import { transitionEvent } from '../eventMachine';
import { useAppState } from '../useWorkspace';
import { FlowSteps } from '../components/Layout';

export default function SafetyCheckPage() {
  const { activeEvent, updateEvent } = useAppState();
  if (!activeEvent) return null;
  const chooseClear = () => {
    const next = transitionEvent(activeEvent, 'PRIVATE_INTAKE');
    updateEvent(activeEvent.id, (event) => ({ ...next, safetyDecision: 'clear' }));
    window.location.assign('/event');
  };
  const chooseSupport = () => {
    const next = transitionEvent(activeEvent, 'SAFETY_SUPPORT');
    updateEvent(activeEvent.id, (event) => ({ ...next, safetyDecision: 'support' }));
    window.location.assign('/safety');
  };
  return (
    <>
      <div className="flow-head"><div><div className="eyebrow">事件分析 · SAFETY_CHECK</div><h1 className="page-title">先确认继续整理对你是安全的</h1><p className="page-lede">这不是诊断或风险评分。请只根据你自己的感受选择；你不需要描述发生了什么。</p></div><span className="pill blue">第 2 步 / 9</span></div>
      <FlowSteps active={2}/>
      <section className="check-head"><h2 className="section-title">最近是否有以下担忧？</h2><p className="section-note">包括威胁、强制控制、报复风险或担心人身安全；也可以选择“不确定／不想回答”。</p></section>
      <div className="check-grid"><section className="card check-card safe"><h2>我目前没有这些担忧</h2><p>我愿意继续单人整理自己的叙述。此选择不会向他人发送通知，也不会代表对任何人的安全作出判断。</p><button className="button" type="button" onClick={chooseClear}>继续到私密叙述</button></section><section className="card check-card support"><h2>我有担忧，或不确定</h2><p>暂停输入并转到安全支持。无需解释原因；不会进入事实协商、假设整理或共同约定。</p><button className="button secondary" type="button" onClick={chooseSupport}>停止并查看安全支持</button></section></div>
      <div className="private-note"><strong>隐私与关键词：</strong>安全路径由你的自评决定。关键词只用于暂停并询问是否需要支持，不单独判定风险或替你选择路径。</div>
      <div className="profile-actions" style={{ marginTop: 18 }}><a className="button quiet" href="/event-consent">返回同意说明</a><a className="link" href="/">退出事件流程</a></div>
      <p className="footer-note">只有明确选择“目前没有这些担忧”才进入私密叙述。任何顾虑、不确定或不想回答都进入安全支持路径。</p>
    </>
  );
}
