/**
 * ============================================================
 * 商汤日日新（SenseNova）API 接口层
 * 通过 Vite 开发服务器代理转发，解决浏览器跨域（CORS）问题：
 *   前端请求  /api/sensenova/v1/images/generations
 *   代理转发  https://token.sensenova.cn/v1/images/generations
 * 密钥经环境变量注入：import.meta.env.VITE_SENSENOVA_API_KEY
 * ============================================================
 */

const API_BASE = '/api/sensenova';
export const MODEL_NAME = 'sensenova-u1.5-lite';

/** 基础画质词 */
const QUALITY_PROMPT =
  'masterpiece, best quality, ultra-detailed, 8k resolution, traditional Chinese aesthetic, intricate details, isolated on clean background';

/** 负向提示词（内联进 prompt，规避现代/卡通/水印等元素） */
const NEGATIVE_PROMPT =
  'low quality, blurry, modern, cartoon, geometric, minimalist, text, watermark';

/**
 * 主体强化：灵感文本中的关键词 → 英文纹样描述
 * 支持长文本灵感（用户可在一段自然语言中描述多个母题，全部命中会叠加）
 */
const SUBJECT_MAP = [
  {
    keys: ['云纹', '云'],
    label: '云纹',
    prompt: 'Ruyi cloud motif, flowing and layered auspicious cloud patterns',
  },
  {
    keys: ['缠枝', '枝'],
    label: '缠枝纹',
    prompt: 'interlocking floral scroll pattern, winding vines with leaves and blossoms',
  },
  {
    keys: ['回纹', '回字'],
    label: '回纹',
    prompt: 'Greek key meander fret pattern, continuous rectangular spirals',
  },
  {
    keys: ['宝相', '相花'],
    label: '宝相花',
    prompt: 'Baoxiang composite flower, radially symmetric layered petals',
  },
  {
    keys: ['龙纹', '龙'],
    label: '龙纹',
    prompt: 'Chinese dragon motif, coiled dragon with scales and flowing mane, majestic and powerful',
  },
  {
    keys: ['水波', '波浪'],
    label: '水波纹',
    prompt: 'water wave pattern, flowing rhythmic waves and ripples',
  },
  {
    keys: ['鱼纹', '鱼'],
    label: '鱼纹',
    prompt: 'fish motif, paired swimming fish symbolizing abundance',
  },
  {
    keys: ['牡丹', '富贵花'],
    label: '牡丹纹',
    prompt: 'peony blossom motif, lush layered petals, king of flowers',
  },
  {
    keys: ['卷草', '藤蔓'],
    label: '卷草纹',
    prompt: 'arabesque scrolling grass pattern, curling tendrils and leaves',
  },
  {
    keys: ['冰裂', '开片'],
    label: '冰裂纹',
    prompt: 'ice-crack crackle pattern, irregular elegant fissures',
  },
  {
    keys: ['鹤', '鸾'],
    label: '仙鹤纹',
    prompt: 'auspicious crane motif, elegant flying crane with long feathers',
  },
  {
    keys: ['鸳鸯'],
    label: '鸳鸯纹',
    prompt: 'mandarin duck pair motif, symbolizing love and union',
  },
];

