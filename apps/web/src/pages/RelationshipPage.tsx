export default function RelationshipPage() {
  return (
    <>
      <div className="page-head"><div><div className="eyebrow">关系差异地图 · 界面示意</div><h1 className="page-title">关系差异地图仅作示意</h1><p className="page-lede">当前版本不开放双人共享。此页只展示未来可能的内容分区，不收集、授权或传递任何个人资料。</p></div><a className="button secondary" href="/event-consent">单人记录一次事件</a></div>
      <div className="relationship-grid">
        <section className="card card-pad"><div className="section-head"><div><h2 className="section-title">共享功能暂未开放</h2><p className="section-note">不接收个人档案或事件内容</p></div><span className="pill gold">暂未开放</span></div>
          <div className="people"><div className="person-chip"><span className="person-avatar">甲</span><div><strong>示意对象 A</strong><span>非真实用户</span></div></div><div className="connection"/><div className="person-chip"><span className="person-avatar">乙</span><div><strong>示意对象 B</strong><span>身份未核验</span></div></div></div>
          <div className="callout"><strong>这里的示意控件不构成授权。</strong>本地页面无法核验操作身份，且尚无加密共享包与分渠道密钥交接，因此双人共享暂未开放。</div>
          <div className="consent-list" aria-label="共享范围选择">
            {[
              ['共同目标与明确共识', '只分享本人明确写下、愿意共同讨论的目标。'],
              ['事件中的已确认事实', '逐条预览事实内容；争议陈述不会自动变成共同事实。'],
              ['本人确认的价值优先序', '仅分享所选条目，不显示整个个人档案。'],
              ['共同约定与边界', '双方共同确认的行动、责任和复盘时间。'],
            ].map(([title, text]) => <label className="consent-item" key={title}><input type="checkbox" disabled aria-label={`${title}：暂未开放`}/><span><strong>{title}</strong><span>{text}</span></span></label>)}
          </div>
          <div className="profile-micro">这些禁用选项只展示未来的授权粒度；当前版本不会生成或导出共享内容。</div>
          <div className="profile-actions" style={{ marginTop: 16 }}><button className="button" type="button" disabled>预览共享清单（暂未开放）</button><a className="button secondary" href="/">返回首页</a></div>
        </section>
        <aside className="card card-pad" id="share-preview"><div className="section-head"><div><h2 className="section-title">授权包预览（未实现）</h2><p className="section-note">未来版本才会展示接收内容</p></div><span className="pill gold">暂不可用</span></div><div className="preview-box"><div className="preview-label">静态示意</div><strong>本版本不会生成共享包</strong><p className="small muted" style={{ margin: '5px 0 0' }}>此页不接收、保存或传递任何个人档案与事件叙述。</p></div><div className="rule"/><div className="permission-note"><strong>未来试点前置条件：</strong>先完成双方身份边界说明、独立设备授权、加密包和密钥分渠道交接。即使未来支持撤回，也无法删除接收方已经下载或复制的副本。</div><a className="button secondary" style={{ width: '100%', marginTop: 14 }} href="#map">查看差异地图样式</a></aside>
      </div>
      <section id="map" style={{ marginTop: 26 }}><div className="section-head"><div><h2 className="section-title">关系差异地图</h2><p className="section-note">双方独立输入并同意后才会生成；当前仅展示各区域的呈现方式。</p></div><span className="pill blue">不生成关系评分</span></div><div className="map-grid">
        <article className="map-cell"><h3>一致点</h3><p>记录双方都明确表达的共同目标；没有共同确认时显示“尚无资料”。</p></article>
        <article className="map-cell"><h3>差异点</h3><p>并列展示各自说法与情境，不把差异转成谁更好或更适合。</p></article>
        <article className="map-cell full"><h3>互动循环</h3><p>按“某人做了什么 → 另一方如何理解 → 如何回应”描述往复过程；每一段都标注来源，避免归咎固定性格。</p></article>
        <article className="map-cell"><h3>权力与现实边界</h3><p>提示经济依赖、照护责任、组织层级或安全风险；不强迫达成和解。</p></article>
        <article className="map-cell"><h3>共同约定</h3><p>只保留双方主动确认的具体行为、责任、边界和复盘时间。</p></article>
      </div></section>
      <p className="footer-note">双人共享暂未开放：本机版本无法验证身份或加密授权。共同设备也可能暴露输入内容。</p>
    </>
  );
}
