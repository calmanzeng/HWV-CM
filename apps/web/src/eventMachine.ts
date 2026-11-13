import {
  type EventIntake,
  type EventRecord,
  type Hypothesis,
  type WorkflowStatus,
} from './domain';

const transitions: Record<WorkflowStatus, WorkflowStatus[]> = {
  CONSENT: ['SAFETY_CHECK', 'SAFETY_SUPPORT'],
  SAFETY_CHECK: ['PRIVATE_INTAKE', 'SAFETY_SUPPORT'],
  PRIVATE_INTAKE: ['FACT_MAP', 'SAFETY_SUPPORT'],
  FACT_MAP: ['HYPOTHESES', 'SAFETY_SUPPORT'],
  HYPOTHESES: ['INDIVIDUAL_CONFIRMATION', 'SAFETY_SUPPORT'],
  INDIVIDUAL_CONFIRMATION: ['OPTIONS', 'SAFETY_SUPPORT'],
  OPTIONS: ['SAFETY_SUPPORT'],
  SAFETY_SUPPORT: [],
};

export function transitionEvent(event: EventRecord, next: WorkflowStatus): EventRecord {
  if (event.status === next) return event;
  if (!transitions[event.status].includes(next)) {
    throw new Error(`不允许从 ${event.status} 跳转到 ${next}`);
  }
  return { ...event, status: next, updatedAt: new Date().toISOString() };
}

export function makeHypotheses(intake: EventIntake): Hypothesis[] {
  const need = intake.needs.trim();
  const interpretation = intake.interpretation.trim();
  const evidence = [intake.facts, intake.feelings].filter(Boolean).join('；');

  return [
    {
      id: 'need-check',
      title: '这次事件里，什么需要对我比较重要？',
      prompt: need
        ? `你写下的需要是：“${need}”。这是否贴近你的体验？`
        : '你还没有填写需要。可以补充一项需要，或把它保留为未知。',
      basis: need || evidence || '目前没有可引用的个人叙述。',
      unknown: '缺席方的感受、需要与动机仍未知。',
      choice: 'pending',
      revision: '',
    },
    {
      id: 'interpretation-check',
      title: '我的解释是否准确表达了当时的理解？',
      prompt: interpretation
        ? `你写下的解释是：“${interpretation}”。它是你的理解，不是对他人动机的证明。`
        : '你还没有填写自己的解释。可以补充、保留未知或拒绝这条整理。',
      basis: interpretation || evidence || '目前没有可引用的个人叙述。',
      unknown: '对方当时的原因与意图，除非本人说明，否则未知。',
      choice: 'pending',
      revision: '',
    },
  ];
}

export function hasSavedIntake(intake: EventIntake): boolean {
  return Object.values(intake).some((value) => value.trim().length > 0);
}

export function areHypothesesConfirmed(event: EventRecord): boolean {
  return event.hypotheses.length >= 2 && event.hypotheses.every((item) => {
    if (item.choice === 'pending') return false;
    if (item.choice === 'revised' && !item.revision.trim()) return false;
    return true;
  });
}

export function guardRoute(path: string, event: EventRecord | undefined): string | null {
  if (path === '/event-consent' || path === '/safety') return null;
  const protectedFlow = ['/event-safety-check', '/event', '/event-map', '/report', '/follow-up'];
  if (event?.status === 'SAFETY_SUPPORT' && protectedFlow.includes(path)) return '/safety';
  if (path === '/follow-up' && event?.safetyDecision === 'support') return '/safety';
  if (path === '/event-safety-check') {
    if (!event?.consentAcceptedAt) return '/event-consent';
    if (event.safetyDecision === 'support') return '/safety';
    if (event.safetyDecision === 'clear') return '/event';
    return null;
  }
  if (path === '/event') {
    if (!event?.consentAcceptedAt) return '/event-consent';
    if (event.safetyDecision === 'support') return '/safety';
    if (event.safetyDecision !== 'clear') return '/event-safety-check';
    if (!['PRIVATE_INTAKE', 'FACT_MAP', 'HYPOTHESES', 'INDIVIDUAL_CONFIRMATION', 'OPTIONS'].includes(event.status)) return '/event-safety-check';
    return null;
  }
  if (path === '/event-map') {
    if (!event?.consentAcceptedAt) return '/event-consent';
    if (event.safetyDecision === 'support') return '/safety';
    if (event.safetyDecision !== 'clear') return '/event-safety-check';
    if (!hasSavedIntake(event.intake)) return '/event';
    if (!event.hypotheses.length) return '/event';
    if (!['HYPOTHESES', 'INDIVIDUAL_CONFIRMATION', 'OPTIONS'].includes(event.status)) return '/event';
    return null;
  }
  if (path === '/report') {
    if (!event?.consentAcceptedAt) return '/event-consent';
    if (event.safetyDecision === 'support') return '/safety';
    if (event.safetyDecision !== 'clear') return '/event-safety-check';
    if (!hasSavedIntake(event.intake)) return '/event';
    if (!areHypothesesConfirmed(event)) return '/event-map';
    if (event.status !== 'OPTIONS') return '/event-map';
    return null;
  }
  return null;
}
