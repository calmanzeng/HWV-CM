import type { ReactNode } from 'react';
import { researchBanner } from '../domain';

const navItems = [
  { label: '首页', href: '/', icon: 'home' },
  { label: '我的档案', href: '/profile', icon: 'profile' },
  { label: '关系', href: '/relationship', icon: 'relationship' },
  { label: '事件分析', href: '/event-consent', icon: 'event' },
  { label: '约定与复盘', href: '/follow-up', icon: 'follow' },
  { label: '关于与数据', href: '/about', icon: 'about' },
];

const pathLabels: Record<string, string> = {
  '/': '首页',
  '/profile': '我的档案',
  '/relationship': '关系',
  '/event-consent': '事件分析 / 开始前说明',
  '/event-safety-check': '事件分析 / 安全自评',
  '/event': '事件分析 / 私密叙述',
  '/event-map': '事件分析 / 核对假设',
  '/report': '事件分析 / 整理结果',
  '/safety': '安全支持',
  '/follow-up': '约定与复盘',
  '/about': '关于与数据',
};

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5v-7h-5v7h-5a1 1 0 0 1-1-1z" /></>,
    profile: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.4-3.3 2.6-5.1 6.5-5.1s6.1 1.8 6.5 5.1" /></>,
    relationship: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="16" r="3" /><path d="M10.2 10.2 13.8 13.8M15 5h4v4M5 15v4h4" /></>,
    event: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>,
    follow: <><path d="M4 5h16M6 3v4m12-4v4M5 9h14v11H5zM8 13h3m-3 3h7" /></>,
    about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  };
  return <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg></span>;
}

export function PrototypeBanner() {
  return (
    <div className="prototype-banner" role="note">
      <span className="banner-mark" aria-hidden="true">!</span>
      <div className="banner-copy"><strong>研究原型 · 本地单人版</strong>{researchBanner}</div>
    </div>
  );
}

export function PageFrame({ path, children, topAction }: { path: string; children: ReactNode; topAction?: ReactNode }) {
  const activeHref = path.startsWith('/event') || path === '/report' || path === '/safety'
    ? '/event-consent'
    : path;
  const eventPage = path.startsWith('/event') || path === '/report' || path === '/safety';
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="HWV-CM 首页">
          <span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17.5 11.8 5l7.2 13M8.2 12h7.5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="brand-name">HWV-CM<span className="brand-sub">认知差异工作台</span></span>
        </a>
        <div className="nav-label">工作区</div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => (
            <a className={`nav-link${activeHref === item.href ? ' active' : ''}`} href={item.href} key={item.href}>
              <NavIcon name={item.icon} />{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="local-status"><span className="local-dot" />本地单人研究原型</div>
          <div className="local-note">本机保存，不上传；本地存储不等于设备加密。</div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">工作区 <span aria-hidden="true">/</span> {pathLabels[path] ?? '页面'}</div>
          <div className="top-actions">
            {topAction ?? <a className="link" href={eventPage ? '/safety' : '/about#data'}>{eventPage ? '安全支持' : '数据与隐私'}</a>}
            <span className="avatar" aria-label="本机个人空间">我</span>
          </div>
        </header>
        <main className="content">
          <PrototypeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageTitle({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-lede">{lede}</p></div>
      {children}
    </div>
  );
}

export function FlowSteps({ active }: { active: number }) {
  const steps = ['同意 CONSENT', '安全自评', '私密叙述', '事实地图', '待验证假设', '本人确认', '整理选项', '共同约定', '复盘'];
  return (
    <div className="flow-grid" aria-label="事件流程状态">
      {steps.map((label, index) => {
        const number = index + 1;
        const className = number < active ? 'flow-step done' : number === active ? 'flow-step active' : 'flow-step';
        return <div className={className} key={label}><span>{number}</span>{label}</div>;
      })}
    </div>
  );
}
