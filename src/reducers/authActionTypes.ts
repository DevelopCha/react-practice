import type { UserInfo } from '../types/auth';

export const AUTH_RESTORE = 'AUTH_RESTORE';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGOUT = 'LOGOUT';

export type AuthAction =
  | { type: typeof AUTH_RESTORE; payload: { userInfo: UserInfo; message: string } }
  | { type: typeof LOGIN_SUCCESS; payload: { userInfo: UserInfo; message: string } }
  | { type: typeof LOGOUT; payload?: { message?: string; error?: string } };
