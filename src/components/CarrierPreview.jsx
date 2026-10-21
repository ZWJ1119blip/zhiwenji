import { useId } from 'react';
import PatternImage from './PatternImage.jsx';

/**
 * 载体适配预览：将纹样按目标载体（丝巾 / 陶瓷 / 版画 / 书签）轮廓裁切展示
 * Demo 阶段为前端 SVG 模拟；真实阶段可将 PatternImage 替换为 <image href={sketch.imageUrl} />
 */
const CARRIERS = {
  丝巾: {
    shape:
      'M56 56 H344 A18 18 0 0 1 362 74 V326 A18 18 0 0 1 344 344 H56 A18 18 0 0 1 38 326 V74 A18 18 0 0 1 56 56 Z',
    inner: 'M84 84 H316 V316 H84 Z',
  },
  陶瓷: {
    shape:
      'M200 44 C178 58 172 84 175 106 C152 152 122 206 122 258 C122 318 156 358 200 358 C244 358 278 318 278 258 C278 206 248 152 225 106 C228 84 222 58 200 44 Z',
    inner:
      'M190 92 C188 128 140 182 140 258 C140 310 166 338 200 338 C234 338 260 310 260 258 C260 182 212 128 210 92',
  },
  版画: {
    shape:
      'M48 96 H352 A8 8 0 0 1 360 104 V296 A8 8 0 0 1 352 304 H48 A8 8 0 0 1 40 296 V104 A8 8 0 0 1 48 96 Z',
    inner: 'M76 124 H324 V276 H76 Z',
  },
  书签: {
    shape:
      'M162 48 H238 A12 12 0 0 1 250 60 V340 A12 12 0 0 1 238 352 H162 A12 12 0 0 1 150 340 V60 A12 12 0 0 1 162 48 Z',
    inner: 'M174 132 H226 V312 H174 Z',
  },
};

export default function CarrierPreview({ pattern = 'cloud', carrier = '丝巾', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const clipId = `carrier-clip-${uid}`;
  const c = CARRIERS[carrier] ?? CARRIERS['丝巾'];

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label={`${carrier}载体适配预览`}
    >
      <rect width="400" height="400" fill="var(--color-rice)" />
      <defs>
        <clipPath id={clipId}>
          <path d={c.shape} />
        </clipPath>
      </defs>

      {/* 载体轮廓内的纹样（真实阶段替换为 <image href={sketch.imageUrl} />） */}
      <g clipPath={`url(#${clipId})`}>
        <PatternImage pattern={pattern} className="h-full w-full" />
      </g>

      {/* 载体描边与内衬线 */}
      <path d={c.shape} fill="none" stroke="var(--color-dai)" strokeWidth="5" strokeLinejoin="round" />
      {c.inner && (
        <path d={c.inner} fill="none" stroke="var(--color-dai)" strokeWidth="1.8" opacity="0.4" />
      )}

      {/* 载体特征细节 */}
      {carrier === '书签' && (
        <g>
          <circle cx="200" cy="74" r="7" fill="var(--color-rice)" stroke="var(--color-dai)" strokeWidth="3" />
          <path d="M200 81 V100" stroke="var(--color-dai)" strokeWidth="2.5" />
          <rect x="190" y="100" width="20" height="24" rx="4" fill="var(--color-zhusha)" />
        </g>
      )}
      {carrier === '版画' && (
        <g
          fill="none"
          stroke="var(--color-mo-light)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.65"
        >
          <path d="M26 86 V66 H46 M374 86 V66 H354 M26 314 V334 H46 M374 314 V334 H354" />
        </g>
      )}
      {carrier === '陶瓷' && (
        <g fill="none" stroke="var(--color-dai)" strokeWidth="2" opacity="0.3">
          <path d="M150 150 C140 200 140 300 160 330 M250 150 C260 200 260 300 240 330" />
        </g>
      )}
    </svg>
  );
}
