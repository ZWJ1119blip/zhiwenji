import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Seal from '../components/Seal.jsx';
import { patternLibraryStore } from '../store/patternLibraryStore.js';
import { logStore } from '../store/logStore.js';

/** 保存时间格式化 */
const formatTime = (iso) =>
  new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * 我的纹样库（素材沉淀与调用闭环）
 * 展示 localStorage（key: myPatternLibrary）中收藏的纹样基因切片：
 * 缩略图 / 保存时间 / 删除 / 带入工作台（挂载为贴纸拼贴）
 */
export default function LibraryPage() {
  const [items, setItems] = useState(() => patternLibraryStore.list());
  const navigate = useNavigate();

  // 订阅纹样库变化（工作台收藏后跳转过来也能看到最新数据）
  useEffect(() => patternLibraryStore.subscribe(() => setItems(patternLibraryStore.list())), []);

  /** 带入工作台：压入传递队列 → 跳转工作台 → 初始化时自动解析挂载为贴纸 */
  const handleBringToWorkbench = (item) => {
    if (!patternLibraryStore.pushPending(item)) {
      alert('素材传递失败：本地存储不可用');
      return;
    }
    logStore.add({
      type: 'manual',
      title: '人工干预-纹样库素材调用',
      details: [
        `素材：${item.title || '未命名素材'}`,
        `保存时间：${formatTime(item.savedAt)}`,
        '说明：从我的纹样库带入共创工作台，将挂载为贴纸供拼贴',
      ],
    });
    navigate('/workbench?from=library');
  };

  /** 删除单个素材 */
  const handleDelete = (item) => {
    if (!window.confirm(`确定删除素材「${item.title || '未命名素材'}」吗？此操作不可恢复。`)) return;
    patternLibraryStore.remove(item.id);
  };

  /** 清空纹样库 */
  const handleClearAll = () => {
    if (!window.confirm(`确定清空全部 ${items.length} 个纹样素材吗？此操作不可恢复。`)) return;
    patternLibraryStore.clear();
  };

  const totalKb = items.reduce((sum, i) => sum + patternLibraryStore.sizeKb(i.imageUrl), 0);

  return (
    <section>
      <PageHeader
        title="我的纹样库"
        en="PATTERN LIBRARY"
        desc="从切片重组中收藏的纹样基因片段会沉淀在这里——自包含存储、跨作品复用。点击「带入工作台」，素材即可以贴纸形式自由拼贴到新的创作中，形成「提取 → 沉淀 → 调用」的素材闭环。"
      />

      {/* 数据概览 */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-rice-card px-5 py-4">
        <p className="text-sm text-mo/80">
          共 <span className="font-semibold text-dai">{items.length}</span> 个纹样素材
          {items.length > 0 && (
            <span className="ml-3 text-xs text-mo-light">约 {totalKb}KB · 本地存储</span>
          )}
        </p>
        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <Link
              to="/workbench"
              className="rounded-md border border-dai px-3 py-1.5 text-xs text-dai transition-colors hover:bg-dai hover:text-rice"
            >
              去工作台创作
            </Link>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-mo/70 transition-colors hover:border-zhusha/50 hover:text-zhusha"
            >
              清空纹样库
            </button>
          </div>
        )}
      </div>

      {/* 素材网格 */}
      {items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-rice-card transition-all duration-300 hover:-translate-y-1 hover:border-dai/30 hover:shadow-[0_18px_40px_-24px_rgba(42,38,32,0.35)]"
            >
              <div className="relative aspect-square overflow-hidden border-b border-line">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute left-3 top-3 rounded-full border border-line bg-rice/90 px-2.5 py-1 text-[11px] tracking-wider text-mo-light">
                  纹样基因切片
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="truncate font-serif text-lg font-semibold text-mo" title={item.title}>
                  {item.title || '未命名素材'}
                </h3>
                <dl className="space-y-1 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-mo-light">保存时间</dt>
                    <dd className="text-right text-mo/75">{formatTime(item.savedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-mo-light">体积</dt>
                    <dd className="text-mo/75">
                      约 {patternLibraryStore.sizeKb(item.imageUrl)}KB · 自包含
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto flex gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => handleBringToWorkbench(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-zhusha px-3 py-2 text-xs font-medium text-rice transition-colors hover:bg-zhusha-deep"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                    带入工作台
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    title="删除此素材"
                    className="rounded-md border border-line px-3 py-2 text-xs text-mo/70 transition-colors hover:border-zhusha/50 hover:text-zhusha"
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* 空状态引导 */
        <div className="flex flex-col items-center rounded-xl border border-dashed border-dai/25 bg-rice/40 px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-dai/25 text-2xl text-dai/40">
            <Seal char="库" />
          </span>
          <p className="mt-5 text-sm text-mo-light">纹样库还是空的</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-mo-light/80">
            在工作台的「纹样基因切片与重组」中框选纹样局部 → 提取切片 → 点「❤️ 收藏」，
            素材就会沉淀到这里，可跨作品复用。
          </p>
          <Link
            to="/workbench"
            className="mt-6 flex items-center gap-2 rounded-md bg-zhusha px-5 py-2.5 text-sm font-medium text-rice transition-colors hover:bg-zhusha-deep"
          >
            去共创工作台提取切片
          </Link>
        </div>
      )}
    </section>
  );
}
