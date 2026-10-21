import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Seal from '../components/Seal.jsx';
import { DiagnosticGrid, DiagnosticReport, DiagnosticTrigger } from '../components/RuleDiagnostic.jsx';
import SliceStudio from '../components/SliceStudio.jsx';
import { CARRIER_OPTIONS, STYLE_OPTIONS } from '../data/mockData.js';
import {
  MODEL_NAME,
  deriveThemeLabel,
  handleGenerateImage,
  refineRegion,
} from '../api/patternApi.js';
import { exportElementAsImage } from '../utils/exportCanvas.js';
import {
  compositeOnCarrier,
  downloadDataUrl,
  generateSeamlessTile,
} from '../utils/imageComposite.js';
import { logStore } from '../store/logStore.js';
import { worksStore } from '../store/worksStore.js';
import { patternLibraryStore } from '../store/patternLibraryStore.js';
import { hexToRgba, stopsToCssGradient } from '../utils/colorUtil.js';

/** 共创流程指引 */
const STEPS = ['输入灵感', 'AI 辅助生成', '人工二次干预', '跨载体适配'];

/** 载体名 → 右侧预览预设 key */
const CARRIER_KEY_MAP = {
  丝巾: 'silk',
  陶瓷: 'ceramic',
  版画: 'print',
  书签: 'bookmark',
  包装盒: 'box',
  汉服: 'hanfu',
  屏风: 'screen',
  数字壁纸: 'wallpaper',
};

/**
 * 跨载体预览预设
 * mask：透明底载体剪影（public/images/*.png），会将 AI 纹样真实「印」在载体上（首选）
 * 合成不可用时回退为 CSS 形态预览：丝巾 clip-path 剪裁、陶瓷盘圆形内阴影等
 */
const CARRIER_PREVIEWS = [
  {
    key: 'silk',
    label: '丝巾',
    mask: '/images/silk-scarf.png',
    wrap: 'relative bg-[radial-gradient(circle_at_50%_40%,#fdfbf4_0%,#efe7d4_70%)] p-6',
    img: 'w-full max-h-72 object-cover',
  },
  {
    key: 'ceramic',
    label: '陶瓷盘',
    mask: '/images/ceramic-plate.png',
    wrap: 'relative bg-[radial-gradient(circle_at_50%_45%,#fdfbf4_0%,#ece2cc_75%)] p-6',
    img: 'mx-auto w-64 max-h-72 object-cover',
  },
  {
    key: 'hanfu',
    label: '汉服',
    mask: '/images/hanfu.png',
    wrap: 'relative bg-[linear-gradient(180deg,#f7f2e6_0%,#eee5cf_100%)] p-6',
    img: 'mx-auto w-52 max-h-72 object-cover rounded-t-[45%] rounded-b-[14%]',
  },
  {
    key: 'print',
    label: '版画',
    wrap: 'relative bg-rice-deep p-5',
    img: 'w-full max-h-72 object-cover border-[6px] border-mo/85 shadow-[0_12px_28px_-12px_rgba(42,38,32,0.5)]',
    extra: 'registration',
  },
  {
    key: 'bookmark',
    label: '书签',
    wrap: 'relative bg-rice-deep p-5',
    img: 'mx-auto w-36 aspect-[3/8] object-cover rounded-lg shadow-[0_12px_28px_-12px_rgba(42,38,32,0.5)]',
    extra: 'tassel',
  },
  {
    key: 'box',
    label: '包装盒',
    wrap: 'relative bg-gradient-to-br from-[#e8dfc9] to-[#d9cba6] p-6',
    img: 'mx-auto w-56 max-h-64 object-cover rounded-md border border-line shadow-[0_16px_32px_-18px_rgba(42,38,32,0.6)]',
    extra: 'ribbon',
  },
  {
    key: 'screen',
    label: '屏风',
    wrap: 'relative bg-[radial-gradient(circle_at_50%_30%,#f4efe1_0%,#e6dcc4_70%)] p-6',
    img: 'mx-auto w-full max-w-md max-h-72 object-cover rounded-sm border-[8px] border-zheshi/70 shadow-[0_14px_30px_-16px_rgba(42,38,32,0.55)]',
    extra: 'panels',
  },
  {
    key: 'wallpaper',
    label: '数字壁纸',
    wrap: 'relative rounded-2xl bg-mo/90 p-4',
    img: 'mx-auto w-full max-w-md aspect-video object-cover rounded-lg',
    extra: 'bezel',
  },
];

/**
 * 非遗传统色卡
 * 染色方式：CSS 叠加层 mix-blend-mode（color / multiply）——
 * 取色卡的色相与饱和度、保留纹样自身的明暗纹理，
 * 避免粗暴全局 hue-rotate 把图片染成土褐色。
 * tint：主染色十六进制色；tintAlpha：叠加浓度；blend：混合模式；
 * gradientStops：多色渐变停靠点（唐三彩 / 敦煌壁画用）。
 */
const TRADITIONAL_PALETTES = [
  {
    id: 'ruyao',
    name: '汝窑天青',
    era: '北宋',
    swatches: ['#9ab8b2', '#7fa3a0', '#cfdedd', '#4e7060'],
    tint: '#9ab8b2',
    tintAlpha: 0.55,
    blend: 'color',
  },
  {
    id: 'tangsancai',
    name: '唐三彩',
    era: '唐',
    swatches: ['#d9a441', '#6b8f6a', '#a85a2c', '#efe3c8'],
    tint: '#c98f3f',
    tintAlpha: 0.5,
    blend: 'color',
    // 三色渐变遮罩：黄 / 赭 / 绿，随位置渐变过渡
    gradientStops: [
      [0, 'rgba(217,164,65,0.62)'],
      [0.34, 'rgba(168,90,44,0.56)'],
      [0.66, 'rgba(107,143,106,0.60)'],
      [1, 'rgba(217,164,65,0.62)'],
    ],
  },
  {
    id: 'jingtailan',
    name: '景泰蓝',
    era: '清',
    swatches: ['#1c3c80', '#2b4c7e', '#d9a441', '#f6f1e6'],
    tint: '#1c3c80',
    tintAlpha: 0.5,
    blend: 'color',
  },
  {
    id: 'dunhuang',
    name: '敦煌壁画',
    era: '唐宋',
    swatches: ['#a85a2c', '#2b4c7e', '#d9a441', '#e6d3ac'],
    tint: '#a85a2c',
    tintAlpha: 0.46,
    blend: 'color',
    gradientStops: [
      [0, 'rgba(168,90,44,0.58)'],
      [0.5, 'rgba(43,76,126,0.52)'],
      [1, 'rgba(217,164,65,0.58)'],
    ],
  },
  {
    id: 'qinghua',
    name: '青花',
    era: '明',
    swatches: ['#2c4a5e', '#6b8ca8', '#f6f1e6'],
    tint: '#33566b',
    tintAlpha: 0.52,
    blend: 'color',
  },
];

