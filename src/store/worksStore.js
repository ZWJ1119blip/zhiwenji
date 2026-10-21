/**
 * 我的作品 Store —— localStorage 持久化
 * 生成草图成功 / 点击导出时写入，「我的作品」页读取渲染
 * 存储字段：图片 URL、创建时间、提示词、风格、应用场景、状态
 */
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'zhiwenji.works.v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.warn('[作品] 读取 localStorage 失败:', err);
    return [];
  }
}

function persist(works) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
  } catch (err) {
    // 常见于存储配额超限（图片 URL 过长时）；不影响当前会话使用
    console.warn('[作品] 写入 localStorage 失败:', err);
  }
}

let works = load();

const emit = () => listeners.forEach((l) => l());

export const worksStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return works;
  },
  /** 新增作品（生成草图成功时调用），返回作品记录 */
  add(work) {
    const item = {
      id: `work_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: '草稿',
      ...work,
    };
    works = [item, ...works];
    persist(works);
    emit();
    return item;
  },
  /** 局部更新作品 */
  update(id, patch) {
    works = works.map((w) => (w.id === id ? { ...w, ...patch } : w));
    persist(works);
    emit();
  },
  /** 导出成功后标记为「已导出」 */
  markExported(id) {
    if (!id || !works.some((w) => w.id === id)) return;
    this.update(id, { status: '已导出', exportedAt: new Date().toISOString() });
  },
};

/** React Hook：订阅作品列表（跨组件实时同步） */
export const useWorks = () => useSyncExternalStore(worksStore.subscribe, worksStore.getSnapshot, () => []);
