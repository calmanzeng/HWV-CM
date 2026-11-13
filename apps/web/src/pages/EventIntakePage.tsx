import { useState, type FormEvent } from 'react';
import { emptyIntake, type EventIntake } from '../domain';
import { hasSavedIntake, makeHypotheses, transitionEvent } from '../eventMachine';
import { useAppState } from '../useWorkspace';
import { FlowSteps } from '../components/Layout';

const fields: { key: keyof EventIntake; title: string; label: string; placeholder: string }[] = [
  { key: 'facts', title: '有哪些事情是你亲自看到、听到或可以核对的？', label: '可核对事实', placeholder: '例如：我们约好 18:00 见面，我在 18:30 收到消息。只写你能确认的内容。' },
  { key: 'disputed', title: '哪些内容仍有争议，或你还不确定？', label: '争议／未知', placeholder: '把说法不一致的部分标出来，也可以写“我不知道”。' },
  { key: 'interpretation', title: '你怎样理解这件事？这只是你的解释吗？', label: '我的解释', placeholder: '例如：“我把时间变化理解为不被重视。” 这不是对他人真实动机的确认。' },
];

export default function EventIntakePage() {
  const { activeEvent, updateEvent } = useAppState();
  const [error, setError] = useState('');
  if (!activeEvent) return null;
  const intake = activeEvent.intake ?? emptyIntake();
  const change = (key: keyof EventIntake, value: string) => {
    updateEvent(activeEvent.id, (event) => ({
      ...event,
      intake: { ...event.intake, [key]: value },
      status: 'PRIVATE_INTAKE',
      hypotheses: [],
    }));
  };
  const proceed = (event: FormEvent) => {
    event.preventDefault();
    if (!hasSavedIntake(intake)) {
      setError('至少写下一项你愿意整理的内容；不适合回答的问题可以留空。');
      return;
    }
    if (activeEvent.status === 'PRIVATE_INTAKE') {
      let next = transitionEvent(activeEvent, 'FACT_MAP');
      next = { ...next, hypotheses: makeHypotheses(intake) };
      next = transitionEvent(next, 'HYPOTHESES');
      updateEvent(activeEvent.id, () => next);
    } else if (!activeEvent.hypotheses.length) {
      setError('当前事件状态无法继续。请返回流程起点重新开始，或检查本机数据。');
      return;
    }
    window.location.assign('/event-map');
  };
  return (
    <>
      <div className="event-head"><div><div className="eyebrow">事件分析 · 第 3 步：私密叙述 · PRIVATE_INTAKE</div><h1 className="page-title">先把发生的事分开写</h1><p className="page-lede">这不是判断谁对谁错的流程。你可以只记录自己愿意整理的部分，跳过不适合回答的问题。</p></div><a className="button quiet" href="/">退出记录</a></div>
      <FlowSteps active={3}/>
      <div className="event-layout" style={{ marginTop: 20 }}>
        <section className="card form-card"><div className="section-head"><div><h2 className="section-title">选择记录方式</h2><p className="section-note">当前仅整理本人叙述；双人共同参与暂未开放。</p></div><span className="pill blue">默认私密</span></div>
          <div className="mode-switch"><span className="mode-option selected"><span className="radio-dot" aria-hidden="true"/>仅整理我自己的叙述</span><span className="mode-option disabled" aria-disabled="true"><span className="radio-empty" aria-hidden="true"/>双方共同参与（暂未开放）</span></div><p className="field-help">当前版本只支持单人路径；本地版本无法验证参与者身份，也未实现加密授权包。</p>
          <div className="callout"><strong>安全先于协商。</strong>如果担心记录或沟通会带来威胁、控制、报复或人身风险，请停止流程并查看安全支持。</div>
          <div className="rule"/>
          <form onSubmit={proceed} className="questions">
            {fields.map((field, index) => <div className="question" key={field.key}><div className="question-head"><span className="question-no">{String(index + 1).padStart(2, '0')}</span><p className="question-title">{field.title}</p></div><div className="form-field"><label htmlFor={field.key}>{field.label}</label><textarea className="textarea" id={field.key} value={intake[field.key]} onChange={(event) => change(field.key, event.target.value)} placeholder={field.placeholder}/></div></div>)}
            <div className="grid grid-2"><div className="form-field"><label htmlFor="feelings">我当时的感受</label><textarea className="textarea" id="feelings" value={intake.feelings} onChange={(event) => change('feelings', event.target.value)} placeholder="尽量写具体感受"/></div><div className="form-field"><label htmlFor="needs">我在意的需要</label><textarea className="textarea" id="needs" value={intake.needs} onChange={(event) => change('needs', event.target.value)} placeholder="安全感、被尊重、可预期性……也可自行填写"/></div></div>
            <div className="grid grid-2"><div className="form-field"><label htmlFor="request">我希望改变的具体行为</label><textarea className="textarea" id="request" value={intake.request} onChange={(event) => change('request', event.target.value)} placeholder="描述可观察、可讨论的行动"/></div><div className="form-field"><label htmlFor="boundary">我的边界与可协商部分</label><textarea className="textarea" id="boundary" value={intake.boundary} onChange={(event) => change('boundary', event.target.value)} placeholder="写清楚你愿意谈什么、不能接受什么"/></div></div>
            <div className="intake-note">记录来源：本人当前叙述。内容仅保存在此浏览器，不会发送到服务器，也不会把解释转成事实。</div>
            {error && <div className="error-note" role="alert">{error}</div>}
            <div className="nav-actions"><a className="button secondary" href="/">退出记录</a><button className="button" type="submit">整理事实与待验证问题</button></div>
          </form>
        </section>
        <aside className="aside-stack"><section className="card safety-card"><span className="safety-icon" aria-hidden="true">!</span><h2>这次沟通安全吗？</h2><p>如果你担心对方会看到输入内容，或可能因此遭受威胁、控制或报复，请不要启动共同流程。</p><div className="safety-links"><a href="/safety">我不确定／现在不安全 →</a><a href="/safety">查看安全支持选项 →</a></div></section><section className="single-mode"><h3>单人记录的边界</h3><p>整理结果只总结你的陈述。对方为什么这么做、怎么看待这件事，除非对方亲自提供并确认，否则都保持未知。</p></section><section className="single-mode"><h3>随时可以停止</h3><p>你可以随时退出；已输入内容会保存在此浏览器。没有任何步骤要求你联系对方或达成和解。</p></section></aside>
      </div>
      <p className="footer-note">假设确认页会要求你检查依据或纠正内容；本人逐条确认前，整理结果不可访问。</p>
    </>
  );
}
