/**
 * Mock 数据层 —— 范式库 / 日志初始数据 / 作品数据
 */

export const STYLE_OPTIONS = ['青花瓷', '水墨淡彩', '剪纸红', '宫廷织绣', '青铜器', '敦煌壁画'];

export const CARRIER_OPTIONS = ['丝巾', '陶瓷', '版画', '书签', '包装盒', '汉服', '屏风', '数字壁纸'];

export const PATTERNS = [
  {
    id: 'cloud',
    name: '云纹',
    latin: 'NUBES',
    origin: '商周滥觞 · 汉唐流变',
    defaultStyle: '青花瓷',
    image: '/patterns/cloud.jpg',
    meaning:
      '取象天际流云，寓意高升如意、祥瑞缭绕。线条婉转、气韵流动，是最具华夏识别度的装饰母题之一。',
    composition:
      '以「如意头」卷云为单体，讲究云头相生、气脉相连；多作二方连续满铺，或以四方连锁构成锦地。',
    palette: [
      { name: '黛蓝', hex: '#2c4a5e' },
      { name: '霁青', hex: '#6b8ca8' },
      { name: '牙白', hex: '#f6f1e6' },
    ],
  },
  {
    id: 'vine',
    name: '缠枝纹',
    latin: 'VITIS',
    origin: '唐宋成型 · 明清鼎盛',
    defaultStyle: '水墨淡彩',
    image: '/patterns/vine.jpg',
    meaning:
      '以藤蔓缠绵、叶果相继之态，寓意生生不息、万代绵长，是「连绵不断」的吉祥语汇。',
    composition:
      '波状藤蔓作 S 形骨架，叶片生于波谷、花头出于波峰；藤枝走丝般穿插避让，繁而不乱。',
    palette: [
      { name: '黛绿', hex: '#2c4a3e' },
      { name: '藤黄', hex: '#d9a441' },
      { name: '赭石', hex: '#8c5a3c' },
    ],
  },
  {
    id: 'meander',
    name: '回纹',
    latin: 'MEANDER',
    origin: '新石器陶纹 · 商周青铜',
    defaultStyle: '剪纸红',
    image: '/patterns/meander.jpg',
    meaning:
      '回环往复、无始无终，寓意富贵不断头、基业永续，兼具几何秩序的理性之美。',
    composition:
      '矩形螺旋为单体，折线方折、转角见骨；以拐折处接驳拼合，可作边饰亦可成满地几何锦。',
    palette: [
      { name: '朱砂', hex: '#b23a2e' },
      { name: '黛绿', hex: '#2c4a3e' },
      { name: '米白', hex: '#f6f1e6' },
    ],
  },
  {
    id: 'baoxiang',
    name: '宝相花',
    latin: 'BAOXIANG',
    origin: '魏晋萌芽 · 隋唐极盛',
    defaultStyle: '宫廷织绣',
    image: '/patterns/baoxiang.jpg',
    meaning:
      '集莲花、牡丹、云纹于一体的理想之花，象征庄严吉祥、圆满具足，是盛世审美的缩影。',
    composition:
      '严格放射对称：花心、内瓣、环瓣三层结构；常以四株小相花拱卫中心大花，构成宝相锦。',
    palette: [
      { name: '宝蓝', hex: '#2b4c7e' },
      { name: '朱砂', hex: '#b23a2e' },
      { name: '藤黄', hex: '#d9a441' },
    ],
  },
  {
    id: 'dragon',
    name: '龙纹',
    latin: 'DRACO',
    origin: '商周青铜 · 明清御用',
    defaultStyle: '宫廷织绣',
    image: '/patterns/dragon.jpg',
    meaning:
      '鳞虫之长、四灵之首，象征皇权尊贵与民族精神。行龙升降、团龙盘绕，皆有「龙腾致雨」的祥瑞寄托。',
    composition:
      '龙首回望、龙身作 S 形三折，四肢五爪张开呈奔腾之势；常与如意云纹相拥，构成「云龙戏珠」锦题。',
    palette: [
      { name: '朱砂', hex: '#b23a2e' },
      { name: '石青', hex: '#2b4c7e' },
      { name: '泥金', hex: '#d9a441' },
    ],
  },
  {
    id: 'wave',
    name: '水波纹',
    latin: 'UNDAE',
    origin: '唐宋成型 · 明清官服',
    defaultStyle: '青花瓷',
    image: '/patterns/wave.jpg',
    meaning:
      '以水波荡漾之态寓意福海寿山、财源滚滚；与山石相合为「海水江崖」，祈愿江山永固。',
    composition:
      '以多重同心弧线叠作波轮，波峰起卷、波谷藏针；多作横排二方连续，作衣裾或器皿下饰的「立水」。',
    palette: [
      { name: '靛青', hex: '#1f4e5f' },
      { name: '蟹壳青', hex: '#4e7060' },
      { name: '牙白', hex: '#f6f1e6' },
    ],
  },
  {
    id: 'fish',
    name: '鱼纹',
    latin: 'PISCIS',
    origin: '半坡陶纹 · 元明青花',
    defaultStyle: '青花瓷',
    image: '/patterns/fish.jpg',
    meaning:
      '「鱼」谐音「余」，寓意富贵有余、连年有余；双鱼相逐又象征夫妻和睦、生生不息。',
    composition:
      '鲤鱼、鲭鱼单体作优游之姿，与水藻、莲花组成鱼藻图；或双鱼对旋成团，适作圆形适合纹样。',
    palette: [
      { name: '霁青', hex: '#6b8ca8' },
      { name: '朱砂', hex: '#b23a2e' },
      { name: '牙白', hex: '#f6f1e6' },
    ],
  },
  {
    id: 'taotie',
    name: '饕餮纹',
    latin: 'TAOTIE',
    origin: '商周青铜 · 良渚玉琮',
    defaultStyle: '青铜器',
    image: '/patterns/taotie.jpg',
    meaning:
      '古人想象中的贪婪神兽，铸于礼器以彰威仪、震四方；是「狞厉之美」的代表，亦是中华纹样之源。',
    composition:
      '严格对称的正面兽面：双角、巨目、横鼻、张开獠牙；以云雷纹衬地，兽面居中，四隅填夔龙纹。',
    palette: [
      { name: '铜绿', hex: '#4e7060' },
      { name: '泥金', hex: '#d9a441' },
      { name: '玄褐', hex: '#8c5a3c' },
    ],
  },
];

