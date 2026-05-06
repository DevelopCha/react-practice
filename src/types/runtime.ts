export type LogKind = 'Mount' | 'Effect' | 'Handler' | 'API' | 'Mock' | 'Dispatch' | 'Reducer' | 'Render' | 'Error';

export type RuntimeLog = {
  id: number;
  kind: LogKind;
  message: string;
};

export type FlowStep = {
  id: string;
  label: string;
};

export type RuntimeEvent = {
  stepId: string;
  kind: LogKind;
  message: string;
  callStack?: string[];
  delay?: number;
};
