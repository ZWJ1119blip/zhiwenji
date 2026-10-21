/** 创作日志时间轴：按事件类型着色（生成草图 / 人工干预 / 载体适配 / 导出等） */
const TYPE_META = {
  create: { label: '创建项目', dot: 'bg-teng', badge: 'bg-teng/15 text-zheshi' },
  select: { label: '选择范式', dot: 'bg-tianqing', badge: 'bg-tianqing/20 text-dai' },
  generate: { label: '生成草图', dot: 'bg-zhusha', badge: 'bg-zhusha/10 text-zhusha' },
  manual: { label: '人工干预', dot: 'bg-dai', badge: 'bg-dai/10 text-dai' },
  carrier: { label: '载体适配', dot: 'bg-zheshi', badge: 'bg-zheshi/15 text-zheshi' },
  export: { label: '导出', dot: 'bg-mo', badge: 'bg-mo/10 text-mo' },
};

export default function LogList({ logs }) {
  if (!logs.length) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-rice/40 px-6 py-16 text-center text-sm text-mo-light">
        暂无日志记录
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
      {logs.map((log) => {
        const meta = TYPE_META[log.type] ?? TYPE_META.create;
        const hasMeta = log.model || log.prompt || log.imageUrl;
        return (
          <li key={log.id} className="relative pl-10 md:pl-14">
            {/* 时间轴节点 */}
            <span
              className={`absolute left-[7px] top-6 h-4 w-4 rounded-full border-2 border-rice ring-2 ring-line/60 ${meta.dot}`}
            />
            <div className="rounded-lg border border-line bg-rice-card p-4 transition-colors hover:border-dai/30 md:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wider ${meta.badge}`}
                >
                  {meta.label}
                </span>
                <time className="text-xs tracking-wider text-mo-light">{log.time}</time>
              </div>
              <h3 className="mt-2.5 font-serif text-lg font-semibold text-mo">{log.title}</h3>
              <ul className="mt-2 space-y-1">
                {log.details.map((d, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-mo/70">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mo-light/60" />
                    {d}
                  </li>
                ))}
              </ul>

              {/* 真实 API 生成记录的附加信息：模型 / 提示词 / 图片 */}
              {hasMeta && (
                <dl className="mt-3 space-y-2 border-t border-line/70 pt-3 text-xs">
                  {log.model && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-mo-light">模型</dt>
                      <dd className="font-medium text-mo/80">{log.model}</dd>
                    </div>
                  )}
                  {log.prompt && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-mo-light">提示词</dt>
                      <dd className="break-all leading-relaxed text-mo/70">{log.prompt}</dd>
                    </div>
                  )}
                  {log.imageUrl && (
                    <div className="flex items-center gap-2">
                      <dt className="shrink-0 text-mo-light">图片</dt>
                      <dd>
                        <a href={log.imageUrl} target="_blank" rel="noreferrer">
                          <img
                            src={log.imageUrl}
                            alt="生成图片缩略图"
                            className="h-16 w-16 rounded border border-line object-cover transition-transform hover:scale-105"
                          />
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
