import { AppShell } from '../components/AppShell';
import { hasContent, read } from '../store';

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function clockLabel(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const ICON_SELF = (
  <>
    <circle cx="12" cy="7" r="3.2" />
    <path d="M5.5 20c.5-3.4 2.7-5.2 6.5-5.2s6 1.8 6.5 5.2" />
  </>
);

const ICON_TOGETHER = (
  <>
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="15" r="3" />
    <path d="M10.2 11.2 13.8 13.8M14.5 5.5h4v4M5.5 17.5v-3" />
  </>
);

const ICON_EVENT = <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h4" />;

const ICON_AGREEMENT = <path d="M8 12.5 10.5 15 16 9.5M20 7v12H4V7l8-3 8 3Z" />;

const ICON_REFLECT = <path d="M4 5h16M6 3v4m12-4v4M5 9h14v11H5zM8 14h3m-3 3h7" />;

export default function HomeScreen() {
  const state = read();
  const hasRecord = hasContent(state);
  const savedAt = clockLabel(state.updatedAt);

  const now = new Date();
  const dateText = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEK[now.getDay()]}`;

  return (
    <AppShell title="首页" activeTab="home">
      <section className="home-greeting">
        <div className="home-date">{dateText}</div>
        <h1 className="home-h1">今天想从哪里开始？</h1>
        <p className="home-lede">
          这里是一间只属于你的小房间。不评价、不打分，只陪你把自己慢慢理清楚。你可以随时离开，也可以随时回来。
        </p>
      </section>

      <a
        className="home-card home-resume"
        href={hasRecord ? '/write-down' : '/event-start'}
      >
        <span className="home-resume-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
          </svg>
        </span>
        <span className="home-resume-body">
          <span className="home-resume-label">
            {hasRecord ? '接着上次' : '还没有保存的记录'}
          </span>
          <h3 className="home-resume-title">
            {hasRecord ? '继续梳理这件事' : '从一次具体的事开始'}
          </h3>
          <p className="home-resume-note">
            {hasRecord
              ? `上次保存于 ${savedAt}；继续前会再确认一次你此刻是否安全。`
              : '先做一次安全检查，再写下你想整理的部分。'}
          </p>
        </span>
        <span className="home-arrow" aria-hidden="true">
          ›
        </span>
      </a>

      <section className="home-entries" aria-label="五个体验入口">
        <a className="home-entry" href="/know-self">
          <span className="home-entry-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICON_SELF}
            </svg>
          </span>
          <span className="home-entry-copy">
            <h3>认识自己</h3>
            <p>一次一个小问题，慢慢靠近当下对自己重要的事。</p>
          </span>
          <span className="home-arrow" aria-hidden="true">
            ›
          </span>
        </a>

        <a className="home-entry" href="/understand">
          <span className="home-entry-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICON_TOGETHER}
            </svg>
          </span>
          <span className="home-entry-copy">
            <h3>理解彼此</h3>
            <p>整理你观察到的共同点与差异，不猜测对方的想法。</p>
          </span>
          <span className="home-arrow" aria-hidden="true">
            ›
          </span>
        </a>

        <a className="home-entry" href="/event-start">
          <span className="home-entry-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICON_EVENT}
            </svg>
          </span>
          <span className="home-entry-copy">
            <h3>面对一件事</h3>
            <p>从一次具体经历出发，把事实、解释、感受和需要分开。</p>
          </span>
          <span className="home-arrow" aria-hidden="true">
            ›
          </span>
        </a>

        <a className="home-entry" href="/agreement">
          <span className="home-entry-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICON_AGREEMENT}
            </svg>
          </span>
          <span className="home-entry-copy">
            <h3>一起改善</h3>
            <p>记下你愿意尝试的改变，约定只是你本人的意愿记录。</p>
          </span>
          <span className="home-arrow" aria-hidden="true">
            ›
          </span>
        </a>

        <a className="home-entry" href="/reflect">
          <span className="home-entry-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICON_REFLECT}
            </svg>
          </span>
          <span className="home-entry-copy">
            <h3>回顾成长</h3>
            <p>回看变化与仍然困难的地方，决定是否更新个人档案。</p>
          </span>
          <span className="home-arrow" aria-hidden="true">
            ›
          </span>
        </a>
      </section>

      <div className="home-note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 21 19H3L12 3Zm0 6v4m0 3h.01" />
        </svg>
        <span>
          <strong>关于隐私：</strong>
          你的内容只保存在这部设备的浏览器里，不会上传，也不是加密存储。双人共享与云端同步为未来预留，v2
          不产生。
        </span>
      </div>

      <p className="app-footer-note">研究原型 · 不提供心理诊断、人格裁定或关系结果预测</p>
    </AppShell>
  );
}
