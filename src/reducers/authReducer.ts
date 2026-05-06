import type { AuthState } from '../types/auth';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { AUTH_RESTORE, LOGIN_SUCCESS, LOGOUT, type AuthAction } from './authActionTypes';

export const initialAuthState: AuthState = {
  isLogin: false,
  userInfo: null,
  authChecked: false,
  loading: false,
  error: null,
  message: null,
};

function recordReducerStep(message: string) {
  addLog('Reducer', message);
  addFlowStep(message);
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AUTH_RESTORE:
      recordReducerStep('authReducer handled AUTH_RESTORE');
      return {
        ...state,
        isLogin: true,
        userInfo: action.payload.userInfo,
        authChecked: true,
        loading: false,
        error: null,
        message: action.payload.message,
      };
    case LOGIN_SUCCESS:
      recordReducerStep('authReducer handled LOGIN_SUCCESS');
      return {
        ...state,
        isLogin: true,
        userInfo: action.payload.userInfo,
        authChecked: true,
        loading: false,
        error: null,
        message: action.payload.message,
      };
    case LOGOUT:
      recordReducerStep('authReducer handled LOGOUT');
      return {
        ...initialAuthState,
        authChecked: true,
        error: action.payload?.error ?? null,
        message: action.payload?.message ?? null,
      };
    default:
      return state;
  }
}
