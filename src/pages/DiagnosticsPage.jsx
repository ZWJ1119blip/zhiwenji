import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Seal from '../components/Seal.jsx';
import { logStore } from '../store/logStore.js';

/**
 * 非遗规制智能诊断仪（独立页面 · 杀手锏功能）
 * 上传纹样 → 激光扫描（1.5s）→ 叠加红色虚线规制网格 →
 * 输出结构化诊断报告：骨架对称度 / 四方连续达标 / 传统色彩合规 / AI 修复建议。
 */

/** 规制网格：垂直中轴线 / 水平基准线 / 黄金分割线（0.382 / 0.618）/ 对准标记 */
function RuleGridOverlay() {
  return (
    <div className="rule-grid-in pointer-events-none absolute inset-0 z-10 select-none" aria-hidden="true">
      {/* 垂直中轴线 */}
      <span className="absolute inset-y-0 left-1/2 w-0 border-l border-dashed border-zhusha/90" />
      {/* 水平基准线 */}
      <span className="absolute inset-x-0 top-1/2 h-0 border-t border-dashed border-zhusha/90" />
      {/* 垂直黄金分割线 */}
      <span className="absolute inset-y-0 left-[38.2%] w-0 border-l border-dashed border-teng/70" />
      <span className="absolute inset-y-0 left-[61.8%] w-0 border-l border-dashed border-teng/70" />
      {/* 水平黄金分割线 */}
      <span className="absolute inset-x-0 top-[38.2%] h-0 border-t border-dashed border-teng/70" />
      <span className="absolute inset-x-0 top-[61.8%] h-0 border-t border-dashed border-teng/70" />
      {/* 中心标记环 */}
      <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zhusha/70">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zhusha" />
      </span>
      {/* 四角对准标记 */}
      {[
        'left-3 top-3 border-l border-t',
        'right-3 top-3 border-r border-t',
        'left-3 bottom-3 border-b border-l',
        'right-3 bottom-3 border-b border-r',
      ].map((pos) => (
        <span key={pos} className={`absolute h-4 w-4 border-zhusha/70 ${pos}`} />
      ))}
      {/* 状态徽标 */}
      <span className="absolute right-3 top-3 rounded-full border border-zhusha/60 bg-rice/85 px-2.5 py-1 text-[10px] font-medium tracking-widest text-zhusha backdrop-blur-sm">
        规制网格已开启
      </span>
    </div>
  );
}

/** 诊断报告面板（结构化 Mock 数据，专业 UI） */
function DiagnosticReportPanel({ result, imageName }) {
  if (!result) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-dai/30 bg-rice-card shadow-[0_18px_44px_-32px_rgba(42,38,32,0.55)]">
      {/* 报告头 */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-dai/8 px-4 py-3">
        <span className="flex items-center gap-2.5">
          <Seal char="规" size="sm" />
          <span className="font-serif text-sm font-semibold text-dai">非遗规制诊断报告</span>
        </span>
        <span className="shrink-0 text-[10px] tracking-widest text-mo-light">AI RULE ENGINE · {result.time}</span>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* 检测对象 */}
        <p className="text-[11px] text-mo-light">
          检测对象：<span className="font-medium text-mo">{imageName || '上传纹样'}</span> · 检测维度：骨架对称 / 四方连续 / 传统色彩
        </p>

        {/* 骨骼对称度 */}
        <div className="rounded-md border border-line bg-rice px-3.5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-mo">骨骼对称度</span>
            <span className="font-semibold tabular-nums text-dai">{result.symmetry}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teng to-dai transition-all duration-700"
              style={{ width: `${result.symmetry}%` }}
            />
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-zhusha">
            <span className="mt-0.5 shrink-0">⚠</span>
            警告：左侧云头略有失衡（以垂直中轴线为基准的镜像像素差 18%）
          </p>
        </div>

        {/* 二值合规指标 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-line bg-rice px-3.5 py-2.5">
            <span className="text-xs text-mo">四方连续达标</span>
            <span className="text-xs font-semibold text-dai">是 · 通过边缘像素匹配检测</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-line bg-rice px-3.5 py-2.5">
            <span className="text-xs text-mo">传统色彩合规</span>
            <span className="text-xs font-semibold text-dai">是 · 匹配标准青花瓷色谱</span>
          </div>
        </div>

        {/* 修复建议 */}
        <div className="rounded-md border border-teng/45 bg-teng/10 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-mo">
            <span className="font-semibold text-zheshi">修复建议：</span>
            建议使用《织纹集》工作台对左侧云头进行局部重绘。
          </p>
        </div>

        {/* 行动入口 */}
        <Link
          to="/workbench"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-dai py-2.5 text-sm font-medium text-rice transition-colors hover:bg-dai-light"
        >
          前往工作台修复
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <p className="text-[10px] leading-relaxed text-mo-light/80">
          * 诊断指标为前端演示数据，用于展示「AI 辅助文化规制校验」产品理念：纹样在投产之前，先过规制关。
        </p>
      </div>
    </div>
  );
}