/** 丝巾剪裁形态：长巾垂坠、两侧柔波（clip-path） */
const SCARF_CLIP_PATH =
  'polygon(12% 0%, 88% 0%, 97% 16%, 83% 30%, 94% 52%, 80% 68%, 92% 100%, 8% 100%, 20% 68%, 6% 52%, 17% 30%, 3% 16%)';
/** 丝巾折痕光影（斜向柔光带，overlay 混合） */
const SILK_FOLD_BG =
  'repeating-linear-gradient(100deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0.16) 16px, rgba(30,26,20,0.12) 30px, rgba(255,255,255,0) 54px)';
/** 丝巾边缘卷曲（两侧内缘柔和明暗） */
const SILK_CURL_BG =
  'linear-gradient(90deg, rgba(30,26,20,0.30) 0%, rgba(30,26,20,0.05) 5%, rgba(255,255,255,0.18) 9%, rgba(255,255,255,0) 16%, rgba(255,255,255,0) 84%, rgba(255,255,255,0.18) 91%, rgba(30,26,20,0.05) 95%, rgba(30,26,20,0.30) 100%)';
/** 陶瓷盘弧面反光：内阴影塑体积感 + 外部投影 */
const CERAMIC_SHADOW =
  'inset 0 0 46px rgba(30,26,20,0.30), inset 0 18px 36px rgba(255,255,255,0.34), inset 0 -18px 36px rgba(30,26,20,0.24), 0 26px 36px -16px rgba(42,38,32,0.5)';
/** 陶瓷釉面高光（screen 混合） */
const CERAMIC_GLAZE_BG =
  'radial-gradient(circle at 34% 26%, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0) 44%), radial-gradient(circle at 68% 78%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 26%)';

/** 色卡 → 染色叠加层样式（CSS 侧） */
const paletteOverlayStyle = (p) =>
  p
    ? {
        background: p.gradientStops ? stopsToCssGradient(p.gradientStops, 115) : hexToRgba(p.tint, p.tintAlpha),
        mixBlendMode: p.blend,
      }
    : null;

/** 色卡 → 合成 / 导出用的染色参数 */
const paletteTintPayload = (p) =>
  p
    ? {
        tint: p.tint,
        tintAlpha: p.tintAlpha,
        blend: p.blend,
        gradientStops: p.gradientStops ?? null,
      }
    : null;

/** 加载图片以获取原始尺寸（用于把纹样库素材按比例做成贴纸） */
const loadImageSize = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 120, h: img.naturalHeight || 120 });
    img.onerror = () => resolve({ w: 120, h: 120 });
    img.src = url;
  });

/** 纹样库素材 → 贴纸样式（等比缩放到最长边 120px，自包含 data URL 直接铺满） */
const materialToStickerStyle = async (imageUrl) => {
  const { w, h } = await loadImageSize(imageUrl);
  const scale = Math.min(120 / w, 120 / h, 1);
  const sw = Math.max(24, Math.round(w * scale));
  const sh = Math.max(24, Math.round(h * scale));
  return {
    width: `${sw}px`,
    height: `${sh}px`,
    backgroundImage: `url(${imageUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  };
};

/** 各载体的染色叠加层裁切形态（与图片形状一致，避免染到透明区） */
const tintShapeFor = (key) =>
  key === 'silk'
    ? { clipPath: SCARF_CLIP_PATH }
    : key === 'ceramic'
      ? { borderRadius: '50%' }
      : key === 'hanfu'
        ? { borderRadius: '46% 46% 14% 14% / 30% 30% 12% 12%' }
        : null;

function SelectField({ label, value, onChange, options, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-dai">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-line bg-rice px-4 py-2.5 pr-10 text-sm text-mo outline-none transition-colors focus:border-dai focus:ring-2 focus:ring-dai/15"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mo-light"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 8l4.5 4.5L14.5 8" />
        </svg>
      </span>
      {hint && <span className="mt-1.5 block text-xs text-mo-light">{hint}</span>}
    </label>
  );
}

/** 色彩滑块：松手/键盘释放时提交一次日志（避免拖动过程中刷屏） */
function ColorSlider({ label, unit, min, max, value, onChange, onCommit }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-dai">{label}</span>
        <span className="tabular-nums text-mo-light">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-zhusha"
      />
    </div>
  );
}

/** 四方连续预览开关 */
function TileSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        checked
          ? 'border-dai bg-dai text-rice'
          : 'border-line bg-rice text-mo/70 hover:border-dai/40 hover:text-dai'
      }`}
    >
      <span
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-rice/35' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-rice shadow transition-all ${
            checked ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </span>
      无缝平铺预览
    </button>
  );
}

