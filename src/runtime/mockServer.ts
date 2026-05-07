import { addFlowStep } from './flowTracker';
import { addLog } from './logger';
import { getApiLabMessage, getApiLabResponseData, getApiLabStatus } from './apiLab';
import { getMockConfig, type MockStatusConfig } from './mockQueryParser';

export type MockApiKey = 'auth' | 'login' | 'users' | 'write' | 'delete' | string;

export type MockServerRequest<TData> = {
  apiKey: MockApiKey;
  mockData?: TData;
};

export type MockServerSuccess<TData> = {
  status: number;
  message: string;
  data: TData;
};

export type MockServerFailure = {
  response: {
    status: number;
    message: string;
  };
};

const defaultMockConfig: Record<string, MockStatusConfig> = {
  auth: { status: 200, message: 'session restored' },
  login: { status: 200, message: 'login success' },
  users: { status: 200, message: 'list fetch success' },
  write: { status: 200, message: 'create success' },
  delete: { status: 200, message: 'delete success' },
  logout: { status: 200, message: 'logout success' },
};

function getRandomNetworkDelay() {
  return Math.floor(Math.random() * 701) + 500;
}

export const mockServer = {
  request<TData>({ apiKey, mockData }: MockServerRequest<TData>): Promise<MockServerSuccess<TData>> {
    const fallback = defaultMockConfig[apiKey] ?? { status: 200, message: 'mock success' };
    const config = getMockConfig(apiKey, fallback);
    const labStatus = getApiLabStatus(apiKey);
    const labMessage = getApiLabMessage(apiKey);
    const effectiveStatus = labStatus ?? config.status;
    const effectiveMessage = labMessage ?? config.message;
    const delay = getRandomNetworkDelay();

    addLog('Mock', `${apiKey} request scheduled (${delay}ms)`);
    addFlowStep(`mockServer.request(${apiKey})`, {
      meaning: 'mock 설정과 API Lab override를 적용해 응답을 예약합니다.',
      codeLocation: 'src/runtime/mockServer.ts:36',
      layer: 'Mock',
      importance: 'core',
      breakpointTip: 'mock status/message override가 실제 어떤 응답으로 해석되는지 확인합니다.',
      changeSummary: 'mock 응답 시나리오가 결정되고 응답이 예약됩니다.',
      graphColumn: 3,
      graphRow: 1,
      graphParents: ['auth-preview-5'],
    });

    return new Promise((resolve, reject) => {
      globalThis.setTimeout(() => {
        if (effectiveStatus === 200) {
          const responseData = getApiLabResponseData(apiKey, mockData as TData);
          addLog('Mock', `${apiKey}:${effectiveStatus}:${effectiveMessage}`);
          addFlowStep(`mockServer resolved ${apiKey}`, {
            meaning: '성공 응답을 resolve하고 response data를 다음 단계로 넘깁니다.',
            codeLocation: 'src/runtime/mockServer.ts:52',
            layer: 'Mock',
            importance: 'support',
            breakpointTip: '응답 data shape가 기대한 userInfo 형태인지 확인합니다.',
            changeSummary: '성공 응답 payload가 애플리케이션으로 돌아옵니다.',
            graphColumn: 4,
            graphRow: 1,
            graphParents: ['auth-preview-6'],
          });
          resolve({
            status: effectiveStatus,
            message: effectiveMessage,
            data: responseData,
          });
          return;
        }

        addLog('Mock', `${apiKey}:${effectiveStatus}:${effectiveMessage}`);
        addFlowStep(`mockServer rejected ${apiKey}`, {
          meaning: '실패 응답을 reject하여 catch 흐름으로 이동시킵니다.',
          codeLocation: 'src/runtime/mockServer.ts:63',
          layer: 'Mock',
          importance: 'core',
          breakpointTip: '실패 status/message가 catch에서 처리할 값과 같은지 확인합니다.',
          changeSummary: '실패 응답이 reject되어 fallback 흐름으로 넘어갑니다.',
          graphColumn: 4,
          graphRow: 2,
          graphParents: ['auth-preview-6'],
        });
        reject({
          response: {
            status: effectiveStatus,
            message: effectiveMessage,
          },
        } satisfies MockServerFailure);
      }, delay);
    });
  },
};
