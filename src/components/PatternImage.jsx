/** 纹样占位图：引用 PatternDefs 中定义的 SVG symbol（Mock 阶段替代真实图片） */
const PATTERN_MAP = {
  cloud: 'pat-cloud',
  vine: 'pat-vine',
  meander: 'pat-meander',
  baoxiang: 'pat-baoxiang',
};

export default function PatternImage({ pattern = 'cloud', className = '', title }) {
  const id = PATTERN_MAP[pattern] ?? PATTERN_MAP.cloud;
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label={title ?? `纹样占位图：${pattern}`}
    >
      <use href={`#${id}`} width="400" height="400" />
    </svg>
  );
}
