/**
 * 全局 SVG 纹样符号定义（隐藏渲染，供 <use href="#pat-*" /> 复用）
 * 四类非遗范式：云纹 / 缠枝纹 / 回纹 / 宝相花
 * 颜色取自 index.css @theme 传统色板（黛蓝、霁青、黛绿、朱砂、藤黄、赭石、宝蓝）
 * ============================================================ */
export default function PatternDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* ===== 云纹单体：如意卷云 ===== */}
        <g id="motif-cloud">
          <g
            fill="none"
            stroke="var(--color-dailan)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="0" cy="-6" r="30" />
            <circle cx="-28" cy="8" r="19" />
            <circle cx="28" cy="8" r="19" />
            <circle cx="-13" cy="-24" r="14" />
            <circle cx="13" cy="-24" r="14" />
            <path d="M-46 12 Q0 24 46 12" />
            <path d="M-1 -18 C-9 -18 -13 -10 -8 -4 C-4 1 3 -1 3 -7" strokeWidth="3.5" />
          </g>
          <circle cx="0" cy="-6" r="5.5" fill="var(--color-jiqing)" />
        </g>

        {/* ===== 宝相花单体：花心 / 内瓣 / 环瓣 三层放射结构 ===== */}
        <g id="motif-baoxiang">
          <g fill="none" strokeWidth="3.5" strokeLinejoin="round">
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse
                key={`outer-${i}`}
                rx="12"
                ry="30"
                stroke="var(--color-baolan)"
                transform={`rotate(${i * 45}) translate(0 -40)`}
              />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse
                key={`inner-${i}`}
                rx="9"
                ry="22"
                stroke="var(--color-teng)"
                transform={`rotate(${i * 45 + 22.5}) translate(0 -74)`}
              />
            ))}
          </g>
          <circle r="11" fill="var(--color-zhusha)" />
          <g fill="var(--color-baolan)" opacity="0.8">
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={`dot-${i}`} r="4" transform={`rotate(${i * 45}) translate(0 -100)`} />
            ))}
          </g>
        </g>
      </defs>

      {/* ===== 云纹 · 四隅拱卫 + 中心大云，满地布局 ===== */}
      <symbol id="pat-cloud" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="var(--color-rice-deep)" />
        <g>
          <use href="#motif-cloud" transform="translate(112 106) scale(0.72)" />
          <use href="#motif-cloud" transform="translate(288 106) scale(0.72)" />
          <use href="#motif-cloud" transform="translate(112 294) scale(0.72)" />
          <use href="#motif-cloud" transform="translate(288 294) scale(0.72)" />
          <use href="#motif-cloud" transform="translate(200 200) scale(0.95)" />
        </g>
        <g fill="var(--color-jiqing)" opacity="0.7">
          <circle cx="200" cy="46" r="4" />
          <circle cx="46" cy="200" r="4" />
          <circle cx="354" cy="200" r="4" />
          <circle cx="200" cy="354" r="4" />
          <circle cx="58" cy="58" r="3" />
          <circle cx="342" cy="58" r="3" />
          <circle cx="58" cy="342" r="3" />
          <circle cx="342" cy="342" r="3" />
        </g>
      </symbol>

      {/* ===== 缠枝纹 · S 形波状藤蔓，叶生波峰、花出波谷 ===== */}
      <symbol id="pat-vine" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="var(--color-rice-deep)" />
        <g fill="none" stroke="var(--color-dai)" strokeWidth="4.5" strokeLinecap="round">
          <path d="M-20 70 Q60 30 140 70 T300 70 T460 70" />
          <path d="M-20 150 Q60 110 140 150 T300 150 T460 150" />
          <path d="M-20 230 Q60 190 140 230 T300 230 T460 230" />
          <path d="M-20 310 Q60 270 140 310 T300 310 T460 310" />
        </g>
        {/* 叶片：生于波峰（60 / 380 处） */}
        <g fill="none" stroke="var(--color-dai)" strokeWidth="3.2" strokeLinecap="round">
          {[70, 150, 230, 310].map((y) => (
            <g key={`leaf-${y}`}>
              <ellipse cx="44" cy={y - 30} rx="6.5" ry="15" transform={`rotate(-28 44 ${y - 30})`} />
              <ellipse cx="76" cy={y - 30} rx="6.5" ry="15" transform={`rotate(28 76 ${y - 30})`} />
              <ellipse cx="364" cy={y - 30} rx="6.5" ry="15" transform={`rotate(-28 364 ${y - 30})`} />
              <ellipse cx="396" cy={y - 30} rx="6.5" ry="15" transform={`rotate(28 396 ${y - 30})`} />
            </g>
          ))}
        </g>
        {/* 花头：出于波谷（220 处） */}
        {[70, 150, 230, 310].map((y) => (
          <g key={`bloom-${y}`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle
                key={a}
                r="5.5"
                fill="var(--color-teng)"
                opacity="0.9"
                transform={`translate(220 ${y + 8}) rotate(${a}) translate(0 -13)`}
              />
            ))}
            <circle cx="220" cy={y + 8} r="4" fill="var(--color-zhusha)" />
          </g>
        ))}
      </symbol>

      {/* ===== 回纹 · 矩形螺旋单体，菱珠为花心，规矩满地 ===== */}
      <symbol id="pat-meander" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="var(--color-rice-deep)" />
        <g fill="none" stroke="var(--color-zhusha)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          {[48, 144, 240, 336].map((x) =>
            [48, 144, 240, 336].map((y) => (
              <path
                key={`spiral-${x}-${y}`}
                transform={`translate(${x} ${y})`}
                d="M0 0 H56 V56 H12 V12 H44 V44 H22 V22 H33 V33"
              />
            ))
          )}
        </g>
        <g fill="var(--color-dai)" opacity="0.85">
          {[81, 177, 273, 369].map((x) =>
            [81, 177, 273, 369].map((y) => (
              <rect
                key={`diamond-${x}-${y}`}
                x="-4.5"
                y="-4.5"
                width="9"
                height="9"
                transform={`translate(${x} ${y}) rotate(45)`}
              />
            ))
          )}
        </g>
      </symbol>

      {/* ===== 宝相花 · 中心大花 + 四隅小相花拱卫 ===== */}
      <symbol id="pat-baoxiang" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="var(--color-rice-deep)" />
        <use href="#motif-baoxiang" transform="translate(70 70) scale(0.42)" />
        <use href="#motif-baoxiang" transform="translate(330 70) scale(0.42)" />
        <use href="#motif-baoxiang" transform="translate(70 330) scale(0.42)" />
        <use href="#motif-baoxiang" transform="translate(330 330) scale(0.42)" />
        <use href="#motif-baoxiang" transform="translate(200 200)" />
        <g fill="var(--color-teng)" opacity="0.75">
          <circle cx="200" cy="30" r="4" />
          <circle cx="30" cy="200" r="4" />
          <circle cx="370" cy="200" r="4" />
          <circle cx="200" cy="370" r="4" />
        </g>
      </symbol>
    </svg>
  );
}
