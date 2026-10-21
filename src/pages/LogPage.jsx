import { useState } from 'react';
import { useSyncExternalStore } from 'react';
import LogList from '../components/LogList.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { logStore } from '../store/logStore.js';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'generate', label: '生成草图' },
  { key: 'manual', label: '人工干预' },
  { key: 'carrier', label: '载体适配' },
  { key: 'export', label: '导出' },
];

export default function LogPage() {
  const logs = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.type === filter);

  return (
    <section>
      <PageHeader
        title="创作日志"
        en="CREATION LOG"
        desc="全程溯源记录：从创建项目、选择范式，到 AI 生成草图、每一次人工干预与载体适配，完整留存创作轨迹。"
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-sm tracking-wider transition-colors ${
              filter === f.key
                ? 'border-dai bg-dai text-rice'
                : 'border-line bg-rice-card text-mo/70 hover:border-dai/40 hover:text-dai'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-mo-light">共 {filtered.length} 条记录</span>
      </div>

      <LogList logs={filtered} />
    </section>
  );
}
