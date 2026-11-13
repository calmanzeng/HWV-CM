import { getActiveEvent } from '../domain';
import { useAppState } from '../useWorkspace';

export default function ReportPage() {
  const { workspace, activeEvent } = useAppState();
  if (!activeEvent) return null;
  const eventIndex = workspace.events.findIndex((item) => item.id === activeEvent.id) + 1;
  const dataRows = [
    ['本人记录的事实', activeEvent.intake.facts || '目前没有足够资料', '来源：本人当前叙述；未由他人核实。'],
    ['仍有争议', activeEvent.intake.disputed || '目前没有标注的争议；不代表双方一致。', '未知内容保持未知，不作裁定。'],
    ['本人的解释', activeEvent.intake.interpretation || '目前没有提供解释。', '解释不是对缺席方动机的证明。'],
    ['本人的感受', activeEvent.intake.feelings || '目前没有提供感受。', '来源：本人当前叙述。'],
    ['本人的需要', activeEvent.intake.needs || '目前没有提供需要。', '来源：本人当前叙述。'],
    ['具体请求', activeEvent.intake.request || '目前没有提出具体请求。', '待本人核对；不代表他人同意。'],
  ];
  const active = getActiveEvent(workspace);
  return (
    <>
      <div className="report-head"><div><div className="eyebrow">事件分析 · 三部分整理结果</div><h1 className="page-title">一次分歧的整理结果</h1><p className="page-lede">只使用你本人提供并确认的内容；缺席方的感受、理由和动机均保持未知。</p></div><div className="profile-actions"><a className="button secondary" href="/event-map">返回核对假设</a><button className="button" type="button" disabled title="当前单人版本未开放共同约定">共同约定（暂未开放）</button></div></div>
      <div className="report-grid"><div className="report-stack">
        <section className="card report-section"><div className="section-head"><div><h2>01 · 分歧地图</h2><p className="report-sub">事实、争议、解释、感受与需求分开显示</p></div><span className="pill blue">来源可见</span></div>{dataRows.map(([kind, detail, note]) => <div className="map-line" key={kind}><div className="map-kind">{kind}</div><div className="map-detail">{detail}<small>{note}</small></div></div>)}<div className="map-line"><div className="map-kind">对方的说明</div><div className="map-detail">未知／有待本人提供并确认。<small>单人路径不替缺席方发言。</small></div></div></section>
        <section className="card report-section"><div className="section-head"><div><h2>02 · 个人沟通建议</h2><p className="report-sub">表达需求、确认理解、设定边界；不要求说服对方。</p></div></div><div className="suggestion"><h3>一种表达结构</h3><p>“当发生{activeEvent.intake.facts || '这件事'}时，我感到{activeEvent.intake.feelings || '（由你补充感受）'}。我在意的是{activeEvent.intake.needs || '（由你补充需要）'}。我想请求{activeEvent.intake.request || '（由你补充具体行为）'}。”</p></div><div className="suggestion"><h3>一个澄清问题</h3><p>“我想先确认我们对这件事的理解是否不同。你愿意说说你的看法吗？”</p></div><div className="suggestion"><h3>暂停与边界</h3><p>{activeEvent.intake.boundary || '如果谈话出现威胁、羞辱或压力升级，可以先暂停；你不需要为了完成分析而继续对话。'}</p></div></section>
        <section className="card report-section"><div className="section-head"><div><h2>03 · 可选协商行动</h2><p className="report-sub">可选方案不是系统命令；也可以不选或提出新方案。</p></div><span className="pill">3 个待讨论选项</span></div>
          <article className="option"><div className="option-top"><h3>方案 A · 把请求改写成可观察的具体行动</h3><span className="pill green">个人准备</span></div><p>{activeEvent.intake.request || '先由你补充希望改变的具体行为，再决定是否提出。'}</p><div className="option-meta"><span className="pill">单人提出的待讨论选项</span><span className="pill">需双方分别自愿确认后方可试行</span><span className="pill">复盘时间由本人决定</span></div></article>
          <article className="option"><div className="option-top"><h3>方案 B · 先核对彼此对事实的理解</h3><span className="pill">可讨论</span></div><p>如果双方都愿意，再分别说出各自能确认的部分；有分歧的内容继续保留为争议。</p><div className="option-meta"><span className="pill">不预设对方同意</span><span className="pill">可以选择不进行</span></div></article>
          <article className="option"><div className="option-top"><h3>方案 C · 暂不协商，先各自整理</h3><span className="pill">可以跳过</span></div><p>如果目前不适合共同讨论，可以暂停关系流程。没有达成约定也不代表失败。</p><div className="option-meta"><span className="pill">个人决定</span><span className="pill">不自动联系对方</span></div></article>
        </section>
      </div><aside className="report-aside"><section className="card source-card"><h2>整理结果边界</h2><div className="source-row"><strong>不评判对错</strong>不判定谁更有道德，也不把一次事件写成固定人格特征。</div><div className="source-row"><strong>不推测缺席方</strong>没有当事人自己的叙述时，其感受、理由和动机均为未知。</div><div className="source-row"><strong>可拒绝全部选项</strong>这些内容仅用于反思，不代表调解结果、共同承诺或他人同意。</div></section><section className="notice-neutral"><strong>个人档案不会自动更新</strong><p>若希望把某项观察写回档案，需要在复盘后逐项查看内容并再次明确确认。</p><a className="link" href="/follow-up">进入个人复盘 →</a></section><section className="notice-neutral"><strong>发现安全风险？</strong><p>请离开协商路径。安全优先，不需要解释，也不必承诺继续沟通。</p><a className="link" href="/safety">打开安全支持 →</a></section></aside></div>
      <p className="footer-note">当前事件记录 #{eventIndex} 保存在此浏览器；可在“关于与数据”页导出或删除。</p>
    </>
  );
}
