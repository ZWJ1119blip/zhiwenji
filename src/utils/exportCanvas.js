/**
 * 导出工具 —— 基于 html2canvas 将 DOM 容器截图为高清 PNG 并触发下载
 *
 * 跨域（CORS）空白 Bug 的根治方案：
 *   商汤返回的图片位于外部 CDN，浏览器以跨域方式加载后会「污染」canvas，
 *   导致 toDataURL() 抛 SecurityError、截图结果为空白。
 *   这里在截图前把容器内所有远程 <img> / background-image 批量替换为
 *   经 Vite 同源代理（/api/img）转换得到的 data URL，截图后还原，
 *   从根头上避免画布被污染。
 *
 * SVG 丢失 Bug 的根治方案：
 *   页内纹样是 <use href="#pat-*"> 引用文档别处的 <symbol>，且 fill/stroke
 *   使用 var(--color-*) CSS 变量。html2canvas 序列化 <svg> 子树时，
 *   跨 <svg> 的引用与 CSS 变量都会丢失（导出为黑底空图）。
 *   这里把 <use> 内联展开、CSS 变量解析为字面值，再将 <svg> 序列化为
 *   data URL 形式的 <img>，截图后还原。
 *
 * 传统色卡（mix-blend-mode 叠加层）导出方案：
 *   html2canvas 对 mix-blend-mode 支持不稳定，这里在截图前临时隐藏
 *   [data-tint-overlay] 叠加层，截图后用 Canvas 2D 混合模式（color /
 *   multiply）在指定区域精确复刻染色效果，再叠加 CSS 滤镜——
 *   顺序与屏幕上「叠加层位于 filter 容器内」的组合一致。
 *
 * html2canvas 采用动态 import 按需加载，避免增大首屏包体。
 */

import { hexToRgba, stopsToCanvasGradient, supportsCanvasColorBlend } from './colorUtil.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * 把容器内所有远程图片临时替换为同源 data URL，返回还原函数
 * @param {HTMLElement} element 目标容器
 * @returns {Promise<() => void>} 还原函数
 */
async function neutralizeRemoteImages(element) {
  const restores = [];
  const targets = [];

  // 远程 <img>
  element.querySelectorAll('img').forEach((img) => {
    if (img.src && img.src.startsWith('http')) targets.push({ el: img, prop: 'src' });
  });
  // 内联 background-image 中的远程地址
  element.querySelectorAll('*').forEach((el) => {
    const bg = el.style.backgroundImage || '';
    const match = bg.match(/url\(["']?(https?:[^"')]+)["']?\)/);
    if (match) targets.push({ el, prop: 'background-image', url: match[1] });
  });

  await Promise.all(
    targets.map(async ({ el, prop, url }) => {
      try {
        const dataUrl = await toDataUrlViaProxy(url || el.src);
        const original = prop === 'src' ? el.src : el.style.backgroundImage;
        restores.push(() => {
          if (prop === 'src') el.src = original;
          else el.style.backgroundImage = original;
        });
        if (prop === 'src') el.src = dataUrl;
        else el.style.backgroundImage = `url("${dataUrl}")`;
      } catch (err) {
        console.warn('[导出] 远程图片同源化失败，将继续尝试截图:', err);
      }
    })
  );

  return () => restores.forEach((fn) => fn());
}

/** 经 Vite 同源代理把远程图片转为 data URL */
async function toDataUrlViaProxy(url) {
  const res = await fetch(`/api/img?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`同源代理返回 HTTP ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(blob);
  });
}

/** var(--color-*) → 字面值（变量定义在 :root，来自 index.css @theme） */
function resolveVarValue(value, rootStyle) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => {
    const v = (rootStyle.getPropertyValue(name) || '').trim();
    return v || (fallback || '').trim() || _;
  });
}

/**
 * 内联展开克隆树中的 <use> 引用
 * - 引用 <symbol>/<svg>：替换为带 viewBox 的嵌套 <svg>（保留 x/y/width/height）
 * - 引用 <g>：替换为 <g>（保留 transform 等属性）
 */
