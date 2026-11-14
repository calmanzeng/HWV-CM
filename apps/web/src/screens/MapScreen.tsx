import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import {
  addObservation,
  read,
  storageAvailable,
  type Observation,
  type ObservationCategory,
} from '../store';

const CATEGORIES: { key: ObservationCategory; label: string; hint: string }[] = [
  { key: 'common', label: '我观察到的共同点', hint: '我认为我们都…' },
  { key: 'difference', label: '我感受到的差异', hint: '我倾向…，对方似乎…' },
  { key: 'unknown', label: '尚未验证的问题', hint: '我不确定…' },
];

const GROUP_TITLES: Record<ObservationCategory, string> = {
  common: '可能存在的共同点',
  difference: '我感受到的差异',
  unknown: '尚未验证的问题',
};

function groupOf(item: Observation): ObservationCategory {
  return item.category ?? 'unknown';
}

export default function MapScreen() {
  const [version, setVersion] = useState(0);
  const [category, setCategory] = useState<ObservationCategory>('difference');
  const [text, setText] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'warn' | 'plain' }>({
    text: '',
    tone: 'plain',
  });

  const state = read();
  const observations = state.observations;
  const grouped = CATEGORIES.map((item) => ({
    ...item,
    items: observations.filter((observation) => groupOf(observation) === item.key),
  }));

  function handleSave() {
    const value = text.trim();
    if (!value) {
      setNotice({ text: '先写下一条你观察到的内容。', tone: 'warn' });
      return;
    }
    if (!storageAvailable) {
      setNotice({ text: '当前浏览器无法保存这条观察。', tone: 'warn' });
      return;
    }

    const result = addObservation(value, false, { category, source: 'map' });
    if (!result.ok) {
      setNotice({ text: '保存失败：浏览器存储不可用或已满。', tone: 'warn' });
      return;
    }
    if (result.reason === 'duplicate') {
      setNotice({ text: '这条观察已经保存过，不会重复添加。', tone: 'plain' });
      return;
    }

    setText('');
    setNotice({ text: '已保存。它仍然只是你的观察，不是双方结论。', tone: 'ok' });
    setVersion((current) => current + 1);
  }

  return (
    <AppShell meta={ROUTES['/map']}>
      <span key={version} hidden />

      <div className="app-eyebrow">关系探索 · 单人观察</div>
      <div className="map-head">
        <h1 className="app-title-lg" style={{ marginTop: 4 }}>
          我的观察
        </h1>
        <span className="map-pill">未经对方确认</span>
      </div>
      <p className="app-lede">
        以下全部来自你自己的观察与感受，不代表双方共同结论。每一条都可以修改或删除。
      </p>

      <div className="map-demo">
        <span className="map-demo-tag">说明</span>
        <span>这一页只显示你自己写下的内容，不会出现任何示例数据。</span>
      </div>

      <section className="map-card">
        <h3 className="map-h3">添加一条我自己的观察</h3>

        <div className="map-categories" role="group" aria-label="观察类别">
          {CATEGORIES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === category ? 'map-option map-option-active' : 'map-option'}
              aria-pressed={item.key === category}
              onClick={() => setCategory(item.key)}
            >
              <span className="map-radio" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="map-field">
          <label htmlFor="map-observation">我观察到 / 我感受到</label>
          <textarea
            id="map-observation"
            className="map-textarea"
            value={text}
            placeholder={
              category === 'common'
                ? '例如：我们都希望冲突后当天能把话说完。'
                : category === 'difference'
                  ? '例如：我倾向于先讲感受，对方似乎更想先讲解决办法。'
                  : '例如：我不确定对方在争执中没有回应，是不是在回避。'
            }
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <button type="button" className="map-btn map-btn-primary" onClick={handleSave}>
          保存这条观察
        </button>

        {notice.text && (
          <p
            className={
              notice.tone === 'ok'
                ? 'map-notice map-notice-ok'
                : notice.tone === 'warn'
                  ? 'map-notice map-notice-warn'
                  : 'map-notice'
            }
            aria-live="polite"
          >
            {notice.text}
          </p>
        )}
      </section>

      {observations.length === 0 ? (
        <section className="map-card">
          <h3 className="map-h3">我添加的观察</h3>
          <p className="map-empty">
            还没有添加。保存后会出现在这里，并始终标记为「待验证」。
          </p>
        </section>
      ) : (
        grouped
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section className="map-card" key={group.key}>
              <h3 className="map-h3">{GROUP_TITLES[group.key]}</h3>
              <ul className="map-list">
                {group.items
                  .slice()
                  .reverse()
                  .map((item) => (
                    <li key={item.id} className="map-list-item">
                      <span className="map-dot" aria-hidden="true" />
                      <div>
                        <p className="map-list-text">{item.text}</p>
                        <div className="map-list-source">
                          来源：本人观察 ·{' '}
                          <span className="map-pill map-pill-warn">待验证</span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ))
      )}

      <div className="map-boundary">
        <strong>边界说明：</strong>
        以上均为本人单方面观察与推测，不得表述为双方共同点或结论。若未来开放双人模式，须双方独立输入并分别授权后才能比较。
      </div>
    </AppShell>
  );
}
