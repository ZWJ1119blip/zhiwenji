/**
 * 个人纹样库（localStorage 持久化）
 * key：myPatternLibrary —— 存放用户从「切片重组」中收藏的纹样基因片段
 * 存储的是自包含 JPEG data URL（单张经 maxSize 320px + JPEG 压缩，约 20–80KB），
 * 不依赖可能过期的远程 CDN 地址，页面刷新/重开不丢失。
 */

const KEY = 'myPatternLibrary';
/** 纹样库 → 工作台的传递队列（一次性消费，避免刷新重复导入） */
const PENDING_KEY = 'myPatternLibrary_pending';

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((i) => i && typeof i.imageUrl === 'string') : [];
  } catch {
    return [];
  }
};

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    emit();
    return { ok: true };
  } catch (err) {
    // 常见于存储配额溢出（收藏过多/过大图片）
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const patternLibraryStore = {
  KEY,

  /** 读取全部素材（新→旧） */
  list: read,

  /** 订阅变化（跨组件同步） */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /**
   * 收藏一个纹样素材
   * @param {{title:string, imageUrl:string}} item imageUrl 为自包含 data URL
   */
  add({ title, imageUrl }) {
    const item = {
      id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title || '未命名切片',
      imageUrl,
      savedAt: new Date().toISOString(),
    };
    const res = write([item, ...read()]);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, item };
  },

  /** 删除单个素材 */
  remove(id) {
    write(read().filter((i) => i.id !== id));
  },

  /** 清空纹样库 */
  clear() {
    write([]);
  },

  /** 纹样库 → 工作台：把选中素材压入传递队列 */
  pushPending(item) {
    try {
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ id: item.id, title: item.title, imageUrl: item.imageUrl })
      );
      return true;
    } catch {
      return false;
    }
  },

  /** 工作台初始化时取出并清空传递队列（一次性消费） */
  takePending() {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      localStorage.removeItem(PENDING_KEY);
      const item = JSON.parse(raw);
      return item && typeof item.imageUrl === 'string' ? item : null;
    } catch {
      return null;
    }
  },

  /** 估算 data URL 图片体积（KB），用于 UI 展示与容量提示 */
  sizeKb(imageUrl) {
    if (typeof imageUrl !== 'string') return 0;
    const i = imageUrl.indexOf(',');
    const b64 = i >= 0 ? imageUrl.slice(i + 1) : imageUrl;
    return Math.max(1, Math.round((b64.length * 0.75) / 1024));
  },
};
