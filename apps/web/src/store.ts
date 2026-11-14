/**
 * HWV-CM v2 · 本地数据层
 *
 * 原则：单人、本机、明文 localStorage、零网络请求。
 * 单一存储键；删除即整体移除；所有写入返回明确结果，不吞异常。
 */

export const STORE_KEY = 'hwv.v2.state';
export const SCHEMA_VERSION = 2 as const;

export const SESSION_KEYS = {
  safety: 'hwv.flow.safety',
  consent: 'hwv.flow.consent',
  reviewId: 'hwv.flow.reviewId',
  agreementId: 'hwv.flow.agreementId',
} as const;

export type SafetyDecision = 'safe' | 'worried' | 'stop';

export type EventDraft = {
  facts: string;
  disputed: string;
  feelings: string;
  needs: string;
  interpretation: string;
  updatedAt: string;
};

export type ObservationCategory = 'common' | 'difference' | 'unknown';

export type Observation = {
  id: string;
  text: string;
  confirmed: boolean;
  source: string;
  /** 观察归类：共同点 / 差异 / 尚未验证。旧记录可能没有该字段。 */
  category?: ObservationCategory;
  at: string;
};

export type Agreement = {
  id: string;
  agenda: string;
  action: string;
  reviewAt: string;
  at: string;
};

export type ResultsRecord = {
  data: Record<string, unknown>;
  savedAt: string;
};

export type StoreState = {
  version: typeof SCHEMA_VERSION;
  createdAt: string | null;
  updatedAt: string | null;
  event: EventDraft | null;
  results: ResultsRecord | null;
  observations: Observation[];
  agreements: Agreement[];
  extra: Record<string, unknown>;
};

export type StoreReason =
  | 'saved'
  | 'deleted'
  | 'empty'
  | 'duplicate'
  | 'unavailable'
  | 'quota'
  | 'error'
  | 'session'
  | 'protected';

export type StoreResult = {
  ok: boolean;
  reason: StoreReason;
  state: StoreState;
  sessionKeys?: string[];
};

const EVENT_FIELDS = [
  'facts',
  'disputed',
  'feelings',
  'needs',
  'interpretation',
] as const;

export type EventField = (typeof EVENT_FIELDS)[number];
export type EventPatch = Partial<Record<EventField, string>>;

function blank(): StoreState {
  return {
    version: SCHEMA_VERSION,
    createdAt: null,
    updatedAt: null,
    event: null,
    results: null,
    observations: [],
    agreements: [],
    extra: {},
  };
}

function normalize(raw: unknown): StoreState {
  const base = blank();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Partial<StoreState> & { version?: unknown };
  if (value.version !== SCHEMA_VERSION) return base;

  if (typeof value.createdAt === 'string') base.createdAt = value.createdAt;
  if (typeof value.updatedAt === 'string') base.updatedAt = value.updatedAt;
  if (value.event && typeof value.event === 'object') base.event = value.event as EventDraft;
  if (value.results && typeof value.results === 'object') base.results = value.results as ResultsRecord;
  if (Array.isArray(value.observations)) base.observations = value.observations as Observation[];
  if (Array.isArray(value.agreements)) base.agreements = value.agreements as Agreement[];
  if (value.extra && typeof value.extra === 'object') base.extra = value.extra as Record<string, unknown>;
  return base;
}