/** 风格强化：style → 英文质感描述 */
const STYLE_MAP = {
  青花瓷: 'Ming dynasty blue and white porcelain texture, cobalt blue on white glaze',
  水墨淡彩: 'Chinese ink wash painting, subtle light color washes, elegant brushwork',
  剪纸红: 'Chinese red paper-cut art, symmetrical cut-out design on rice paper',
  宫廷织绣: 'imperial court silk embroidery, brocade texture, gold and silk threads',
  青铜器: 'Chinese bronze ware texture, archaic patina, weathered turquoise green and gold tones',
  敦煌壁画: 'Dunhuang mural art style, mineral pigments on plaster, ochre red and azure blue, ethereal cave painting texture',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 从长文本灵感中提取简短主题标签（用于日志/列表展示）
 * 命中纹样关键词则取纹样名，否则截取前 12 字
 */
export function deriveThemeLabel(inspiration) {
  const text = (inspiration || '').trim();
  if (!text) return '未命名灵感';
  const hits = SUBJECT_MAP.filter((s) => s.keys.some((k) => text.includes(k))).map((s) => s.label);
  if (hits.length) return hits.join(' · ');
  return text.length > 12 ? `${text.slice(0, 12)}…` : text;
}

/**
 * 主体解析：长文本灵感作为最核心的 subject
 * - 用户原文始终置于最前（AI 必须围绕用户的灵感创作）
 * - 文本中命中的传统纹样母题会追加英文强化描述
 * - 全部未命中时回退为「原文 + traditional Chinese decorative pattern」
 */
function resolveSubject(inspiration) {
  const text = (inspiration || '').trim();
  const hits = SUBJECT_MAP.filter((s) => s.keys.some((k) => text.includes(k))).map((s) => s.prompt);
  if (hits.length) {
    return [text, ...hits, 'traditional Chinese decorative pattern'].join(', ');
  }
  return `${text}, traditional Chinese decorative pattern`;
}

/** 风格匹配：命中用强化描述，未命中回退为原始风格 */
function resolveStyle(style) {
  return STYLE_MAP[style] ?? `${style} style`;
}

/**
 * 超级提示词（Prompt）拼接函数
 * 以用户的「长文本灵感」为核心 subject，叠加风格词、画质词与负向提示词
 * @param {string} inspiration 用户的创作灵感（自然语言长文本）
 * @param {string} style 纹样风格，如「青花瓷」
 * @returns {string} 拼接后的完整提示词
 */
export function buildPrompt(inspiration, style) {
  const subject = resolveSubject(inspiration);
  const styleText = resolveStyle(style);
  return [
    subject,
    styleText,
    QUALITY_PROMPT,
    `negative prompt: ${NEGATIVE_PROMPT}`,
  ].join(', ');
}

/**
 * 容错解析图片 URL：依次尝试多种可能的返回结构，直到取到有效字符串
 * 1. data.data[0].url        （标准结构）
 * 2. data.images[0].url      （备选结构）
 * 3. data.data[0].b64_json   （Base64 图片，自动转为 data URI 供 <img> 渲染）
 * 4. data.url                （备选结构）
 * 均未命中时返回 null，由调用方 throw 完整响应数据
 */
function resolveImageUrl(data) {
  const first = data?.data?.[0];
  if (typeof first?.url === 'string' && first.url) {
    return first.url;
  }
  if (typeof data?.images?.[0]?.url === 'string' && data.images[0].url) {
    return data.images[0].url;
  }
  if (typeof first?.b64_json === 'string' && first.b64_json) {
    return first.b64_json.startsWith('data:')
      ? first.b64_json
      : `data:image/png;base64,${first.b64_json}`;
  }
  if (typeof data?.url === 'string' && data.url) {
    return data.url;
  }
  return null;
}

/**
 * 调用日日新生成纹样草图（真实 API）
 * 请求前后打印完整日志（请求体 / 响应状态 / 完整 JSON），错误不吞没，
 * 解析失败时 throw new Error(JSON.stringify(data)) 将真实响应抛给前端
 * @param {string} inspiration 创作灵感（自然语言长文本）
 * @param {string} style 纹样风格
 * @returns {Promise<{success: boolean, imageUrl: string, prompt: string, theme: string}>}
 */
export const handleGenerateImage = async (inspiration, style) => {
  const prompt = buildPrompt(inspiration, style);

  // 环境变量校验（需 .env 中配置 VITE_SENSENOVA_API_KEY，改后需重启 dev server）
  const apiKey = import.meta.env.VITE_SENSENOVA_API_KEY;
  if (!apiKey) {
    const msg = '未配置 API Key（VITE_SENSENOVA_API_KEY），请在 .env 中配置并重启 dev server';
    console.error('[SenseNova]', msg);
    throw new Error(msg);
  }

  const requestBody = {
    model: MODEL_NAME,
    prompt,
    size: '1024x1024',
    n: 1,
  };

  try {
    // —— 请求前日志：地址 + 请求体（F12 控制台可查）——
    console.log('[SenseNova] 请求地址:', `${API_BASE}/v1/images/generations`);
    console.log('[SenseNova] 请求体:', requestBody);

    const res = await fetch(`${API_BASE}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // —— 响应状态日志 ——
    console.log('[SenseNova] 响应状态:', res.status, res.statusText);

    const data = await res.json();

    // —— 完整响应数据日志 ——
    console.log('[SenseNova] 完整响应数据:', data);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    }

    // —— 容错解析：依次尝试多种结构 ——
    const imageUrl = resolveImageUrl(data);
    if (!imageUrl) {
      throw new Error(JSON.stringify(data));
    }

    return { success: true, imageUrl, prompt, theme: deriveThemeLabel(inspiration) };
  } catch (err) {
    // 打印并重新抛出真实错误，交由前端展示（不吞没报错）
    console.error('[SenseNova] 生成草图失败:', err);
    throw err;
  }
};

/**
 * 局部重绘（模拟实现，预留真实接口）
 * @param {string} imageUrl 待重绘的图片地址
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const refineRegion = async (imageUrl) => {
  await delay(1500);
  return { success: true, message: '重绘成功' };
};

/**
 * 导出作品（模拟实现，预留真实接口）
 */
export const exportWork = async (imageUrl, format = 'PNG') => {
  await delay(600);
  return { success: true, format };
};
