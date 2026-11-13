import { useMemo, useState, type FormEvent } from 'react';
import { domains, type PersonalFollowUp } from '../domain';
import { transitionEvent } from '../eventMachine';
import { useAppState } from '../useWorkspace';

const defaultFollowUp: Omit<PersonalFollowUp, 'savedAt'> = {
  actionStatus: 'skip',
  safetyStatus: 'skip',
  reflection: '',
  writebackText: '',
  writebackConstructId: 'E.repair',
};

export default function FollowUpPage() {
  const { activeEvent, updateEvent, updateProfile } = useAppState();
  const readyEvent = activeEvent?.status === 'OPTIONS' ? activeEvent : undefined;
  const stored = readyEvent?.personalFollowUp;
  const [actionStatus, setActionStatus] = useState<PersonalFollowUp['actionStatus']>(stored?.actionStatus ?? 'skip');
  const [safetyStatus, setSafetyStatus] = useState<PersonalFollowUp['safetyStatus']>(stored?.safetyStatus ?? 'skip');
  const [reflection, setReflection] = useState(stored?.reflection ?? '');
  const [writebackText, setWritebackText] = useState(stored?.writebackText ?? '');
  const [writebackConstructId, setWritebackConstructId] = useState(stored?.writebackConstructId ?? 'E.repair');
  const [confirmWriteback, setConfirmWriteback] = useState(false);
  const [message, setMessage] = useState('');
  const constructs = useMemo(() => domains.flatMap((domain) => domain.constructs.map((item) => ({ ...item, domainId: domain.id }))), []);

  const saveReflection = (event: FormEvent) => {
    event.preventDefault();
    if (!readyEvent) {
      setMessage('请先完成一次单人事件整理，再记录个人复盘。');
      return;
    }
    const followUp: PersonalFollowUp = {
      ...(stored ?? defaultFollowUp),
      actionStatus,
      safetyStatus,
      reflection: reflection.trim(),
      writebackText: writebackText.trim(),
      writebackConstructId,
      savedAt: new Date().toISOString(),
      writebackConfirmedAt: stored?.writebackConfirmedAt,
    };
    updateEvent(readyEvent.id, (current) => ({ ...current, personalFollowUp: followUp }));
    setMessage('个人复盘已保存在此浏览器；这不表示他人同意任何方案。');
  };

  const commitWriteback = () => {
    if (!readyEvent || !stored) {
      setMessage('请先保存个人复盘，再单独确认档案回写。');
      return;
    }
    if (!writebackText.trim()) {
      setMessage('请先写下要回写的具体内容。');
      return;
    }
    if (!confirmWriteback) {
      setMessage('请勾选确认，才会把这条观察写入个人档案。');
      return;
    }
    if (stored.writebackConfirmedAt) {
      setMessage('这条复盘已回写过，避免重复写入。');
      return;
    }
    const now = new Date().toISOString();
    updateProfile((profile) => ({
      ...profile,
      observations: [...profile.observations, {
        id: crypto.randomUUID(),
        constructId: writebackConstructId,
        text: writebackText.trim(),
        source: '本人确认的事件反思',
        createdAt: now,
        confirmed: true,
        uncertainty: '来自单次事件反思；不代表稳定人格特征',
      }],
    }));
    updateEvent(readyEvent.id, (event) => ({ ...event, personalFollowUp: { ...(event.personalFollowUp ?? stored), writebackText: writebackText.trim(), writebackConstructId, writebackConfirmedAt: now } }));
    setConfirmWriteback(false);
    setMessage('已按你的确认写入个人档案；来源与不确定性一并保留。');
  };

  const reportNewHarm = () => {
    const now = new Date().toISOString();
    setSafetyStatus('harm');
    if (activeEvent?.consentAcceptedAt) {
      updateEvent(activeEvent.id, (event) => ({
        ...transitionEvent(event, 'SAFETY_SUPPORT'),
        safetyDecision: 'support',
        personalFollowUp: {
          ...(event.personalFollowUp ?? defaultFollowUp),
          actionStatus,
          safetyStatus: 'harm',
          reflection: reflection.trim(),
          writebackText: writebackText.trim(),
          writebackConstructId,
          savedAt: now,
        },
      }));
    }
    window.location.assign('/safety');
  };

  return (
    <>
      <div className="follow-head"><div><div className="eyebrow">反馈与复盘 · 个人路径</div><h1 className="page-title">个人复盘与档案回写</h1><p className="page-lede">此页不创建共同约定。复盘只记录你自己的行动和感受，只有再次确认后才写入档案。</p></div><a className="button secondary" href={readyEvent ? '/report' : '/'}>{readyEvent ? '返回整理结果' : '返回首页'}</a></div>
      <div className="follow-grid"><section><div className="section-head"><div><h2 className="section-title">共同约定暂未开放</h2><p className="section-note">未来功能示意，不代表已有约定或双方同意。</p></div><span className="pill gold">未来功能示意</span></div>
        <article className="card agreement"><div className="agreement-top"><div><h2>示例选项：预计迟到时更新到达时间</h2><p>单人提出的待讨论选项：若双方分别自愿确认，可试行“可能晚到超过 10 分钟时发送预计到达时间”；另一方可选择是否继续等待。</p></div><span className="pill">示意</span></div><div className="agreement-meta"><span className="pill">需双方分别自愿确认后方可试行</span><span className="pill">复盘示例：一周后</span><span className="pill">非真实共同约定</span></div><p className="field-help" style={{ marginTop: 12 }}>当前单人版本不会创建、保存或追踪双方约定。</p></article>
        <div className="agreement-empty" style={{ marginTop: 13 }}>此处没有已确认的共同约定。你可以记录个人复盘，但这不代表另一方同意、参与或履约。</div>
      </section>
      <form className="card review-form" id="review" onSubmit={saveReflection}><div className="section-head"><div><h2 className="section-title">我的个人复盘</h2><p className="section-note">仅保存在你的浏览器；不记录对方是否履约。</p></div></div>
        {!readyEvent && <div className="error-note">完成事件整理后，可以在这里记录与自己有关的复盘。</div>}
        <div className="review-question"><strong>你对自己准备尝试的行动，进展如何？</strong><div className="review-options">{[['done', '已尝试'], ['partial', '部分尝试'], ['not-done', '尚未尝试'], ['skip', '不想回答']].map(([value, label]) => <label className="review-option" key={value}><input type="radio" name="actionStatus" value={value} checked={actionStatus === value} onChange={() => setActionStatus(value as PersonalFollowUp['actionStatus'])}/>{label}</label>)}</div></div>
        <div className="review-question"><strong>这段时间你的安全感或压力有什么变化？</strong><div className="review-options">{[['safer', '更安全'], ['pressure', '压力增加'], ['uncertain', '不确定'], ['skip', '不想回答']].map(([value, label]) => <label className="review-option" key={value}><input type="radio" name="safetyStatus" value={value} checked={safetyStatus === value} onChange={() => setSafetyStatus(value as PersonalFollowUp['safetyStatus'])}/>{label}</label>)}<button className="review-option button-like" type="button" onClick={reportNewHarm}>出现新的伤害 · 转安全支持</button></div><a className="link" href="/safety" style={{ display: 'inline-block', marginTop: 10 }}>需要安全支持 →</a></div>
        <div className="form-field"><label htmlFor="reflection-text">我想补充的个人复盘</label><textarea className="textarea" id="reflection-text" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="可选。只写自己的感受、行动或新的理解。"/></div>
        <div className="profile-actions" style={{ marginTop: 16 }}><button className="button" type="submit" disabled={!readyEvent}>保存个人复盘</button></div>
        {message && <div className="success-note" role="status">{message}</div>}
        <div className="rule"/><div className="writeback"><h3>档案回写需要再次确认</h3><p>复盘不会自动更新个人认知档案。先保存复盘，再逐字检查准备写入的内容，并再次明确确认。</p>
          <div className="form-field" style={{ marginTop: 12 }}><label htmlFor="writeback-construct">关联候选构念</label><select className="select" id="writeback-construct" value={writebackConstructId} onChange={(event) => setWritebackConstructId(event.target.value)}>{constructs.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.domainId}</option>)}</select></div>
          <div className="form-field" style={{ marginTop: 10 }}><label htmlFor="writeback-text">准备写入个人档案的内容</label><textarea className="textarea" id="writeback-text" value={writebackText} onChange={(event) => setWritebackText(event.target.value)} placeholder="写下可被你日后修正或删除的观察。"/></div>
          <label className="consent-check" style={{ marginTop: 12 }}><input type="checkbox" checked={confirmWriteback} onChange={(event) => setConfirmWriteback(event.target.checked)}/><span>我已检查上面的内容，并确认将它作为“本人确认的事件反思”加入个人档案。</span></label>
          <div className="profile-actions" style={{ marginTop: 14 }}><button className="button secondary" type="button" onClick={() => setConfirmWriteback(false)}>暂不回写</button><button className="button" type="button" disabled={!stored || Boolean(stored.writebackConfirmedAt)} onClick={commitWriteback}>确认回写</button></div>
          {stored?.writebackConfirmedAt && <p className="field-help">已于 {new Date(stored.writebackConfirmedAt).toLocaleString('zh-CN')} 回写；为避免重复提交，回写操作已锁定。</p>}
        </div>
      </form></div>
      <p className="footer-note">任何回写都保留事件来源与确认时间；单次观察不会自动扩展成稳定人格结论。</p>
    </>
  );
}
