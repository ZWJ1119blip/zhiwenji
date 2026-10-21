import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Seal from './Seal.jsx';

const MENUS = [
  { to: '/gallery', label: '范式图库' },
  { to: '/workbench', label: '共创工作台' },
  { to: '/inspiration', label: '灵感广场' },
  { to: '/diagnostics', label: '智能诊断' },
  { to: '/log', label: '创作日志' },
  { to: '/works', label: '我的作品' },
  { to: '/library', label: '我的纹样库' },
];

function DesktopLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className="relative block py-1 text-[15px] tracking-wider"
    >
      {({ isActive }) => (
        <span className="relative block">
          <span className={isActive ? 'text-zhusha' : 'text-mo/75 transition-colors hover:text-dai'}>
            {label}
          </span>
          <span
            className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-left rounded-full bg-zhusha transition-transform duration-300 ${
              isActive ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </span>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-rice/85 backdrop-blur-md">
      {/* 顶部传统色饰带 */}
      <div className="h-0.5 w-full bg-gradient-to-r from-zhusha via-teng to-dai" />

      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <Link to="/gallery" className="group flex items-center gap-3">
          <Seal char="织" />
          <span className="flex flex-col">
            <span className="font-serif text-xl font-semibold tracking-[0.25em] text-mo transition-colors group-hover:text-zhusha">
              织纹集
            </span>
            <span className="mt-0.5 text-[10px] tracking-[0.28em] text-mo-light">
              AIGC · 非遗纹样共创
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {MENUS.map((m) => (
            <DesktopLink key={m.to} to={m.to} label={m.label} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-mo transition-colors hover:border-dai/40 hover:text-dai md:hidden"
          aria-expanded={open}
          aria-label="打开菜单"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-line/70 bg-rice/95 md:hidden">
          <div className="mx-auto max-w-6xl px-6 py-2">
            {MENUS.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block border-b border-line/60 py-3.5 text-sm tracking-wider last:border-0 ${
                    isActive ? 'text-zhusha' : 'text-mo/75'
                  }`
                }
              >
                {m.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
