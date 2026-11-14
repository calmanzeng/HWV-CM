import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import { read } from '../store';

export default function UnderstandScreen() {
  const state = read();
  const count = state.observations.length;

  return (
    <AppShell meta={ROUTES['/understand']}>
      <div className="app-eyebrow">关系探索</div>
      <h1 className="app-title-lg">看见差异，不替对方说话</h1>
      <p className="app-lede">
        这里只整理你自己的观察。对方的想法，除非对方亲自说明，否则我们会保持「未知」——不猜测，也不替他下结论。
      </p>

      <section className="un-card">
        <h2 className="un-h2">双人模式暂未开放</h2>
        <p className="un-text">
          当前版本只支持单人视角：你可以记录自己的观察、认为可能存在的共同点、感受到的差异，以及尚未验证的问题。双方共同输入、授权比较、共享数据都是未来预留能力，v2 不提供。
        </p>
        <div className="un-note">缺席方的感受、需要与动机仍未知。这不是缺陷，而是对彼此边界的尊重。</div>
      </section>

      <a className="un-entry" href="/map">
        <span className="un-entry-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />
          </svg>
        </span>
        <span className="un-entry-copy">
          <h3>关系差异地图</h3>
          <p>
            {count > 0
              ? `你已记录 ${count} 条观察，全部来自你自己的视角。`
              : '查看我目前记录下来的观察与待验证问题。'}
          </p>
        </span>
        <span className="un-arrow" aria-hidden="true">
          ›
        </span>
      </a>

      <p className="app-footer-note">
        提示：记录差异时，多用「我观察到」「我感受到」，少用「他总是」「他就是」。
      </p>
    </AppShell>
  );
}
