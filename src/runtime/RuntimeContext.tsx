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
};

type RuntimeContextValue = {
  flowSteps: FlowStep[];
  activeStepId: string | null;
  logs: RuntimeLog[];
  apiEvents: ApiMonitorEntry[];
  selectedApiEventId: number | null;
  selectedApiEvent: ApiMonitorEntry | null;
  traceSession: TraceSession | null;
  stateDiff: StateDiffEntry[];
  callStack: string[];
  beginTraceSession: (title: string, firstStep: string, callChain?: string[]) => TraceSession;
  selectApiEvent: (id: number) => void;
  captureStateDiff: (before: unknown, after: unknown) => void;
  setFlowSteps: (steps: FlowStep[]) => void;
  resetRuntime: (steps?: FlowStep[]) => void;
  appendLog: (kind: RuntimeLog['kind'], message: string) => void;
  pushRuntimeFlowStep: (step: string) => { id: number; step: string; timestamp: string };
  refreshRuntimeSnapshot: () => void;
  setCallStack: (stack: string[]) => void;
  runEvents: (events: RuntimeEvent[]) => Promise<void>;
};

const RuntimeContext = createContext<RuntimeContextValue | null>(null);
let nextTraceSessionId = 1;

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [flowSteps, setFlowStepsState] = useState<FlowStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [apiEvents, setApiEvents] = useState<ApiMonitorEntry[]>([]);
  const [selectedApiEventId, setSelectedApiEventId] = useState<number | null>(null);
  const [traceSession, setTraceSession] = useState<TraceSession | null>(null);
  const [stateDiff, setStateDiff] = useState<StateDiffEntry[]>([]);
  const [callStack, setCallStackState] = useState<string[]>([]);

  const syncLogsFromStore = useCallback(() => {
    setLogs(getLogs().map((log) => ({ id: log.id, kind: log.type, message: log.message })));
  }, []);

  const syncFlowFromStore = useCallback(() => {
    const trackedFlow = getFlow();
    setFlowStepsState(trackedFlow.map((entry) => ({ id: String(entry.id), label: entry.step })));
    setActiveStepId(trackedFlow.length > 0 ? String(trackedFlow[trackedFlow.length - 1].id) : null);
  }, []);

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
    (title: string, firstStep: string, callChain: string[] = []) => {
      clearLogs();
      clearFlow();
      clearApiEvents();

      const nextSession: TraceSession = {
        id: nextTraceSessionId,
        title,
        startedAt: new Date().toISOString(),
      };

      nextTraceSessionId += 1;
      setTraceSession(nextSession);
      setStateDiff([]);
      setSelectedApiEventId(null);
      setCallStackState(callChain);

      addLog('Handler', `${title} trace session started`);
      addFlowStep(firstStep);
      refreshRuntimeSnapshot();

      return nextSession;
    },
    [refreshRuntimeSnapshot],
  );

  const selectApiEvent = useCallback((id: number) => {
    setSelectedApiEventId(id);
  }, []);

  const captureStateDiff = useCallback((before: unknown, after: unknown) => {
    setStateDiff(createStateDiff(before, after));
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
    setActiveStepId(null);
  }, []);

  const resetRuntime = useCallback((steps?: FlowStep[]) => {
    clearLogs();
    clearFlow();
    clearApiEvents();
    if (steps) {
      setFlowStepsState(steps);
    } else {
      setFlowStepsState([]);
    }
    setActiveStepId(null);
    setLogs([]);
    setApiEvents([]);
    setSelectedApiEventId(null);
    setStateDiff([]);
    setCallStackState([]);
  }, []);

  const setCallStack = useCallback((stack: string[]) => {
    setCallStackState(stack);
  }, []);

  const runEvents = useCallback(
    async (events: RuntimeEvent[]) => {
      for (const event of events) {
        setActiveStepId(event.stepId);
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
      logs,
      apiEvents,
      selectedApiEventId,
      selectedApiEvent: apiEvents.find((event) => event.id === selectedApiEventId) ?? apiEvents[0] ?? null,
      traceSession,
      stateDiff,
      callStack,
      beginTraceSession,
      selectApiEvent,
      captureStateDiff,
      setFlowSteps,
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
      captureStateDiff,
      flowSteps,
      pushRuntimeFlowStep,
      refreshRuntimeSnapshot,
      resetRuntime,
      runEvents,
      selectApiEvent,
      selectedApiEventId,
      setCallStack,
      setFlowSteps,
      stateDiff,
      traceSession,
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
