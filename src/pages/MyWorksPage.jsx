import { useState } from 'react';
import { Link } from 'react-router-dom';
import CarrierPreview from '../components/CarrierPreview.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { MOCK_WORKS } from '../data/mockData.js';
import { exportElementAsImage } from '../utils/exportCanvas.js';
import { worksStore, useWorks } from '../store/worksStore.js';

/** ISO 时间 → 'YYYY-MM-DD HH:mm' */
const formatTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 单张作品卡：载体预览 + 导出高清作品（html2canvas） */
function WorkCard({ work }) {
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const isReal = Boolean(work.imageUrl); // 本地真实作品（工作台生成）vs 示例作品

  const handleExport = async () => {
    setExporting(true);
    setNotice('正在导出…');
    const result = await exportElementAsImage(document.getElementById(`export-target-${work.id}`), {
      filename: `织纹集-${work.title}-${work.carrier}.png`,
    });
    setExporting(false);
    if (result.success) {
      // 导出成功：本地作品状态更新为「已导出」
      worksStore.markExported(work.id);
      setNotice('高清作品已开始下载（PNG · 2x）');
    } else {
      setNotice(`导出失败：${result.error}`);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-rice-card transition-all duration-300 hover:-translate-y-1 hover:border-dai/30 hover:shadow-[0_18px_40px_-24px_rgba(42,38,32,0.35)]">
      {/* 导出目标容器 */}
      <div
        id={`export-target-${work.id}`}
        className="aspect-[4/3] overflow-hidden border-b border-line bg-rice"
      >
        {isReal ? (
          <img
            src={work.imageUrl}
            alt={work.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CarrierPreview
            pattern={work.pattern}
            carrier={work.carrier}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold text-mo">{work.title}</h3>
          <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-mo-light">
            {work.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-mo-light">
          {work.carrier} · {work.style} ·{' '}
          {isReal ? `创建于 ${formatTime(work.createdAt)}` : `更新于 ${work.updatedAt}`}
        </p>
        {isReal && work.prompt && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-mo-light/80" title={work.prompt}>
            提示词：{work.prompt}
          </p>
        )}
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-teng/50 bg-teng/10 px-2.5 py-0.5 text-[11px] text-zheshi">
          <span aria-hidden="true">◆</span> 溯源日志已生成
        </span>

        <div className="mt-4 flex items-center gap-3">
          <Link
            to="/log"
            className="inline-flex items-center gap-1 text-xs text-dai transition-colors hover:text-zhusha"
          >
            查看溯源记录
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-zhusha/60 px-3 py-1.5 text-xs text-zhusha transition-colors hover:bg-zhusha hover:text-rice disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zhusha/30 border-t-zhusha" />
            )}
            {exporting ? '导出中…' : '导出高清作品'}
          </button>
        </div>
        {notice && <p className="mt-2 text-[11px] text-dai">{notice}</p>}
        <p className="mt-1 text-[10px] text-mo-light/70">若下载被拦截，可长按 / 右键预览图「图片另存为」</p>
      </div>
    </article>
  );
}

export default function MyWorksPage() {
  // 从 localStorage 读取真实作品（工作台生成 / 导出的作品会自动保存到这里）
  const works = useWorks();

  return (
    <section>
      <PageHeader
        title="我的作品"
        en="MY WORKS"
        desc="共创完成的纹样作品。每件作品都保留了完整的创作日志，可随时回溯它是如何被 AI 生成、又如何被你一点点修改的。生成与导出会自动保存到本地（localStorage）。"
      />

      {/* 无本地作品时的空状态引导 */}
      {works.length === 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-dai/30 bg-rice/40 px-5 py-4 text-center">
          <p className="text-sm text-mo-light">暂无本地作品</p>
          <p className="mt-1 text-xs text-mo-light/80">
            在共创工作台生成草图后，作品（图片 / 提示词 / 时间）会自动保存到这里。以下为示例作品：
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 本地真实作品（localStorage） */}
        {works.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}

        {/* 无本地作品时展示示例作品 */}
        {works.length === 0 &&
          MOCK_WORKS.map((w) => <WorkCard key={w.id} work={w} />)}

        {/* 空状态引导卡 */}
        <Link
          to="/workbench"
          className="group flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-dai/30 bg-rice/40 p-8 text-center transition-colors hover:border-zhusha/50 hover:bg-rice-card"
        >
          <span className="text-4xl font-light text-dai/40 transition-transform duration-300 group-hover:scale-110 group-hover:text-zhusha/60">
            ＋
          </span>
          <p className="mt-4 text-sm text-mo-light">开始新的共创</p>
          <p className="mt-1 text-xs text-mo-light/70">前往共创工作台</p>
        </Link>
      </div>
    </section>
  );
}
