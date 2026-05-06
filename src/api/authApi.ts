import type { LoginPayload, UserInfo } from '../types/auth';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { axiosClient } from './axiosClient';

export const authApi = {
  checkAuth() {
    addLog('API', 'authApi.checkAuth() called');
    addFlowStep('authApi.checkAuth()', {
      meaning: '인증 세션 복원을 위해 auth API 함수를 호출합니다.',
      codeLocation: 'src/api/authApi.ts:7',
    });
    return axiosClient.get<UserInfo>('auth', { id: 'admin', name: 'Legacy Admin' });
  },
  login(payload: LoginPayload) {
    addLog('API', 'authApi.login() called');
    addFlowStep('authApi.login()', {
      meaning: '로그인 form payload를 인증 API 요청으로 넘깁니다.',
      codeLocation: 'src/api/authApi.ts:14',
    });
    return axiosClient.post<UserInfo, LoginPayload>('login', payload, {
      id: payload.id || 'admin',
      name: payload.id ? `${payload.id} User` : 'Legacy Admin',
    });
  },
  logout() {
    addLog('API', 'authApi.logout() called');
    addFlowStep('authApi.logout()', {
      meaning: '현재 인증 세션을 종료하는 API 요청을 시작합니다.',
      codeLocation: 'src/api/authApi.ts:25',
    });
    return axiosClient.post<null>('logout', null);
  },
};