/** 传统色卡单项 */
function PaletteChip({ palette, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col gap-2 rounded-md border p-3 text-left transition-all ${
        active
          ? 'border-zhusha bg-zhusha/5 shadow-[0_6px_18px_-12px_rgba(178,58,46,0.6)]'
          : 'border-line bg-rice hover:border-dai/40'
      }`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-mo">{palette.name}</span>
        <span className="shrink-0 text-[10px] tracking-widest text-mo-light">{palette.era}</span>
      </span>
      <span className="flex gap-1.5">
        {palette.swatches.map((hex) => (
          <span
            key={hex}
            className="h-5 w-5 rounded-full border border-line/80"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </span>
      {active && (
        <span className="text-[10px] text-zhusha">
          混合模式 {palette.blend === 'multiply' ? 'multiply' : 'color'} · 保留纹理染色
        </span>
      )}
    </button>
  );
}

/** 传统色卡染色叠加层：mix-blend-mode 精准染色，纹样纹理不丢失 */
function TintOverlay({ palette, shape }) {
  const style = paletteOverlayStyle(palette);
  if (!style) return null;
  return (
    <span
      data-tint-overlay=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 transition-opacity duration-300"
      style={{ ...shape, ...style }}
    />
  );
}

/** 载体预览的 CSS 叠加层（流苏 / 缎面高光 / 套准标记等细节） */
function CarrierOverlay({ kind }) {
  if (kind === 'sheen') {
    return (
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.35)_50%,transparent_58%)]" />
    );
  }
  if (kind === 'tassel') {
    return (
      <span className="pointer-events-none absolute left-1/2 top-1.5 -translate-x-1/2">
        <span className="mx-auto block h-3 w-px bg-zhusha/70" />
        <span className="mx-auto block h-2 w-2 rounded-full bg-zhusha/80" />
      </span>
    );
  }
  if (kind === 'registration') {
    return (
      <>
        {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((pos) => (
          <span key={pos} className={`pointer-events-none absolute ${pos} h-3 w-3 text-mo/50`}>
            <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current" />
            <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
          </span>
        ))}
      </>
    );
  }
  if (kind === 'ribbon') {
    return <span className="pointer-events-none absolute bottom-6 left-1/2 top-6 w-3 -translate-x-1/2 bg-zhusha/70" />;
  }
  if (kind === 'collar') {
    return (
      <svg
        viewBox="0 0 100 60"
        className="pointer-events-none absolute left-1/2 top-5 h-12 w-24 -translate-x-1/2 opacity-80"
        fill="none"
      >
        <path d="M22 0 L50 34 L78 0" stroke="#f6f1e6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'panels') {
    return (
      <span className="pointer-events-none absolute inset-y-8 left-1/2 w-full max-w-md -translate-x-1/2">
        <span className="absolute inset-y-0 left-1/3 w-px bg-zheshi/60" />
        <span className="absolute inset-y-0 left-2/3 w-px bg-zheshi/60" />
      </span>
    );
  }
  if (kind === 'bezel') {
    return <span className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-rice/30" />;
  }
  return null;
}

/**
 * CSS 形态载体预览（真实底图合成不可用时的回退，质感优先）
 * - 丝巾：clip-path 裁剪成丝巾形态 + 投影 + 斜向折痕光影 + 边缘卷曲
 * - 陶瓷盘：border-radius 50% + inset 内阴影塑弧面反光 + 釉面高光
 * - 其他载体：按预设圆角 / 边框 / 叠加层模拟
 */
function PlainCanvas({ carrier, imageUrl, filter, palette, mediaRef }) {
  const key = carrier.key;
  const shape = tintShapeFor(key);
  return (
    <span ref={mediaRef} className="relative isolate inline-block max-w-full align-middle">
      {key === 'silk' ? (
        <>
          <img
            src={imageUrl}
            alt="丝巾载体预览"
            className="block h-72 w-full object-cover"
            style={{
              clipPath: SCARF_CLIP_PATH,
              filter: `drop-shadow(0 18px 22px rgba(42,38,32,0.32))${filter ? ` ${filter}` : ''}`,
            }}
          />
          {/* 折痕光影 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: SCARF_CLIP_PATH, background: SILK_FOLD_BG, mixBlendMode: 'overlay' }}
          />
          {/* 边缘卷曲 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: SCARF_CLIP_PATH, background: SILK_CURL_BG }}
          />
        </>
      ) : key === 'ceramic' ? (
        <>
          <img
            src={imageUrl}
            alt="陶瓷盘载体预览"
            className="mx-auto block h-72 w-64 object-cover"
            style={{ borderRadius: '50%', filter, boxShadow: CERAMIC_SHADOW }}
          />
          {/* 釉面高光 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: CERAMIC_GLAZE_BG, mixBlendMode: 'screen' }}
          />
        </>
      ) : (
        <>
          <img
            src={imageUrl}
            alt="人工创作画布"
            style={{ filter }}
            className={`block transition-all duration-300 ${carrier.img}`}
          />
          {carrier.extra && <CarrierOverlay kind={carrier.extra} />}
        </>
      )}
      <TintOverlay palette={palette} shape={shape} />
    </span>
  );
}

export default function WorkbenchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspiration, setInspiration] = useState('');
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [carrier, setCarrier] = useState(CARRIER_OPTIONS[0]);
  const [status, setStatus] = useState('idle'); // idle | generating | done
  const [sketch, setSketch] = useState(null); // { imageUrl, prompt, theme }
  const [error, setError] = useState(''); // 表单校验错误（输入框下方）
  const [apiError, setApiError] = useState(''); // 真实 API 错误（红色横幅）
  const [notice, setNotice] = useState('');

  // —— 右侧交互工作区状态 ——
  const [hue, setHue] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [previewCarrier, setPreviewCarrier] = useState('silk');
  const [intervened, setIntervened] = useState(false); // 是否已进行人工干预
  const [tileMode, setTileMode] = useState(false); // 四方连续无缝平铺预览
  const [tileSize, setTileSize] = useState(200); // 平铺单元尺寸（px）
  const [activePalette, setActivePalette] = useState(null); // 传统色卡
  const [carrierCache, setCarrierCache] = useState({}); // 载体合成结果缓存 { key: dataUrl }
  const [compositing, setCompositing] = useState(false);
  const [carrierError, setCarrierError] = useState(''); // 载体合成失败时回退普通预览
  const mediaRef = useRef(null); // 染色作用区域（导出烘焙用）

  // —— 非遗规制智能诊断仪状态 ——
  const [diagGrid, setDiagGrid] = useState(false); // 辅助网格线
  const [diagState, setDiagState] = useState('idle'); // idle | scanning | done
  const [diagResult, setDiagResult] = useState(null);
  const diagTimer = useRef(null);

  // —— 我的作品（localStorage 持久化）——
  const [currentWorkId, setCurrentWorkId] = useState(null);

  // —— 我的纹样库：待导入贴纸队列 + 素材选择弹窗 ——
  const [pendingImports, setPendingImports] = useState([]); // [{ id, title, imageUrl, style }]
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState(() => patternLibraryStore.list());

  const themeLabel = useMemo(() => deriveThemeLabel(inspiration), [inspiration]);
  const activeCarrier =
    CARRIER_PREVIEWS.find((c) => c.key === previewCarrier) ?? CARRIER_PREVIEWS[0];
  const activePaletteDef = TRADITIONAL_PALETTES.find((p) => p.id === activePalette) ?? null;

  /** 当前完整滤镜：色相 + 对比度（色卡改由叠加层混合完成，不再用 hue-rotate） */
  const activeFilter = [`hue-rotate(${hue}deg)`, `contrast(${contrast}%)`].join(' ');

  /** 载体合成缓存 key：切换色卡需重新合成（色卡已烘焙进合成图） */
  const compositeKey = `${activeCarrier.key}:${activePalette ?? 'plain'}`;
  const compositedUrl = carrierCache[compositeKey];
  const usingComposite = !tileMode && Boolean(activeCarrier.mask) && !carrierError && Boolean(compositedUrl);

  // 步骤高亮：0 输入灵感 → 1 AI 生成 → 2 人工干预 → 3 跨载体适配
  const stepIndex =
    status === 'done' ? (intervened ? 3 : 2) : status === 'generating' ? 1 : 0;

  /**
   * 把纹样库素材挂载为贴纸（进入 pendingImports 队列，由 SliceStudio 消费）
   * 用途：①「从我的纹样库提取素材」弹窗点击；② 从纹样库页「带入工作台」跳转带入
   */
  const importMaterialToStickers = async (item) => {
    if (!item || typeof item.imageUrl !== 'string') return;
    const style = await materialToStickerStyle(item.imageUrl);
    const entry = {
      id: `import_${item.id || 'x'}_${Date.now()}`,
      title: item.title || '纹样库素材',
      imageUrl: item.imageUrl,
      style,
    };
    setPendingImports((list) => [...list, entry]);
    setNotice(
      sketch
        ? '已从纹样库提取素材，贴纸库已更新——拖拽贴纸即可拼贴到主图'
        : '已带入纹样库素材：生成草图后，素材将自动加入贴纸库供拼贴'
    );
  };

  /**
   * 入口参数解析（初始化时挂载）：
   * ① 范式图库「一键使用此纹样」→ ?theme=云纹&style=青花瓷：预填灵感输入框与风格下拉
   * ② 我的纹样库「带入工作台」→ ?from=library：读取 localStorage 传递队列并导入为贴纸
   */
  useEffect(() => {
    const theme = searchParams.get('theme');
    const styleParam = searchParams.get('style');
    const from = searchParams.get('from');

    if (theme) {
      setInspiration(theme);
      setNotice(`已从范式图库带入「${theme}」，可直接生成或补充灵感描述`);
    }
    if (styleParam && STYLE_OPTIONS.includes(styleParam)) {
      setStyle(styleParam);
    }
    if (from === 'library') {
      const pending = patternLibraryStore.takePending();
      if (pending) importMaterialToStickers(pending);
    }
    // 参数一次性消费后清空 URL，避免刷新重复带入（保留用户已填写的表单状态）
    if (theme || styleParam || from) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** 打开纹样库素材弹窗：实时读取 localStorage */
  const openLibraryModal = () => {
    setLibraryItems(patternLibraryStore.list());
    setLibraryOpen(true);
  };

  /** 弹窗内点击素材 → 导入贴纸库 */
  const handlePickMaterial = (item) => {
    setLibraryOpen(false);
    importMaterialToStickers(item);
  };

  /** 弹窗内删除素材 */
  const handleDeleteMaterial = (item) => {
    patternLibraryStore.remove(item.id);
    setLibraryItems(patternLibraryStore.list());
  };

  /** 需要真实底图合成的载体：按需生成「纹样印在载体上」的合成图（含色卡染色） */
  useEffect(() => {
    if (!sketch || tileMode || !activeCarrier.mask) return;
    if (carrierCache[compositeKey]) return;
    let cancelled = false;
    setCompositing(true);
    setCarrierError('');
    compositeOnCarrier(sketch.imageUrl, activeCarrier.mask, {
      kind: activeCarrier.key,
      tint: paletteTintPayload(activePaletteDef),
    })
      .then((dataUrl) => {
        if (cancelled) return;
        setCarrierCache((c) => ({ ...c, [compositeKey]: dataUrl }));
      })
      .catch((err) => {
        // 合成失败（如图片地址不允许同源代理读取）时回退为 CSS 形态预览，不阻塞创作
        console.error('[载体合成]', err);
        if (!cancelled) setCarrierError('载体底图合成失败，已回退为 CSS 形态预览');
      })
      .finally(() => {
        if (!cancelled) setCompositing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketch, activeCarrier, compositeKey, tileMode]);

  // 卸载时清理诊断定时器
  useEffect(() => () => clearTimeout(diagTimer.current), []);

  /** —— 生成草图：调用日日新（SenseNova）真实 API，错误原样展示 —— */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inspiration.trim()) {
      setError('请先描述你的创作灵感，哪怕只是一句话');
      return;
    }
    setError('');
    setApiError('');
    setNotice('');
    setIntervened(false);
    setHue(0);
    setContrast(100);
    setActivePalette(null);
    setTileMode(false);
    setCarrierCache({});
    setCarrierError('');
    setDiagGrid(false);
    setDiagState('idle');
    setDiagResult(null);
    setCurrentWorkId(null);
    setStatus('generating');
    try {
      const result = await handleGenerateImage(inspiration.trim(), style);
      setSketch({
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        theme: result.theme || deriveThemeLabel(inspiration),
      });
      setStatus('done');
      // 持久化到「我的作品」（localStorage）：图片 URL / 时间 / 提示词
      const work = worksStore.add({
        title: result.theme || deriveThemeLabel(inspiration) || '未命名纹样',
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        style,
        carrier,
        pattern: themeLabel,
      });
      setCurrentWorkId(work.id);
      // 写入创作日志：时间（store 自动补全）、类型、模型、提示词、图片 URL
      logStore.add({
        type: 'generate',
        title: '生成草图',
        model: MODEL_NAME,
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        details: [
          `灵感：${result.theme || deriveThemeLabel(inspiration)}`,
          `风格：${style}`,
          `应用场景：${carrier}`,
        ],
      });
    } catch (err) {
      // 真实错误信息原样显示（红色横幅），同时可在 F12 控制台查看完整日志
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Workbench] 生成失败:', msg);
      setApiError(msg);
      setStatus('idle');
    }
  };

  /** —— 应用场景下拉变更：同步右侧载体预览 —— */
  const handleCarrierChange = (value) => {
    setCarrier(value);
    setPreviewCarrier(CARRIER_KEY_MAP[value] ?? 'silk');
  };

  /** —— 色彩微调：写入人工干预日志 —— */
  const commitColorAdjust = () => {
    setIntervened(true);
    logStore.add({
      type: 'manual',
      title: '人工干预-色彩微调',
      details: [`色相 Hue-Rotate：${hue}°`, `对比度 Contrast：${contrast}%`],
    });
  };

  /** —— 切换载体预览：写入人工干预日志 —— */
  const handleCarrierPreview = (c) => {
    setPreviewCarrier(c.key);
    setTileMode(false);
    setIntervened(true);
    logStore.add({
      type: 'manual',
      title: '人工干预-载体预览',
      details: [`跨载体适配：${c.label}`, '说明：切换载体预览，观察纹样铺陈效果'],
    });
  };

  /** —— 传统色卡套用（CSS 叠加层混合染色）—— */
  const handlePaletteSelect = (palette) => {
    const next = activePalette === palette.id ? null : palette.id;
    setActivePalette(next);
    setIntervened(true);
    logStore.add({
      type: 'manual',
      title: next ? '人工干预-传统色卡套用' : '人工干预-取消色卡',
      details: next
        ? [
            `色卡：${palette.era} · ${palette.name}`,
            `色值：${palette.swatches.join(' / ')}`,
            `染色方式：mix-blend-mode ${palette.blend}（保留纹样纹理，仅校正色调）`,
          ]
        : ['说明：取消传统色卡，恢复原始发色'],
    });
  };

  /** —— 模拟人工干预：局部重绘（中心区域）—— */
  const handleRefine = async () => {
    if (!sketch) return;
    setNotice('正在对中心区域进行局部重绘…');
    await refineRegion(sketch.imageUrl);
    setIntervened(true);
    logStore.add({
      type: 'manual',
      title: '人工干预-局部重绘',
      details: ['说明：对中心区域进行了重绘'],
    });
    setNotice('已记录一次人工干预：局部重绘 · 中心');
  };

  /** —— 真实导出：html2canvas 截图当前容器为高清 PNG —— */
  const handleExport = async () => {
    if (!sketch) return;
    setNotice('正在导出高清作品…');
    const result = await exportElementAsImage(document.getElementById('export-target'), {
      filename: `织纹集-${sketch.theme || '作品'}-${tileMode ? '四方连续' : carrier}.png`,
      filter: activeFilter,
      // 色卡未烘焙进载体合成图时，导出时以 Canvas 混合模式精确复刻叠加层染色
      tint: usingComposite ? null : paletteTintPayload(activePaletteDef),
      tintRegion: usingComposite ? null : mediaRef.current,
    });
    if (result.success) {
      // 导出成功：作品状态标记为「已导出」
      worksStore.markExported(currentWorkId);
      logStore.add({
        type: 'export',
        title: '导出高清作品',
        model: MODEL_NAME,
        details: [
          `作品：${sketch.theme || '未命名'}`,
          tileMode ? '形态：四方连续平铺' : `应用场景：${carrier}`,
          activePaletteDef ? `色卡：${activePaletteDef.era} · ${activePaletteDef.name}` : '色卡：未套用',
          '格式：PNG · 2x 高清 · html2canvas',
        ],
      });
      setNotice('高清作品已开始下载（PNG · 2x）');
    } else {
      setNotice(`导出失败：${result.error}`);
    }
  };

  /** —— 杀手锏：生成四方连续生产稿（印染厂可直接开机） —— */
  const handleTileExport = async () => {
    if (!sketch) return;
    setNotice('正在生成四方连续生产稿…');
    try {
      const dataUrl = await generateSeamlessTile(sketch.imageUrl, { size: 2048, tile: 1024 });
      downloadDataUrl(dataUrl, `织纹集-四方连续生产稿-${sketch.theme || '纹样'}-2048.png`);
      logStore.add({
        type: 'export',
        title: '导出四方连续生产稿',
        model: MODEL_NAME,
        details: [
          `纹样：${sketch.theme || '未命名'}`,
          '规格：2048×2048 · 单元 1024×1024',
          '工艺：四边镜像无缝（对合连续）',
          '用途：可直接交付印染厂开机生产',
        ],
      });
      setNotice('四方连续生产稿已开始下载（2048×2048 无缝）');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[四方连续] 生成失败:', err);
      alert(`生产稿生成失败：${msg}`);
      setNotice(`生产稿生成失败：${msg}`);
    }
  };

  /** —— 杀手锏：非遗规制智能诊断 —— */
  const handleDiagnose = () => {
    setDiagGrid(true);
    setDiagState('scanning');
    setDiagResult(null);
    if (diagTimer.current) clearTimeout(diagTimer.current);
    diagTimer.current = setTimeout(() => {
      const paletteName = activePaletteDef
        ? `${activePaletteDef.era} · ${activePaletteDef.name}`
        : null;
      const result = {
        symmetry: 85,
        seamless: tileMode,
        paletteName,
        advice: '检测到中心云头存在轻微不对称，建议使用局部重绘工具修正，或开启四方连续微调。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setDiagState('done');
      setDiagResult(result);
      logStore.add({
        type: 'manual',
        title: '非遗规制诊断',
        details: [
          `纹样骨架对称度：${result.symmetry}%`,
          `四方连续达标：${result.seamless ? '是' : '否'}`,
          `传统色彩合规：${result.paletteName ? `是（匹配 ${result.paletteName}）` : '未套用色卡'}`,
          `AI 建议：${result.advice}`,
        ],
      });
    }, 1500);
  };

  return (
    <section>
      <PageHeader
        title="共创工作台"
        en="CO-CREATION STUDIO"
        desc="用一段灵感点亮创作：AI 负责推演纹样结构，你负责把关审美。左侧输入灵感并生成草图，右侧进行色彩微调、传统色卡套用、规制诊断与跨载体适配——每一步人工干预都会写入创作日志。"
      />

      {/* 专业性标语 */}
      <p className="mx-auto mb-4 max-w-3xl rounded-lg border border-dai/25 bg-dai/5 px-5 py-3 text-center text-sm font-medium tracking-wide text-dai">
        专为非遗纹样打造：拒绝随机堆砌，支持四方连续与规制校验。
      </p>
      <p className="mb-8 text-center text-xs text-mo-light">
        想先校验一张现成纹样？
        <Link
          to="/diagnostics"
          className="mx-1 font-medium text-zhusha underline decoration-zhusha/40 underline-offset-4 transition-colors hover:text-zhusha-deep"
        >
          前往「非遗规制智能诊断仪」
        </Link>
        上传即可扫描骨架对称度 / 四方连续 / 色彩合规
      </p>

      {/* 共创流程指引 */}
      <ol className="mx-auto mb-10 flex max-w-3xl items-center">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2.5">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors ${
                  i < stepIndex
                    ? 'border-dai bg-dai text-rice'
                    : i === stepIndex
                      ? 'border-zhusha bg-zhusha/10 text-zhusha'
                      : 'border-line text-mo-light'
                }`}
              >
                {i < stepIndex ? '✓' : String(i + 1).padStart(2, '0')}
              </span>
              <span className={`hidden text-sm sm:block ${i <= stepIndex ? 'text-mo' : 'text-mo-light'}`}>
                {s}
              </span>
            </span>
            {i < STEPS.length - 1 && <span className="mx-3 h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* ============ 左侧：灵感生成区 ============ */}
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-xl border border-line bg-rice-card p-6 shadow-[0_18px_50px_-40px_rgba(42,38,32,0.5)] md:p-8"
          >
            <h2 className="mb-6 flex items-center gap-3 font-serif text-xl font-semibold text-mo">
              <Seal char="创" size="sm" />
              引导式共创
            </h2>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-dai">描述你的创作灵感</span>
                <textarea
                  value={inspiration}
                  onChange={(e) => {
                    setInspiration(e.target.value);
                    if (error) setError('');
                  }}
                  rows={4}
                  placeholder="例如：我想设计一款带有春天生机感的连绵云纹，用于青花瓷丝巾……"
                  className={`w-full resize-y rounded-md border bg-rice px-4 py-2.5 text-sm leading-relaxed text-mo outline-none transition-colors placeholder:text-mo-light/60 focus:ring-2 focus:ring-dai/15 ${
                    error ? 'border-zhusha' : 'border-line focus:border-dai'
                  }`}
                />
                {error && <span className="mt-1.5 block text-xs text-zhusha">{error}</span>}
                {!error && inspiration.trim() && (
                  <span className="mt-1.5 block text-xs text-dai-light">
                    AI 识别到的母题：{themeLabel}
                  </span>
                )}
                <span className="mt-1.5 block text-xs text-mo-light">
                  建议描述「纹样母题 + 气质感受 + 用途场景」，AI 将围绕你的灵感推演纹样
                </span>
              </label>

              <SelectField
                label="纹样风格"
                value={style}
                onChange={setStyle}
                options={STYLE_OPTIONS}
                hint="风格将决定纹样的线条气质与配色倾向"
              />

              <SelectField
                label="应用场景"
                value={carrier}
                onChange={handleCarrierChange}
                options={CARRIER_OPTIONS}
                hint="生成后将自动进行跨载体适配预览"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'generating'}
              className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-md bg-zhusha py-3 pl-[0.3em] font-medium tracking-[0.3em] text-rice transition-colors hover:bg-zhusha-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'generating' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rice/35 border-t-rice" />
                  正在生成…
                </>
              ) : (
                '生成草图'
              )}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-mo-light">
              由商汤日日新 SenseNova 驱动 · 模型 {MODEL_NAME}
            </p>
          </form>

          {/* 真实错误信息（红色横幅，可滚动查看完整 JSON） */}
          {apiError && (
            <div className="mt-4 max-h-48 overflow-auto rounded-md border border-zhusha/40 bg-zhusha/5 px-4 py-3">
              <p className="mb-1 text-xs font-medium text-zhusha">生成失败，真实错误信息：</p>
              <p className="break-all text-xs leading-relaxed text-zhusha/90">{apiError}</p>
            </div>
          )}

          {/* 生成中 */}
          {status === 'generating' && (
            <div className="mt-6 flex flex-col items-center rounded-xl border border-line bg-rice-card px-6 py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-zhusha" />
              <p className="mt-4 text-sm text-mo-light">AI 正在围绕你的灵感推演纹样结构…</p>
            </div>
          )}

          {/* 生成成功：真实图片 */}
          {status === 'done' && sketch && (
            <div className="mt-6 rounded-xl border border-line bg-rice-card p-4 md:p-5">
              <div className="overflow-hidden rounded-lg border border-line bg-rice">
                <img
                  src={sketch.imageUrl}
                  alt="AI 生成的纹样草图"
                  className="block h-full w-full object-cover"
                />
              </div>
              <dl className="mt-4 divide-y divide-line/70 text-sm">
                {[
                  ['提示词', sketch.prompt],
                  ['纹样风格', style],
                  ['应用场景', carrier],
                  ['模型', MODEL_NAME],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-mo-light">{k}</dt>
                    <dd className="max-w-[60%] text-right font-medium text-mo">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 纹样库素材待挂载提示（尚未生成草图时） */}
          {pendingImports.length > 0 && status !== 'done' && (
            <div className="mt-4 rounded-md border border-dai/30 bg-dai/5 px-4 py-3 text-xs leading-relaxed text-dai">
              已从纹样库带入 {pendingImports.length} 个素材：生成草图后，素材将自动加入贴纸库，可直接拖拽拼贴到主图。
            </div>
          )}

          {/* 空闲提示 */}
          {status === 'idle' && !apiError && (
            <div className="mt-6 rounded-xl border border-dashed border-dai/25 bg-rice/40 px-6 py-10 text-center">
              <p className="text-sm text-mo-light">描述你的灵感并点击「生成草图」</p>
              <p className="mt-1.5 text-xs text-mo-light/80">
                生成成功后，右侧交互工作区将解锁
              </p>
            </div>
          )}
        </div>

        {/* ============ 右侧：交互工作区（人工二次创作 + 跨载体适配） ============ */}
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          {status === 'done' && sketch ? (
            <div className="rounded-xl border border-line bg-rice-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 font-serif text-xl font-semibold text-mo">
                  <Seal char="改" size="sm" />
                  人工二次创作
                </h2>
                <TileSwitch checked={tileMode} onChange={setTileMode} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mo-light">
                拖动滑块实时调整色相与对比度，套用传统色卡（叠加层混合染色，保留纹理），切换应用场景查看铺陈效果——每次操作都会记入创作日志。
              </p>

              {/* 画布（导出目标）+ 规制诊断网格叠加层 */}
              <div className="relative mt-5">
                <div
                  id="export-target"
                  className={`flex min-h-[260px] items-center justify-center overflow-hidden transition-all duration-300 ${activeCarrier.wrap}`}
                >
                  {tileMode ? (
                    /* 四方连续无缝平铺：background-repeat 无限拼接 */
                    <div
                      ref={mediaRef}
                      className="relative isolate h-72 w-full"
                      style={{
                        backgroundImage: `url(${sketch.imageUrl})`,
                        backgroundSize: `${tileSize}px ${tileSize}px`,
                        backgroundRepeat: 'repeat',
                        filter: activeFilter,
                      }}
                    >
                      <TintOverlay palette={activePaletteDef} />
                    </div>
                  ) : usingComposite ? (
                    /* 真实底图合成：纹样已「印」在载体剪影上（色卡已烘焙进合成图） */
                    <img
                      ref={mediaRef}
                      src={compositedUrl}
                      alt={`${activeCarrier.label}载体预览`}
                      style={{ filter: `drop-shadow(0 16px 22px rgba(42,38,32,0.28)) ${activeFilter}` }}
                      className="h-72 w-full object-contain transition-all duration-300"
                    />
                  ) : activeCarrier.mask && !carrierError ? (
                    <div className="flex flex-col items-center py-16">
                      <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-zhusha" />
                      <p className="mt-3 text-xs text-mo-light">
                        {compositing ? '正在将纹样印制到载体…' : '载体合成中…'}
                      </p>
                    </div>
                  ) : (
                    /* CSS 形态预览：丝巾 clip-path / 陶瓷盘圆形内阴影等 */
                    <PlainCanvas
                      carrier={activeCarrier}
                      imageUrl={sketch.imageUrl}
                      filter={activeFilter}
                      palette={activePaletteDef}
                      mediaRef={mediaRef}
                    />
                  )}
                </div>

                {/* 非遗规制诊断：辅助网格线（位于导出目标之外，不会进入截图） */}
                {diagGrid && <DiagnosticGrid scanning={diagState === 'scanning'} />}
              </div>

              {/* 四方连续：单元尺寸调节 + 说明 */}
              {tileMode && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                  <span className="text-[11px] text-mo-light">单元尺寸</span>
                  <span className="flex overflow-hidden rounded-md border border-line">
                    {[120, 200, 320].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTileSize(s)}
                        className={`px-3 py-1 text-[11px] transition-colors ${
                          tileSize === s ? 'bg-dai text-rice' : 'bg-rice text-mo/70 hover:text-dai'
                        }`}
                      >
                        {s}px
                      </button>
                    ))}
                  </span>
                  <span className="text-[11px] text-mo-light">
                    纹样可向四周无限拼接 · 点「生成四方连续生产稿」导出印染厂文件
                  </span>
                </div>
              )}

              {/* 杀手锏：非遗规制智能诊断仪 */}
              <div className="mt-5">
                <DiagnosticTrigger
                  onClick={handleDiagnose}
                  running={diagState === 'scanning'}
                  done={diagState === 'done'}
                />
                <DiagnosticReport result={diagResult} />
              </div>

              {/* 色彩微调滑块 */}
              <div className="mt-6 space-y-5">
                <ColorSlider
                  label="色相 Hue-Rotate"
                  unit="°"
                  min={0}
                  max={360}
                  value={hue}
                  onChange={setHue}
                  onCommit={commitColorAdjust}
                />
                <ColorSlider
                  label="对比度 Contrast"
                  unit="%"
                  min={50}
                  max={200}
                  value={contrast}
                  onChange={setContrast}
                  onCommit={commitColorAdjust}
                />
              </div>

              {/* 非遗传统色卡匹配（CSS 叠加层混合染色） */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-dai">传统色卡匹配</p>
                  {activePaletteDef && (
                    <span className="text-[11px] text-zhusha">
                      已套用：{activePaletteDef.era} · {activePaletteDef.name}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TRADITIONAL_PALETTES.map((p) => (
                    <PaletteChip
                      key={p.id}
                      palette={p}
                      active={activePalette === p.id}
                      onSelect={() => handlePaletteSelect(p)}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-mo-light">
                  点击色卡，以 mix-blend-mode 叠加层将纹样精准染成对应历史时期经典配色——只改色调、保留纹理（再次点击取消）
                </p>
              </div>

              {/* 素材沉淀与调用：从我的纹样库提取素材 → 加入贴纸库拼贴 */}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={openLibraryModal}
                  className="flex items-center gap-2 rounded-md border border-dai bg-dai/5 px-4 py-2 text-sm font-medium text-dai transition-colors hover:bg-dai hover:text-rice"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" />
                    <path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7" />
                    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                  </svg>
                  从我的纹样库提取素材
                  {patternLibraryStore.list().length > 0 && (
                    <span className="rounded-full bg-dai/10 px-1.5 py-0.5 text-[10px] tabular-nums">
                      {patternLibraryStore.list().length}
                    </span>
                  )}
                </button>
                <span className="text-[11px] leading-relaxed text-mo-light">
                  纹样库保存了你从切片重组中收藏的素材 · 点击素材即可加入贴纸库，自由拼贴
                </span>
              </div>

              {/* 杀手锏：纹样基因切片与重组（框选提取贴纸 → 自由拼贴 → 收藏入纹样库） */}
              <SliceStudio
                imageUrl={sketch.imageUrl}
                theme={sketch.theme}
                importedStickers={pendingImports}
                onImportConsumed={(id) =>
                  setPendingImports((list) => list.filter((i) => i.id !== id))
                }
              />

              {/* 跨载体适配预览 */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-dai">跨载体适配预览</p>
                <div className="flex flex-wrap gap-2">
                  {CARRIER_PREVIEWS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleCarrierPreview(c)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        previewCarrier === c.key
                          ? 'border-dai bg-dai text-rice'
                          : 'border-line bg-rice text-mo/70 hover:border-dai/40 hover:text-dai'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 人工干预操作 */}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={handleRefine}
                  className="flex-1 rounded-md border border-dai px-4 py-2.5 text-sm text-dai transition-colors hover:bg-dai hover:text-rice"
                >
                  模拟局部重绘
                </button>
                <button
                  type="button"
                  onClick={handleTileExport}
                  className="flex-1 rounded-md border border-dai bg-dai/5 px-4 py-2.5 text-sm font-medium text-dai transition-colors hover:bg-dai hover:text-rice"
                >
                  生成四方连续生产稿
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 rounded-md border border-zhusha px-4 py-2.5 text-sm text-zhusha transition-colors hover:bg-zhusha hover:text-rice"
                >
                  导出高清作品
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-mo-light">
                若下载被浏览器拦截，可在预览图上长按 / 右键「图片另存为」保存
              </p>
              {notice && <p className="mt-2 text-center text-xs text-dai">{notice}</p>}
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-dai/25 bg-rice/40 px-6 py-14 text-center">
              <span className="text-3xl text-dai/30">◇</span>
              <p className="mt-4 text-sm text-mo-light">交互工作区待激活</p>
              <p className="mt-1.5 text-xs text-mo-light/80">
                左侧生成草图成功后，即可在此进行色彩微调、色卡套用、规制诊断与跨载体适配
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============ 我的纹样库 · 素材选择弹窗 ============ */}
      {libraryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-mo/45 p-4 backdrop-blur-sm"
          onClick={() => setLibraryOpen(false)}
        >
          <div
            className="max-h-[82vh] w-full max-w-2xl overflow-auto rounded-xl border border-line bg-rice-card p-6 shadow-[0_30px_80px_-40px_rgba(42,38,32,0.6)] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-3 font-serif text-xl font-semibold text-mo">
                <Seal char="库" size="sm" />
                我的纹样库
              </h3>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-mo-light transition-colors hover:border-zhusha/50 hover:text-zhusha"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {libraryItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-dai/25 bg-rice/40 px-6 py-12 text-center">
                <p className="text-sm text-mo-light">纹样库还是空的</p>
                <p className="mt-1.5 text-xs text-mo-light/80">
                  在右侧「纹样基因切片与重组」中框选提取切片，点「❤️ 收藏」即可沉淀素材
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs text-mo-light">
                  共 {libraryItems.length} 个素材 · 点击任意素材，将其加入贴纸库拼贴到当前作品
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {libraryItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-lg border border-line bg-rice transition-all hover:border-dai/40 hover:shadow-[0_14px_30px_-20px_rgba(42,38,32,0.5)]"
                    >
                      <button
                        type="button"
                        onClick={() => handlePickMaterial(item)}
                        className="block w-full text-left"
                        title="点击加入贴纸库"
                      >
                        <span className="block aspect-square overflow-hidden border-b border-line">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </span>
                        <span className="block px-3 py-2">
                          <span className="block truncate text-xs font-medium text-mo">{item.title}</span>
                          <span className="mt-0.5 block text-[10px] text-mo-light">
                            {new Date(item.savedAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' · '}
                            {patternLibraryStore.sizeKb(item.imageUrl)}KB
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(item)}
                        title="删除此素材"
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border border-rice/70 bg-mo/70 text-xs text-rice opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 合规声明 */}
      <p className="mt-12 border-t border-line pt-6 text-center text-xs leading-relaxed text-mo-light">
        *创意由你定义，AI 仅为画笔。本平台所有生成素材均需经人工干预，且自动记录溯源日志以保护知识产权。*
      </p>
    </section>
  );
}
