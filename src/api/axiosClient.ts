import axios from 'axios';
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
    addFlowStep(`axiosClient.get(${apiKey})`);
    const apiEvent = addApiRequest('GET', apiKey, null);
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
    addFlowStep(`axiosClient.post(${apiKey})`);
    const apiEvent = addApiRequest('POST', apiKey, payload ?? null);
    return mockServer
      .request<TResponse>({ apiKey, mockData: mockData ?? (payload as TResponse) })
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
    addFlowStep(`axiosClient.delete(${apiKey})`);
    const apiEvent = addApiRequest('DELETE', apiKey, payload ?? null);
    return mockServer
      .request<TResponse>({ apiKey, mockData: mockData ?? (payload as TResponse) })
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
