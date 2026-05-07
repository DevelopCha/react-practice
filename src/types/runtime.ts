export type LogKind = 'Mount' | 'Effect' | 'Handler' | 'Flow' | 'API' | 'Mock' | 'Dispatch' | 'Reducer' | 'Render' | 'Error';

export type RuntimeLog = {
  id: number;
  kind: LogKind;
  message: string;
  timestamp?: string;
};

export type FlowStep = {
  id: string;
  label: string;
  status?: 'pending' | 'active' | 'done';
  meaning?: string;
  data?: unknown;
  codeLocation?: string;
  timestamp?: string;
  layer?: string;
  importance?: 'core' | 'support';
  breakpointTip?: string;
  changeSummary?: string;
  graphColumn?: number;
  graphRow?: number;
  graphParents?: string[];
};

export type RuntimeEvent = {
  stepId: string;
  kind: LogKind;
  message: string;
  callStack?: string[];
  delay?: number;
};
