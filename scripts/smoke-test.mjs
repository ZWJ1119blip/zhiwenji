/**
 * 冒烟测试：色卡染色工具 + 作品 Store（localStorage 持久化）
 * 运行：node scripts/smoke-test.mjs
 */
// —— localStorage polyfill（Node 环境）——
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
};

// —— 1. colorUtil ——
const { hexToRgba, stopsToCssGradient } = await import('../src/utils/colorUtil.js');
console.log('[colorUtil]');
check('hexToRgba 6 位', hexToRgba('#9ab8b2', 0.55) === 'rgba(154, 184, 178, 0.55)');
check('hexToRgba 3 位', hexToRgba('#fff', 1) === 'rgba(255, 255, 255, 1)');
check('hexToRgba 容错', hexToRgba('not-a-color', 0.5) === 'rgba(0,0,0,0.5)');
check(
  'stopsToCssGradient',
  stopsToCssGradient([[0, 'rgba(1,2,3,0.5)'], [1, 'rgba(4,5,6,0.5)']], 115) ===
    'linear-gradient(115deg, rgba(1,2,3,0.5) 0%, rgba(4,5,6,0.5) 100%)'
);

// —— 2. worksStore ——
const { worksStore, useWorks } = await import('../src/store/worksStore.js');
console.log('[worksStore]');
check('初始为空', worksStore.getSnapshot().length === 0);

const w1 = worksStore.add({
  title: '云游青花',
  imageUrl: 'https://example.com/a.png',
  prompt: 'masterpiece, ruyi cloud motif...',
  style: '青花瓷',
  carrier: '丝巾',
});
check('add 返回 id', typeof w1.id === 'string' && w1.id.startsWith('work_'));
check('add 默认状态为草稿', w1.status === '草稿');
check('add 后列表长度为 1', worksStore.getSnapshot().length === 1);
check('持久化到 localStorage', JSON.parse(store.get('zhiwenji.works.v1')).length === 1);

const w2 = worksStore.add({ title: '缠枝一碟春', imageUrl: 'https://example.com/b.png', prompt: 'p2', style: '水墨淡彩', carrier: '陶瓷' });
check('最新作品在前', worksStore.getSnapshot()[0].id === w2.id);
check('列表长度为 2', worksStore.getSnapshot().length === 2);

worksStore.markExported(w1.id);
check('markExported 状态更新', worksStore.getSnapshot().find((w) => w.id === w1.id).status === '已导出');
check('markExported 幂等（不重复计数）', worksStore.getSnapshot().length === 2);
worksStore.markExported(w1.id);
check('重复 markExported 安全', worksStore.getSnapshot().length === 2);
worksStore.markExported('not-exist-id');
check('未知 id 安全', worksStore.getSnapshot().length === 2);

// 订阅机制
let notified = 0;
const unsub = worksStore.subscribe(() => notified++);
worksStore.add({ title: 't3', imageUrl: 'u3', prompt: 'p3' });
unsub();
worksStore.add({ title: 't4', imageUrl: 'u4', prompt: 'p4' });
check('订阅/退订生效', notified === 1);
check('useWorks 是函数', typeof useWorks === 'function');

// 快照引用稳定性（useSyncExternalStore 要求）
const snapA = worksStore.getSnapshot();
worksStore.add({ title: 't5', imageUrl: 'u5', prompt: 'p5' });
check('快照引用随变更更新', worksStore.getSnapshot() !== snapA);

// —— 3. 色卡数据完整性（任务一定义的真实色值）——
const page = await import('../src/pages/WorkbenchPage.jsx').catch((e) => ({ error: e }));
console.log('[模块导入]');
check('WorkbenchPage 可导入（无语法/引用错误）', !page.error);

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
