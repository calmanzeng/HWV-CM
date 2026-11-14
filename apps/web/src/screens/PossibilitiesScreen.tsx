import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import { read, readExtra, saveExtra, storageAvailable } from '../store';

type Choice = 'fit' | 'revise' | 'unknown';

type Decision = {
  choice: Choice;
  text: string;
};

type SavedPossibilities = {
  self?: Decision;
  meaning?: Decision;
};

const SAVED_KEY = 'possibilities';

export default function PossibilitiesScreen() {
  const [self, setSelf] = useState<Decision | null>(null);
  const [meaning, setMeaning] = useState<Decision | null>(null);
  const [notice, setNotice] = useState('');

  const state = read();
  const needs = state.event?.needs?.trim() ?? '';
  const interpretation = state.event?.interpretation?.trim() ?? '';

  useEffect(() => {
    const saved = readExtra<SavedPossibilities>(SAVED_KEY);
    if (!saved) return;
    if (saved.self) setSelf(saved.self);
    if (saved.meaning) setMeaning(saved.meaning);
  }, []);

  function persist(nextSelf: Decision | null, nextMeaning: Decision | null) {
    if (!storageAvailable) {
      setNotice('当前无法保存到本机，选择不会被记住。');
      return;
    }
    const result = saveExtra(SAVED_KEY, { self: nextSelf, meaning: nextMeaning });
    if (!result.ok) setNotice('选择未能保存到本机，请稍后再试。');
    else setNotice('');
  }

  function update(key: 'self' | 'meaning', decision: Decision | null) {
    if (key === 'self') {
      setSelf(decision);
      persist(decision, meaning);
    } else {
      setMeaning(decision);
      persist(self, decision);
    }
  }

  function handleConfirm() {
    const reviseEmpty =
      (self?.choice === 'revise' && !self.text.trim()) ||
      (meaning?.choice === 'revise' && !meaning.text.trim());

    if (reviseEmpty) {
      setNotice('你有一条假设选了「我想修改」，但修改内容还是空的。请写一句，或改选「保留为未知」。');
      return;
    }
    if (!self || !meaning) {
      setNotice('请先为两条假设分别做出选择。选「保留为未知」也算明确的选择。');
      return;
    }
    if (!storageAvailable) {
      setNotice('当前无法把选择保存到本机，先不生成整理结果。');
      return;
    }
    const result = saveExtra(SAVED_KEY, { self, meaning });
    if (!result.ok) {
      setNotice('选择保存失败，先不生成整理结果。');
      return;
    }
    window.location.href = '/results';
  }

  const cards = [
    {
      key: 'self' as const,
      title: '这次事件里，什么需要对我比较重要？',
      quote: needs,
      quoteLabel: '你写下的需要',
      fitLabel: '贴近我的体验',
      emptyHint: '你在「写下经过」里还没有写「我在意的需要」，可以先回去补一句，或直接选「保留为未知」。',
    },
    {
      key: 'meaning' as const,
      title: '我的解释，是否准确表达了当时的理解？',
      quote: interpretation,
      quoteLabel: '你写下的解释',
      fitLabel: '这是我的理解',
      emptyHint: '你在「写下经过」里还没有写「我的解释」，可以先回去补一句，或直接选「保留为未知」。',
    },
  ];

  return (
    <AppShell meta={ROUTES['/possibilities']} right={<a href="/">退出</a>}>
      <div className="app-eyebrow">事件梳理 · 不同理解</div>
      <h1 className="app-title-lg">这些只是「可能」，不是结论</h1>
      <p className="app-lede">
        下面两条来自你在「写下经过」里写下的内容。请逐条看过：它贴近你的体验吗？需要修改吗？还是保留为未知？
      </p>

      {cards.map((card) => {
        const decision = card.key === 'self' ? self : meaning;
        const choice = decision?.choice ?? null;
        return (
          <section className="hp-card" key={card.key}>
            <h3 className="hp-title">{card.title}</h3>
            <div className="hp-basis">
              {card.quote ? (
                <>
                  {card.quoteLabel}是：
                  <strong>「{card.quote}」</strong>
                  <br />
                  这是否贴近你的体验？
                </>
              ) : (
                card.emptyHint
              )}
            </div>
            <p className="hp-unknown">缺席方的感受、需要与动机仍未知——除非对方亲自说明。</p>

            <div className="hp-actions">
              <button
                type="button"
                className={choice === 'fit' ? 'hp-option hp-option-active' : 'hp-option'}
                aria-pressed={choice === 'fit'}
                onClick={() => update(card.key, { choice: 'fit', text: decision?.text ?? '' })}
              >
                <span className="hp-radio" aria-hidden="true" />
                {card.fitLabel}
              </button>

              <button
                type="button"
                className={choice === 'revise' ? 'hp-option hp-option-active' : 'hp-option'}
                aria-pressed={choice === 'revise'}
                onClick={() => update(card.key, { choice: 'revise', text: decision?.text ?? '' })}
              >
                <span className="hp-radio" aria-hidden="true" />
                不完全贴切，我想修改
              </button>

              {choice === 'revise' && (
                <div className="hp-field">
                  <label htmlFor={`rev-${card.key}`}>写下更贴切的表达</label>
                  <textarea
                    id={`rev-${card.key}`}
                    className="hp-textarea"
                    value={decision?.text ?? ''}
                    placeholder="写下更贴切的表达……"
                    onChange={(event) => update(card.key, { choice: 'revise', text: event.target.value })}
                  />
                </div>
              )}

              <button
                type="button"
                className={choice === 'unknown' ? 'hp-option hp-option-active' : 'hp-option'}
                aria-pressed={choice === 'unknown'}
                onClick={() => update(card.key, { choice: 'unknown', text: '' })}
              >
                <span className="hp-radio" aria-hidden="true" />
                保留为未知，不整理
              </button>
            </div>
          </section>
        );
      })}

      <div className="hp-note">
        只有当你确认上面的说法（或明确保留为未知）后，才会生成三份整理结果。修改后的内容会标记为你本人的修订。
      </div>

      {notice && (
        <p className="hp-notice" aria-live="polite">
          {notice}
        </p>
      )}

      <div className="hp-cta">
        <button type="button" className="hp-btn hp-btn-primary" onClick={handleConfirm}>
          我确认过了，生成整理结果
        </button>
        <a className="hp-btn hp-btn-quiet" href="/write-down">
          回上一步修改叙述
        </a>
      </div>
    </AppShell>
  );
}
