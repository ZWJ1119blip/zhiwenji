import { useEffect, useRef, useState } from 'react';
import { logStore } from '../store/logStore.js';
import { patternLibraryStore } from '../store/patternLibraryStore.js';
import { cropImageRegion } from '../utils/imageComposite.js';

/**
 * 纹样基因切片与重组（核心人工二次创作交互）
 * 流程：开启切片重组 → 在纹样大图上拖拽框选局部 →
 *       「提取此切片」生成贴纸（background-image + background-position 精准裁取）→
 *       贴纸可随意拖拽拼贴回主图；每张贴纸可「❤️ 收藏入纹样库」（自包含切片图），
 *       也可接收从「我的纹样库」导入的素材贴纸。每次操作记入创作日志。
 */
let stickerSeq = 0;
const MIN_SELECTION = 40; // 最小框选边长（px），过小则提取出的切片过于模糊

export default function SliceStudio({ imageUrl, theme, importedStickers, onImportConsumed }) {
  const [active, setActive] = useState(false); // 是否开启切片重组
  const [rect, setRect] = useState(null); // 当前框选 { x, y, w, h }（px，相对图片舞台）
  const [pending, setPending] = useState(null); // 松开鼠标后待提取的框选
  const [stickers, setStickers] = useState([]); // 贴纸库 [{ id, style, x, y, z, dataUrl? }]
  const [toast, setToast] = useState(''); // 收藏结果提示
  const [hint, setHint] = useState(''); // 操作提示（框选过小 / 已取消等）
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const drawingRef = useRef(null); // 框选起点
  const dragRef = useRef(null); // 贴纸拖拽状态
  const zTopRef = useRef(10); // 贴纸层级计数
  const toastTimer = useRef(null);
  const hintTimer = useRef(null);

  // 卸载时清理提示定时器
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(hintTimer.current);
    },
    []
  );

  /** 接收从「我的纹样库」/工作台导入的素材贴纸：自动打开切片重组并合入贴纸库 */
  useEffect(() => {
    if (!importedStickers || importedStickers.length === 0) return;
    // 有素材进入时自动展开切片重组，便于立即拼贴
    setActive(true);
    setStickers((list) => {
      const exists = new Set(list.map((s) => s.id));
      const fresh = importedStickers.filter((i) => i && !exists.has(i.id));
      if (fresh.length === 0) return list;
      return [
        ...list,
        ...fresh.map((i) => ({
          id: i.id,
          label: i.title || '纹样库素材',
          style: i.style,
          x: 40,
          y: 40 + list.length * 24,
          z: ++zTopRef.current,
          dataUrl: i.imageUrl, // 导入素材本身即自包含图，可直接收藏/持久化
          fromLibrary: true,
        })),
      ];
    });
    // 导入日志 + 通知父组件消费（避免 StrictMode / 重复渲染时重复导入）
    importedStickers.forEach((i) => {
      logStore.add({
        type: 'manual',
        title: '人工干预-从纹样库导入素材',
        details: [
          `素材：${i.title || '未命名素材'}`,
          '说明：素材已加入贴纸库，可拖拽拼贴至主图',
        ],
      });
      onImportConsumed?.(i.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedStickers]);

  /** 提示信息（2.5s 后自动消失） */
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  /** 操作提示（3.5s 后自动消失，用于框选过小 / 取消框选等反馈） */
  const showHint = (msg) => {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), 3500);
  };

  const toggle = () => {
    setActive((v) => {
      if (v) {
        // 关闭时清理框选状态（保留已提取的贴纸）
        setRect(null);
        setPending(null);
      }
      return !v;
    });
  };

  /** 取消当前框选：清空框选区域与待提取状态，让红框与按钮彻底消失 */
  const cancelSelection = () => {
    drawingRef.current = null;
    setRect(null);
    setPending(null);
    showHint('已取消框选，可重新拖拽框选纹样局部');
  };

  /** 框选开始 */
  const handleStagePointerDown = (e) => {
    if (!active || pending) return;
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    drawingRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    setRect({ x: drawingRef.current.x, y: drawingRef.current.y, w: 0, h: 0 });
    stage.setPointerCapture?.(e.pointerId);
  };

  /** 框选拖动 */
  const handleStagePointerMove = (e) => {
    if (!drawingRef.current) return;
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    const cx = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const cy = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    const { x, y } = drawingRef.current;
    setRect({
      x: Math.min(x, cx),
      y: Math.min(y, cy),
      w: Math.abs(cx - x),
      h: Math.abs(cy - y),
    });
  };

  /** 框选结束：尺寸过小则给出温馨提示并清除，避免提取出糊图 */
  const handleStagePointerUp = (e) => {
    if (!drawingRef.current) return;
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    const { x, y } = drawingRef.current;
    drawingRef.current = null;
    // 以松手位置计算最终框选（与拖动时的钳制逻辑保持一致）
    const cx = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const cy = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    const next = {
      x: Math.min(x, cx),
      y: Math.min(y, cy),
      w: Math.abs(cx - x),
      h: Math.abs(cy - y),
    };
    if (next.w >= MIN_SELECTION && next.h >= MIN_SELECTION) {
      setRect(next);
      setPending(next);
      return;
    }
    // 过小：清除框选并提示重新框选（单击等无意识操作不打扰用户）
    setRect(null);
    setPending(null);
    if (next.w > 3 || next.h > 3) {
      showHint(
        `框选区域过小（${Math.round(next.w)}×${Math.round(next.h)}px），请重新框选（建议不小于 ${MIN_SELECTION}×${MIN_SELECTION}px）`
      );
    }
  };

  /** 框选被系统中断（如触摸取消）：直接清除 */
  const handleStagePointerCancel = () => {
    drawingRef.current = null;
    setRect(null);
    setPending(null);
  };

  /** 提取此切片：按框选区域生成贴纸（精准裁取原图像素） */
  const handleExtract = () => {
    if (!pending) return;
    // 兜底校验：窗口缩放等场景下 pending 可能已小于最小尺寸
    if (pending.w < MIN_SELECTION || pending.h < MIN_SELECTION) {
      showHint(
        `框选区域过小（${Math.round(pending.w)}×${Math.round(pending.h)}px），请重新框选（建议不小于 ${MIN_SELECTION}×${MIN_SELECTION}px）`
      );
      setPending(null);
      setRect(null);
      return;
    }
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const natW = img.naturalWidth || 1024;
    const natH = img.naturalHeight || 1024;
    // 框选区域 → 原图像素坐标（图片以 object-cover 铺满舞台）
    const coverScale = Math.max(stageRect.width / natW, stageRect.height / natH);
    const dispW = natW * coverScale;
    const dispH = natH * coverScale;
    const offX = (dispW - stageRect.width) / 2;
    const offY = (dispH - stageRect.height) / 2;
    const srcX = (pending.x + offX) / coverScale;
    const srcY = (pending.y + offY) / coverScale;
    const srcW = pending.w / coverScale;
    const srcH = pending.h / coverScale;

    // 贴纸显示尺寸：保持框选宽高比，宽度 56–150px
    const sw = Math.min(150, Math.max(56, pending.w));
    const sh = Math.max(28, sw * (srcH / srcW));
    // 背景缩放与位移：把「原图中被框选的那一块」映射到贴纸上
    const bgScale = sw / srcW;
    const style = {
      width: `${sw}px`,
      height: `${sh}px`,
      backgroundImage: `url(${imageUrl})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${natW * bgScale}px ${natH * bgScale}px`,
      backgroundPosition: `${-srcX * bgScale}px ${-srcY * bgScale}px`,
    };
    const id = `sticker_${Date.now()}_${stickerSeq++}`;
    setStickers((list) => [
      ...list,
      {
        id,
        style,
        x: stageRect.width / 2 - sw / 2,
        y: stageRect.height / 2 - sh / 2,
        z: ++zTopRef.current,
        label: `切片 ${list.length + 1}`,
        // 原图中的裁剪区域（原图像素坐标），用于生成自包含切片图
        crop: { x: srcX, y: srcY, w: srcW, h: srcH },
      },
    ]);
    setPending(null);
    setRect(null);
    logStore.add({
      type: 'manual',
      title: '人工干预-纹样切片重组',
      details: [
        `纹样：${theme || '未命名'}`,
        `切片位置：x ${Math.round(srcX)} · y ${Math.round(srcY)}（原图坐标）`,
        `切片尺寸：${Math.round(srcW)}×${Math.round(srcH)}`,
        '说明：已提取为基因贴纸，可拖拽拼贴至主图',
      ],
    });

    // 异步生成自包含切片图（JPEG data URL）：供「收藏入纹样库」使用，
    // 不依赖可能过期的远程图片地址；体积受控，避免 localStorage 卡顿/超容
    cropImageRegion(imageUrl, { x: srcX, y: srcY, w: srcW, h: srcH })
      .then((dataUrl) => {
        setStickers((list) => list.map((s) => (s.id === id ? { ...s, dataUrl } : s)));
      })
      .catch((err) => {
        console.warn('[切片] 自包含切片图生成失败（不影响拼贴，仅不可收藏）:', err);
      });
  };

  /** ❤️ 收藏入纹样库：把自包含切片图 + 当前时间写入 localStorage myPatternLibrary */
  const handleCollect = (sticker) => {
    if (!sticker.dataUrl) {
      showToast('切片图正在生成，请稍候再收藏…');
      return;
    }
    const res = patternLibraryStore.add({
      title: `${theme || '纹样'} · ${sticker.label}`,
      imageUrl: sticker.dataUrl,
    });
    if (res.ok) {
      const kb = patternLibraryStore.sizeKb(sticker.dataUrl);
      showToast(`已成功存入纹样库（约 ${kb}KB）`);
      logStore.add({
        type: 'manual',
        title: '人工干预-收藏切片入纹样库',
        details: [
          `纹样：${theme || '未命名'}`,
          `贴纸：${sticker.label}`,
          `体积：约 ${kb}KB · 自包含 JPEG`,
          '说明：已存入我的纹样库，可跨作品复用',
        ],
      });
    } else {
      showToast(`存入失败：${res.error || '存储空间不足，请先清理纹样库'}`);
    }
  };

  /** 贴纸置顶（拖拽或悬停时提升层级，保证 × 按钮不被其他贴纸遮挡） */
  const raiseSticker = (id) => {
    setStickers((list) => {
      if (!list.some((s) => s.id === id)) return list;
      const top = zTopRef.current + 1;
      zTopRef.current = top;
      return list.map((s) => (s.id === id ? { ...s, z: top } : s));
    });
  };

  /** 贴纸拖拽开始 */
  const handleStickerPointerDown = (e, sticker) => {
    e.stopPropagation();
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    dragRef.current = {
      id: sticker.id,
      offsetX: e.clientX - r.left - sticker.x,
      offsetY: e.clientY - r.top - sticker.y,
      moved: false,
    };
    raiseSticker(sticker.id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  /** 贴纸拖拽移动 */
  const handleStickerPointerMove = (e, sticker) => {
    if (!dragRef.current || dragRef.current.id !== sticker.id) return;
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left - dragRef.current.offsetX;
    const y = e.clientY - r.top - dragRef.current.offsetY;
    dragRef.current.moved = true;
    setStickers((list) => list.map((s) => (s.id === sticker.id ? { ...s, x, y } : s)));
  };

  /** 贴纸拖拽结束：写入拼贴日志 */
  const handleStickerPointerUp = (e, sticker) => {
    if (!dragRef.current || dragRef.current.id !== sticker.id) return;
    const moved = dragRef.current.moved;
    dragRef.current = null;
    if (!moved) return;
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    logStore.add({
      type: 'manual',
      title: '人工干预-贴纸拼贴',
      details: [
        `纹样：${theme || '未命名'}`,
        `贴纸：${sticker.label}`,
        `拼贴位置：x ${Math.round((sticker.x / r.width) * 100)}% · y ${Math.round((sticker.y / r.height) * 100)}%`,
      ],
    });
  };

  /** 删除贴纸（贴纸右上角红色 ×） */
  const handleStickerRemove = (e, sticker) => {
    // 必须阻止冒泡与默认行为：否则事件会被底层贴纸的拖拽/指针捕获逻辑拦截
    e.stopPropagation();
    e.preventDefault();
    setStickers((list) => list.filter((s) => s.id !== sticker.id));
    logStore.add({
      type: 'manual',
      title: '人工干预-删除切片贴纸',
      details: [`纹样：${theme || '未命名'}`, `贴纸：${sticker.label}`],
    });
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-dai">纹样基因切片与重组</p>
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            active
              ? 'border-zhusha bg-zhusha/10 text-zhusha'
              : 'border-dai bg-dai/5 text-dai hover:bg-dai hover:text-rice'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v14a2 2 0 0 0 2 2h14" />
            <path d="M18 21V7a2 2 0 0 0-2-2H2" />
          </svg>
          {active ? '关闭切片重组' : '开启切片重组'}
        </button>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-mo-light">
        通用 AI 只能整图生成；在这里你可以像拼贴艺术家一样，框选纹样的「基因片段」提取为贴纸，再自由拼贴回主图——这是真正的人工二次创作。提取的切片还可一键收藏进「我的纹样库」跨作品复用。框选区域建议不小于 {MIN_SELECTION}×{MIN_SELECTION}px，过小将无法提取。
      </p>

      {active && (
        <div className="rounded-lg border border-dai/25 bg-rice p-3">
          {/* 纹样大图舞台：框选 + 贴纸拼贴 */}
          <div
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerCancel}
            className={`relative h-72 w-full touch-none select-none overflow-hidden rounded-md border border-line bg-rice-deep ${
              pending ? 'cursor-default' : 'cursor-crosshair'
            }`}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="切片重组主图"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              draggable="false"
            />

            {/* 框选半透明红框 + 取消按钮（红色 ×） */}
            {rect && (
              <span
                className="pointer-events-none absolute border-2 border-dashed border-zhusha bg-zhusha/15"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: 30 }}
              >
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-zhusha" />
                {/* × 取消框选：阻止冒泡防止触发舞台拖拽；z-index 高于底层拖拽层 */}
                <button
                  type="button"
                  title="取消框选"
                  aria-label="取消框选"
                  onPointerDown={(e) => {
                    // 阻止父级舞台重新开始框选（事件不会冒泡到舞台）
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    // 第一行即阻止冒泡与默认行为，防止被底层拖拽逻辑拦截
                    e.stopPropagation();
                    e.preventDefault();
                    cancelSelection();
                  }}
                  className="pointer-events-auto absolute -right-3 -top-3 grid h-5 w-5 cursor-pointer place-items-center rounded-full border border-rice bg-zhusha text-[11px] font-bold leading-none text-rice shadow-md transition-transform hover:scale-110"
                  style={{ zIndex: 40 }}
                >
                  ×
                </button>
              </span>
            )}

            {/* 已提取贴纸：可拖拽 */}
            {stickers.map((s) => (
              <span
                key={s.id}
                role="button"
                tabIndex={0}
                title={`${s.label}（拖拽移动，点 × 移除）`}
                onPointerEnter={() => raiseSticker(s.id)}
                onPointerDown={(e) => handleStickerPointerDown(e, s)}
                onPointerMove={(e) => handleStickerPointerMove(e, s)}
                onPointerUp={(e) => handleStickerPointerUp(e, s)}
                onPointerCancel={(e) => handleStickerPointerUp(e, s)}
                className="absolute cursor-grab touch-none rounded-sm border border-rice/80 shadow-[0_8px_18px_-8px_rgba(42,38,32,0.7)] outline-none active:cursor-grabbing"
                style={{ left: s.x, top: s.y, zIndex: s.z, ...s.style }}
              >
                <span
                  role="button"
                  tabIndex={0}
                  title="移除此贴纸"
                  aria-label="移除此贴纸"
                  onPointerDown={(e) => {
                    // 关键修复：父级贴纸在 pointerdown 中设置了指针捕获，
                    // 会把后续 click 重定向到父贴纸上，导致本按钮 onClick 失效。
                    // 这里阻止冒泡，使父级不会捕获指针，click 即可正常触发。
                    e.stopPropagation();
                  }}
                  onClick={(e) => handleStickerRemove(e, s)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStickerRemove(e, s);
                    }
                  }}
                  className="absolute -right-2 -top-2 grid h-4 w-4 cursor-pointer place-items-center rounded-full border border-rice/70 bg-zhusha text-[9px] leading-none text-rice shadow"
                  style={{ zIndex: 30 }}
                >
                  ×
                </span>
              </span>
            ))}

            {/* 操作提示 */}
            {!pending && !rect && stickers.length === 0 && (
              <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full border border-line bg-rice/85 px-3 py-1 text-[11px] text-mo-light backdrop-blur-sm">
                按住鼠标在大图上拖拽，框选要提取的纹样局部
              </span>
            )}
          </div>

          {/* 操作反馈提示（框选过小 / 已取消框选等） */}
          {hint && (
            <p className="mt-2 flex items-center gap-1.5 rounded-md border border-zhusha/30 bg-zhusha/5 px-3 py-1.5 text-[11px] leading-relaxed text-zhusha">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              {hint}
            </p>
          )}

          {/* 框选完成后：提取操作 */}
          {pending && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-mo-light">
                已框选 {Math.round(pending.w)}×{Math.round(pending.h)}px 区域
              </span>
              <button
                type="button"
                onClick={handleExtract}
                className="flex items-center gap-2 rounded-md bg-zhusha px-4 py-1.5 text-xs font-medium text-rice transition-colors hover:bg-zhusha-deep"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                提取此切片
              </button>
              <button
                type="button"
                onClick={cancelSelection}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-mo/70 transition-colors hover:border-dai/40 hover:text-dai"
              >
                重新框选
              </button>
            </div>
          )}

          {/* 贴纸库 */}
          {stickers.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-dai">
                  贴纸库（{stickers.length}）· 拖拽贴纸到左侧大图上完成拼贴
                </p>
                {toast && (
                  <span className="rounded-full border border-dai/30 bg-dai/5 px-2.5 py-1 text-[11px] text-dai">
                    {toast}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {stickers.map((s) => (
                  <span
                    key={`lib-${s.id}`}
                    className="flex flex-col items-center gap-1 rounded-md border border-line bg-rice-card p-1.5"
                  >
                    <span
                      className="block rounded-sm border border-line/70"
                      style={s.style}
                      title={s.label}
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] text-mo-light">{s.label}</span>
                      {/* ❤️ 收藏入纹样库：写入 localStorage myPatternLibrary */}
                      <button
                        type="button"
                        onClick={() => handleCollect(s)}
                        title={s.dataUrl ? '收藏此切片到我的纹样库' : '切片图生成中…'}
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] transition-colors ${
                          s.dataUrl
                            ? 'border-zhusha/50 text-zhusha hover:bg-zhusha hover:text-rice'
                            : 'border-line text-mo-light/60'
                        }`}
                      >
                        ❤️ 收藏入纹样库
                      </button>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
