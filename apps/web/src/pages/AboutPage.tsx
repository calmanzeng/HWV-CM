import { useRef, useState, type ChangeEvent } from 'react';
import { domains, evidenceEntries } from '../domain';
import { makeExport, parseImport } from '../storage';
import { useAppState } from '../useWorkspace';

function downloadJson(content: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AboutPage() {
  const { workspace, storageError, safeMode, replaceWorkspace, deleteAllData } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const exportData = () => {
    setError('');
    setMessage('');
    try {
      downloadJson(makeExport(workspace), `hwv-cm-local-data-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage('已生成完整 JSON 备份。下载文件可能包含敏感个人内容，请妥善保管。');
    } catch {
      setError('浏览器未能生成导出文件。请检查下载权限后重试。');
    }
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const imported = parseImport(JSON.parse(await file.text()));
      if (!window.confirm('导入会替换此浏览器当前 HWV-CM 数据。建议先导出现有资料。继续导入吗？')) return;
      replaceWorkspace(imported);
      setMessage('备份已导入。请检查档案与事件内容是否完整。');
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : '未知错误';
      setError(`无法导入：${detail}。原有数据未被替换。`);
    }
  };

  const removeAll = () => {
    if (!window.confirm('确定删除本浏览器中本产品保存的所有个人档案与事件记录？此操作不能撤销；已下载的 JSON 文件不会被删除。')) return;
    deleteAllData();
    setMessage('已请求清除此浏览器中的 HWV-CM 数据。若浏览器报告清除失败，请按提示到站点设置中清理。');
    setError('');
  };

  const domainCount = domains.reduce((count, domain) => count + domain.constructs.length, 0);

  return (
    <>
      <div className="about-head"><div><div className="eyebrow">关于 HWV-CM</div><h1 className="page-title">理解差异，不替人下结论</h1><p className="page-lede">模型 1.0 汇集多个理论作为候选框架。整合模型尚未完成心理测量学验证，也未证明冲突辅助能改善真实关系结果。</p></div></div>
      <div className="about-grid">
        <section className="card about-card">
          <h2>模型来源与研究状态</h2>
          <p>框架将个体描述拆为世界观、人生观、价值观、道德判断、人格倾向、人际关系、情绪与冲突、情境与权力八个领域。{domainCount} 项是候选构念目录，不代表每一项都已有可靠测量工具。</p>
          <div className="evidence-list">
            <div className="evidence-item"><strong>Schwartz 基本价值观理论</strong><span>19 个相对价值取向用于研究与排序交互参考；正式问卷、翻译和商业使用许可需逐项核验。</span></div>
            <div className="evidence-item"><strong>IPIP、Big Five 与关系研究</strong><span>理论来源不等于本产品验证完成。不同量表不可拼成统一人格或三观总分。</span></div>
            <div className="evidence-item"><strong>测量与伦理标准</strong><span>AERA/APA/NCME、ITC、NIST AI RMF 与 UNESCO 等作为验证、翻译适配和风险治理参考。</span></div>
            <div className="evidence-item"><strong>证据登记表</strong><span>项目维护 {evidenceEntries.length} 条可追溯来源、适用范围及许可提醒；逐项内容可在下方展开查看。</span><a className="link" href="#evidence">查看证据登记 ↓</a></div>
          </div>
          <div className="caution-note">借用研究理论不代表获得第三方量表题目、翻译文本或数据库的转载与商用授权。正式发布前须逐项复核。</div>
          <p className="about-principle">不计算三观分数、道德分或匹配率；单人路径不代替缺席方发言，所有推断均为待验证假设。</p>
        </section>

        <aside className="card about-card data-manager" id="data">
          <h2>本机数据管理</h2>
          <p>内容保存在当前浏览器的 localStorage，不上传到产品服务器，也不调用云端 AI。本地存储不等于设备加密，共享设备或浏览器扩展仍可能接触资料。</p>
          <div className="data-list">
            <div className="data-action"><div><strong>导出完整档案</strong><span>包含个人档案、访谈答案、价值排序、事件及复盘。下载文件不会随本机数据删除而自动清除。</span></div><button className="link text-button" type="button" onClick={exportData}>导出 JSON</button></div>
            <div className="data-action"><div><strong>从备份导入</strong><span>仅接受本产品支持的格式。导入前会确认；验证失败不会替换当前资料。</span></div><label className="link file-button">选择备份文件<input ref={fileInput} className="file-input-cover" type="file" accept="application/json,.json" onChange={importData}/></label></div>
            <div className="data-action"><div><strong>查看保存说明</strong><span>共享设备可能暴露资料；敏感内容请谨慎记录或导出。</span></div><a className="link" href="#local">了解</a></div>
          </div>
          <div className="delete-box"><strong>删除本机全部数据</strong><p>清除本产品在此浏览器的个人档案与事件记录。不会删除已下载文件、浏览器历史或设备备份。</p><button className="danger-link" type="button" onClick={removeAll}>删除全部本机数据</button></div>
          {storageError && <div className="error-note" role="alert">{storageError} {safeMode && '为保护原始数据，自动保存已暂停。你可以导入备份，或确认删除损坏的数据后重新开始。'}</div>}
          {message && <div className="success-note" role="status">{message}</div>}{error && <div className="error-note" role="alert">{error}</div>}
        </aside>
      </div>

      <div className="about-bottom">
        <section className="card about-card" id="local"><h2>隐私与存储边界</h2><p>“本机保存”表示页面不会把叙述发送到服务器，不代表数据已加密。浏览器扩展、同一系统账户的其他使用者和设备备份都可能访问本地资料。敏感内容请优先在个人设备上处理，并谨慎导出或共享。</p></section>
        <section className="card about-card"><h2>安全与使用边界</h2><p>如遇威胁、控制、暴力或明显权力不对称，应停止共同调解并查看安全支持。本产品不提供实时危机响应，也不替代心理、医疗或法律服务。</p><p>整理结果不用于招聘、录取、医疗、保险、惩戒等高影响决策。</p><a className="link" href="/safety">查看安全支持页 →</a></section>
      </div>

      <section className="about-evidence" id="evidence"><div className="section-head"><div><div className="eyebrow">证据登记</div><h2 className="section-title">模型来源与使用限制</h2><p className="section-note">登记表中的资料不代表每一构念都已得到验证或适用于所有情境。</p></div><span className="pill blue">{evidenceEntries.length} 项登记</span></div>
        <details className="evidence-register"><summary><span><strong>查看完整证据登记</strong><small>展开逐条查看用途、许可与限制备注</small></span><span className="pill blue">{evidenceEntries.length} 项</span></summary><div className="evidence-grid">{evidenceEntries.map((entry) => <details className="card evidence-card" key={entry.id}><summary><span className="evidence-type">{entry.type} · {entry.id}</span><strong>{entry.name}</strong><span className="evidence-year">{entry.year}</span></summary><div className="evidence-details"><p><strong>用途：</strong>{entry.purpose || '未注明'}</p><p><strong>许可：</strong>{entry.license || '需按原始来源核对'}</p><p><strong>限制与备注：</strong>{entry.note || '请结合原始来源与项目规格阅读。'}</p>{entry.url && <a className="link" href={entry.url} target="_blank" rel="noreferrer">打开原始来源 ↗</a>}</div></details>)}</div></details>
      </section>
      <p className="footer-note">项目规格、研究路线和证据登记属于内部交付文件；页面中列出的来源信息以登记表为准。</p>
    </>
  );
}
