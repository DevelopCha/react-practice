import { createContext, useCallback, useEffect, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FlowStep, RuntimeEvent, RuntimeLog } from '../types/runtime';
import { clearApiEvents, getApiEvents, type ApiMonitorEntry } from './apiMonitor';
import { addFlowStep, clearFlow, getFlow } from './flowTracker';
import { addLog, clearLogs, getLogs } from './logger';
import { createStateDiff, type StateDiffEntry } from './stateDiff';

type TraceSession = {
  id: number;
  title: string;
  startedAt: string;
  input?: unknown;
  result?: string;
};

type Checkpoint = {
  id: number;
  flowStepId: string;
  name: string;
  label: string;
  data: unknown;
  meaning?: string;
  codeLocation?: string;
  timestamp: string;
};

type RuntimeContextValue = {
  flowSteps: FlowStep[];
  activeStepId: string | null;
  selectedStepId: string | null;
  selectedStep: FlowStep | null;
  logs: RuntimeLog[];
  apiEvents: ApiMonitorEntry[];
  selectedApiEventId: number | null;
  selectedApiEvent: ApiMonitorEntry | null;
  traceSession: TraceSession | null;
  checkpoints: Checkpoint[];
  selectedCheckpoint: Checkpoint | null;
  stateDiff: StateDiffEntry[];
  stateDiffReason: string | null;
  callStack: string[];
  beginTraceSession: (
    title: string,
    firstStep: string,
    callChain?: string[],
    input?: unknown,
    firstStepDetails?: { meaning?: string; codeLocation?: string },
  ) => TraceSession;
  completeTraceSession: (result: string) => void;
  observe: (name: string, data: unknown, details?: { label?: string; meaning?: string; codeLocation?: string }) => void;
  selectFlowStep: (stepId: string) => void;
  selectApiEvent: (id: number) => void;
  captureStateDiff: (before: unknown, after: unknown, reason?: string) => void;
  setFlowSteps: (steps: FlowStep[]) => void;
  setPreviewFlowSteps: (steps: FlowStep[]) => void;
  resetRuntime: (steps?: FlowStep[]) => void;
  appendLog: (kind: RuntimeLog['kind'], message: string) => void;
  pushRuntimeFlowStep: (step: string) => { id: number; step: string; timestamp: string };
  refreshRuntimeSnapshot: () => void;
  setCallStack: (stack: string[]) => void;
  runEvents: (events: RuntimeEvent[]) => Promise<void>;
};

