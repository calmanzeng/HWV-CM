import { useEffect, type ReactNode } from 'react';
import { PageFrame } from './components/Layout';
import { guardRoute, transitionEvent } from './eventMachine';
import { useAppState } from './useWorkspace';
import AboutPage from './pages/AboutPage';
import EventConsentPage from './pages/EventConsentPage';
import EventIntakePage from './pages/EventIntakePage';
import EventMapPage from './pages/EventMapPage';
import FollowUpPage from './pages/FollowUpPage';
import HomePage from './pages/HomePage';
import RelationshipPage from './pages/RelationshipPage';
import ReportPage from './pages/ReportPage';
import SafetyCheckPage from './pages/SafetyCheckPage';
import SafetyPage from './pages/SafetyPage';
import HomeScreen from './screens/HomeScreen';
import KnowSelfScreen from './screens/KnowSelfScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import UnderstandScreen from './screens/UnderstandScreen';

/**
 * v2 屏幕（移动端外壳）。已完成一屏就接入一屏；
 * 未接入的路径继续走下方 v1 流程，保证任何时刻整站都是可用的。
 */
const V2_SCREENS: Record<string, ReactNode> = {
  '/': <HomeScreen />,
  '/know-self': <KnowSelfScreen />,
  '/profile': <ProfileScreen />,
  '/understand': <UnderstandScreen />,
  '/map': <MapScreen />,
};

const LEGACY_ROUTES: Record<string, { label: string; page: ReactNode }> = {
  '/relationship': { label: '关系', page: <RelationshipPage /> },
  '/event-consent': { label: '开始前说明', page: <EventConsentPage /> },
  '/event-safety-check': { label: '安全自评', page: <SafetyCheckPage /> },
  '/event': { label: '私密叙述', page: <EventIntakePage /> },
  '/event-map': { label: '核对假设', page: <EventMapPage /> },
  '/report': { label: '整理结果', page: <ReportPage /> },
  '/safety': { label: '安全支持', page: <SafetyPage /> },
  '/follow-up': { label: '约定与复盘', page: <FollowUpPage /> },
  '/about': { label: '关于与数据', page: <AboutPage /> },
  '/home-legacy': { label: '首页', page: <HomePage /> },
};

function normalizePath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function LegacyApp({ path }: { path: string }) {
  const route = LEGACY_ROUTES[path];
  const { activeEvent, storageError, safeMode, updateEvent } = useAppState();
  const redirect = guardRoute(path, activeEvent);

  useEffect(() => {
    if (redirect) window.location.replace(redirect);
  }, [redirect]);

  useEffect(() => {
    if (path === '/safety' && activeEvent?.consentAcceptedAt && activeEvent.status !== 'SAFETY_SUPPORT') {
      try {
        const supportEvent = transitionEvent(activeEvent, 'SAFETY_SUPPORT');
        updateEvent(activeEvent.id, (event) => ({ ...supportEvent, safetyDecision: 'support' }));
      } catch {
        updateEvent(activeEvent.id, (event) => ({ ...event, status: 'SAFETY_SUPPORT', safetyDecision: 'support' }));
      }
    }
  }, [path, activeEvent?.id, activeEvent?.status, activeEvent?.consentAcceptedAt, updateEvent]);

  let page = route?.page ?? (
    <section className="card card-pad">
      <h1 className="page-title">找不到这个页面</h1>
      <p className="page-lede">请从主导航选择一个页面。</p>
      <a className="button" href="/">
        返回首页
      </a>
    </section>
  );

  if (safeMode && path !== '/about') {
    page = (
      <section className="card card-pad recovery-page">
        <div className="eyebrow">数据保护模式</div>
        <h1 className="page-title">先处理本机数据读取问题</h1>
        <p className="page-lede">
          本机资料无法完整读取，自动保存已暂停。为避免覆盖原始数据，其他可编辑页面暂时锁定。
        </p>
        <a className="button" href="/about#data">
          前往数据恢复与管理
        </a>
      </section>
    );
  } else if (redirect) {
    page = (
      <section className="card card-pad route-guard">
        <div className="eyebrow">流程守卫</div>
        <h1 className="section-title">正在前往上一个必要步骤</h1>
        <p className="page-lede">
          只有完成当前单人流程的同意、安全自评、私密叙述和本人确认，才能进入后续内容。
        </p>
        <a className="button secondary" href={redirect}>
          若页面未自动跳转，点击继续
        </a>
      </section>
    );
  }

  return (
    <PageFrame path={path}>
      <div className="global-status" aria-live="polite">
        {storageError && (
          <div className={safeMode ? 'storage-message danger' : 'storage-message'}>
            <strong>{safeMode ? '自动保存已暂停。' : '本次修改可能未能保存。'}</strong> {storageError}{' '}
            <a href="/about#data">前往数据管理</a>
          </div>
        )}
      </div>
      {page}
    </PageFrame>
  );
}

export default function App() {
  const path = normalizePath();
  const screen = V2_SCREENS[path];
  if (screen) return <>{screen}</>;
  return <LegacyApp path={path} />;
}
