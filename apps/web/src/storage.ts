import {
  createProfile,
  createWorkspace,
  interviewQuestions,
  valueItems,
  type EventRecord,
  type Profile,
  type Workspace,
} from './domain';

const PREFIX = 'hwvcm:v1:';
const META_KEY = `${PREFIX}meta`;
const PROFILE_KEY = `${PREFIX}person:local`;

type MetaRecord = {
  schemaVersion: 1;
  profileId: 'local';
  eventIds: string[];
  activeEventId: string | null;
};

export type LoadResult = { workspace: Workspace; error: string | null; safeMode: boolean };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}

const workflowStatuses = ['CONSENT', 'SAFETY_CHECK', 'PRIVATE_INTAKE', 'FACT_MAP', 'HYPOTHESES', 'INDIVIDUAL_CONFIRMATION', 'OPTIONS', 'SAFETY_SUPPORT'];
const choiceStatuses = ['pending', 'keep', 'revised', 'rejected'];

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return false;
  if (!isStringRecord(value.interviewAnswers) || !Array.isArray(value.skippedQuestions) || !value.skippedQuestions.every((item) => Number.isInteger(item) && item >= 1 && item <= interviewQuestions.length)) return false;
  if (value.valueOrder !== null && (!Array.isArray(value.valueOrder) || value.valueOrder.length !== valueItems.length || new Set(value.valueOrder).size !== valueItems.length || !value.valueOrder.every((item) => valueItems.includes(item)))) return false;
  if (!Array.isArray(value.observations)) return false;
  const sources = ['本人明确表达', '本产品原创情境题', '本人确认的事件反思'];
  return value.observations.every((item) => isRecord(item)
    && typeof item.id === 'string'
    && typeof item.constructId === 'string'
    && typeof item.text === 'string'
    && sources.includes(String(item.source))
    && typeof item.createdAt === 'string'
    && typeof item.confirmed === 'boolean'
    && typeof item.uncertainty === 'string');
}

function isEvent(value: unknown): value is EventRecord {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return false;
  if (!workflowStatuses.includes(String(value.status)) || !['unknown', 'clear', 'support'].includes(String(value.safetyDecision))) return false;
  if (value.consentAcceptedAt !== undefined && typeof value.consentAcceptedAt !== 'string') return false;
  const intake = value.intake;
  if (!isRecord(intake) || !['facts', 'disputed', 'interpretation', 'feelings', 'needs', 'request', 'boundary'].every((key) => typeof intake[key] === 'string')) return false;
  if (!Array.isArray(value.hypotheses) || !value.hypotheses.every((item) => isRecord(item)
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.prompt === 'string'
    && typeof item.basis === 'string'
    && typeof item.unknown === 'string'
    && choiceStatuses.includes(String(item.choice))
    && typeof item.revision === 'string')) return false;
  if (value.personalFollowUp !== undefined) {
    const followUp = value.personalFollowUp;
    if (!isRecord(followUp)
      || !['done', 'partial', 'not-done', 'skip'].includes(String(followUp.actionStatus))
      || !['safer', 'pressure', 'harm', 'uncertain', 'skip'].includes(String(followUp.safetyStatus))
      || typeof followUp.reflection !== 'string'
      || typeof followUp.writebackText !== 'string'
      || typeof followUp.writebackConstructId !== 'string'
      || typeof followUp.savedAt !== 'string'
      || (followUp.writebackConfirmedAt !== undefined && typeof followUp.writebackConfirmedAt !== 'string')) return false;
  }
  return true;
}

function readMeta(): MetaRecord {
  const value = parseJson<Partial<MetaRecord>>(localStorage.getItem(META_KEY), {});
  if (value.schemaVersion !== 1 || !Array.isArray(value.eventIds)) {
    throw new Error('数据结构版本无法识别');
  }
  return {
    schemaVersion: 1,
    profileId: 'local',
    eventIds: value.eventIds.filter((id): id is string => typeof id === 'string'),
    activeEventId: typeof value.activeEventId === 'string' ? value.activeEventId : null,
  };
}

export function loadWorkspace(): LoadResult {
  try {
    const storedMeta = localStorage.getItem(META_KEY);
    if (!storedMeta) {
      const profile = parseJson<unknown>(localStorage.getItem(PROFILE_KEY), createProfile());
      if (!isProfile(profile)) throw new Error('个人档案字段无法识别');
      return { workspace: { profile, events: [], activeEventId: null }, error: null, safeMode: false };
    }
    const meta = readMeta();
    const profile = parseJson<unknown>(localStorage.getItem(PROFILE_KEY), createProfile());
    if (!isProfile(profile)) throw new Error('个人档案字段无法识别');
    const events = meta.eventIds.map((id) => {
      const event = parseJson<unknown>(localStorage.getItem(`${PREFIX}event:${id}`), null);
      if (!isEvent(event)) throw new Error('事件记录缺失或字段无法识别');
      return event;
    });
    if (meta.activeEventId && !events.some((event) => event.id === meta.activeEventId)) throw new Error('当前事件索引无法识别');
    return {
      workspace: { profile, events, activeEventId: meta.activeEventId },
      error: null,
      safeMode: false,
    };
  } catch {
    return {
      workspace: createWorkspace(),
      error: '本机数据无法完整读取。为避免覆盖，当前已暂停自动保存；请先导入可用备份或删除损坏的数据。',
      safeMode: true,
    };
  }
}

export function saveWorkspace(workspace: Workspace): void {
  const meta: MetaRecord = {
    schemaVersion: 1,
    profileId: 'local',
    eventIds: workspace.events.map((event) => event.id),
    activeEventId: workspace.activeEventId,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(workspace.profile));
  for (const event of workspace.events) {
    localStorage.setItem(`${PREFIX}event:${event.id}`, JSON.stringify(event));
  }
  const retained = new Set(meta.eventIds.map((id) => `${PREFIX}event:${id}`));
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${PREFIX}event:`) && !retained.has(key)) localStorage.removeItem(key);
  }
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function clearWorkspace(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(PREFIX)) localStorage.removeItem(key);
  }
}

export type ExportBundle = {
  format: 'HWV-CM-LOCAL-DATA';
  schemaVersion: 1;
  exportedAt: string;
  profile: Profile;
  events: EventRecord[];
  activeEventId: string | null;
};

export function makeExport(workspace: Workspace): ExportBundle {
  return {
    format: 'HWV-CM-LOCAL-DATA',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: workspace.profile,
    events: workspace.events,
    activeEventId: workspace.activeEventId,
  };
}

export function parseImport(value: unknown): Workspace {
  if (!isRecord(value)) throw new Error('文件内容不是 JSON 对象');
  if (value.format !== 'HWV-CM-LOCAL-DATA' || value.schemaVersion !== 1) {
    throw new Error('文件格式或版本不受支持');
  }
  if (!isProfile(value.profile) || !Array.isArray(value.events) || !value.events.every(isEvent)) {
    throw new Error('档案或事件字段不完整，或与当前版本不兼容');
  }
  const ids = value.events.map((event) => event.id);
  if (new Set(ids).size !== ids.length) throw new Error('事件列表包含重复编号');
  if (value.activeEventId !== undefined && value.activeEventId !== null && typeof value.activeEventId !== 'string') throw new Error('当前事件编号字段无效');
  const activeEventId = typeof value.activeEventId === 'string' ? value.activeEventId : null;
  if (activeEventId && !ids.includes(activeEventId)) throw new Error('当前事件编号不在事件列表中');
  return {
    profile: { ...createProfile(), ...value.profile, id: 'local' },
    events: value.events,
    activeEventId,
  };
}