function inlineUseRefs(root) {
  let guard = 0;
  while (guard++ < 40) {
    const uses = Array.from(root.querySelectorAll('use'));
    if (!uses.length) break;
    for (const use of uses) {
      const href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      const ref = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
      if (!ref) {
        use.remove();
        continue;
      }
      const tag = ref.tagName.toLowerCase();
      const isSymbol = tag === 'symbol' || tag === 'svg';
      const holder = document.createElementNS(SVG_NS, isSymbol ? 'svg' : 'g');

      if (isSymbol) {
        for (const attr of ['x', 'y', 'width', 'height']) {
          if (use.hasAttribute(attr)) holder.setAttribute(attr, use.getAttribute(attr));
        }
        holder.setAttribute('viewBox', ref.getAttribute('viewBox') || '0 0 400 400');
      }
      for (const attr of ['transform', 'opacity', 'class']) {
        if (use.hasAttribute(attr)) holder.setAttribute(attr, use.getAttribute(attr));
      }

      ref.childNodes.forEach((n) => holder.appendChild(n.cloneNode(true)));
      use.parentNode.replaceChild(holder, use);
    }
  }
}

/**
 * SVG 导出预处理：把容器内 <svg> 转为自包含的 data URL <img>，返回还原函数
 * @param {HTMLElement} element 目标容器
 * @returns {() => void} 还原函数
 */
function prepareSvgForExport(element) {
  const restores = [];
  const rootStyle = getComputedStyle(document.documentElement);

  Array.from(element.querySelectorAll('svg')).forEach((svg) => {
    try {
      const rect = svg.getBoundingClientRect();
      const clone = svg.cloneNode(true);

      // 1) 内联 <use>（跨 SVG 的 symbol 引用）
      inlineUseRefs(clone);

      // 2) CSS 变量 → 字面值
      clone.querySelectorAll('*').forEach((el) => {
        for (const attr of ['fill', 'stroke', 'stop-color', 'flood-color', 'color']) {
          const v = el.getAttribute(attr);
          if (v && v.includes('var(')) el.setAttribute(attr, resolveVarValue(v, rootStyle));
        }
        const style = el.getAttribute('style');
        if (style && style.includes('var(')) el.setAttribute('style', resolveVarValue(style, rootStyle));
      });

      // 3) 显式尺寸，避免 data URL 中丢失布局
      if (rect.width > 0 && rect.height > 0) {
        clone.setAttribute('width', String(Math.round(rect.width)));
        clone.setAttribute('height', String(Math.round(rect.height)));
      }

      const xml = new XMLSerializer().serializeToString(clone);
      const img = document.createElement('img');
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      img.alt = svg.getAttribute('aria-label') || '';
      img.className = svg.getAttribute('class') || '';
      const svgStyle = svg.getAttribute('style');
      img.setAttribute('style', svgStyle ? `${svgStyle};display:block` : 'display:block');

      const parent = svg.parentNode;
      if (!parent) return;
      parent.replaceChild(img, svg);
      restores.push(() => parent.replaceChild(svg, img));
    } catch (err) {
      console.warn('[导出] SVG 预处理失败，将按原样截图:', err);
    }
  });

  return () => restores.forEach((fn) => fn());
}

/**
 * 传统色卡染色烘焙：在指定区域以 Canvas 混合模式复刻 mix-blend-mode 叠加层效果
 * @param {HTMLCanvasElement} source 截图画布
 * @param {Object} tint { tint, tintAlpha, blend, gradientStops }
 * @param {{x:number,y:number,w:number,h:number}} region 作用区域（画布像素坐标）
 * @returns {HTMLCanvasElement} 染色后的画布
 */
function bakeTint(source, tint, region) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;

  ctx.drawImage(source, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.w, region.h);
  ctx.clip();

  // color 模式：取色卡色相/饱和度 + 保留纹样明暗（首选）；
  // 不支持时退化为 multiply（压暗叠加，仍保留纹理）
  const useColor = supportsCanvasColorBlend() && tint.blend !== 'multiply';
  ctx.globalCompositeOperation = useColor ? 'color' : 'multiply';

  if (tint.gradientStops && tint.gradientStops.length) {
    ctx.fillStyle = stopsToCanvasGradient(ctx, region.x, region.y, region.x + region.w, region.y + region.h, tint.gradientStops);
  } else {
    ctx.fillStyle = hexToRgba(tint.tint, tint.tintAlpha ?? 0.55);
  }
  ctx.fillRect(region.x, region.y, region.w, region.h);
  ctx.restore();
  return canvas;
}

