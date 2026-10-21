/**
 * 图像合成工具
 * 1. 同源代理加载：商汤图片位于外部 CDN，直接加载会污染 canvas（截图空白）
 * 2. 纹样 × 载体合成：把 AI 纹样「印」到透明载体剪影上，并叠加
 *    物理投影 / 受光 / 折痕 / 边缘内阴影，模拟真实铺陈效果
 * 3. 传统色卡染色：将色卡以 mix-blend-mode 等效的 Canvas 混合模式
 *    （color / multiply）烘焙进合成图，只改色调、保留纹样纹理
 * 4. 四方连续生产稿：四边镜像无缝铺贴，可直接交付印染厂
 */

import { hexToRgba, stopsToCanvasGradient } from './colorUtil.js';

/** 远程图片 → 同源代理地址 */
export const toProxyUrl = (url) => `/api/img?url=${encodeURIComponent(url)}`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${src.slice(0, 80)}`));
    img.src = src;
  });

/** 远程图片 → data URL（经 Vite 同源代理，绕开 CDN 跨域限制） */
export const toDataUrl = async (url) => {
  if (typeof url === 'string' && url.startsWith('data:')) return url;
  const res = await fetch(toProxyUrl(url));
  if (!res.ok) throw new Error(`同源代理加载失败 HTTP ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片转 data URL 失败'));
    reader.readAsDataURL(blob);
  });
};

/** 以 cover 方式把图片绘制进指定矩形 */
function drawCover(ctx, img, w, h, dx = 0, dy = 0) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, dx + (w - dw) / 2, dy + (h - dh) / 2, dw, dh);
}

const createCanvas = (size) => {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
};

/** 剪影填充为纯色（用于投影 / 内阴影） */
function fillSilhouette(source, size, color) {
  const c = createCanvas(size);
  const x = c.getContext('2d');
  x.drawImage(source, 0, 0, size, size);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, size, size);
  return c;
}

/** 模糊副本（Canvas filter，主流浏览器支持；不支持时退化为硬边阴影） */
function blurred(source, size, radius) {
  const c = createCanvas(size);
  const x = c.getContext('2d');
  if (typeof x.filter === 'string' && radius > 0) x.filter = `blur(${radius}px)`;
  x.drawImage(source, 0, 0, size, size);
  return c;
}

/** 边缘内阴影：剪影内侧一圈柔和暗部，让「印上去」的纹样有实物边缘 */
function edgeShade(source, size) {
  const dark = fillSilhouette(source, size, 'rgba(40,34,24,0.9)');
  const blur = blurred(dark, size, Math.max(2, size * 0.018));
  const bx = blur.getContext('2d');
  // 擦除内部，仅保留边缘一圈
  bx.globalCompositeOperation = 'destination-out';
  const inset = size * 0.028;
  bx.drawImage(source, inset, inset, size - inset * 2, size - inset * 2);
  return blur;
}

