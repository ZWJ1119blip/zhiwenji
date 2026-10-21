/** 页面标题区：朱砂题签 + 衬线大标题 + 分隔线 + 描述 */
export default function PageHeader({ title, en, desc }) {
  return (
    <header className="mb-10 md:mb-14">
      <div className="flex items-center gap-4">
        <span className="h-10 w-[3px] shrink-0 rounded-full bg-zhusha md:h-12" />
        <div>
          {en && <p className="text-[11px] tracking-[0.42em] text-zhusha/75">{en}</p>}
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-[0.06em] text-mo md:text-4xl">
            {title}
          </h1>
        </div>
      </div>
      <div className="mt-5 h-px w-full bg-line" />
      {desc && (
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mo/65 md:text-[15px]">{desc}</p>
      )}
    </header>
  );
}
