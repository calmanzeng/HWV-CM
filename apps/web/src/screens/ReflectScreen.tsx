import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import {
  addObservation,
  read,
  readExtra,
  reviewSubmitId,
  saveExtra,
  storageAvailable,
} from '../store';

type Draft = { r1: string; r2: string; r3: string; r4: string };

const EMPTY: Draft = { r1: '', r2: '', r3: '', r4: '' };
const DRAFT_KEY = 'reflectDraft';

const QUESTIONS: { key: keyof Draft; no: string; title: string; placeholder: string }[] = [
  {
    key: 'r1',
    no: '01',
    title: '当初，你希望改善的是什么？',
    placeholder: '例如：我希望见面更守时，能提前说明。',
  },
  {
    key: 'r2',
    no: '02',
    title: '实际发生了什么？哪些事情有变化？',
    placeholder: '可以写有变化的，也可以写没有变化的。',
  },
  {
    key: 'r3',
    no: '03',
    title: '哪些地方仍然困难？你现在怎么看待它？',
    placeholder: '承认困难也是一种看见。',
  },
  {
    key: 'r4',
    no: '04',
    title: '这之后，你对自己有什么新的认识？',
    placeholder: '例如：我发现自己更需要提前约定，而不是临时安排。',
  },
];

export default function ReflectScreen() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [writeback, setWriteback] = useState(false);
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');

  const draftRef = useRef<Draft>(EMPTY);
  const timerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  draftRef.current = draft;

  const state = read();
  const observations = state.observations.slice(-3).reverse();
  const latestAgreement = state.agreements[state.agreements.length - 1];

  useEffect(() => {
    const saved = readExtra<Draft>(DRAFT_KEY);
    if (saved && typeof saved === 'object') {
      setDraft({ r1: saved.r1 ?? '', r2: saved.r2 ?? '', r3: saved.r3 ?? '', r4: saved.r4 ?? '' });
    }
  }, []);

  useEffect(() => {
    if (draftRef.current.r1) return;
    if (!latestAgreement?.agenda) return;
    setDraft((current) => (current.r1 ? current : { ...current, r1: latestAgreement.agenda }));
  }, [latestAgreement?.agenda]);

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

  function update(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice('');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      saveExtra(DRAFT_KEY, draftRef.current);
    }, 400);
  }

  function handleDone() {
    if (submittingRef.current) return;

    const text = draft.r4.trim();
    if (!writeback) {
      saveExtra(DRAFT_KEY, draftRef.current);
      window.location.href = '/';
      return;
    }
    if (!text) {
      setNotice('你打开了回写开关，但还没有写下新的认识。请先写一句，或关掉这个开关。');
      return;
    }
    if (!storageAvailable) {
      setNotice('当前浏览器无法保存，这条认识不会写入档案。');
      return;
    }

    submittingRef.current = true;
    const result = addObservation(text, true, { id: reviewSubmitId(), source: 'reflect' });
    submittingRef.current = false;

    if (!result.ok) {
      setNotice('写入档案失败：浏览器存储不可用或已满。你可以再试一次。');
      return;
    }
    if (result.reason === 'duplicate') {
      setNotice('这条认识已经在这次回顾里写入过档案，不会重复添加。');
      window.setTimeout(() => {
        window.location.href = '/';
      }, 900);
      return;
    }
    setStatus('已写入档案');
    window.location.href = '/profile';
  }

  return (
    <AppShell meta={ROUTES['/reflect']}>
      <div className="app-eyebrow">成长 · 复盘与记录</div>
      <h1 className="app-title-lg">看见变化，也看见困难</h1>
      <p className="app-lede">
        复盘不是打分。它只是回头看看：当初想改善什么、现在怎么样了、你自己有哪些新的认识。
      </p>

      <section className="rf-card">
        {QUESTIONS.map((question) => (
          <div key={question.key} className="rf-group">
            <div className="rf-no">{question.no}</div>
            <p className="rf-question">{question.title}</p>
            <div className="rf-field">
              <label htmlFor={`rf-${question.key}`}>{question.title}</label>
              <textarea
                id={`rf-${question.key}`}
                className="rf-textarea"
                value={draft[question.key]}
                placeholder={question.placeholder}
                onChange={(event) => update(question.key, event.target.value)}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="rf-card">
        <h3 className="rf-h3">成长记录</h3>
        {observations.length === 0 ? (
          <p className="rf-empty">还没有写入档案的认识。完成一次回顾并主动确认后，才会出现在这里。</p>
        ) : (
          <ul className="rf-list">
            {observations.map((item) => (
              <li key={item.id} className="rf-list-item">
                <span className="rf-dot" aria-hidden="true" />
                <div>
                  <p className="rf-list-text">{item.text}</p>
                  <span className={item.confirmed ? 'rf-pill' : 'rf-pill rf-pill-warn'}>
                    {item.confirmed ? '本人已确认' : '待确认'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rf-card">
        <h3 className="rf-h3">是否回写个人档案？</h3>
        <p className="rf-block-text">
          如果这次复盘让你更了解自己，可以选择把一条新的认识写进档案。这一步需要你主动确认。
        </p>

        <label className={writeback ? 'rf-switch-row rf-switch-on' : 'rf-switch-row'}>
          <span className="rf-switch-text">把新认识写入档案</span>
          <span className="rf-switch" aria-hidden="true">
            <input
              type="checkbox"
              checked={writeback}
              onChange={(event) => {
                setWriteback(event.target.checked);
                setNotice('');
              }}
            />
            <span className="rf-track" />
          </span>
        </label>

        {notice && (
          <p className="rf-notice" aria-live="polite">
            {notice}
          </p>
        )}
        {status && <p className="rf-status">{status}</p>}

        <div className="rf-callout">
          档案只保存在本机；产品内不存在任何共享路径。双人共享与授权机制为未来预留，v2 不产生。
        </div>
      </section>

      <div className="rf-actions">
        <button type="button" className="rf-btn rf-btn-primary" onClick={handleDone}>
          完成本次回顾
        </button>
        <a className="rf-btn rf-btn-soft" href="/agreement">
          回去看我的约定
        </a>
      </div>

      <p className="app-footer-note">复盘不产生评分，不评价你做得够不够好。</p>
    </AppShell>
  );
}