function storage(): Storage | null {
  try {
    const probe = 'hwv.__probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const box = storage();

export const storageAvailable = box !== null;

/**
 * 数据完整性保护：检测到损坏或未知版本的原始数据时为 true，
 * 普通写入（write / saveEvent 隐式删除）将被拒绝，避免静默覆盖用户数据。
 */
let corrupted = false;

/** 损坏/未知版本的原始字符串，保留用于导出备份，避免用户误以为数据已丢失。 */
let corruptRaw: string | null = null;

export function isCorrupted(): boolean {
  return corrupted;
}

/**
 * 原始 JSON 顶层结构校验（先于 normalize，防止非法字段被静默归一化丢弃）：
 * 已定义字段的类型必须正确；任何非法类型都视为损坏，进入只读保护并保留原始数据。
 */
function validateRawShape(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return '顶层不是对象';
  const value = raw as Record<string, unknown>;
  if (value.version !== SCHEMA_VERSION) return 'version 缺失或错误';
  if ('observations' in value && !Array.isArray(value.observations)) return 'observations 不是数组';
  if ('agreements' in value && !Array.isArray(value.agreements)) return 'agreements 不是数组';
  if ('event' in value && value.event !== null && (typeof value.event !== 'object' || Array.isArray(value.event))) return 'event 不是对象';
  if ('results' in value && value.results !== null && (typeof value.results !== 'object' || Array.isArray(value.results))) return 'results 不是对象';
  if ('extra' in value && value.extra !== null && (typeof value.extra !== 'object' || Array.isArray(value.extra))) return 'extra 不是对象';
  if ('createdAt' in value && value.createdAt !== null && typeof value.createdAt !== 'string') return 'createdAt 不是字符串';
  if ('updatedAt' in value && value.updatedAt !== null && typeof value.updatedAt !== 'string') return 'updatedAt 不是字符串';
  return null;
}

/** 结构校验：版本号正确但内部字段损坏（如 observations 混入 null）时视为损坏。 */
function validateState(state: StoreState): string | null {
  if (state.event !== null) {
    for (const field of EVENT_FIELDS) {
      if (typeof state.event[field] !== 'string') return `event.${field} 不是字符串`;
    }
  }
  for (const item of state.observations) {
    if (!item || typeof item !== 'object' || typeof item.text !== 'string') {
      return 'observations 含非法元素';
    }
  }
  for (const item of state.agreements) {
    if (!item || typeof item !== 'object' || typeof item.agenda !== 'string') {
      return 'agreements 含非法元素';
    }
  }
  if (state.results !== null) {
    if (typeof state.results !== 'object' || !state.results.data || typeof state.results.data !== 'object') {
      return 'results 结构非法';
    }
  }
  return null;
}

export function read(): StoreState {
  corrupted = false;
  corruptRaw = null;
  if (!box) return blank();
  let raw: string | null = null;
  try {
    raw = box.getItem(STORE_KEY);
  } catch {
    // 存储读取异常：无法判断原数据是否完好，一律进入只读保护，不覆盖
    corrupted = true;
    return blank();
  }
  if (raw === null) return blank();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    corrupted = true; // JSON 损坏：进入只读保护，不静默覆盖
    corruptRaw = raw;
    return blank();
  }
  // 原始顶层结构校验（先于 normalize）：已定义字段类型非法 → 保护，防止被静默归一化丢弃
  const rawIssue = validateRawShape(parsed);
  if (rawIssue !== null) {
    corrupted = true;
    corruptRaw = raw;
    return blank();
  }
  if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== SCHEMA_VERSION) {
    corrupted = true; // 未知/缺失版本：进入只读保护
    corruptRaw = raw;
    return blank();
  }
  const state = normalize(parsed);
  const issue = validateState(state);
  if (issue !== null) {
    corrupted = true; // 结构损坏：进入只读保护
    corruptRaw = raw;
    return blank();
  }
  return state;
}

function hasExtraContent(extra: Record<string, unknown>): boolean {
  for (const key of Object.keys(extra)) {
    const value = extra[key];
    if (typeof value === 'string' && value.trim()) return true;
    if (value && typeof value === 'object') {
      for (const inner of Object.values(value as Record<string, unknown>)) {
        if (typeof inner === 'string' && inner.trim()) return true;
      }
    }
  }
  return false;
}

export function hasContent(state: StoreState = read()): boolean {
  if (state.event) {
    for (const field of EVENT_FIELDS) {
      const value = state.event[field];
      if (typeof value === 'string' && value.trim()) return true;
    }
  }
  if (state.results) return true;
  if (state.observations.length || state.agreements.length) return true;
  return hasExtraContent(state.extra);
}

