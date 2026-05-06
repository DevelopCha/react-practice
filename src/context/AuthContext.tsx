import { createContext, useCallback, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { AUTH_RESTORE, LOGIN_SUCCESS, LOGOUT, type AuthAction } from '../reducers/authActionTypes';
import { authReducer, initialAuthState } from '../reducers/authReducer';
import type { AuthState, LoginPayload } from '../types/auth';

export const AuthStateContext = createContext<AuthState | null>(null);
export const AuthDispatchContext = createContext<Dispatch<AuthAction> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>{children}</AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const state = useContext(AuthStateContext);

  if (!state) {
    throw new Error('useAuthState must be used inside AuthProvider');
  }

  return state;
}

export function useAuthDispatch() {
  const dispatch = useContext(AuthDispatchContext);

  if (!dispatch) {
    throw new Error('useAuthDispatch must be used inside AuthProvider');
  }

  return dispatch;
}

export function useAuth() {
  const state = useAuthState();
  const dispatch = useAuthDispatch();

  const login = useCallback(
    (payload: LoginPayload) =>
      authApi
        .login(payload)
        .then((response) => {
          dispatch({ type: LOGIN_SUCCESS, payload: { userInfo: response.data, message: response.message } });
        })
        .catch((error) => {
          dispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'login failed' } });
        }),
    [dispatch],
  );

  const checkAuth = useCallback(
    () =>
      authApi
        .checkAuth()
        .then((response) => {
          dispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
        })
        .catch((error) => {
          dispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'auth check failed' } });
        }),
    [dispatch],
  );

  const logout = useCallback(() => {
    authApi.logout().finally(() => {
      dispatch({ type: LOGOUT, payload: { message: 'logout complete' } });
    });
  }, [dispatch]);

  return { state, checkAuth, login, logout };
}