/** 创作日志初始 Mock 数据 */
export const INITIAL_LOGS = [
  {
    id: 'l1',
    time: '2026-10-20 09:30',
    type: 'generate',
    title: '生成草图',
    details: ['提示词：秋水缠枝', '参数：风格B · 水墨淡彩', '载体：版画'],
  },
  {
    id: 'l2',
    time: '2026-10-19 16:45',
    type: 'export',
    title: '导出作品',
    details: ['作品：青花叙曲', '格式：PNG · 300dpi', '载体：丝巾'],
  },
  {
    id: 'l3',
    time: '2026-10-19 11:20',
    type: 'manual',
    title: '人工干预',
    details: ['操作：配色替换', '区域：全局', '调整：朱砂 → 赭石'],
  },
  {
    id: 'l4',
    time: '2026-10-18 15:02',
    type: 'carrier',
    title: '载体适配',
    details: ['载体：丝巾', '留白：边距 8%', '缩放：纹样单元 1.2×'],
  },
  {
    id: 'l5',
    time: '2026-10-18 14:35',
    type: 'manual',
    title: '人工干预',
    details: ['操作：局部重绘', '区域：中心'],
  },
  {
    id: 'l6',
    time: '2026-10-18 14:32',
    type: 'generate',
    title: '生成草图',
    details: ['提示词：青花瓷云纹', '参数：风格A'],
  },
  {
    id: 'l7',
    time: '2026-10-15 10:20',
    type: 'select',
    title: '选择范式',
    details: ['范式：云纹', '构图：满铺连续', '配色：黛蓝 / 霁青'],
  },
  {
    id: 'l8',
    time: '2026-10-15 10:12',
    type: 'create',
    title: '创建项目',
    details: ['项目：青花叙曲 · 丝巾纹样', '定位：工艺美术共创 Demo'],
  },
];

