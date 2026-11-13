import { answeredInterviewCount, getActiveEvent } from '../domain';
import { useAppState } from '../useWorkspace';

const entries = [
  { href: '/profile', title: '认识自己', text: '用可跳过的访谈和自由记录，整理当下对自己重要的事。', icon: '♙' },
  { href: '/event-consent', title: '处理一次冲突', text: '从你自己的叙述出发，区分事实、解释、感受和需要。', icon: '▤' },
  { href: '/relationship', title: '理解一段关系', text: '查看差异地图的呈现方式；双人共享暂未开放。', icon: '⌘' },
];

export default function HomePage() {
  const { workspace } = useAppState();
  const activeEvent = getActiveEvent(workspace);
  const interviewCount = answeredInterviewCount(workspace.profile);
  return (
    <>
      <div className="welcome">
        <div className="welcome-copy">
          <div className="eyebrow">理解差异，从具体情境开始</div>
          <h1 className="home-title">把不同，先说清楚。</h1>
          <p className="home-lede">记录自己的想法，梳理一次分歧，或了解一段关系里的共同点与边界。这里不替任何人打分，也不替你决定关系走向。</p>
        </div>
        <div className="home-mark" aria-hidden="true"><svg viewBox="0 0 96 96" fill="none"><circle cx="48" cy="48" r="34" stroke="currentColor" strokeWidth="1.6" opacity=".35"/><circle cx="31" cy="39" r="8" fill="currentColor"/><circle cx="63" cy="34" r="6" fill="currentColor" opacity=".65"/><circle cx="57" cy="63" r="10" fill="currentColor" opacity=".42"/><path d="m36 43 14 14M39 37l18-2m-3 20 8-15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></div>
      </div>
      <div className="section-head"><div><h2 className="section-title">从一个入口开始</h2><p className="section-note">不需要先完成档案，任何一步都可以跳过或退出。</p></div></div>
      <section className="entry-grid" aria-label="开始方式">
        {entries.map((entry) => <a className="entry-card" href={entry.href} key={entry.href}><span className="entry-icon" aria-hidden="true">{entry.icon}</span><h3>{entry.title}</h3><p>{entry.text}</p><span className="entry-arrow" aria-hidden="true">↗</span></a>)}
      </section>
      <div className="home-layout">
        <section className="recent">
          <div className="section-head"><div><h2 className="section-title">最近在处理</h2><p className="section-note">仅显示保存在本机浏览器的数据。</p></div><a className="link" href="/follow-up">查看复盘</a></div>
          <article className="card card-pad">
            {activeEvent ? <div className="recent-item" style={{ borderTop: 0, paddingTop: 0 }}><div><p className="recent-title">最近一次事件整理</p><div className="recent-meta">{new Date(activeEvent.updatedAt).toLocaleDateString('zh-CN')} · {activeEvent.status === 'OPTIONS' ? '可查看整理结果' : '流程尚未完成'}</div></div><a className="button secondary" href={activeEvent.status === 'OPTIONS' ? '/report' : activeEvent.safetyDecision === 'support' ? '/safety' : '/event-consent'}>{activeEvent.status === 'OPTIONS' ? '打开整理结果' : '继续流程'}</a></div> : <div className="recent-item" style={{ borderTop: 0, paddingTop: 0 }}><div><p className="recent-title">还没有事件记录</p><div className="recent-meta">你可以从单人事件流程开始；无需先填写个人档案。</div></div><a className="button secondary" href="/event-consent">新建事件</a></div>}
            <div className="recent-item"><div><p className="recent-title">个人访谈</p><div className="recent-meta">{interviewCount} / 18 个问题已回答 · 允许跳过</div></div><a className="link" href="/profile">打开档案 →</a></div>
          </article>
        </section>
        <aside className="right-stack" aria-label="隐私与原则">
          <section className="card privacy-card"><div className="privacy-head"><span className="privacy-icon" aria-hidden="true">⌑</span><h2 className="privacy-title">资料默认只属于你</h2></div><p className="privacy-copy">本机浏览器保存，不做云端同步；这不等于设备加密。</p><div className="rule"/><a className="link" href="/about#data">查看数据管理 →</a></section>
          <section className="disclaimer"><strong>我们怎样看待差异</strong>差异本身不是缺陷。分析只帮助你整理信息与提出可修正的问题；是否沟通、协商或结束，都由当事人自己决定。</section>
        </aside>
      </div>
      <p className="footer-note">HWV-CM 1.0 包含 58 个候选构念。组合模型尚未完成实证验证；证据来源与限制可在“关于与数据”中查看。</p>
    </>
  );
}
