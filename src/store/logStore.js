/**
 * 创作日志 Store —— 跨页面共享（工作台生成草图后，日志页实时可见）
 * 基于 React 18+ useSyncExternalStore 的轻量实现
 */
import { INITIAL_LOGS } from '../data/mockData.js';

let logs = INITIAL_LOGS;
const listeners = new Set();
let seq = 0;

const formatTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const logStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return logs;
  },
  /** 追加一条日志（自动补全 id 与时间），返回新日志 */
  add(entry) {
    const item = {
      id: `log_${Date.now()}_${seq++}`,
      time: formatTime(new Date()),
      ...entry,
    };
    logs = [item, ...logs];
    listeners.forEach((l) => l());
    return item;
  },
};
