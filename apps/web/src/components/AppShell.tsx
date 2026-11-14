import type { ReactNode } from 'react';
import { TAB_ITEMS, type RouteDef } from '../routes';

type AppShellProps = {
  /** 路由元信息（routes.ts 为唯一数据源） */
  meta: RouteDef;
  children: ReactNode;
  activeTab?: RouteDef['tab'];
  backHref?: string;
  right?: ReactNode;
  showTabs?: boolean;
};

const ICONS: Record<string, ReactNode> = {
  home: <path d="m3.5 10.5 8.5-7 8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />,
  'know-self': (
    <>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20c.5-3.4 2.7-5.2 6.5-5.2s6 1.8 6.5 5.2" />
    </>
  ),
  understand: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="15" r="3" />
      <path d="M10.2 11.2 13.8 13.8" />
    </>
  ),
  event: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h4" />,
  reflect: <path d="M5 9h14v11H5zM6 3v4m12-4v4M8 14h3m-3 3h7" />,
};

export function AppShell({
  meta,
  children,
  activeTab: activeTabProp,
  backHref: backHrefProp,
  right,
  showTabs: showTabsProp,
}: AppShellProps) {
  const title = meta.title;
  const activeTab = activeTabProp ?? meta.tab;
  const backHref = backHrefProp ?? meta.backHref;
  const showTabs = showTabsProp ?? meta.showTabs ?? true;

  return (
    <div className="app">
      <header className="app-topbar">
        {backHref ? (
          <a className="app-back" href={backHref}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            返回
          </a>
        ) : (
          <span className="app-back app-back-empty" aria-hidden="true" />
        )}
        <h1 className="app-title">{title}</h1>
        <div className="app-right">{right}</div>
      </header>

      <main className="app-content">{children}</main>

      {showTabs && (
        <nav className="app-tabbar" aria-label="主导航">
          {TAB_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <a
                key={item.key}
                className={isActive ? 'app-tab app-tab-active' : 'app-tab'}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[item.key]}
                </svg>
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}