/** 计算「染色区域元素」相对于导出容器的画布像素矩形 */
function resolveRegion(container, regionEl, canvas) {
  if (!container || !regionEl || !canvas) return null;
  const c = container.getBoundingClientRect();
  const r = regionEl.getBoundingClientRect();
  if (!c.width || !c.height || !r.width || !r.height) return null;
  const scale = canvas.width / c.width;
  return {
    x: (r.left - c.left) * scale,
    y: (r.top - c.top) * scale,
    w: r.width * scale,
    h: r.height * scale,
  };
}

/**
 * 将指定 DOM 元素导出为 PNG 图片并下载
 * @param {HTMLElement} element 目标容器（需设置唯一 id，如 export-target）
 * @param {Object} options
 * @param {string} options.filename 下载文件名
 * @param {string} options.filter   CSS filter 字符串（如 hue-rotate(30deg) contrast(120%)），会烘焙进导出图
 * @param {Object} options.tint     传统色卡 { tint, tintAlpha, blend, gradientStops }，会以混合模式烘焙进导出图
 * @param {HTMLElement} options.tintRegion 染色作用区域元素（一般为纹样图片容器）
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const exportElementAsImage = async (element, options = {}) => {
  const { filename = '织纹集作品.png', filter = '', tint = null, tintRegion = null } = options;

  if (!element) {
    const msg = '未找到导出目标容器';
    console.error('[导出]', msg);
    alert(`导出失败：${msg}`);
    return { success: false, error: msg };
  }

  // 截图前预处理：远程图片同源化 + SVG 自包含化 + 隐藏色卡叠加层（改为手动烘焙）
  const restoreImages = await neutralizeRemoteImages(element);
  const restoreSvg = prepareSvgForExport(element);

  // 隐藏 [data-tint-overlay] 叠加层，避免与手动烘焙重复染色
  const tintOverlays = Array.from(element.querySelectorAll('[data-tint-overlay]'));
  const restoreTint = tintOverlays.map((el) => {
    const prev = el.style.display;
    el.style.display = 'none';
    return () => {
      el.style.display = prev;
    };
  });

  try {
    // 1. 按需加载 html2canvas（动态 import，拆分单独 chunk）
    const { default: html2canvas } = await import('html2canvas');

    // 2. 截取容器：useCORS + allowTaint:false（远程图片已同源化，不会被污染）
    const source = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#f6f1e6',
      scale: 2,
      logging: false,
    });

    let out = source;

    // 3. 传统色卡染色烘焙（先染色、后滤镜，与屏幕上的混合顺序一致：
    //    屏幕上叠加层位于 filter 容器内部，会随图片一同被滤镜处理）
    if (tint && tintRegion) {
      const region = resolveRegion(element, tintRegion, source);
      if (region) out = bakeTint(out, tint, region);
    }

    // 4. 将 CSS 滤镜烘焙进导出画布（Canvas 2D filter 支持 hue-rotate / contrast）
    if (filter && typeof out.getContext === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = out.width;
      canvas.height = out.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = filter;
        ctx.drawImage(out, 0, 0);
        out = canvas;
      }
    }

    // 5. 触发浏览器下载
    const link = document.createElement('a');
    link.download = filename;
    link.href = out.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err) {
    console.error('[导出] html2canvas 截图失败:', err);
    const msg = err instanceof Error ? err.message : String(err);
    alert(`导出失败：${msg}\n\n你也可以在预览图上长按 / 右键「图片另存为」保存作品。`);
    return { success: false, error: msg };
  } finally {
    // 无论成功失败都还原原始 DOM
    restoreTint.forEach((fn) => fn());
    restoreSvg();
    restoreImages();
  }
};
