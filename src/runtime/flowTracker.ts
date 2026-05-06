export type RuntimeFlowEntry = {
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

export function addFlowStep(step: string): RuntimeFlowEntry {
  const entry: RuntimeFlowEntry = {
    id: nextFlowId,
    step,
    timestamp: new Date().toISOString(),
  };

  nextFlowId += 1;
  flow = [...flow, entry];
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
