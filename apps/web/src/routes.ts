export type TabKey = 'home' | 'know-self' | 'understand' | 'event' | 'reflect';

export type RouteDef = {
  path: string;
  title: string;
  tab: TabKey;
  backHref?: string;
  showTabs?: boolean;
};

export const TAB_ITEMS: { key: TabKey; label: string; href: string }[] = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'know-self', label: '认识自己', href: '/know-self' },
  { key: 'understand', label: '理解彼此', href: '/understand' },
  { key: 'event', label: '一件事', href: '/event-start' },
  { key: 'reflect', label: '成长', href: '/reflect' },
];

/**
 * ROUTES 用 satisfies 保留对象字面量的键类型：
 * `keyof typeof ROUTES` 推导为 12 个路由路径的字面量联合，
 * 供 App.tsx 的 V2_SCREENS 做编译期双向约束（漏注册即 tsc 失败）。
 */
export const ROUTES = {
  '/': { path: '/', title: '首页', tab: 'home' },
  '/know-self': { path: '/know-self', title: '认识自己', tab: 'know-self', backHref: '/' },
  '/profile': { path: '/profile', title: '个人档案', tab: 'know-self', backHref: '/know-self' },
  '/understand': { path: '/understand', title: '理解彼此', tab: 'understand', backHref: '/' },
  '/map': { path: '/map', title: '关系差异地图', tab: 'understand', backHref: '/understand' },
  '/event-start': { path: '/event-start', title: '面对一件事', tab: 'event', backHref: '/' },
  '/write-down': { path: '/write-down', title: '写下经过', tab: 'event', backHref: '/event-start' },
  '/possibilities': {
    path: '/possibilities',
    title: '看见不同可能',
    tab: 'event',
    backHref: '/write-down',
  },
  '/results': { path: '/results', title: '三份整理结果', tab: 'event', backHref: '/possibilities' },
  '/agreement': { path: '/agreement', title: '一起商量', tab: 'event', backHref: '/results' },
  '/reflect': { path: '/reflect', title: '回顾成长', tab: 'reflect', backHref: '/' },
  '/safety': {
    path: '/safety',
    title: '安全支持',
    tab: 'home',
    backHref: '/event-start',
    showTabs: false,
  },
} satisfies Record<string, RouteDef>;

export type RoutePath = keyof typeof ROUTES;

export function matchRoute(pathname: string): RouteDef | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized in ROUTES ? ROUTES[normalized as RoutePath] : undefined;
}
