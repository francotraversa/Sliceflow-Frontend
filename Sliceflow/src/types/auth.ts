export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserLoginCreds {
  username: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  expires: number; // int64 en Go
}

export interface UserCreateCreds {
  username: string;
  password: string;
  role: string;
}

export type JwtPayload = {
  user?: string;
  role?: string;
  user_id?: number;
  exp?: number;
};
