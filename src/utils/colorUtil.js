/**
 * 颜色工具 —— 传统色卡染色（CSS mix-blend-mode 叠加层 / Canvas 混合烘焙）共用
 */

/** 十六进制色 → rgba 字符串 */
export const hexToRgba = (hex, alpha = 1) => {
  if (typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * 渐变停靠点 → CSS linear-gradient 字符串
 * @param {Array<[number, string]>} stops [[0, 'rgba(...)'], ...]
 * @param {number} angle 渐变角度
 */
export const stopsToCssGradient = (stops, angle = 115) =>
  `linear-gradient(${angle}deg, ${stops.map(([s, c]) => `${c} ${Math.round(s * 100)}%`).join(', ')})`;

/**
 * 渐变停靠点 → Canvas 线性渐变
 */
export const stopsToCanvasGradient = (ctx, x0, y0, x1, y1, stops) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([s, c]) => g.addColorStop(s, c));
  return g;
};

/** 浏览器是否支持 Canvas 2D 'color' 混合模式（传统色卡烘焙依赖） */
export const supportsCanvasColorBlend = () => {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return false;
    ctx.globalCompositeOperation = 'color';
    return ctx.globalCompositeOperation === 'color';
  } catch {
    return false;
  }
};
