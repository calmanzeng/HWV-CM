import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import { read, readExtra, saveResults, storageAvailable } from '../store';

type Choice = 'fit' | 'revise' | 'unknown';
type Decision = { choice: Choice; text: string };
type SavedPossibilities = { self?: Decision; meaning?: Decision };

type TabKey = 'facts' | 'views' | 'options';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'facts', label: '事实与经过' },
  { key: 'views', label: '不同理解' },
  { key: 'options', label: '可选方向' },
];

const CHOICE_LABEL: Record<Choice, string> = {
  fit: '你已确认贴近体验',
  revise: '你已修订',
  unknown: '你保留为未知',
};

const DIRECTIONS = [
  '下次见面时，提前说明我对这件事的在意。',
  '先不处理这件事，观察一段时间。',
  '把「待验证」的问题，留到某天愿意时再核对。',
  '什么都不做——这也是一种选择。',
];

export default function ResultsScreen() {
  const [tab, setTab] = useState<TabKey>('facts');
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState('');

  const state = read();
  const draft = state.event;
  const possibilities = readExtra<SavedPossibilities>('possibilities');

  const facts = draft?.facts?.trim() ?? '';
  const disputed = draft?.disputed?.trim() ?? '';
  const feelings = draft?.feelings?.trim() ?? '';
  const needs = draft?.needs?.trim() ?? '';
  const interpretation = draft?.interpretation?.trim() ?? '';
  const hasAny = Boolean(facts || disputed || feelings || needs || interpretation);

  useEffect(() => {
    const saved = state.results;
    if (saved?.data?.confirmed) setConfirmed(true);
  }, [state.results]);

  useEffect(() => {
    if (!hasAny) return;
    if (state.results) return;
    if (!storageAvailable) {
      setStatus('当前浏览器无法保存，这份整理结果在离开后将丢失。');
      return;
    }
    saveResults({ generatedAt: new Date().toISOString(), confirmed: false });
    setStatus('整理结果已保存到本机');
  }, [hasAny, state.results]);

  function handleConfirm(next: boolean) {
    setConfirmed(next);
    if (!storageAvailable) {
      setStatus('当前浏览器无法保存确认状态');
      return;
    }
    const result = saveResults({
      generatedAt: state.results?.data?.generatedAt ?? new Date().toISOString(),
      confirmed: next,
    });
    setStatus(result.ok ? (next ? '已标记「本人已确认」' : '已取消确认') : '未能保存确认状态');
  }

  if (!hasAny) {
    return (
      <AppShell meta={ROUTES['/results']} backHref="/write-down">
        <div className="app-eyebrow">事件梳理 · 整理结果</div>
        <h1 className="app-title-lg">还没有可以整理的内容</h1>
        <p className="app-lede">
          整理结果来自你在「写下经过」里写下的内容。现在那里还是空的，先去写一点你最愿意写下的部分。
        </p>
        <div className="rs-cta">
          <a className="rs-btn rs-btn-primary" href="/write-down">
            去写下经过
          </a>
          <a className="rs-btn rs-btn-quiet" href="/">
            先回首页
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell meta={ROUTES['/results']} right={<a href="/">保存</a>}>
      <div className="app-eyebrow">事件梳理 · 整理结果</div>
      <h1 className="app-title-lg">这是给你的，不是给你的判决</h1>
      <p className="app-lede">
        下面三份材料来自你自己的叙述。所有推断都标记为「待验证假设」，不是事实。
      </p>

      <div className="rs-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? 'rs-tab rs-tab-active' : 'rs-tab'}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'facts' && (
        <section className="rs-card">
          <span className="rs-tag">以你的叙述为准</span>
          <h3 className="rs-h3">事实与经过</h3>
          {facts ? <p className="rs-text">{facts}</p> : <p className="rs-empty">你还没有写下可以核对的事实。</p>}
          {disputed && (
            <>
              <p className="rs-sub">以下内容仍有争议或尚未验证：</p>
              <p className="rs-text">{disputed}</p>
            </>
          )}
          {feelings && (
            <>
              <p className="rs-sub">你当时的感受：</p>
              <p className="rs-text">{feelings}</p>
            </>
          )}
          <p className="rs-foot">仅收录你自己写下的内容；无法确认的部分单独列出，不当作结论。</p>
        </section>
      )}

      {tab === 'views' && (
        <section className="rs-card">
          <span className="rs-tag">待验证假设</span>
          <h3 className="rs-h3">不同理解</h3>

          <p className="rs-sub">你写下的需要</p>
          <p className="rs-text">{needs || '还没有写下。'}</p>
          {possibilities?.self && <span className="rs-pill">{CHOICE_LABEL[possibilities.self.choice]}</span>}
          {possibilities?.self?.choice === 'revise' && possibilities.self.text.trim() && (
            <p className="rs-text">你的修订：{possibilities.self.text}</p>
          )}

          <p className="rs-sub">你写下的解释</p>
          <p className="rs-text">{interpretation || '还没有写下。'}</p>
          {possibilities?.meaning && (
            <span className="rs-pill">{CHOICE_LABEL[possibilities.meaning.choice]}</span>
          )}
          {possibilities?.meaning?.choice === 'revise' && possibilities.meaning.text.trim() && (
            <p className="rs-text">你的修订：{possibilities.meaning.text}</p>
          )}

          <p className="rs-foot">尚未验证：对方的真实原因与当时感受。除非对方亲自说明，否则保持未知。</p>
        </section>
      )}

      {tab === 'options' && (
        <section className="rs-card">
          <span className="rs-tag">你可以考虑，也可以不做</span>
          <h3 className="rs-h3">可选方向</h3>
          <ul className="rs-list">
            {DIRECTIONS.map((item, index) => (
              <li key={item} className="rs-list-item">
                <span className="rs-num">{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="rs-foot">这些是常见方向，不是对你的建议。做与不做都不会被记录成评分。</p>
        </section>
      )}

      <label className={confirmed ? 'rs-confirm rs-confirm-on' : 'rs-confirm'}>
        <input type="checkbox" checked={confirmed} onChange={(event) => handleConfirm(event.target.checked)} />
        <span className="rs-box" aria-hidden="true" />
        <span className="rs-confirm-text">
          我确认这份整理结果贴近我的体验。确认后才会标记「本人已确认」，也才会进入回顾与约定。
        </span>
      </label>

      {status && (
        <p className="rs-status" aria-live="polite">
          {status}
        </p>
      )}

      <div className="rs-cta">
        <a className="rs-btn rs-btn-primary" href="/agreement">
          我愿意试试一个约定
        </a>
        <a className="rs-btn rs-btn-soft" href="/reflect">
          先不约定，去回顾成长
        </a>
        <a className="rs-btn rs-btn-quiet" href="/">
          保存后离开
        </a>
      </div>

      <p className="app-footer-note">整理结果不是测评结论；不用于评分、排名或任何第三方用途。</p>
    </AppShell>
  );
}
