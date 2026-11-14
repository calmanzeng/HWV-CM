import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { KNOW_SELF_QUESTIONS } from '../knowSelfQuestions';
import { readExtra, saveExtra } from '../store';

const FIELD = 'knowSelf';

type SavedKnowSelf = {
  index?: number;
  answers?: Record<string, string>;
};

function clockLabel(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function KnowSelfScreen() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('尚未填写');

  const answersRef = useRef<Record<string, string>>({});
  const indexRef = useRef(0);
  const textRef = useRef('');
  const timerRef = useRef<number | null>(null);

  indexRef.current = index;
  textRef.current = text;

  function persist(currentIndex: number, value: string): boolean {
    const question = KNOW_SELF_QUESTIONS[currentIndex];
    const answers = { ...answersRef.current };
    if (value.trim()) answers[question.id] = value;
    else delete answers[question.id];

    const res = saveExtra(FIELD, { index: currentIndex, answers });
    if (!res.ok) {
      setStatus('未能保存到本机，请检查浏览器存储');
      return false;
    }
    answersRef.current = answers;
    setStatus(`已保存 · ${clockLabel()}`);
    return true;
  }

  useEffect(() => {
    const saved = readExtra<SavedKnowSelf>(FIELD);
    if (!saved) return;

    if (saved.answers) answersRef.current = saved.answers;
    const rawIndex = typeof saved.index === 'number' ? saved.index : 0;
    const safeIndex = Math.min(Math.max(rawIndex, 0), KNOW_SELF_QUESTIONS.length - 1);
    const question = KNOW_SELF_QUESTIONS[safeIndex];
    const restored = saved.answers?.[question.id] ?? '';

    setIndex(safeIndex);
    setText(restored);
    if (restored.trim()) setStatus('已恢复上次的回答');
  }, []);

  useEffect(() => {
    function flush() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      persist(indexRef.current, textRef.current);
    }
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const question = KNOW_SELF_QUESTIONS[index];
  const isLast = index === KNOW_SELF_QUESTIONS.length - 1;

  function handleInput(value: string) {
    setText(value);
    setStatus('正在保存…');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      persist(index, value);
    }, 400);
  }

  function handleSkip() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isLast) {
      window.location.href = '/profile';
      return;
    }
    const nextIndex = index + 1;
    const nextQuestion = KNOW_SELF_QUESTIONS[nextIndex];
    setIndex(nextIndex);
    setText(answersRef.current[nextQuestion.id] ?? '');
    setStatus('已跳过这一问');
  }

  function handleSaveAndNext() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persist(index, text);
    if (isLast) {
      window.location.href = '/profile';
      return;
    }
    const nextIndex = index + 1;
    const nextQuestion = KNOW_SELF_QUESTIONS[nextIndex];
    setIndex(nextIndex);
    setText(answersRef.current[nextQuestion.id] ?? '');
  }

  return (
    <AppShell
      title="认识自己"
      activeTab="know-self"
      backHref="/"
      right={<a href="/profile">我的档案</a>}
    >
      <div className="app-eyebrow">个人探索 · 一次一问</div>
      <h1 className="app-title-lg">慢慢来，不着急</h1>
      <p className="app-lede">
        这里没有标准答案，也没有对错。你可以跳过任何问题，写下的内容只属于你，随时可以保存或修改。
      </p>

      <div className="ks-progress">
        <span>
          问题 {index + 1} / {KNOW_SELF_QUESTIONS.length}
        </span>
        <span>{status}</span>
      </div>

      <div className="ks-steps" aria-hidden="true">
        {KNOW_SELF_QUESTIONS.map((item, position) => (
          <span
            key={item.id}
            className={
              position < index
                ? 'ks-step ks-step-done'
                : position === index
                  ? 'ks-step ks-step-current'
                  : 'ks-step'
            }
          />
        ))}
      </div>

      <section className="ks-card">
        <div className="ks-no">第 {index + 1} 问</div>
        <h2 className="ks-question">{question.text}</h2>
        <p className="ks-hint">{question.hint}</p>
        <div className="ks-field">
          <label htmlFor="know-self-answer">我的想法</label>
          <textarea
            id="know-self-answer"
            className="ks-textarea"
            value={text}
            placeholder={question.placeholder}
            onChange={(event) => handleInput(event.target.value)}
          />
        </div>
        <div className="ks-skip-row">
          <button type="button" className="ks-link-button" onClick={handleSkip}>
            跳过这一问
          </button>
          <span className="ks-pill">默认私密</span>
        </div>
      </section>

      <div className="ks-actions">
        <button type="button" className="ks-btn ks-btn-primary" onClick={handleSaveAndNext}>
          {isLast ? '保存并查看档案' : '保存并继续'}
        </button>
        <a className="ks-btn ks-btn-quiet" href="/">
          暂时离开（会自动保存）
        </a>
      </div>

      <p className="app-footer-note">你的回答只保存在本机，不会用于任何评分或与他人比较。</p>
    </AppShell>
  );
}
