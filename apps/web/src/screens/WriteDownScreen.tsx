import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell';
import {
  getSafety,
  read,
  saveEvent,
  storageAvailable,
  type EventField,
} from '../store';

type Draft = Record<EventField, string>;

const EMPTY: Draft = {
  facts: '',
  disputed: '',
  feelings: '',
  needs: '',
  interpretation: '',
};

const FIELDS: { key: EventField; no: string; question: string; placeholder: string }[] = [
  {
    key: 'facts',
    no: '01 · 可以核对的事实',
    question: '有哪些事情是你亲自看到、听到或可以核对的？',
    placeholder: '例如：我们约好 18:00 见面，对方 18:30 到达。只写你能确认的部分。',
  },
  {
    key: 'disputed',
    no: '02 · 争议或未知',
    question: '哪些内容还有争议，或你还不确定？',
    placeholder: '把双方说法不一致的地方标出来，也可以写「我不知道」。',
  },
  {
    key: 'feelings',
    no: '03 · 我当时的感受',
    question: '你当时的感受是什么？',
    placeholder: '尽量写具体的感受，例如：失落、被忽略、担心……',
  },
  {
    key: 'needs',
    no: '03 · 我在意的需要',
    question: '你在意的是什么？',
    placeholder: '我在意的需要：被尊重、安全感、可预期……也可以留空',
  },
  {
    key: 'interpretation',
    no: '04 · 我的解释（不是事实）',
    question: '你怎样理解对方的行为？这只是你的理解。',
    placeholder: '例如：「我把迟到理解为不被重视。」这不等同于对方的真实动机。',
  },
];

function clockLabel(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function WriteDownScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState('仅保存在本机');
  const [warn, setWarn] = useState(false);

  const draftRef = useRef<Draft>(EMPTY);
  const timerRef = useRef<number | null>(null);

  draftRef.current = draft;

  useEffect(() => {
    if (getSafety() !== 'safe') {
      window.location.replace('/event-start?need-safety=1');
      setAllowed(false);
      return;
    }
    setAllowed(true);

    if (!storageAvailable) {
      setWarn(true);
      setStatus('本页内容不会保存');
      return;
    }

    const state = read();
    if (state.event) {
      const restored: Draft = { ...EMPTY };
      for (const field of FIELDS) {
        const value = state.event[field.key];
        if (typeof value === 'string') restored[field.key] = value;
      }
      setDraft(restored);
      if (Object.values(restored).some((value) => value.trim())) {
        setStatus(`已恢复上次保存的内容 · ${clockLabel()}`);
      }
    }
  }, []);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      // BFCache 恢复不会重新挂载组件，必须在这里重新校验安全状态
      if (getSafety() !== 'safe') {
        window.location.replace('/event-start?need-safety=1');
      }
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  function flush(): boolean {
    const result = saveEvent(draftRef.current);
    if (result.ok) {
      setStatus(`已保存到本机 · ${clockLabel()}`);
      return true;
    }
    setWarn(true);
    setStatus('未能保存（浏览器存储不可用或已满）');
    return false;
  }

  useEffect(() => {
    function onLeave() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      saveEvent(draftRef.current);
    }
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, []);

  function handleChange(key: EventField, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus('正在保存…');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      flush();
    }, 400);
  }

  function goNext(href: string) {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    flush();
    window.location.href = href;
  }

  if (allowed !== true) {
    return (
      <AppShell title="写下经过" activeTab="event" backHref="/event-start">
        <p className="wd-guard">
          {allowed === false ? '正在前往安全检查…' : '正在确认安全检查状态…'}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="写下经过"
      activeTab="event"
      backHref="/event-start"
      right={<a href="/">退出</a>}
    >
      <div className="app-eyebrow">事件梳理 · 私密叙述</div>
      <h1 className="app-title-lg">先把发生的事，分开写</h1>
      <p className="app-lede">
        不用写得好，也不用写得全。只记录你愿意整理的部分，不确定的地方可以写「我不知道」。
      </p>

      {warn && (
        <div className="wd-warn">
          当前浏览器无法保存内容（可能处于隐私模式或已禁用本地存储）。本页写下的内容在离开后将丢失。
        </div>
      )}

      <div className="wd-steps" aria-hidden="true">
        <span className="wd-step wd-step-done" />
        <span className="wd-step wd-step-done" />
        <span className="wd-step wd-step-current" />
        <span className="wd-step" />
        <span className="wd-step" />
        <span className="wd-step" />
      </div>

      <section className="wd-card">
        {FIELDS.slice(0, 2).map((field) => (
          <div key={field.key} className="wd-group">
            <div className="wd-no">{field.no}</div>
            <p className="wd-question">{field.question}</p>
            <div className="wd-field">
              <label htmlFor={`wd-${field.key}`}>{field.question}</label>
              <textarea
                id={`wd-${field.key}`}
                className="wd-textarea"
                value={draft[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => handleChange(field.key, event.target.value)}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="wd-card">
        {FIELDS.slice(2).map((field) => (
          <div key={field.key} className="wd-group">
            <div className="wd-no">{field.no}</div>
            <p className="wd-question">{field.question}</p>
            <div className="wd-field">
              <label htmlFor={`wd-${field.key}`}>{field.question}</label>
              <textarea
                id={`wd-${field.key}`}
                className="wd-textarea"
                value={draft[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => handleChange(field.key, event.target.value)}
              />
            </div>
          </div>
        ))}
        <div className="wd-legend">
          写完后会请你分辨：哪些是「我看到的事实」，哪些是「我的解释」——两者分开，是这一步的全部意义。
        </div>
      </section>

      <div className="wd-actions">
        <button type="button" className="wd-btn wd-btn-primary" onClick={() => goNext('/possibilities')}>
          写好了，继续
        </button>
        <button type="button" className="wd-btn wd-btn-quiet" onClick={() => goNext('/')}>
          先保存，稍后再写
        </button>
      </div>

      <p className="wd-status" aria-live="polite">
        {status}
      </p>
      <p className="app-footer-note">
        记录只保存在本机；「感受与需要」会作为你叙述的一部分被保留，不会被当作事实或评分依据。
      </p>
    </AppShell>
  );
}
