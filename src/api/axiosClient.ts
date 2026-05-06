import axios from 'axios';
import { getApiLabRequestPayload } from '../runtime/apiLab';
import { addApiRequest, rejectApiRequest, resolveApiRequest } from '../runtime/apiMonitor';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { mockServer } from '../runtime/mockServer';

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 1000,
});

export const axiosClient = {
  instance: axiosInstance,
  get<T>(apiKey: string, data?: T) {
    addLog('API', `axiosClient.get(${apiKey})`);
    addFlowStep(`axiosClient.get(${apiKey})`, {
      meaning: 'GET 요청을 API monitor에 등록하고 mock server로 전달합니다.',
      codeLocation: 'src/api/axiosClient.ts:14',
    });
    const requestPayload = getApiLabRequestPayload(apiKey, null);
    const apiEvent = addApiRequest('GET', apiKey, requestPayload);
    return mockServer
      .request<T>({ apiKey, mockData: data })
      .then((response) => {
        resolveApiRequest(apiEvent.id, response);
        return response;
      })
      .catch((error) => {
        rejectApiRequest(apiEvent.id, error);
        throw error;
      });
  },
  post<TResponse, TPayload = unknown>(apiKey: string, payload?: TPayload, mockData?: TResponse) {
    addLog('API', `axiosClient.post(${apiKey})`);
    addFlowStep(`axiosClient.post(${apiKey})`, {
      meaning: 'POST payload를 API monitor에 등록하고 mock server로 전달합니다.',
      codeLocation: 'src/api/axiosClient.ts:29',
    });
    const requestPayload = getApiLabRequestPayload(apiKey, payload ?? null);
    const apiEvent = addApiRequest('POST', apiKey, requestPayload);
    return mockServer
      .request<TResponse>({ apiKey, mockData: mockData ?? (requestPayload as TResponse) })
      .then((response) => {
        resolveApiRequest(apiEvent.id, response);
        return response;
      })
      .catch((error) => {
        rejectApiRequest(apiEvent.id, error);
        throw error;
      });
  },
  delete<TResponse, TPayload = unknown>(apiKey: string, payload?: TPayload, mockData?: TResponse) {
    addLog('API', `axiosClient.delete(${apiKey})`);
    addFlowStep(`axiosClient.delete(${apiKey})`, {
      meaning: 'DELETE 요청 payload를 API monitor에 등록하고 mock server로 전달합니다.',
      codeLocation: 'src/api/axiosClient.ts:45',
    });
    const requestPayload = getApiLabRequestPayload(apiKey, payload ?? null);
    const apiEvent = addApiRequest('DELETE', apiKey, requestPayload);
    return mockServer
      .request<TResponse>({ apiKey, mockData: mockData ?? (requestPayload as TResponse) })
      .then((response) => {
        resolveApiRequest(apiEvent.id, response);
        return response;
      })
      .catch((error) => {
        rejectApiRequest(apiEvent.id, error);
        throw error;
      });
  },
};
