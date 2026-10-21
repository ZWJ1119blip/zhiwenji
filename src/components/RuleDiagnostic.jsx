import Seal from './Seal.jsx';

/**
 * 非遗规制智能诊断仪（杀手锏功能）
 * 理念：生成之后、投产之前，先用 AI 辅助校验纹样的「文化规制」——
 * 骨架对称性 / 四方连续性 / 传统色彩合规，并给出专业修正建议。
 */

/** 诊断触发按钮：醒目入口 */
export function DiagnosticTrigger({ onClick, running, done }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-lg border-2 border-zhusha/60 bg-gradient-to-r from-zhusha/8 via-zhusha/15 to-zhusha/8 px-4 py-3.5 text-left transition-all duration-300 hover:border-zhusha hover:shadow-[0_16px_38px_-18px_rgba(178,58,46,0.6)] md:px-5"
    >
      {/* 流光扫过 */}
      <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-rice/25 to-transparent transition-all duration-700 group-hover:left-full" />
      <span className="relative flex items-center gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zhusha text-rice shadow-[0_8px_16px_-6px_rgba(178,58,46,0.85)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-zhusha-deep">开启非遗规制诊断</span>
            <span className="shrink-0 rounded-full border border-zhusha/50 bg-rice/70 px-2 py-0.5 text-[10px] font-medium text-zhusha">
              核心差异化能力
            </span>
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-mo-light">
            AI 校验骨架对称性 · 四方连续性 · 传统色彩合规，输出可执行的修正建议
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium text-zhusha">
          {running ? '诊断中…' : done ? '重新诊断' : '开始诊断'}
        </span>
      </span>
    </button>
  );
}

/** 诊断辅助网格线：CSS 绘制的红色虚线（垂直中轴线 / 水平基准线 / 三分线 / 对准标记） */
export function DiagnosticGrid({ scanning }) {
  return (
    <div className="rule-grid-in pointer-events-none absolute inset-0 z-10 select-none" aria-hidden="true">
      {/* 垂直中轴线 */}
      <span className="absolute inset-y-0 left-1/2 w-0 border-l border-dashed border-zhusha/85" />
      {/* 水平基准线 */}
      <span className="absolute inset-x-0 top-1/2 h-0 border-t border-dashed border-zhusha/85" />
      {/* 三分辅助线 */}
      <span className="absolute inset-y-0 left-1/3 w-0 border-l border-dashed border-zhusha/35" />
      <span className="absolute inset-y-0 left-2/3 w-0 border-l border-dashed border-zhusha/35" />
      <span className="absolute inset-x-0 top-1/3 h-0 border-t border-dashed border-zhusha/35" />
      <span className="absolute inset-x-0 top-2/3 h-0 border-t border-dashed border-zhusha/35" />
      {/* 中心标记环 */}
      <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zhusha/70">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zhusha" />
      </span>
      {/* 四角对准标记 */}
      {[
        'left-3 top-3 border-l border-t',
        'right-3 top-3 border-r border-t',
        'left-3 bottom-3 border-b border-l',
        'right-3 bottom-3 border-b border-r',
      ].map((pos) => (
        <span key={pos} className={`absolute h-4 w-4 border-zhusha/70 ${pos}`} />
      ))}
      {/* 扫描线 */}
      {scanning && <span className="rule-scan-line" />}
      {/* 状态徽标 */}
      <span className="absolute right-3 top-3 rounded-full border border-zhusha/60 bg-rice/85 px-2.5 py-1 text-[10px] font-medium tracking-widest text-zhusha backdrop-blur-sm">
        {scanning ? 'AI 诊断中' : '规制网格已开启'}
      </span>
    </div>
  );
}

/** 诊断报告面板：结构化指标 + AI 建议 */
export function DiagnosticReport({ result }) {
  if (!result) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-dai/30 bg-rice-card shadow-[0_18px_44px_-32px_rgba(42,38,32,0.55)]">
      {/* 报告头 */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-dai/8 px-4 py-2.5">
        <span className="flex items-center gap-2.5">
          <Seal char="规" size="sm" />
          <span className="font-serif text-sm font-semibold text-dai">非遗规制诊断报告</span>
        </span>
        <span className="shrink-0 text-[10px] tracking-widest text-mo-light">AI RULE ENGINE · {result.time}</span>
      </div>

      <div className="space-y-3.5 px-4 py-4">
        {/* 纹样骨架对称度 */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-mo">纹样骨架对称度</span>
            <span className="font-semibold tabular-nums text-dai">{result.symmetry}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-dai-light to-dai transition-all duration-700"
              style={{ width: `${result.symmetry}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-mo-light">基于垂直中轴线与水平基准线的像素分布加权分析</p>
        </div>

        {/* 二值合规指标 */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-line bg-rice px-3 py-2.5">
            <span className="text-xs text-mo">四方连续达标</span>
            <span className={`text-xs font-semibold ${result.seamless ? 'text-dai' : 'text-zhusha'}`}>
              {result.seamless ? '是' : '否'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-line bg-rice px-3 py-2.5">
            <span className="text-xs text-mo">传统色彩合规</span>
            <span className={`text-xs font-semibold ${result.paletteName ? 'text-dai' : 'text-mo-light'}`}>
              {result.paletteName ? `是 · ${result.paletteName}` : '未套用色卡'}
            </span>
          </div>
        </div>

        {/* AI 建议 */}
        <div className="rounded-md border border-teng/45 bg-teng/10 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-mo">
            <span className="font-semibold text-zheshi">AI 建议：</span>
            {result.advice}
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-mo-light/80">
          * 诊断指标为前端演示数据，用于展示「AI 辅助文化规制校验」产品理念：纹样在投产之前，先过规制关。
        </p>
      </div>
    </div>
  );
}