const RuntimeContext = createContext<RuntimeContextValue | null>(null);
let nextTraceSessionId = 1;
let nextCheckpointId = 1;

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [flowSteps, setFlowStepsState] = useState<FlowStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [apiEvents, setApiEvents] = useState<ApiMonitorEntry[]>([]);
  const [selectedApiEventId, setSelectedApiEventId] = useState<number | null>(null);
  const [traceSession, setTraceSession] = useState<TraceSession | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<number | null>(null);
  const [stateDiff, setStateDiff] = useState<StateDiffEntry[]>([]);
  const [stateDiffReason, setStateDiffReason] = useState<string | null>(null);
  const [callStack, setCallStackState] = useState<string[]>([]);
  const [previewFlowSteps, setPreviewFlowStepsState] = useState<FlowStep[]>([]);

  const syncLogsFromStore = useCallback(() => {
    setLogs(getLogs().map((log) => ({ id: log.id, kind: log.type, message: log.message, timestamp: log.timestamp })));
  }, []);

  const syncFlowFromStore = useCallback(() => {
    const trackedFlow = getFlow();
    const runtimeSteps: FlowStep[] = trackedFlow.map((entry) => ({
      id: String(entry.id),
      label: entry.step,
      status: entry.status,
      meaning: entry.meaning,
      data: entry.data,
      codeLocation: entry.codeLocation,
      timestamp: entry.timestamp,
    }));
    const latestRuntimeStepId = runtimeSteps[runtimeSteps.length - 1]?.id ?? null;
    const runtimeStepByLabel = new Map(runtimeSteps.map((step) => [step.label, step]));
    const previewLabels = new Set(previewFlowSteps.map((step) => step.label));
    let activeMergedStepId = latestRuntimeStepId;

    const mergedPreviewSteps = previewFlowSteps.map((previewStep) => {
      const runtimeStep = runtimeStepByLabel.get(previewStep.label);

      if (!runtimeStep) {
        return { ...previewStep, status: 'pending' as const };
      }

      const isActive = runtimeStep.id === latestRuntimeStepId;
      if (isActive) {
        activeMergedStepId = previewStep.id;
      }

      return {
        ...previewStep,
        ...runtimeStep,
        id: previewStep.id,
        status: isActive ? ('active' as const) : ('done' as const),
        meaning: runtimeStep.meaning ?? previewStep.meaning,
        data: runtimeStep.data ?? previewStep.data,
        codeLocation: runtimeStep.codeLocation ?? previewStep.codeLocation,
        timestamp: runtimeStep.timestamp,
      };
    });

    const extraRuntimeSteps = runtimeSteps
      .filter((step) => !previewLabels.has(step.label))
      .map((step) => ({
        ...step,
        status: step.id === latestRuntimeStepId ? ('active' as const) : ('done' as const),
      }));

    const nextSteps =
      previewFlowSteps.length > 0 ? [...mergedPreviewSteps, ...extraRuntimeSteps] : extraRuntimeSteps;

    setFlowStepsState(nextSteps);
    setActiveStepId(activeMergedStepId);
    setSelectedStepId((currentId) => {
      if (activeMergedStepId) {
        return activeMergedStepId;
      }

      if (currentId && nextSteps.some((step) => step.id === currentId)) {
        return currentId;
      }

      return nextSteps[0]?.id ?? null;
    });
  }, [previewFlowSteps]);

  const syncApiEventsFromStore = useCallback(() => {
    const nextApiEvents = getApiEvents();
    setApiEvents(nextApiEvents);
    setSelectedApiEventId((currentId) => {
      if (currentId && nextApiEvents.some((event) => event.id === currentId)) {
        return currentId;
      }

      return nextApiEvents[0]?.id ?? null;
    });
  }, []);

  const appendLog = useCallback((kind: RuntimeLog['kind'], message: string) => {
    addLog(kind, message);
    syncLogsFromStore();
  }, [syncLogsFromStore]);

  const refreshRuntimeSnapshot = useCallback(() => {
    syncLogsFromStore();
    syncFlowFromStore();
    syncApiEventsFromStore();
  }, [syncApiEventsFromStore, syncFlowFromStore, syncLogsFromStore]);

  const beginTraceSession = useCallback(
    (
      title: string,
      firstStep: string,
      callChain: string[] = [],
      input?: unknown,
      firstStepDetails: { meaning?: string; codeLocation?: string } = {},
    ) => {
      clearLogs();
      clearFlow();
      clearApiEvents();
      nextCheckpointId = 1;

      const nextSession: TraceSession = {
        id: nextTraceSessionId,
        title,
        startedAt: new Date().toISOString(),
        input,
      };

      nextTraceSessionId += 1;
      setTraceSession(nextSession);
      setCheckpoints([]);
      setSelectedCheckpointId(null);
      setSelectedStepId(null);
      setActiveStepId(null);
      setStateDiff([]);
      setStateDiffReason(null);
      setSelectedApiEventId(null);
      setCallStackState(callChain);

      addLog('Handler', `${title} trace session started`);
      const firstFlowStep = addFlowStep(firstStep, {
        meaning: firstStepDetails.meaning ?? '사용자 행동 하나가 독립적인 실험 Session을 시작합니다.',
        data: input,
        codeLocation: firstStepDetails.codeLocation,
      });
      setSelectedStepId(String(firstFlowStep.id));
      refreshRuntimeSnapshot();

      return nextSession;
    },
    [refreshRuntimeSnapshot],
  );

  const completeTraceSession = useCallback((result: string) => {
    setTraceSession((currentSession) => (currentSession ? { ...currentSession, result } : currentSession));
    setFlowStepsState((currentSteps) =>
      currentSteps.map((step) => (step.status === 'active' ? { ...step, status: 'done' } : step)),
    );
    setActiveStepId(null);
    addLog('Render', `Session result: ${result}`);
    syncLogsFromStore();
  }, [syncLogsFromStore]);

  const selectApiEvent = useCallback((id: number) => {
    setSelectedApiEventId(id);
  }, []);

  const selectFlowStep = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedCheckpointId(checkpoints.find((entry) => entry.flowStepId === stepId)?.id ?? null);
  }, [checkpoints]);

  const observe = useCallback(
    (name: string, data: unknown, details: { label?: string; meaning?: string; codeLocation?: string } = {}) => {
      const flowStep = addFlowStep(details.label ?? name, {
        meaning: details.meaning,
        data,
        codeLocation: details.codeLocation,
      });
      const checkpoint: Checkpoint = {
        id: nextCheckpointId,
        flowStepId: String(flowStep.id),
        name,
        label: details.label ?? name,
        data,
        meaning: details.meaning,
        codeLocation: details.codeLocation,
        timestamp: new Date().toISOString(),
      };

      nextCheckpointId += 1;
      setCheckpoints((current) => [...current, checkpoint]);
      setSelectedCheckpointId(checkpoint.id);
      setSelectedStepId(String(flowStep.id));
      refreshRuntimeSnapshot();
    },
    [refreshRuntimeSnapshot],
  );

  const captureStateDiff = useCallback((before: unknown, after: unknown, reason?: string) => {
    setStateDiff(createStateDiff(before, after));
    setStateDiffReason(reason ?? null);
  }, []);

  useEffect(() => {
    clearLogs();
    clearFlow();
    clearApiEvents();
    addLog('Mount', 'App runtime engine initialized');
    addFlowStep('App startup flow initialized');
    syncLogsFromStore();
    syncFlowFromStore();
    syncApiEventsFromStore();
  }, [syncApiEventsFromStore, syncFlowFromStore, syncLogsFromStore]);

  useEffect(() => {
    window.addEventListener('runtime-logger-changed', refreshRuntimeSnapshot);
    window.addEventListener('runtime-flow-changed', refreshRuntimeSnapshot);
    window.addEventListener('runtime-api-monitor-changed', refreshRuntimeSnapshot);

    return () => {
      window.removeEventListener('runtime-logger-changed', refreshRuntimeSnapshot);
      window.removeEventListener('runtime-flow-changed', refreshRuntimeSnapshot);
      window.removeEventListener('runtime-api-monitor-changed', refreshRuntimeSnapshot);
    };
  }, [refreshRuntimeSnapshot]);

  const pushRuntimeFlowStep = useCallback((step: string) => {
    const entry = addFlowStep(step);
    syncFlowFromStore();
    return entry;
  }, [syncFlowFromStore]);

  const setFlowSteps = useCallback((steps: FlowStep[]) => {
    setFlowStepsState(steps);
    setPreviewFlowStepsState([]);
    setActiveStepId(null);
    setSelectedStepId(steps[0]?.id ?? null);
  }, []);

  const setPreviewFlowSteps = useCallback((steps: FlowStep[]) => {
    const previewSteps = steps.map((step) => ({
      ...step,
      status: step.status ?? ('pending' as const),
    }));

    clearFlow();
    setPreviewFlowStepsState(previewSteps);
    setFlowStepsState(previewSteps);
    setActiveStepId(null);
    setSelectedStepId(previewSteps[0]?.id ?? null);
    setSelectedCheckpointId(null);
    setCheckpoints([]);
    setTraceSession(null);
    setStateDiff([]);
    setStateDiffReason(null);
  }, []);

  const resetRuntime = useCallback((steps?: FlowStep[]) => {
    clearLogs();
    clearFlow();
    clearApiEvents();
    if (steps) {
      setFlowStepsState(steps);
      setPreviewFlowStepsState(steps);
    } else {
      setFlowStepsState([]);
      setPreviewFlowStepsState([]);
    }
    setActiveStepId(null);
    setSelectedStepId(steps?.[0]?.id ?? null);
    setLogs([]);
    setApiEvents([]);
    setSelectedApiEventId(null);
    setStateDiff([]);
    setStateDiffReason(null);
    setCheckpoints([]);
    setSelectedCheckpointId(null);
    setCallStackState([]);
  }, []);

  const setCallStack = useCallback((stack: string[]) => {
    setCallStackState(stack);
  }, []);

  const runEvents = useCallback(
    async (events: RuntimeEvent[]) => {
      for (const event of events) {
        setActiveStepId(event.stepId);
        setSelectedStepId(event.stepId);
        if (event.callStack) {
          setCallStackState(event.callStack);
        }
        addLog(event.kind, event.message);
        addFlowStep(event.message);
        syncLogsFromStore();
        await new Promise((resolve) => window.setTimeout(resolve, event.delay ?? 280));
      }
    },
    [syncLogsFromStore],
  );

  const value = useMemo(
    () => ({
      flowSteps,
      activeStepId,
      selectedStepId,
      selectedStep:
        flowSteps.find((step) => step.id === selectedStepId) ??
        flowSteps.find((step) => step.id === activeStepId) ??
        flowSteps[flowSteps.length - 1] ??
        null,
      logs,
      apiEvents,
      selectedApiEventId,
      selectedApiEvent: apiEvents.find((event) => event.id === selectedApiEventId) ?? apiEvents[0] ?? null,
      traceSession,
      checkpoints,
      selectedCheckpoint: selectedCheckpointId
        ? checkpoints.find((checkpoint) => checkpoint.id === selectedCheckpointId) ?? null
        : null,
      stateDiff,
      stateDiffReason,
      callStack,
      beginTraceSession,
      completeTraceSession,
      observe,
      selectFlowStep,
      selectApiEvent,
      captureStateDiff,
      setFlowSteps,
      setPreviewFlowSteps,
      resetRuntime,
      appendLog,
      pushRuntimeFlowStep,
      refreshRuntimeSnapshot,
      setCallStack,
      runEvents,
    }),
    [
      activeStepId,
      appendLog,
      apiEvents,
      beginTraceSession,
      callStack,
      completeTraceSession,
      captureStateDiff,
      checkpoints,
      flowSteps,
      observe,
      pushRuntimeFlowStep,
      refreshRuntimeSnapshot,
      resetRuntime,
      runEvents,
      selectApiEvent,
      selectFlowStep,
      selectedApiEventId,
      selectedStepId,
      setCallStack,
      setFlowSteps,
      setPreviewFlowSteps,
      stateDiff,
      stateDiffReason,
      traceSession,
      selectedCheckpointId,
    ],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useRuntime() {
  const value = useContext(RuntimeContext);

  if (!value) {
    throw new Error('useRuntime must be used inside RuntimeProvider');
  }

  return value;
}