export default function DiagnosticsPage() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageName, setImageName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | scanning | done
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  /** 读取本地图片文件 */
  const loadFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件（PNG / JPG / WebP）');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setImageName(file.name);
      setPhase('idle');
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  /** 使用示例纹样（方便无本地文件时演示） */
  const loadSample = () => {
    setImageSrc('/patterns/cloud.png');
    setImageName('示例纹样 · 青花云纹');
    setPhase('idle');
    setResult(null);
  };

  /** 开始智能扫描：1.5s 激光扫描后输出报告 */
  const handleScan = () => {
    if (!imageSrc) return;
    setPhase('scanning');
    setResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const report = {
        symmetry: 82,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setPhase('done');
      setResult(report);
      logStore.add({
        type: 'manual',
        title: '非遗规制智能诊断',
        details: [
          `检测对象：${imageName || '上传纹样'}`,
          '骨骼对称度：82%（左侧云头略有失衡）',
          '四方连续达标：是（边缘像素匹配检测通过）',
          '传统色彩合规：是（匹配标准青花瓷色谱）',
          '修复建议：对左侧云头进行局部重绘',
        ],
      });
    }, 1500);
  };

  return (
    <section>
      <PageHeader
        title="非遗规制智能诊断仪"
        en="AI RULE DIAGNOSTIC"
        desc="上传纹样，AI 将校验它的「文化规制」：骨架是否对称、能否四方连续、色彩是否合规。通用 AI 只负责生成，织纹集负责在投产之前把好规制关。"
      />

      {/* 专业性标语 */}
      <p className="mx-auto mb-8 max-w-3xl rounded-lg border border-dai/25 bg-dai/5 px-5 py-3 text-center text-sm font-medium tracking-wide text-dai">
        专为非遗纹样打造：拒绝随机堆砌，支持四方连续与规制校验。
      </p>

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        {/* ============ 左侧：上传 + 扫描舞台 ============ */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-line bg-rice-card p-6 shadow-[0_18px_50px_-40px_rgba(42,38,32,0.5)] md:p-8">
            <h2 className="mb-5 flex items-center gap-3 font-serif text-xl font-semibold text-mo">
              <Seal char="诊" size="sm" />
              纹样扫描
            </h2>

            {/* 上传框 */}
            {!imageSrc && (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    loadFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                    dragOver
                      ? 'border-zhusha bg-zhusha/5'
                      : 'border-dai/30 bg-rice/50 hover:border-dai/60'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12 text-dai/40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M17 8l-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-mo">支持拖拽或点击上传纹样图片进行扫描</p>
                  <p className="mt-1.5 text-xs text-mo-light">支持 PNG / JPG / WebP · 建议上传高清四方连续纹样</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => loadFile(e.target.files?.[0])}
                />
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[11px] text-mo-light">没有素材？</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <button
                  type="button"
                  onClick={loadSample}
                  className="mx-auto mt-3 flex items-center gap-2 rounded-md border border-dai px-4 py-2 text-sm text-dai transition-colors hover:bg-dai hover:text-rice"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  使用示例纹样体验
                </button>
              </>
            )}

            {/* 扫描舞台 */}
            {imageSrc && (
              <>
                <div className="relative overflow-hidden rounded-lg border border-line bg-rice-deep">
                  <img
                    src={imageSrc}
                    alt="待诊断纹样"
                    className="block max-h-[420px] w-full object-contain"
                  />
                  {/* 激光扫描线 */}
                  {phase === 'scanning' && (
                    <>
                      <span className="rule-scan-line" />
                      <span className="absolute right-3 top-3 z-20 rounded-full border border-zhusha/60 bg-rice/85 px-2.5 py-1 text-[10px] font-medium tracking-widest text-zhusha backdrop-blur-sm">
                        AI 扫描中
                      </span>
                    </>
                  )}
                  {/* 规制网格 */}
                  {phase === 'done' && <RuleGridOverlay />}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={phase === 'scanning'}
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-md bg-zhusha py-3.5 text-sm font-medium tracking-[0.2em] text-rice transition-colors hover:bg-zhusha-deep disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {phase === 'scanning' ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-rice/35 border-t-rice" />
                        正在扫描…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                          <circle cx="12" cy="12" r="3.2" />
                        </svg>
                        {phase === 'done' ? '重新智能扫描' : '开始智能扫描'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setImageName('');
                      setPhase('idle');
                      setResult(null);
                    }}
                    className="rounded-md border border-line px-4 py-3 text-sm text-mo/70 transition-colors hover:border-dai/40 hover:text-dai"
                  >
                    换一张
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-mo-light">
                  扫描约 1.5 秒 · 检测骨架对称度、四方连续达标与传统色彩合规
                </p>
              </>
            )}
          </div>
        </div>

        {/* ============ 右侧：诊断报告 / 说明 ============ */}
        <div className="lg:col-span-2">
          {result ? (
            <DiagnosticReportPanel result={result} imageName={imageName} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-dai/25 bg-rice/40 px-6 py-14 text-center">
              <span className="text-3xl text-dai/30">◇</span>
              <p className="mt-4 text-sm font-medium text-mo">诊断报告待生成</p>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-mo-light">
                上传纹样并点击「开始智能扫描」。
                <br />
                系统将校验骨架对称度、四方连续达标与传统色彩合规，并给出可执行的修复建议。
              </p>
              <div className="mt-6 space-y-2 text-left text-[11px] text-mo-light">
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-dai" />
                  骨架对称度 —— 垂直中轴线镜像像素分析
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teng" />
                  四方连续 —— 四边边缘像素匹配检测
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zhusha" />
                  传统色彩 —— 青花 / 彩釉标准色谱比对
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 合规声明 */}
      <p className="mt-12 border-t border-line pt-6 text-center text-xs leading-relaxed text-mo-light">
        *创意由你定义，AI 仅为画笔。本平台所有生成素材均需经人工干预，且自动记录溯源日志以保护知识产权。*
      </p>
    </section>
  );
}
