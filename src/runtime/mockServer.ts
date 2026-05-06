import { addFlowStep } from './flowTracker';
import { addLog } from './logger';
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
    const delay = getRandomNetworkDelay();

    addLog('Mock', `${apiKey} request scheduled (${delay}ms)`);
    addFlowStep(`mockServer.request(${apiKey})`);

    return new Promise((resolve, reject) => {
      globalThis.setTimeout(() => {
        if (config.status === 200) {
          addLog('Mock', `${apiKey}:${config.status}:${config.message}`);
          addFlowStep(`mockServer resolved ${apiKey}`);
          resolve({
            status: config.status,
            message: config.message,
            data: mockData as TData,
          });
          return;
        }

        addLog('Mock', `${apiKey}:${config.status}:${config.message}`);
        addFlowStep(`mockServer rejected ${apiKey}`);
        reject({
          response: {
            status: config.status,
            message: config.message,
          },
        } satisfies MockServerFailure);
      }, delay);
    });
  },
};
