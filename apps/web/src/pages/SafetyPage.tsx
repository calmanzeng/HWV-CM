import { useState } from 'react';
import { useAppState } from '../useWorkspace';

export default function SafetyPage() {
  const { activeEvent, updateWorkspace } = useAppState();
  const [message, setMessage] = useState('');
  const clearCurrent = () => {
    if (!activeEvent) {
      setMessage('当前没有事件记录需要清除。');
      return;
    }
    const confirmed = window.confirm('清除本机当前事件记录？此操作会删除这条事件的同意状态、叙述和整理内容，不能撤销。');
    if (!confirmed) return;
    updateWorkspace((workspace) => ({
      ...workspace,
      events: workspace.events.filter((event) => event.id !== activeEvent.id),
      activeEventId: null,
    }));
    setMessage('当前事件记录已从本机浏览器清除。');
  };
  return (
    <div className="safety-page">
      <div className="safety-head"><span className="safety-badge" aria-hidden="true">!</span><div><div className="eyebrow">你可以在这里停止</div><h1 className="safety-title">安全比完成分析重要</h1><p className="safety-lede">这条路径不会要求你当面对质、向对方解释或继续共同讨论。你不必提供更多细节。</p></div></div>
      <section className="urgent"><strong>如果你此刻面临即时危险</strong><p>请优先前往你能安全到达的公共地点，联系当地紧急服务或你信任的人。HWV-CM 不会接收求助通知，也不能替你联系外部支持。</p></section>
      <div className="safety-grid"><section className="card card-pad safety-choice"><h2>先照顾眼前安全</h2><p>如果继续使用设备会增加风险，可以现在关闭页面或换到安全设备。你不需要在这里保存说明。</p><div className="support-steps"><div className="support-step"><span className="step-mark">1</span><div><strong>离开共同分析</strong><span>当前版本不会进入共同协商、共同假设确认或共同约定。</span></div></div><div className="support-step"><span className="step-mark">2</span><div><strong>选择可信任的支持者</strong><span>联系你认为安全的人或所在地区可信的专业支持机构。</span></div></div><div className="support-step"><span className="step-mark">3</span><div><strong>谨慎使用设备</strong><span>本机存储不等于设备加密；同设备使用者仍可能看到页面、浏览器记录或下载文件。</span></div></div></div></section>
        <section className="card card-pad safety-choice"><h2>本地记录与设备提醒</h2><p>资料只保存于当前浏览器，不上传到本产品服务器；本地保存不代表设备加密，也不会自动删除浏览器历史或已导出的文件。</p><div className="rule"/><div className="support-steps"><div className="support-step"><span className="step-mark">•</span><div><strong>不继续输入</strong><span>关闭页面前不需要解释原因；你可以随时离开。</span></div></div><div className="support-step"><span className="step-mark">•</span><div><strong>需要时清除当前事件</strong><span>清理记录前先考虑设备安全和可信任的现实支持。</span></div></div><div className="support-step"><span className="step-mark">•</span><div><strong>地区资源需核验</strong><span>正式发布前应按使用地区核验官方紧急服务、热线和专业机构联系方式。</span></div></div></div></section></div>
      <div className="resource-note"><strong>本系统的边界：</strong>本页面不提供危机干预、医疗建议或实时求助服务。没有核验你所在地区前，系统不会编造电话号码或声称支持全天候可用。</div>
      {message && <div className="success-note" role="status">{message}</div>}
      <div className="safety-footer"><a className="button secondary" href="/">离开事件分析</a><a className="button quiet" href="/about#data">查看本地数据管理</a>{activeEvent && <button className="button danger" type="button" onClick={clearCurrent}>清除当前事件记录</button>}</div>
      <p className="footer-note">安全支持分支会绕过共同协商路径。任何人都可以停止；停止不需要另一方批准。</p>
    </div>
  );
}
