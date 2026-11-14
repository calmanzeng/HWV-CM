import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import {
  addAgreement,
  agreementSubmitId,
  readExtra,
  saveExtra,
  storageAvailable,
} from '../store';

const REVIEW_OPTIONS = ['一周后', '两周后', '一个月后', '我自己定时间'] as const;
const DRAFT_KEY = 'agreementDraft';

type Draft = {
  agenda: string;
  action: string;
  review: string;
  customTime: string;
};

const EMPTY: Draft = { agenda: '', action: '', review: '', customTime: '' };

export default function AgreementScreen() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const draftRef = useRef<Draft>(EMPTY);
  const timerRef = useRef<number | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    const saved = readExtra<Draft>(DRAFT_KEY);
    if (saved && typeof saved === 'object') {
      setDraft({
        agenda: saved.agenda ?? '',
        action: saved.action ?? '',
        review: saved.review ?? '',
        customTime: saved.customTime ?? '',
      });
    }
  }, []);

  useEffect(() => {
    function onLeave() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      saveExtra(DRAFT_KEY, draftRef.current);
    }
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, []);

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setNotice('');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      saveExtra(DRAFT_KEY, draftRef.current);
    }, 400);
  }

  function handleSubmit() {
    if (submitting) return;

    const agenda = draft.agenda.trim();
    if (!agenda) {
      setNotice('先写下你想改善的那件具体小事，再记下这份约定。');
      return;
    }
    if (!draft.review) {
      setNotice('请先选择回顾时间。一周后、两周后、一个月后，或你自己定一个时间。');
      return;
    }
    if (draft.review === '我自己定时间' && !draft.customTime.trim()) {
      setNotice('你选了「我自己定时间」，请写下一个时间，或换成上面几个选项。');
      return;
    }
    if (!storageAvailable) {
      setNotice('当前浏览器无法保存，这份约定不会被记录。');
      return;
    }

    setSubmitting(true);
    const result = addAgreement(
      {
        agenda,
        action: draft.action,
        reviewAt: draft.review === '我自己定时间' ? draft.customTime.trim() : draft.review,
      },
      { id: agreementSubmitId() },
    );
    setSubmitting(false);

    if (!result.ok) {
      setNotice('保存失败：浏览器存储不可用或已满。你可以再试一次。');
      return;
    }
    if (result.reason === 'duplicate') {
      setNotice('这份约定已经记录过，不会重复添加。');
      window.setTimeout(() => {
        window.location.href = '/reflect';
      }, 900);
      return;
    }
    window.location.href = '/reflect';
  }

  return (
    <AppShell meta={ROUTES['/agreement']}>
      <div className="app-eyebrow">改善 · 本人意愿记录</div>
      <h1 className="app-title-lg">你愿意尝试的改变</h1>
      <p className="app-lede">
        约定不逼你承诺，也不替对方答应任何事。这里只记录你本人的意愿——改什么、愿意怎么试、什么时候回头看。
      </p>

      <div className="ag-note">
        <strong>关于双人约定：</strong>
        v2 为单人模式，共同约定的「双方分别同意、共享与撤回」为未来预留能力。当前记录只属于你自己。
      </div>

      <section className="ag-card">
        <div className="ag-group">
          <div className="ag-no">01 · 想改善的具体事情</div>
          <p className="ag-question">哪一件具体的小事，是你愿意先试试的？</p>
          <div className="ag-field">
            <label htmlFor="ag-agenda">想改善的具体事情</label>
            <textarea
              id="ag-agenda"
              className="ag-textarea"
              value={draft.agenda}
              placeholder="例如：下次见面时，提前说明我对守时的在意。"
              onChange={(event) => update({ agenda: event.target.value })}
            />
          </div>
        </div>

        <div className="ag-group">
          <div className="ag-no">02 · 我愿意尝试的行动</div>
          <p className="ag-question">为了这件事，你愿意做的一个具体动作是什么？</p>
          <div className="ag-field">
            <label htmlFor="ag-action">我愿意尝试的行动</label>
            <textarea
              id="ag-action"
              className="ag-textarea"
              value={draft.action}
              placeholder="例如：我会在见面时用「我希望」开头，说出我的需要。"
              onChange={(event) => update({ action: event.target.value })}
            />
          </div>
        </div>

        <div className="ag-group">
          <div className="ag-no">03 · 回顾时间</div>
          <p className="ag-question">什么时候回来看看做得怎么样？</p>
          <div className="ag-options" role="group" aria-label="回顾时间">
            {REVIEW_OPTIONS.map((option) => {
              const active = draft.review === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={active ? 'ag-option ag-option-active' : 'ag-option'}
                  aria-pressed={active}
                  onClick={() => update({ review: option })}
                >
                  <span className="ag-radio" aria-hidden="true" />
                  {option}
                </button>
              );
            })}
          </div>

          {draft.review === '我自己定时间' && (
            <div className="ag-field">
              <label htmlFor="ag-custom-time">我想在什么时候回来看</label>
              <input
                id="ag-custom-time"
                className="ag-input"
                type="text"
                value={draft.customTime}
                placeholder="例如：这个月底，或某天我愿意的时候"
                onChange={(event) => update({ customTime: event.target.value })}
              />
            </div>
          )}
        </div>

        <div className="ag-group">
          <div className="ag-no">04 · 修改或结束的方式</div>
          <p className="ag-question">这份约定随时可以修改或结束，你决定即可。</p>
          <div className="ag-callout">没有「坚持到底」的义务。改变不需要一次做到完美。</div>
        </div>
      </section>

      {notice && (
        <p className="ag-notice" aria-live="polite">
          {notice}
        </p>
      )}

      <div className="ag-actions">
        <button type="button" className="ag-btn ag-btn-primary" onClick={handleSubmit}>
          记下来了，去回顾成长
        </button>
        <a className="ag-btn ag-btn-quiet" href="/results">
          暂不记录
        </a>
      </div>
    </AppShell>
  );
}
