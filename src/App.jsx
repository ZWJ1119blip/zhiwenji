import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import PatternDefs from './components/PatternDefs.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import WorkbenchPage from './pages/WorkbenchPage.jsx';
import LogPage from './pages/LogPage.jsx';
import InspirationPage from './pages/InspirationPage.jsx';
import DiagnosticsPage from './pages/DiagnosticsPage.jsx';
import MyWorksPage from './pages/MyWorksPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 全局 SVG 纹样符号定义（云纹 / 缠枝纹 / 回纹 / 宝相花） */}
      <PatternDefs />

      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <Routes>
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/inspiration" element={<InspirationPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/works" element={<MyWorksPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-mo-light md:flex-row md:px-10">
          <p>织纹集 · AIGC 非遗纹样交互式创作助手 — Demo 原型</p>
          <p className="tracking-widest">AI 生成草图 · 人工二次编辑 · 载体适配 · 溯源记录</p>
        </div>
      </footer>
    </div>
  );
}