function write(next: StoreState): StoreResult {
  const state = normalize(next);
  state.version = SCHEMA_VERSION;
  state.updatedAt = new Date().toISOString();
  if (!state.createdAt) state.createdAt = state.updatedAt;

  if (!box) {
    return { ok: false, reason: 'unavailable', state };
  }
  if (corrupted) {
    return { ok: false, reason: 'protected', state: blank() };
  }
  try {
    box.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    return { ok: false, reason: 'quota', state: read() };
  }
  return { ok: true, reason: 'saved', state };
}

/** 事件草稿：全空时不留空壳；若没有其它内容则整键清除。 */
export function saveEvent(patch: EventPatch): StoreResult {
  const state = read();
  const merged: EventDraft = {
    facts: '',
    disputed: '',
    feelings: '',
    needs: '',
    interpretation: '',
    updatedAt: new Date().toISOString(),
    ...(state.event ?? {}),
  };

  for (const field of EVENT_FIELDS) {
    const value = patch[field];
    if (typeof value === 'string') merged[field] = value;
  }

  const hasAny = EVENT_FIELDS.some((field) => merged[field].trim());

  if (!hasAny) {
    const hasOther =
      Boolean(state.results) ||
      state.observations.length > 0 ||
      state.agreements.length > 0 ||
      hasExtraContent(state.extra);

    if (!hasOther) {
      if (!box) return { ok: false, reason: 'unavailable', state: blank() };
      if (corrupted) {
        // 保护模式下拒绝隐式整键删除；用户可在数据管理页显式清空
        return { ok: false, reason: 'protected', state: blank() };
      }
      let cleared = false;
      try {
        box.removeItem(STORE_KEY);
        cleared = box.getItem(STORE_KEY) === null;
      } catch {
        return { ok: false, reason: 'error', state: read() };
      }
      if (!cleared) return { ok: false, reason: 'error', state: read() };
      return { ok: true, reason: 'empty', state: blank() };
    }
    state.event = null;
  } else {
    state.event = merged;
  }
  return write(state);
}

export function saveResults(data: Record<string, unknown>): StoreResult {
  const state = read();
  state.results = { data, savedAt: new Date().toISOString() };
  return write(state);
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addObservation(
  text: string,
  confirmed: boolean,
  options: { id?: string; source?: string; category?: ObservationCategory } = {},
): StoreResult {
  const state = read();
  const value = text.trim();
  if (!value) return { ok: false, reason: 'empty', state };

  const id = options.id ? String(options.id) : null;
  if (id && state.observations.some((item) => item.id === id)) {
    return { ok: true, reason: 'duplicate', state };
  }

  state.observations = [
    ...state.observations,
    {
      id: id ?? randomId('obs'),
      text: value,
      confirmed: Boolean(confirmed),
      source: options.source ? String(options.source) : 'manual',
      category: options.category ?? 'unknown',
      at: new Date().toISOString(),
    },
  ];
  return write(state);
}

export function addAgreement(
  data: { agenda: string; action?: string; reviewAt?: string },
  options: { id?: string } = {},
): StoreResult {
  const state = read();
  const agenda = (data.agenda ?? '').trim();
  if (!agenda) return { ok: false, reason: 'empty', state };

  const id = options.id ? String(options.id) : null;
  if (id && state.agreements.some((item) => item.id === id)) {
    return { ok: true, reason: 'duplicate', state };
  }

  state.agreements = [
    ...state.agreements,
    {
      id: id ?? randomId('agr'),
      agenda,
      action: data.action ?? '',
      reviewAt: data.reviewAt ?? '',
      at: new Date().toISOString(),
    },
  ];
  return write(state);
}

export function saveExtra(key: string, value: unknown): StoreResult {
  const state = read();
  state.extra = { ...state.extra, [key]: value };
  return write(state);
}

export function readExtra<T = unknown>(key: string): T | null {
  const state = read();
  const value = state.extra[key];
  return (value as T) ?? null;
}

/** 删除全部数据：主键删除后回读确认，再逐项清理四个会话键并回读。 */
export function clearAll(): StoreResult {
  if (!box) {
    return { ok: false, reason: 'unavailable', state: blank() };
  }

  let removed = false;
  try {
    box.removeItem(STORE_KEY);
    removed = box.getItem(STORE_KEY) === null;
  } catch {
    return { ok: false, reason: 'error', state: read() };
  }
  if (!removed) return { ok: false, reason: 'error', state: read() };

  // 主键已确认删除：损坏保护随之解除，会话键残留另行报告
  corrupted = false;
  corruptRaw = null;

  const keys = Object.values(SESSION_KEYS);
  let sessionUsable = true;
  try {
    window.sessionStorage.setItem('hwv.__probe', '1');
    window.sessionStorage.removeItem('hwv.__probe');
  } catch {
    sessionUsable = false;
  }

  if (!sessionUsable) {
    // sessionStorage 不可访问：四个会话键无法核验，不得签发删除成功
    return { ok: false, reason: 'session', state: blank(), sessionKeys: keys };
  }
  for (const key of keys) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* 逐项回读会给出结论 */
    }
  }
  const left: string[] = [];
  for (const key of keys) {
    let remains: string | null = null;
    try {
      remains = window.sessionStorage.getItem(key);
    } catch {
      remains = 'unreadable';
    }
    if (remains !== null) left.push(key);
  }
  if (left.length) {
    return { ok: false, reason: 'session', state: blank(), sessionKeys: left };
  }

  return { ok: true, reason: 'deleted', state: blank() };
}

