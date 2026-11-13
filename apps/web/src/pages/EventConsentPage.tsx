import { useState, type FormEvent } from 'react';
import { createEvent } from '../domain';
import { transitionEvent } from '../eventMachine';
import { useAppState } from '../useWorkspace';
import { FlowSteps } from '../components/Layout';

export default function EventConsentPage() {
  const { updateWorkspace } = useAppState();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const begin = (event: FormEvent) => {
    event.preventDefault();
    if (!accepted) {
      setError('请先确认已了解用途，再继续。');
      return;
    }
    const created = createEvent();
    const transitioned = transitionEvent(created, 'SAFETY_CHECK');
    const prepared = { ...transitioned, consentAcceptedAt: new Date().toISOString() };
    updateWorkspace((current) => ({ ...current, events: [...current.events, prepared], activeEventId: prepared.id }));
    window.location.assign('/event-safety-check');
  };
  return (
    <>
      <div className="flow-head"><div><div className="eyebrow">事件分析 · CONSENT</div><h1 className="page-title">先了解用途，再决定是否继续</h1><p className="page-lede">这条流程只整理你自己的叙述，不替缺席的人推测动机，也不判断谁对谁错。</p></div><span className="pill blue">第 1 步 / 9</span></div>
      <FlowSteps active={1}/>
      <div className="consent-layout">
        <section className="card consent-card"><h2>这次整理会做什么</h2><p>你可以在任何一步停止。输入内容只保存在此浏览器，不会发送到本产品服务器。</p>
          <ul className="consent-points"><li><strong>目的：</strong>把你提供的事实、解释、感受、需要和边界分开呈现。</li><li><strong>范围：</strong>当前只开放单人整理；不会自动把个人档案带入事件，也不会联系或通知他人。</li><li><strong>限制：</strong>所有解释都只是待验证假设；本工具不提供心理诊断、危机响应或关系结果预测。</li><li><strong>退出：</strong>你可以跳过问题或离开流程。若担心威胁、控制、报复或人身安全，请在下一步选择安全支持。</li></ul>
          <form onSubmit={begin}><label className="consent-check"><input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); setError(''); }}/><span>我已了解这是尚未验证的本地研究原型，并自愿继续进行单人反思整理。</span></label>{error && <div className="error-note" role="alert">{error}</div>}<div className="consent-actions"><button className="button" type="submit">同意并前往安全自评</button><a className="button secondary" href="/">暂不继续</a></div></form>
        </section>
        <aside><section className="card side-card"><span className="status-label">暂未开放</span><h2>双方共同参与</h2><p>本机页面无法核验谁在操作，也没有加密授权包和安全的密钥交接。双人共享暂未开放；关系页仅展示差异地图样式。</p><a className="button secondary" href="/relationship">查看关系页示意</a></section><section className="card side-card"><h2>还不确定？</h2><p>你不必在这里提供更多细节。遇到任何安全顾虑或不确定时，可以直接离开事件流程查看支持选项。</p><a className="link" href="/safety">查看安全支持 →</a></section></aside>
      </div>
      <p className="footer-note">同意页与安全自评是独立流程门槛。产品会记录同意时间；你可以随时停止。</p>
    </>
  );
}
