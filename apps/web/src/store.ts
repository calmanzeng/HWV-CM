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

export type Observation = {
  id: string;
  text: string;
  confirmed: boolean;
  source: string;
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
  | 'session';

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

export function read(): StoreState {
  if (!box) return blank();
  try {
    const raw = box.getItem(STORE_KEY);
    return raw ? normalize(JSON.parse(raw)) : blank();
  } catch {
    return blank();
  }
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
  options: { id?: string; source?: string } = {},
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

  const keys = Object.values(SESSION_KEYS);
  let sessionUsable = true;
  try {
    window.sessionStorage.setItem('hwv.__probe', '1');
    window.sessionStorage.removeItem('hwv.__probe');
  } catch {
    sessionUsable = false;
  }

  if (sessionUsable) {
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
