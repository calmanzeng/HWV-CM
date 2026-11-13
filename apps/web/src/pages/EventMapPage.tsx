import { useEffect, useState, type FormEvent } from 'react';
import { areHypothesesConfirmed, transitionEvent } from '../eventMachine';
import type { HypothesisChoice } from '../domain';
import { useAppState } from '../useWorkspace';
import { FlowSteps } from '../components/Layout';

const choiceLabels: { value: HypothesisChoice; label: string }[] = [
  { value: 'keep', label: '贴近我的体验' },
  { value: 'revised', label: '需要修正' },
  { value: 'rejected', label: '不适用' },
];

export default function EventMapPage() {
  const { activeEvent, updateEvent } = useAppState();
  const [error, setError] = useState('');
  useEffect(() => {
    if (activeEvent?.status === 'HYPOTHESES') {
      updateEvent(activeEvent.id, (event) => transitionEvent(event, 'INDIVIDUAL_CONFIRMATION'));
    }
  }, [activeEvent?.id, activeEvent?.status, updateEvent]);
  if (!activeEvent) return null;
  const completeCount = activeEvent.hypotheses.filter((item) => item.choice !== 'pending' && (item.choice !== 'revised' || item.revision.trim())).length;
  const choose = (id: string, value: HypothesisChoice) => {
    setError('');
    updateEvent(activeEvent.id, (event) => ({
      ...event,
      hypotheses: event.hypotheses.map((item) => item.id === id ? { ...item, choice: value } : item),
      status: event.status === 'HYPOTHESES' ? 'INDIVIDUAL_CONFIRMATION' : event.status,
    }));
  };
  const revise = (id: string, value: string) => updateEvent(activeEvent.id, (event) => ({
    ...event,
    hypotheses: event.hypotheses.map((item) => item.id === id ? { ...item, revision: value } : item),
  }));
  const proceed = (event: FormEvent) => {
    event.preventDefault();
    if (!areHypothesesConfirmed(activeEvent)) {
      setError('请逐条选择保留、修正或拒绝；修正时需要写下修正内容。完成前不能进入整理选项。');
      return;
    }
    let next = activeEvent;
    if (next.status === 'HYPOTHESES') next = transitionEvent(next, 'INDIVIDUAL_CONFIRMATION');
    if (next.status === 'INDIVIDUAL_CONFIRMATION') next = transitionEvent(next, 'OPTIONS');
    if (next.status !== 'OPTIONS') {
      setError('当前流程状态无法进入整理结果。请返回前一步检查本机记录。');
      return;
    }
    updateEvent(activeEvent.id, () => next);
    window.location.assign('/report');
  };
  return (
    <>
      <div className="map-head"><div><div className="eyebrow">事件分析 · 第 6 步：本人确认 · INDIVIDUAL_CONFIRMATION</div><h1 className="page-title">先检查理解是否贴近你</h1><p className="page-lede">系统只把你的输入整理成可修正的问题。你可以确认一部分、纠正一部分，或全部拒绝。</p></div><a className="button secondary" href="/event">返回我的叙述</a></div>
      <FlowSteps active={6}/>
      <div className="map-columns"><section className="card fact-panel"><h2><span className="fact-dot"/>你提供的内容</h2>
        <div className="fact-item"><span className="fact-main">{activeEvent.intake.facts || '目前没有可核对的事实'}</span><span className="fact-caption">来源：本人叙述 · 不代表他人已确认</span></div>
        <div className="fact-item"><span className="fact-main">争议／未知：{activeEvent.intake.disputed || '目前未知'}</span><span className="fact-caption">不替任何人补全缺失信息。</span></div>
        <div className="fact-item"><span className="fact-main">感受：{activeEvent.intake.feelings || '目前未知'}</span><span className="fact-caption">只代表你自己的描述。</span></div>
      </section><section className="card fact-panel"><h2><span className="fact-dot orange"/>缺席方信息</h2><div className="quote-card"><div className="quote-label"><span>对方的解释</span><span className="pill">未知</span></div><p className="quote-text">单人模式不会代替对方发言，也不推测对方的原因、感受或动机。</p></div><div className="quote-card" style={{ marginTop: 10 }}><div className="quote-label"><span>你的解释</span><span className="pill orange">本人陈述</span></div><p className="quote-text">{activeEvent.intake.interpretation || '目前没有提供；保持未知。'}</p></div></section></div>
      <form onSubmit={proceed}><section className="hypothesis-section"><div className="section-head"><div><h2 className="section-title">待验证假设与核对问题</h2><p className="section-note">依据仅来自你的叙述；不是事实裁定、人格判断或对他人动机的推测。</p></div><span className="pill gold">已完成 {completeCount} / {activeEvent.hypotheses.length}</span></div>
        <div className="hypotheses">{activeEvent.hypotheses.map((item, index) => <article className="hypothesis" key={item.id}><span className="pill blue">待验证假设 {index + 1}</span><h3>{item.title}</h3><p>{item.prompt}</p><div className="basis"><strong>依据：</strong>{item.basis}<br/><strong>未知：</strong>{item.unknown}</div><fieldset className="hypothesis-actions"><legend>请由本人核对</legend>{choiceLabels.map((choice) => <label className="hypothesis-choice" key={choice.value}><input type="radio" name={`hypothesis-${item.id}`} checked={item.choice === choice.value} onChange={() => choose(item.id, choice.value)}/>{choice.label}</label>)}</fieldset>{item.choice === 'revised' && <div className="form-field revision-field"><label htmlFor={`revision-${item.id}`}>写下你的修正</label><textarea className="textarea" id={`revision-${item.id}`} value={item.revision} onChange={(event) => revise(item.id, event.target.value)} placeholder="按你的理解重新描述；也可以写“目前不知道”。"/></div>}</article>)}</div>
      </section>
      <section className="locked-panel" id="correction"><div><strong>{completeCount === activeEvent.hypotheses.length ? '本人确认已完成' : '整理选项保持锁定'}</strong><p>单人模式只需本人逐条确认；缺席方的期待与动机保持未知。选择只保存在此浏览器。</p></div><span className="lock-tag">{completeCount === activeEvent.hypotheses.length ? '可进入 OPTIONS' : '未确认 · OPTIONS 不可用'}</span></section>
      {error && <div className="error-note" role="alert">{error}</div>}
      <div className="profile-actions" style={{ marginTop: 18 }}><a className="button secondary" href="/safety">停止并查看安全支持</a><button className="button" type="submit" disabled={!areHypothesesConfirmed(activeEvent)}>查看整理选项</button></div></form>
      <p className="footer-note">整理选项只在本人逐条确认后开放。需要修正的条目必须先写下修正内容。</p>
    </>
  );
}
