import { useMemo, useRef, useState, type FormEvent } from 'react';
import { answeredInterviewCount, domains, interviewQuestions, valueItems, type Observation, type ObservationSource } from '../domain';
import { getObservationStatus } from '../domain';
import { useAppState } from '../useWorkspace';

const observationSources: ObservationSource[] = ['本人明确表达', '本产品原创情境题', '本人确认的事件反思'];

export default function ProfilePage() {
  const { workspace, updateProfile } = useAppState();
  const profile = workspace.profile;
  const [questionIndex, setQuestionIndex] = useState(5);
  const freeNoteRef = useRef<HTMLDetailsElement>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSource, setNoteSource] = useState<ObservationSource>('本人明确表达');
  const [noteConstructId, setNoteConstructId] = useState(domains[0]?.constructs[0]?.id ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [showAllValues, setShowAllValues] = useState(false);
  const [showAllConstructs, setShowAllConstructs] = useState(false);
  const answerCount = answeredInterviewCount(profile);
  const valueOrder = profile.valueOrder ?? valueItems;
  const constructs = useMemo(() => domains.flatMap((domain) => domain.constructs.map((construct) => ({ ...construct, domainId: domain.id, domainName: domain.name }))), []);

  const saveAnswer = (value: string) => {
    const id = `Q${String(questionIndex + 1).padStart(2, '0')}`;
    updateProfile((current) => ({
      ...current,
      interviewAnswers: { ...current.interviewAnswers, [id]: value },
      skippedQuestions: current.skippedQuestions.filter((question) => question !== questionIndex + 1),
    }));
  };

  const skipQuestion = () => {
    updateProfile((current) => ({ ...current, skippedQuestions: [...new Set([...current.skippedQuestions, questionIndex + 1])] }));
    setQuestionIndex((current) => (current + 1) % interviewQuestions.length);
  };

  const moveValue = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= valueOrder.length) return;
    const next = [...valueOrder];
    [next[index], next[target]] = [next[target], next[index]];
    updateProfile((current) => ({ ...current, valueOrder: next }));
  };

  const submitObservation = (event: FormEvent) => {
    event.preventDefault();
    if (!noteText.trim()) {
      setFormError('请先填写你愿意记录的内容。');
      return;
    }
    const createdAt = new Date().toISOString();
    updateProfile((current) => ({
      ...current,
      observations: editingId
        ? current.observations.map((item) => item.id === editingId ? { ...item, text: noteText.trim(), source: noteSource, constructId: noteConstructId } : item)
        : [...current.observations, { id: crypto.randomUUID(), constructId: noteConstructId, text: noteText.trim(), source: noteSource, createdAt, confirmed: true, uncertainty: '仅说明本人当前表达；未验证为稳定倾向' }],
    }));
    setNoteText('');
    setEditingId(null);
    setFormError('');
  };

  const openFreeNote = () => {
    if (!freeNoteRef.current) return;
    freeNoteRef.current.open = true;
    freeNoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const editObservation = (item: Observation) => {
    setEditingId(item.id);
    setNoteText(item.text);
    setNoteSource(item.source);
    setNoteConstructId(item.constructId);
    openFreeNote();
  };

  const deleteObservation = (id: string) => {
    if (!window.confirm('删除这条个人观察？删除后无法恢复。')) return;
    updateProfile((current) => ({ ...current, observations: current.observations.filter((item) => item.id !== id) }));
    if (editingId === id) { setEditingId(null); setNoteText(''); }
  };

  const answerId = `Q${String(questionIndex + 1).padStart(2, '0')}`;
  const answeredValue = profile.interviewAnswers[answerId] ?? '';
  const visibleValues = showAllValues ? valueOrder : valueOrder.slice(0, 4);
  const previewConstructs = ['W.uncertainty', 'L.life_goals', 'V.benevolence_dependability', 'R.boundaries', 'E.conflict_style'].flatMap((id) => {
    const construct = constructs.find((item) => item.id === id);
    return construct ? [construct] : [];
  });
  return (
    <>
      <div className="profile-head"><div><div className="eyebrow">个人认知档案</div><h1 className="page-title">由你定义，也由你修正</h1><p className="page-lede">访谈可以跳过。每一条记录都保留来源与不确定性；证据不足时就显示“目前未知”。</p></div><div className="profile-actions"><a className="button secondary" href="/about#data">查看数据管理</a><a className="button" href="#interview">继续访谈</a></div></div>
      <div className="stats"><div className="stat-box"><div className="metric">58</div><span>候选构念 · 8 个领域</span></div><div className="stat-box"><div className="metric">{profile.observations.length}</div><span>本人确认的观察</span></div><div className="stat-box"><div className="metric">19</div><span>价值项 · 相对排序</span></div></div>
      <div className="profile-grid">
        <div className="profile-main-column">
          <section className="card progress-card" id="interview"><div className="section-head"><div><h2 className="section-title">原创情境访谈</h2><p className="section-note">18 个开放问题 · 可以逐题跳过或稍后再来</p></div><span className="pill blue">未验证研究题</span></div>
            <div className="progress-top"><div><strong>从一个具体情境开始</strong><div className="muted small">当前第 {questionIndex + 1} 题 · 输入自动保存在此浏览器</div></div><span className="pill">{answerCount} / 18 已回答</span></div>
            <div className="progress-track" aria-label={`访谈进度 ${answerCount} / 18`}><div className="progress-fill" style={{ width: `${Math.round(answerCount / 18 * 100)}%` }}/></div>
            <div className="form-field"><label htmlFor="current-question">{interviewQuestions[questionIndex]}</label><textarea className="textarea" id="current-question" value={answeredValue} onChange={(event) => saveAnswer(event.target.value)} placeholder="用自己的话描述；可以留空或跳过"/><div className="field-help">回答只代表你对这个情境的看法，不会自动推广成固定特征。</div></div>
            <div className="profile-actions" style={{ marginTop: 16 }}><button className="button secondary" type="button" onClick={skipQuestion}>跳过此题</button><button className="button" type="button" onClick={() => setQuestionIndex((current) => (current + 1) % interviewQuestions.length)}>下一题（自动保存）</button></div>
            <div className="rule"/>
            <div className="section-head"><div><h2 className="section-title">19 项价值优先序</h2><p className="section-note">表达相对排序，不计算总分，也不评判高低。</p></div><button className="link text-button" type="button" onClick={() => setShowAllValues((value) => !value)}>{showAllValues ? '收起排序' : '调整排序 →'}</button></div>
            <div className="callout"><strong>{profile.valueOrder ? '你的相对顺序已保存在本机。' : '尚未排序。'}</strong>{profile.valueOrder ? '顺序可随时调整，不会转换为分数。' : '当前清单顺序只是展示顺序，不代表你的偏好。点击箭头调整，不计算总分。'}</div>
            <div className="rank-list" id="ranking">{visibleValues.map((item, index) => <div className="rank-row" key={item}><span className="rank-num">{profile.valueOrder ? String(index + 1).padStart(2, '0') : '—'}</span><strong>{item}</strong>{showAllValues ? <span className="rank-controls"><button type="button" className="mini-button" aria-label={`将${item}上移`} disabled={index === 0} onClick={() => moveValue(index, -1)}>↑</button><button type="button" className="mini-button" aria-label={`将${item}下移`} disabled={index === valueOrder.length - 1} onClick={() => moveValue(index, 1)}>↓</button></span> : <span className="pill">{profile.valueOrder ? '相对顺序' : '待排序'}</span>}</div>)}</div>
            {!showAllValues && <button className="button secondary full-width" type="button" style={{ marginTop: 12 }} onClick={() => setShowAllValues(true)}>查看并调整全部 19 项</button>}
          </section>
          <details className="card card-pad free-note-card" id="free-note" ref={freeNoteRef}><summary className="free-note-summary"><span><strong>自由记录</strong><small>注明来源；只记录你愿意保存在本机的内容。</small></span><span className="pill blue">默认仅自己可见 · {profile.observations.length} 条</span></summary><div className="free-note-content">
            <form onSubmit={submitObservation} className="note-form"><div className="form-field"><label htmlFor="note-construct">关联候选构念</label><select id="note-construct" className="select" value={noteConstructId} onChange={(event) => setNoteConstructId(event.target.value)}>{constructs.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.domainId}</option>)}</select></div><div className="form-field"><label htmlFor="note-source">记录来源</label><select id="note-source" className="select" value={noteSource} onChange={(event) => setNoteSource(event.target.value as ObservationSource)}>{observationSources.map((source) => <option key={source}>{source}</option>)}</select></div><div className="form-field note-text-field"><label htmlFor="note-content">我的记录</label><textarea id="note-content" className="textarea" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="写下自己的表达或复盘；不要代替缺席的人描述其动机。"/></div>{formError && <div className="error-note" role="alert">{formError}</div>}<div className="profile-actions"><button className="button" type="submit">{editingId ? '保存修改' : '添加记录'}</button>{editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(null); setNoteText(''); }}>取消修改</button>}</div></form>
            {profile.observations.length > 0 && <div className="observation-list">{profile.observations.map((item) => <article className="observation-card" key={item.id}><div className="observation-top"><span className="pill">{constructs.find((construct) => construct.id === item.constructId)?.name ?? '个人记录'}</span><span className="pill blue">本人确认</span></div><p>{item.text}</p><div className="observation-meta">来源：{item.source} · {new Date(item.createdAt).toLocaleDateString('zh-CN')} · {item.uncertainty}</div><div className="profile-actions"><button className="text-button link" type="button" onClick={() => editObservation(item)}>编辑</button><button className="text-button danger-text" type="button" onClick={() => deleteObservation(item.id)}>删除</button></div></article>)}</div>}
          </div></details>
        </div>
        <aside className="card card-pad construct-card" id="constructs"><div className="section-head"><div><h2 className="section-title">构念档案</h2><p className="section-note">按领域浏览 58 个候选项</p></div><a className="link" href="/about#evidence">查看来源</a></div><div className="callout"><strong>数据质量不是心理测量置信度。</strong>它只说明当前记录有多少来源、是否由你确认。</div>
          <div className="construct-list">{previewConstructs.map((construct) => { const observations = profile.observations.filter((item) => item.constructId === construct.id); return <article className="construct-row" key={construct.id}><div><p className="construct-name">{construct.name}</p><div className="construct-domain">{construct.domainName} · {construct.domainId}</div></div><div className="construct-side"><span className={`pill${observations.some((item) => item.confirmed) ? ' blue' : ''}`}>{getObservationStatus(observations)}</span><button className="text-button link" type="button" onClick={() => { setNoteConstructId(construct.id); openFreeNote(); }}>添加观察</button></div></article>; })}</div>
          {showAllConstructs && <div className="construct-list full-construct-list">{domains.map((domain) => <details className="domain-details" key={domain.id}><summary><span>{domain.name}</span><span className="domain-count">{domain.constructs.length} 项 · {domain.id}</span></summary><div className="domain-constructs">{domain.constructs.map((construct) => { const observations = profile.observations.filter((item) => item.constructId === construct.id); return <article className="construct-row" key={construct.id}><div><p className="construct-name">{construct.name}</p><div className="construct-domain">{domain.name} · {domain.id}</div><div className="construct-uncertainty">不确定性：{observations.length ? '仅代表已有本人记录，稳定性未验证' : '目前未知；候选项需要研究验证'}</div>{observations.map((item) => <p className="construct-evidence" key={item.id}>“{item.text}” · 来源：{item.source}</p>)}</div><div className="construct-side"><span className={`pill${observations.some((item) => item.confirmed) ? ' blue' : ''}`}>{getObservationStatus(observations)}</span><button className="text-button link" type="button" onClick={() => { setNoteConstructId(construct.id); openFreeNote(); }}>添加观察</button></div></article>; })}</div></details>)}</div>}
          <button className="button secondary full-width construct-expand" type="button" onClick={() => setShowAllConstructs((current) => !current)}>{showAllConstructs ? '收起全部领域' : '查看全部领域'}</button>
        </aside>
      </div>
      <p className="footer-note">本机浏览器只保存你输入的资料；本地存储不等于设备加密。双人共享暂未开放，私密条目不会进入关系差异地图。</p>
    </>
  );
}
