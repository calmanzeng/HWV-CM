import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell';
import {
  getConsent,
  getSafety,
  setConsent,
  setSafety,
  type SafetyDecision,
} from '../store';

const OPTIONS: { key: SafetyDecision; label: string }[] = [
  { key: 'safe', label: '我现在可以安全地整理这件事' },
  { key: 'worried', label: '我有一些担忧或不确定' },
  { key: 'stop', label: '我现在不想继续（可以随时回来）' },
];

const CONFIRM_LABEL: Record<SafetyDecision, string> = {
  safe: '继续，写下经过',
  worried: '先看安全支持',
  stop: '先看安全支持',
};

export default function EventStartScreen() {
  const [accepted, setAccepted] = useState(false);
  const [choice, setChoice] = useState<SafetyDecision | null>(null);
  const safetyRef = useRef<HTMLElement | null>(null);

  const needSafety =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('need-safety') === '1';

  useEffect(() => {
    if (getConsent()) setAccepted(true);
    const saved = getSafety();
    if (saved) setChoice(saved);
  }, []);

  function handleConsent() {
    setConsent(true);
    setAccepted(true);
    window.setTimeout(() => {
      safetyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  function handleConfirm() {
    if (!choice) return;
    setSafety(choice);
    window.location.href = choice === 'safe' ? '/write-down' : '/safety';
  }

  return (
    <AppShell
      title="面对一件事"
      activeTab="event"
      backHref="/"
      right={<a href="/safety">安全支持</a>}
    >
      <div className="app-eyebrow">事件梳理 · 开始之前</div>
      <h1 className="app-title-lg">先看看这里安不安全</h1>
      <p className="app-lede">
        梳理一次具体经历，不是判对错，也不是逼你和解。开始前，请先确认两件事：你知道了什么，以及你此刻是否安全。
      </p>

      {needSafety && (
        <div className="es-callout">
          为确认你此刻是否安全，需要先在这里完成一次安全检查。这一步不能跳过，也不会替你判断。
        </div>
      )}

      <section className="es-card">
        <h2 className="es-h2">开始之前，请了解</h2>
        <ul className="es-list">
          <li>内容只保存在本机，不会上传，也不会自动分享给任何人。</li>
          <li>每一步都可以跳过、修改或退出，不会因此产生任何评价。</li>
          <li>系统整理的内容只是「待验证的假设」，不是事实，也不是对对方动机的判断。</li>
          <li>任何一步都不会要求你联系对方或达成和解。</li>
        </ul>

        <label className={accepted ? 'es-check es-check-on' : 'es-check'}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => {
              setAccepted(event.target.checked);
              setConsent(event.target.checked);
            }}
          />
          <span className="es-box" aria-hidden="true" />
          <span className="es-check-text">我已了解以上说明，并愿意继续。</span>
        </label>

        <div className="es-actions">
          <button
            type="button"
            className="es-btn es-btn-primary"
            disabled={!accepted}
            onClick={handleConsent}
          >
            {accepted ? '已了解，向下确认' : '我了解，继续'}
          </button>
          <a className="es-btn es-btn-quiet" href="/">
            暂时不开始
          </a>
        </div>
      </section>

      {accepted && (
        <section className="es-safety" ref={safetyRef}>
          <div className="es-safety-title">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 21 19H3L12 3Zm0 7v4m0 3h.01" />
            </svg>
            <span>安全检查 · 此刻的你</span>
          </div>
          <p className="es-note">哪一句更贴近你的情况？如实选择就好，没有标准答案。</p>

          <div className="es-options" role="group" aria-label="安全检查选项">
            {OPTIONS.map((option) => {
              const active = option.key === choice;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={active ? 'es-option es-option-active' : 'es-option'}
                  aria-pressed={active}
                  onClick={() => setChoice(option.key)}
                >
                  <span className="es-radio" aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="es-btn es-btn-primary"
            disabled={!choice}
            onClick={handleConfirm}
          >
            {choice ? CONFIRM_LABEL[choice] : '请先选择一项'}
          </button>

          <div className="es-warn">
            选择「有担忧或不确定」或「不想继续」时，流程会先停在安全支持页，不会推进到下一步。
          </div>

          <div className="es-steps" aria-hidden="true">
            <span className="es-step es-step-current" />
            <span className="es-step" />
            <span className="es-step" />
            <span className="es-step" />
            <span className="es-step" />
            <span className="es-step" />
            <span className="es-step" />
          </div>
          <p className="es-flow">
            流程示意：同意 → 安全检查 → 写下经过 → 理清事实 → 看见不同可能 → 本人确认 → 整理结果
          </p>
        </section>
      )}
    </AppShell>
  );
}
