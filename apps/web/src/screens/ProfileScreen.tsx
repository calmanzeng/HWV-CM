import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import {
  clearAll,
  exportText,
  isCorrupted,
  read,
  sizeBytes,
  storageAvailable,
  type StoreState,
} from '../store';

type KnowSelfSaved = { answers?: Record<string, string> };

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd} ${hh}:${mi}`;
}

function eventFieldCount(state: StoreState): number {
  if (!state.event) return 0;
  const fields = ['facts', 'disputed', 'feelings', 'needs', 'interpretation'] as const;
  return fields.filter((field) => state.event?.[field]?.trim()).length;
}

function knowSelfAnswered(state: StoreState): number {
  const saved = state.extra.knowSelf as KnowSelfSaved | undefined;
  if (!saved || !saved.answers) return 0;
  return Object.values(saved.answers).filter((value) => value.trim()).length;
}

export default function ProfileScreen() {
  const [version, setVersion] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'warn' | 'plain' }>({
    text: '',
    tone: 'plain',
  });

  const state = read();
  const observations = state.observations;
  const answered = knowSelfAnswered(state);
  const fieldCount = eventFieldCount(state);
  const updatedAt = formatTime(state.updatedAt);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function handleExport() {
    if (!storageAvailable) {
      setNotice({ text: '当前浏览器无法读取记录，无法导出。', tone: 'warn' });
      return;
    }
    const hasAny =
      Boolean(state.event) ||
      Boolean(state.results) ||
      observations.length > 0 ||
      state.agreements.length > 0 ||
      Object.keys(state.extra).length > 0;

    if (!hasAny) {
      setNotice({ text: '还没有可导出的记录。', tone: 'plain' });
      return;
    }

    try {
      const blob = new Blob([exportText()], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const stamp =
        `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}` +
        `-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `HWV-CM-导出-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNotice({ text: '已生成导出文件，由浏览器下载到你的设备。文件不上传任何服务器。', tone: 'ok' });
    } catch {
      setNotice({ text: '导出失败，浏览器可能限制了下载。', tone: 'warn' });
    }
  }

  function handleDelete() {
    const result = clearAll();
    if (result.ok) {
      setConfirming(false);
      refresh();
      setNotice({ text: '已删除。本机存储中不再保留你的记录。', tone: 'ok' });
      return;
    }
    const reason =
      result.reason === 'unavailable'
        ? '存储不可用'
        : result.reason === 'session'
          ? `会话标记未能清除（${(result.sessionKeys ?? []).join('、')}）`
          : '写入受限';
    setNotice({ text: `删除未完成（${reason}），请重试或清理浏览器存储空间后再试。`, tone: 'warn' });
  }

  return (
    <AppShell meta={ROUTES['/profile']} right={<a href="/know-self">继续探索</a>}>
      <span key={version} hidden />

      <div className="app-eyebrow">自我观察的记录</div>
      <div className="pf-head">
        <h1 className="app-title-lg" style={{ marginTop: 4 }}>
          你的档案
        </h1>
        <span className="pf-pill">仅自己可见</span>
      </div>
      <p className="app-lede">
        这里收集你在探索中留下的痕迹。它不是对你的裁定，只是你愿意记录下来的、关于自己的片段。
      </p>

      <div className="pf-stats">
        <div className="pf-card pf-stat">
          <div className="pf-stat-num">{observations.length}</div>
          <div className="pf-stat-label">观察记录</div>
        </div>
        <div className="pf-card pf-stat">
          <div className="pf-stat-num">{fieldCount}</div>
          <div className="pf-stat-label">事件草稿字段</div>
        </div>
        <div className="pf-card pf-stat">
          <div className="pf-stat-num">{state.agreements.length}</div>
          <div className="pf-stat-label">约定</div>
        </div>
      </div>
      <p className="pf-footnote">不统计「跳过」——跳过几次不该变成对你的评分。</p>

      <section className="pf-card pf-block">
        <h3 className="pf-h3">我的观察记录</h3>
        {observations.length === 0 ? (
          <p className="pf-empty">还没有记录。在「关系差异地图」添加，或在「回顾成长」确认的认识，会出现在这里。</p>
        ) : (
          <ul className="pf-list">
            {observations
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.id} className="pf-list-item">
                  <span className="pf-dot" aria-hidden="true" />
                  <div>
                    <p className="pf-list-text">{item.text}</p>
                    <span className={item.confirmed ? 'pf-pill' : 'pf-pill pf-pill-warn'}>
                      {item.confirmed ? '本人已确认' : '单次表达 · 待确认'}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="pf-card pf-block">
        <h3 className="pf-h3">价值取向</h3>
        {answered === 0 ? (
          <p className="pf-block-text">
            还没有整理。在「认识自己」里回答几个问题后，可以回来看看自己更在意什么——这只是参考，不代表你应该成为什么样的人。
          </p>
        ) : (
          <p className="pf-block-text">
            你已经在「认识自己」回答 {answered} 个问题。这些回答只是参考，不用来给你定型。
          </p>
        )}
        <div className="pf-inline-link">
          <a href="/know-self">去回答下一个问题 →</a>
        </div>
      </section>

      <section className="pf-card pf-block">
        <h3 className="pf-h3">回写说明</h3>
        <p className="pf-block-text">复盘后是否更新档案，由你主动确认。产品不会自动替你改写任何记录。</p>
        <div className="pf-callout">
          档案只保存在本机；产品内不存在任何共享路径。双人共享与授权机制为未来预留，v2 不产生。
        </div>
      </section>

      <section className="pf-card pf-block">
        <h3 className="pf-h3">数据管理</h3>
        <p className="pf-block-text">所有内容保存在这台设备的浏览器里，不会上传。你可以随时导出带走，也可以彻底删除。</p>

        {isCorrupted() && (
          <div className="pf-callout pf-callout-danger">
            <strong>检测到无法读取的记录。</strong>
            <br />
            本机保存的数据可能已损坏或来自其他版本。为保护原始内容，自动保存已暂停；你可以导出现在能读到的部分，或彻底删除后重新开始。
          </div>
        )}

        <div className="pf-meta">
          <span className="pf-pill">占用 {(sizeBytes() / 1024).toFixed(1)} KB</span>
          <span className="pf-pill">{updatedAt ? `最近保存 ${updatedAt}` : '尚未保存'}</span>
        </div>

        <div className="pf-actions">
          <button type="button" className="pf-btn pf-btn-ghost" onClick={handleExport}>
            导出为 JSON 文件
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-danger"
            onClick={() => {
              setConfirming(true);
              setNotice({ text: '删除前请再确认一次：这一步没有备份，也无法撤销。', tone: 'plain' });
            }}
          >
            删除全部记录
          </button>
        </div>

        {confirming && (
          <div className="pf-danger-zone">
            <p className="pf-danger-text">
              删除后无法恢复，也不会留下备份。事件记录、整理结果、观察记录和约定会一起消失。
            </p>
            <button type="button" className="pf-btn pf-btn-danger" onClick={handleDelete}>
              确认删除，无法恢复
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-quiet"
              onClick={() => {
                setConfirming(false);
                setNotice({ text: '已取消，什么都没有删除。', tone: 'plain' });
              }}
            >
              取消
            </button>
          </div>
        )}

        {notice.text && (
          <p
            className={
              notice.tone === 'ok'
                ? 'pf-notice pf-notice-ok'
                : notice.tone === 'warn'
                  ? 'pf-notice pf-notice-warn'
                  : 'pf-notice'
            }
            aria-live="polite"
          >
            {notice.text}
          </p>
        )}
      </section>

      <p className="app-footer-note">本机保存 · 不上传 · 不等于设备加密</p>
    </AppShell>
  );
}
