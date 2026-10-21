import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { INSPIRATION_WORKS } from '../data/mockData.js';

/** 版权存证徽章（醒目，展示社区知识产权保护机制） */
function CertBadge({ cert }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teng/70 bg-rice/95 px-2.5 py-1 text-[11px] font-medium text-zheshi shadow-[0_2px_10px_-4px_rgba(42,38,32,0.4)] backdrop-blur-sm">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 1.5l6 2.2v5.1c0 4.2-2.5 7.6-6 9.7-3.5-2.1-6-5.5-6-9.7V3.7l6-2.2zm-1.6 9.9l4.2-4.2-1.1-1.1-3.1 3.1-1.5-1.5-1.1 1.1 2.6 2.6z"
          clipRule="evenodd"
        />
      </svg>
      版权存证 · {cert.status}
    </span>
  );
}

/** 创作者头像：印章式色块 + 单字 */
function CreatorAvatar({ creator }) {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line font-serif text-sm font-semibold text-rice"
      style={{ backgroundColor: creator.color }}
      title={creator.name}
    >
      {creator.avatar}
    </span>
  );
}

/** 社区作品卡片：图片 + 存证徽章 + 创作者 + 点赞 */
function InspirationCard({ work }) {
  const [liked, setLiked] = useState(work.liked);
  const [likes, setLikes] = useState(work.likes);

  const toggleLike = () => {
    setLiked((v) => {
      setLikes((n) => (v ? n - 1 : n + 1));
      return !v;
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-rice-card transition-all duration-300 hover:-translate-y-1 hover:border-dai/30 hover:shadow-[0_18px_40px_-24px_rgba(42,38,32,0.35)]">
      {/* 作品图 */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
        <img
          src={work.image}
          alt={`${work.title} · ${work.pattern}${work.carrier}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {/* 醒目的版权存证徽章 */}
        <span className="absolute right-3 top-3">
          <CertBadge cert={work.cert} />
        </span>
        <span className="absolute bottom-3 left-3 rounded-full border border-line bg-rice/90 px-2.5 py-1 text-[11px] tracking-wider text-mo-light backdrop-blur-sm">
          {work.carrier} · {work.pattern}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <header className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold text-mo">{work.title}</h3>
          <span className="shrink-0 text-[11px] tracking-[0.2em] text-mo-light">{work.style}</span>
        </header>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-mo/65">「{work.inspiration}」</p>

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zheshi">
          <span aria-hidden="true">⛓</span>
          区块链存证编号 {work.cert.no}
        </p>

        {/* 创作者 + 点赞 */}
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-center gap-2.5">
            <CreatorAvatar creator={work.creator} />
            <span className="text-xs text-mo/75">{work.creator.name}</span>
          </span>
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              liked
                ? 'border-zhusha bg-zhusha/10 text-zhusha'
                : 'border-line text-mo-light hover:border-zhusha/40 hover:text-zhusha'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 3.2c0 5.1-7.5 9.7-7.5 9.7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {likes}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function InspirationPage() {
  const totalLikes = INSPIRATION_WORKS.reduce((sum, w) => sum + w.likes, 0);

  return (
    <section>
      <PageHeader
        title="灵感广场"
        en="INSPIRATION PLAZA"
        desc="来自共创社区的非遗纹样作品。每一件都附带区块链存证编号与完整溯源日志——灵感可以被借鉴，版权始终受到保护。"
      />

      {/* 社区数据概览 */}
      <div className="mb-8 grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-rice-card py-5 text-center">
        {[
          ['社区作品', `${INSPIRATION_WORKS.length * 214}+`],
          ['累计点赞', `${totalLikes + 5213}`],
          ['存证覆盖率', '100%'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="font-serif text-2xl font-semibold text-dai md:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-mo-light">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {INSPIRATION_WORKS.map((w) => (
          <InspirationCard key={w.id} work={w} />
        ))}
      </div>

      {/* 底部合规与引导 */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-dashed border-dai/30 bg-rice/40 px-6 py-8 text-center">
        <p className="max-w-xl text-sm leading-relaxed text-mo/70">
          广场作品均自动生成溯源日志与存证编号。喜欢哪件作品？去共创工作台复刻属于你的版本——
          你的灵感与干预记录，同样会被完整保护。
        </p>
        <Link
          to="/workbench"
          className="rounded-md bg-dai px-6 py-2.5 text-sm font-medium tracking-wider text-rice transition-colors hover:bg-dai-light"
        >
          开始我的共创
        </Link>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-mo-light">
        *创意由你定义，AI 仅为画笔。本平台所有生成素材均需经人工干预，且自动记录溯源日志以保护知识产权。*
      </p>
    </section>
  );
}
