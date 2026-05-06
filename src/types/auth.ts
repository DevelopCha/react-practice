export type UserInfo = {
  id: string;
  name: string;
};

export interface AuthState {
  isLogin: boolean;
  userInfo: UserInfo | null;
  authChecked: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

export type LoginPayload = {
  id: string;
  password: string;
};
