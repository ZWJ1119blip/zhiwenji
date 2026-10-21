/**
 * 冒烟测试：patternLibraryStore（localStorage mock）
 * 覆盖：收藏(add) / 列表(list) / 订阅(subscribe) / 删除(remove) / 清空(clear) /
 *       纹样库→工作台传递队列(pushPending/takePending) / 体积估算(sizeKb) / 配额错误处理
 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { patternLibraryStore } = await import('../src/store/patternLibraryStore.js');

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  if (cond) {
    pass++;
    console.log('  ✓', name);
  } else {
    fail++;
    console.log('  ✗', name);
  }
};

// 1. 初始为空
check('初始纹样库为空', patternLibraryStore.list().length === 0);

// 2. 收藏两个素材（模拟自包含 JPEG data URL）
const fakeJpeg = (kb) => 'data:image/jpeg;base64,' + 'A'.repeat(Math.round((kb * 1024) / 0.75));
const r1 = patternLibraryStore.add({ title: '云纹 · 切片 1', imageUrl: fakeJpeg(30) });
const r2 = patternLibraryStore.add({ title: '缠枝 · 切片 2', imageUrl: fakeJpeg(50) });
check('收藏返回 ok 与 item.id', r1.ok && typeof r1.item.id === 'string' && r2.ok);
check('列表按新→旧排序（2 条，最新在前）',
  patternLibraryStore.list().length === 2 &&
  patternLibraryStore.list()[0].title === '缠枝 · 切片 2');
check('存储 key 为 myPatternLibrary', store.has('myPatternLibrary'));
check('保存时间 savedAt 为 ISO 字符串', typeof r1.item.savedAt === 'string' && !Number.isNaN(Date.parse(r1.item.savedAt)));

// 3. 订阅通知
let notified = 0;
const unsub = patternLibraryStore.subscribe(() => notified++);
patternLibraryStore.add({ title: '回纹 · 切片 3', imageUrl: fakeJpeg(20) });
check('add 后订阅者被通知', notified === 1);
unsub();
patternLibraryStore.add({ title: '宝相 · 切片 4', imageUrl: fakeJpeg(10) });
check('取消订阅后不再通知', notified === 1);

// 4. 体积估算（30KB data URL → 约 30KB）
check('sizeKb 估算约 30KB', patternLibraryStore.sizeKb(fakeJpeg(30)) === 30);

// 5. 传递队列（纹样库 → 工作台）
const target = patternLibraryStore.list().find((i) => i.title === '云纹 · 切片 1');
check('pushPending 成功', patternLibraryStore.pushPending(target) === true);
const taken = patternLibraryStore.takePending();
check('takePending 取回同一素材', taken && taken.id === target.id && taken.imageUrl === target.imageUrl);
check('takePending 一次性消费（再次为空）', patternLibraryStore.takePending() === null);
check('队列 key 为 myPatternLibrary_pending', store.has('myPatternLibrary_pending') === false);

// 6. 删除 / 清空
const before = patternLibraryStore.list().length;
patternLibraryStore.remove(patternLibraryStore.list()[0].id);
check('删除后数量减一', patternLibraryStore.list().length === before - 1);
patternLibraryStore.clear();
check('清空后为空数组', patternLibraryStore.list().length === 0 && Array.isArray(patternLibraryStore.list()));

// 7. 配额溢出处理（mock setItem 抛错）
const origSet = globalThis.localStorage.setItem;
globalThis.localStorage.setItem = () => {
  throw new Error('QuotaExceededError');
};
const rFull = patternLibraryStore.add({ title: '超容测试', imageUrl: fakeJpeg(10) });
check('配额溢出时返回 ok:false 与错误信息', rFull.ok === false && /Quota/.test(rFull.error));
globalThis.localStorage.setItem = origSet;

// 8. 损坏数据容错
store.set('myPatternLibrary', '{broken json');
check('JSON 损坏时返回空数组不崩溃', patternLibraryStore.list().length === 0);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
