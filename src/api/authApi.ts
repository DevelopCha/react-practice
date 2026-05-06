import type { LoginPayload, UserInfo } from '../types/auth';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { axiosClient } from './axiosClient';

export const authApi = {
  checkAuth() {
    addLog('API', 'authApi.checkAuth() called');
    addFlowStep('authApi.checkAuth()');
    return axiosClient.get<UserInfo>('auth', { id: 'admin', name: 'Legacy Admin' });
  },
  login(payload: LoginPayload) {
    addLog('API', 'authApi.login() called');
    addFlowStep('authApi.login()');
    return axiosClient.post<UserInfo, LoginPayload>('login', payload, {
      id: payload.id || 'admin',
      name: payload.id ? `${payload.id} User` : 'Legacy Admin',
    });
  },
  logout() {
    addLog('API', 'authApi.logout() called');
    addFlowStep('authApi.logout()');
    return axiosClient.post<null>('logout', null);
  },
};