/** 光影层：source-atop 保证只作用于剪影内部，不破坏外部透明 */
function applyLighting(ctx, size, kind) {
  ctx.globalCompositeOperation = 'source-atop';

  // 基础布光：顶部受光、底部背光
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, 'rgba(255,255,255,0.18)');
  base.addColorStop(0.45, 'rgba(255,255,255,0)');
  base.addColorStop(1, 'rgba(30,26,20,0.22)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  if (kind === 'ceramic') {
    // 瓷质：中心受光隆起、盘沿压暗 + 高光斑
    const rg = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.04, size * 0.5, size * 0.5, size * 0.52);
    rg.addColorStop(0, 'rgba(255,255,255,0.14)');
    rg.addColorStop(0.72, 'rgba(255,255,255,0)');
    rg.addColorStop(1, 'rgba(38,34,26,0.30)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, size, size);

    const spec = ctx.createRadialGradient(size * 0.36, size * 0.28, 0, size * 0.36, size * 0.28, size * 0.16);
    spec.addColorStop(0, 'rgba(255,255,255,0.22)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, size, size);
  } else if (kind === 'silk') {
    // 缎面：斜向柔光折痕
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.42);
    for (let i = -1; i <= 1; i++) {
      const y = i * size * 0.2;
      const g = ctx.createLinearGradient(0, y - size * 0.055, 0, y + size * 0.055);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.11)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-size, y - size * 0.055, size * 2, size * 0.11);
    }
    ctx.restore();
  } else if (kind === 'hanfu') {
    // 织物：衣身纵向褶皱 + 领口阴影
    const rg = ctx.createLinearGradient(0, size * 0.12, 0, size);
    rg.addColorStop(0, 'rgba(255,255,255,0.12)');
    rg.addColorStop(0.35, 'rgba(255,255,255,0)');
    rg.addColorStop(1, 'rgba(30,26,20,0.20)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, size, size);

    const collar = ctx.createLinearGradient(0, size * 0.2, 0, size * 0.42);
    collar.addColorStop(0, 'rgba(30,26,20,0)');
    collar.addColorStop(0.6, 'rgba(30,26,20,0.16)');
    collar.addColorStop(1, 'rgba(30,26,20,0)');
    ctx.fillStyle = collar;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 传统色卡染色：把色卡颜色以 Canvas 混合模式（color / multiply）叠到合成图上
 * - 染色层先用剪影 alpha 裁掉剪影外区域，保证只染「印在载体上」的部分
 * - color 模式取色卡的色相/饱和度 + 保留纹样明暗纹理，避免粗暴 hue-rotate 的土褐色
 * @param {CanvasRenderingContext2D} ctx 合成画布上下文
 * @param {CanvasImageSource} maskImg 载体剪影（取 alpha）
 * @param {number} size 画布边长
 * @param {Object} tint { tint, tintAlpha, blend, gradientStops }
 */
function applyPaletteTint(ctx, maskImg, size, tint) {
  if (!tint) return;

  // 1) 独立画布绘制染色层（纯色或渐变）
  const layer = createCanvas(size);
  const lx = layer.getContext('2d');
  if (tint.gradientStops && tint.gradientStops.length) {
    lx.fillStyle = stopsToCanvasGradient(lx, 0, 0, size, size, tint.gradientStops);
  } else {
    lx.fillStyle = hexToRgba(tint.tint, tint.tintAlpha ?? 0.55);
  }
  lx.fillRect(0, 0, size, size);

  // 2) 用剪影 alpha 裁掉载体之外的区域
  lx.globalCompositeOperation = 'destination-in';
  lx.drawImage(maskImg, 0, 0, size, size);

  // 3) 以混合模式叠加（源透明处不影响底色）
  const blend = tint.blend === 'multiply' ? 'multiply' : 'color';
  if (ctx.globalCompositeOperation !== blend) ctx.globalCompositeOperation = blend;
  ctx.drawImage(layer, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 把 AI 纹样合成到载体剪影上（模拟「印在真实载体」的物理落地效果）
 * @param {string} patternUrl AI 生成的纹样图地址
 * @param {string} maskUrl    透明底载体剪影地址（如 /images/silk-scarf.png）
 * @param {Object} options
 * @param {number} options.size 输出画布边长
 * @param {string} options.kind 载体类型 silk / ceramic / hanfu（决定光影质感）
 * @param {Object} options.tint 传统色卡 { tint, tintAlpha, blend, gradientStops }（可选）
 * @returns {Promise<string>} 合成后的 PNG data URL
 */
export const compositeOnCarrier = async (patternUrl, maskUrl, options = {}) => {
  const { size = 1024, kind = 'silk', tint = null } = options;
  const [patternSrc, maskImg] = await Promise.all([toDataUrl(patternUrl), loadImage(maskUrl)]);
  const patternImg = await loadImage(patternSrc);

  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  // 1) 物理投影：剪影模糊后向下偏移，模拟物体落在纸面上的阴影
  const shadow = blurred(fillSilhouette(maskImg, size, 'rgba(42,38,28,1)'), size, Math.round(size * 0.03));
  ctx.globalAlpha = 0.3;
  ctx.drawImage(shadow, 0, size * 0.038);
  ctx.globalAlpha = 1;

  // 2) 纹样填入剪影（source-in：仅保留剪影区域内的纹样）
  ctx.drawImage(maskImg, 0, 0, size, size);
  ctx.globalCompositeOperation = 'source-in';
  drawCover(ctx, patternImg, size, size);

  // 3) 光影质感（source-atop：不污染剪影外的透明区域）
  applyLighting(ctx, size, kind);

  // 4) 边缘内阴影，强化实物轮廓
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(edgeShade(maskImg, size), 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // 5) 传统色卡染色（色相/饱和度取自色卡，明暗纹理保留）
  applyPaletteTint(ctx, maskImg, size, tint);

  return canvas.toDataURL('image/png');
};

/**
 * 生成「四方连续生产稿」：2×2 四边镜像铺贴
 * 镜像连续（对合连续）可保证四边完全无缝，是印染厂可直接开机的生产文件
 * @param {string} patternUrl AI 生成的纹样图地址
 * @param {Object} options
 * @param {number} options.size  输出画布边长（默认 2048）
 * @param {number} options.tile  单元尺寸（默认 1024）
 * @returns {Promise<string>} 无缝平铺 PNG data URL
 */
export const generateSeamlessTile = async (patternUrl, options = {}) => {
  const { size = 2048, tile = 1024 } = options;
  const patternImg = await loadImage(await toDataUrl(patternUrl));

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f6f1e6';
  ctx.fillRect(0, 0, size, size);

  const count = Math.floor(size / tile);
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const flipH = col % 2 === 1;
      const flipV = row % 2 === 1;
      ctx.save();
      ctx.translate(col * tile, row * tile);
      if (flipH) {
        ctx.scale(-1, 1);
        ctx.translate(-tile, 0);
      }
      if (flipV) {
        ctx.scale(1, -1);
        ctx.translate(0, -tile);
      }
      drawCover(ctx, patternImg, tile, tile);
      ctx.restore();
    }
  }

  return canvas.toDataURL('image/png');
};

/**
 * 纹样基因切片裁剪：把原图中指定区域（原图像素坐标）裁成自包含的 JPEG data URL
 * 用途：收藏入「我的纹样库」——自包含图片不依赖可能过期的远程 CDN 地址，
 *       且通过 maxSize + JPEG 压缩把单张体积控制在几十 KB，避免 localStorage 卡顿/超容。
 * @param {string} imageUrl 纹样原图地址（远程 URL 会经同源代理加载）
 * @param {{x:number,y:number,w:number,h:number}} rect 原图像素坐标区域
 * @param {Object} options
 * @param {number} options.maxSize 输出最长边（默认 320，兼顾清晰度与体积）
 * @param {number} options.quality JPEG 质量（默认 0.85）
 * @returns {Promise<string>} JPEG data URL
 */
export const cropImageRegion = async (imageUrl, rect, options = {}) => {
  const { maxSize = 320, quality = 0.85 } = options;
  const img = await loadImage(await toDataUrl(imageUrl));
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  // 区域裁剪边限定在原图范围内
  const sx = Math.max(0, Math.min(rect.x, natW - 1));
  const sy = Math.max(0, Math.min(rect.y, natH - 1));
  const sw = Math.max(1, Math.min(rect.w, natW - sx));
  const sh = Math.max(1, Math.min(rect.h, natH - sy));
  // 等比缩放到最长边 maxSize
  const scale = Math.min(maxSize / sw, maxSize / sh, 1);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  return canvas.toDataURL('image/jpeg', quality);
};

/** 触发 data URL / canvas 下载 */
export const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