export function sizeBytes(): number {
  if (!box) return 0;
  try {
    const raw = box.getItem(STORE_KEY);
    return raw ? new Blob([raw]).size : 0;
  } catch {
    return 0;
  }
}

export function exportText(): string {
  if (corrupted && corruptRaw !== null) {
    // 数据损坏：导出原始内容，注明未做解析，便于人工恢复
    return JSON.stringify(
      {
        app: 'HWV-CM',
        schema: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        note: '本机数据无法识别（损坏或版本不兼容），以下为原始存储内容，未做任何改写。可人工核对后重新导入。',
        preservedRaw: corruptRaw,
      },
      null,
      2,
    );
  }
  const state = read();
  return JSON.stringify(
    {
      app: 'HWV-CM',
      schema: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      note: '本文件由用户在本机主动导出。内容为单人记录，未上传任何服务器，不含对方数据。',
      data: {
        event: state.event,
        results: state.results,
        observations: state.observations,
        agreements: state.agreements,
        extra: state.extra,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      },
    },
    null,
    2,
  );
}

/* ---------- 流程会话状态（不进入个人档案） ---------- */

function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* 存储不可用时由调用方处理 */
  }
}

function sessionRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getSafety(): SafetyDecision | null {
  const value = sessionGet(SESSION_KEYS.safety);
  return value === 'safe' || value === 'worried' || value === 'stop' ? value : null;
}

export function setSafety(decision: SafetyDecision): void {
  sessionSet(SESSION_KEYS.safety, decision);
}

export function getConsent(): boolean {
  return sessionGet(SESSION_KEYS.consent) === '1';
}

export function setConsent(accepted: boolean): void {
  if (accepted) sessionSet(SESSION_KEYS.consent, '1');
  else sessionRemove(SESSION_KEYS.consent);
}

export function clearFlow(): void {
  sessionRemove(SESSION_KEYS.safety);
  sessionRemove(SESSION_KEYS.consent);
}

/** 同一次提交内保持稳定的幂等 ID；新页面会话重新生成。 */
function ensureId(key: string, prefix: string): string {
  const existing = sessionGet(key);
  if (existing) return existing;
  const created = randomId(prefix);
  sessionSet(key, created);
  return created;
}

export function reviewSubmitId(): string {
  return ensureId(SESSION_KEYS.reviewId, 'rev');
}

export function agreementSubmitId(): string {
  return ensureId(SESSION_KEYS.agreementId, 'agr-req');
}

export function resetReviewSubmitId(): void {
  sessionRemove(SESSION_KEYS.reviewId);
}

export function resetAgreementSubmitId(): void {
  sessionRemove(SESSION_KEYS.agreementId);
}
