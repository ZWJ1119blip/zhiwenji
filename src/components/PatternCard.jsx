import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleGenerateImage } from '../api/patternApi.js';

/** 范式图库卡片：真实纹样图 + 名称 + 寓意 + 构图规则 + 配色规范 + 一键使用 / AI 重新生成 */
export default function PatternCard({ pattern }) {
  // 默认展示高质量真实纹样图；AI 生成成功后替换为 AI 纹样
  const [imageUrl, setImageUrl] = useState(pattern.image);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const navigate = useNavigate();

  /** 一键使用此纹样：带 theme / style 参数跳转共创工作台，自动预填表单 */
  const handleUse = () => {
    navigate(
      `/workbench?theme=${encodeURIComponent(pattern.name)}&style=${encodeURIComponent(pattern.defaultStyle)}`
    );
  };

  /** AI 重新生成：调用日日新接口，成功后用真实图片替换默认纹样图 */
  const handleRegenerate = async () => {
    setLoading(true);
    setGenError('');
    try {
      const result = await handleGenerateImage(pattern.name, pattern.defaultStyle);
      // 将真实返回的 imageUrl 存入 State，替换默认纹样图
      setImageUrl(result.imageUrl);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      // 无论成功失败都在 finally 恢复按钮状态，避免卡死
      setLoading(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-rice-card transition-all duration-300 hover:-translate-y-1 hover:border-dai/30 hover:shadow-[0_18px_40px_-24px_rgba(42,38,32,0.35)]">
      {/* 纹样图：默认高质量真实图，AI 生成后替换 */}
      <div className="relative aspect-square overflow-hidden border-b border-line">
        <img
          src={imageUrl}
          alt={`${pattern.name}纹样`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-full border border-line bg-rice/90 px-2.5 py-1 text-[11px] tracking-wider text-mo-light">
          {pattern.origin}
        </span>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rice/70 backdrop-blur-sm">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-zhusha" />
            <span className="mt-2 text-xs text-mo-light">AI 生成中…</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <header className="flex items-baseline justify-between">
          <h3 className="font-serif text-2xl font-semibold text-mo">{pattern.name}</h3>
          <span className="text-[11px] tracking-[0.25em] text-mo-light">{pattern.latin}</span>
        </header>

        <p className="text-sm leading-relaxed text-mo/75">{pattern.meaning}</p>

        <dl className="mt-auto space-y-3 border-t border-line pt-4 text-[13px]">
          <div>
            <dt className="mb-1 font-medium text-dai">构图规则</dt>
            <dd className="leading-relaxed text-mo/65">{pattern.composition}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="shrink-0 font-medium text-dai">配色规范</dt>
            <dd className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {pattern.palette.map((c) => (
                <span key={c.hex} className="flex items-center gap-1.5">
                  <span
                    className="h-4 w-4 rounded-full border border-line"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[11px] text-mo/60">{c.name}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        {/* 一键使用此纹样（主操作）+ AI 重新生成（次操作） */}
        <div className="space-y-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={handleUse}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zhusha px-4 py-2 text-sm font-medium text-rice transition-colors hover:bg-zhusha-deep"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
            一键使用此纹样
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dai px-4 py-1.5 text-xs text-dai transition-colors hover:bg-dai hover:text-rice disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-dai/30 border-t-dai" />
            )}
            {loading ? 'AI 生成中…' : 'AI 重新生成'}
          </button>
          {genError && <p className="mt-1 text-center text-xs text-zhusha">{genError}</p>}
        </div>
      </div>
    </article>
  );
}