/** 灵感广场 · 社区 Mock 作品（图片来自 public/community，由 AI 生成） */
export const INSPIRATION_WORKS = [
  {
    id: 'insp-1',
    title: '云游青花',
    image: '/community/silk-scarf.png',
    carrier: '丝巾',
    pattern: '云纹',
    style: '青花瓷',
    creator: { name: '林叙白', avatar: '叙', color: '#2c4a5e' },
    likes: 328,
    liked: false,
    inspiration: '我想让如意云在丝巾上连成一条春天的河流，青花发色要淡雅…',
    cert: { no: '#2026-A7F3', status: '溯源日志已生成' },
  },
  {
    id: 'insp-2',
    title: '缠枝一碟春',
    image: '/community/ceramic-plate.png',
    carrier: '陶瓷',
    pattern: '缠枝纹',
    style: '宫廷织绣',
    creator: { name: '苏釉色', avatar: '釉', color: '#4e7060' },
    likes: 256,
    liked: false,
    inspiration: '缠枝纹绕盘而生，藤黄点蕊，像一碟盛不住的春意…',
    cert: { no: '#2026-B2E9', status: '区块链存证' },
  },
  {
    id: 'insp-3',
    title: '宝相屏山',
    image: '/community/folding-screen.png',
    carrier: '屏风',
    pattern: '宝相花',
    style: '敦煌壁画',
    creator: { name: '程砚舟', avatar: '砚', color: '#8c5a3c' },
    likes: 512,
    liked: false,
    inspiration: '取敦煌宝相的端庄，做四扇小屏，置于茶室一隅…',
    cert: { no: '#2026-C8D1', status: '区块链存证' },
  },
  {
    id: 'insp-4',
    title: '江海游袂',
    image: '/community/hanfu.png',
    carrier: '汉服',
    pattern: '水波纹',
    style: '水墨淡彩',
    creator: { name: '沈青袂', avatar: '袂', color: '#2b4c7e' },
    likes: 194,
    liked: false,
    inspiration: '水波与鱼纹绣在衣摆，行走时如江海流动…',
    cert: { no: '#2026-D4A6', status: '溯源日志已生成' },
  },
  {
    id: 'insp-5',
    title: '回纹礼盒',
    image: '/community/gift-box.png',
    carrier: '包装盒',
    pattern: '回纹',
    style: '剪纸红',
    creator: { name: '何砚红', avatar: '红', color: '#b23a2e' },
    likes: 143,
    liked: false,
    inspiration: '回纹不断头，礼盒四面连续，朱砂配黛绿最喜气…',
    cert: { no: '#2026-E1B8', status: '区块链存证' },
  },
  {
    id: 'insp-6',
    title: '鱼藻壁纸',
    image: '/community/digital-wallpaper.png',
    carrier: '数字壁纸',
    pattern: '鱼纹',
    style: '敦煌壁画',
    creator: { name: '叶知藻', avatar: '藻', color: '#7fa3b5' },
    likes: 407,
    liked: false,
    inspiration: '让古老的鱼藻游进手机屏幕，做一张会呼吸的壁纸…',
    cert: { no: '#2026-F9C2', status: '溯源日志已生成' },
  },
];

/** 我的作品 · Mock 数据 */
export const MOCK_WORKS = [
  {
    id: 'work-1',
    title: '青花叙曲',
    carrier: '丝巾',
    pattern: 'cloud',
    style: '青花瓷',
    updatedAt: '2026-10-19 16:45',
    status: '已导出',
  },
  {
    id: 'work-2',
    title: '山水间',
    carrier: '书签',
    pattern: 'vine',
    style: '水墨淡彩',
    updatedAt: '2026-10-18 15:02',
    status: '草稿',
  },
  {
    id: 'work-3',
    title: '宝相生春',
    carrier: '陶瓷',
    pattern: 'baoxiang',
    style: '宫廷织绣',
    updatedAt: '2026-10-16 10:20',
    status: '待适配',
  },
];
