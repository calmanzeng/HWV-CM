import modelJson from '../../../model/HWV-CM_1.0.json';
import evidenceCsv from '../../../research/权威知识库与证据登记表.csv?raw';

export type Domain = {
  id: string;
  name: string;
  temporal: string;
  constructs: { id: string; name: string; measurement_status: string; evidence: string[] }[];
  source_ids: string[];
};

export const domains = (modelJson as { domains: Domain[] }).domains;

export const valueItems = [
  '自主思考', '自主行动', '刺激与新颖', '享乐', '成就', '支配权力', '资源权力', '面子／公众形象',
  '个人安全', '社会安全', '传统', '规则遵从', '人际顺从', '谦逊', '关怀亲近者', '可靠守信',
  '普遍福祉', '环境保护', '包容差异',
];

export const interviewQuestions = [
  '一个人失约但有充分理由时，你最在乎道歉、补救，还是今后提前通知？为什么？',
  '当“按规则处理”与“对特殊处境通融”冲突时，你更关注什么？',
  '如果个人自由和家庭义务只能优先满足一个，你如何权衡？',
  '你更希望被认为有成就、可信赖、善良，还是独立？哪项最难放弃？',
  '对同一问题，你会在什么证据出现后改变立场？',
  '遇到不确定的情况时，你更愿意先定一个方案，还是先收集信息？为什么？',
  '工作、关系、成长、财富与贡献中，过去半年哪个最影响你的选择？',
  '你目前最清楚的人生目标是什么？有哪些还在探索？',
  '当别人批评你时，哪些表达让你最难接受？',
  '发生争执时，你最需要暂停、解释、被理解，还是立即解决？',
  '你如何判断亲密关系里“关心”和“控制”的边界？',
  '当伴侣或同事没有回应消息时，你通常会做什么解释？',
  '当你认为自己正确但对方感受受伤时，你会先处理哪部分？',
  '哪些事情你愿意妥协，哪些是必须保持的个人边界？',
  '最近一次和他人意见不一致是什么？请分别描述事实和你的解释。',
  '你更习惯直接指出问题还是先维护气氛？不同关系有差别吗？',
  '你曾因理解他人的处境而改变判断吗？',
  '你希望工具在什么情况下保持沉默、提醒风险或建议专业支持？',
];

export type Evidence = {
  id: string;
  type: string;
  name: string;
  year: string;
  url: string;
  purpose: string;
  license: string;
  note: string;
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      fields.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  fields.push(value.trim());
  return fields;
}

export const evidenceEntries: Evidence[] = evidenceCsv
  .split(/\r?\n/)
  .filter(Boolean)
  .slice(1)
  .map((line) => {
    const [id = '', type = '', name = '', year = '', url = '', purpose = '', license = '', note = ''] = parseCsvLine(line);
    return { id, type, name, year, url, purpose, license, note };
  });

export const researchBanner = '尚未完成心理测量学验证；仅提供认知与沟通反思辅助，不提供心理诊断、人格裁定或关系结果预测。本机浏览器保存，不上传；不等于设备加密。';

export type ObservationSource = '本人明确表达' | '本产品原创情境题' | '本人确认的事件反思';

export type Observation = {
  id: string;
  constructId: string;
  text: string;
  source: ObservationSource;
  createdAt: string;
  confirmed: boolean;
  uncertainty: string;
};

export type Profile = {
  id: string;
  createdAt: string;
  updatedAt: string;
  interviewAnswers: Record<string, string>;
  skippedQuestions: number[];
  valueOrder: string[] | null;
  observations: Observation[];
};

export type SafetyDecision = 'unknown' | 'clear' | 'support';
export type HypothesisChoice = 'pending' | 'keep' | 'revised' | 'rejected';
export type WorkflowStatus =
  | 'CONSENT'
  | 'SAFETY_CHECK'
  | 'PRIVATE_INTAKE'
  | 'FACT_MAP'
  | 'HYPOTHESES'
  | 'INDIVIDUAL_CONFIRMATION'
  | 'OPTIONS'
  | 'SAFETY_SUPPORT';

export type Hypothesis = {
  id: string;
  title: string;
  prompt: string;
  basis: string;
  unknown: string;
  choice: HypothesisChoice;
  revision: string;
};

export type EventIntake = {
  facts: string;
  disputed: string;
  interpretation: string;
  feelings: string;
  needs: string;
  request: string;
  boundary: string;
};

export type PersonalFollowUp = {
  actionStatus: 'done' | 'partial' | 'not-done' | 'skip';
  safetyStatus: 'safer' | 'pressure' | 'harm' | 'uncertain' | 'skip';
  reflection: string;
  writebackText: string;
  writebackConstructId: string;
  writebackConfirmedAt?: string;
  savedAt: string;
};

export type EventRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: WorkflowStatus;
  consentAcceptedAt?: string;
  safetyDecision: SafetyDecision;
  intake: EventIntake;
  hypotheses: Hypothesis[];
  personalFollowUp?: PersonalFollowUp;
};

export type Workspace = {
  profile: Profile;
  events: EventRecord[];
  activeEventId: string | null;
};

export const emptyIntake = (): EventIntake => ({
  facts: '', disputed: '', interpretation: '', feelings: '', needs: '', request: '', boundary: '',
});

export function createProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: 'local',
    createdAt: now,
    updatedAt: now,
    interviewAnswers: {},
    skippedQuestions: [],
    valueOrder: null,
    observations: [],
  };
}

export function createWorkspace(): Workspace {
  return { profile: createProfile(), events: [], activeEventId: null };
}

export function createEvent(): EventRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID?.() ?? `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    status: 'CONSENT',
    safetyDecision: 'unknown',
    intake: emptyIntake(),
    hypotheses: [],
  };
}

export function answeredInterviewCount(profile: Profile): number {
  return Object.values(profile.interviewAnswers).filter((answer) => answer.trim().length > 0).length;
}

export function getActiveEvent(workspace: Workspace): EventRecord | undefined {
  return workspace.events.find((event) => event.id === workspace.activeEventId);
}

export function getObservationStatus(observations: Observation[]): string {
  if (!observations.length) return '目前未知';
  if (observations.some((entry) => entry.confirmed)) return '本人已确认';
  return observations.length === 1 ? '单次表达' : `${observations.length} 条记录`;
}
