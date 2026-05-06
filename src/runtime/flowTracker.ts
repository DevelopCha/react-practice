import { addLog } from './logger';

export type RuntimeFlowStepDetails = {
  meaning?: string;
  data?: unknown;
  codeLocation?: string;
  status?: 'pending' | 'active' | 'done';
};

export type RuntimeFlowEntry = RuntimeFlowStepDetails & {
  id: number;
  step: string;
  timestamp: string;
};

let nextFlowId = 1;
let flow: RuntimeFlowEntry[] = [];

function notifyFlowChanged() {
  if (typeof window !== 'undefined') {
    globalThis.setTimeout(() => {
      window.dispatchEvent(new Event('runtime-flow-changed'));
    }, 0);
  }
}

export function addFlowStep(step: string, details: RuntimeFlowStepDetails = {}): RuntimeFlowEntry {
  const entry: RuntimeFlowEntry = {
    id: nextFlowId,
    step,
    timestamp: new Date().toISOString(),
    status: details.status ?? 'done',
    meaning: details.meaning,
    data: details.data,
    codeLocation: details.codeLocation,
  };

  nextFlowId += 1;
  flow = [...flow, entry];
  addLog('Flow', `step ${entry.id}: ${step}`);
  notifyFlowChanged();

  return entry;
}

export function clearFlow() {
  flow = [];
  nextFlowId = 1;
  notifyFlowChanged();
}

export function getFlow(): RuntimeFlowEntry[] {
  return [...flow];
}
