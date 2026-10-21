import PatternCard from '../components/PatternCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { PATTERNS } from '../data/mockData.js';

export default function GalleryPage() {
  return (
    <section>
      <PageHeader
        title="范式图库"
        en="PATTERN GALLERY"
        desc="八类经典非遗纹样范式：云纹、缠枝纹、回纹、宝相花、龙纹、水波纹、鱼纹、饕餮纹。选择一种范式作为共创起点——它将决定草图的构图规则与配色规范，也是溯源记录的起点。"
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {PATTERNS.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-mo-light">
        纹样图为高清范式参考 · 点击「AI 重新生成」可用日日新模型演绎你的版本 · 后续将接入非遗纹样数据库
      </p>
    </section>
  );
}
