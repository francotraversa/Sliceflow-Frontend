export interface User {
  IdUser: number;
  Username: string;
  Role: string;
  Status: string;
  id_company: number;
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
  id_company: number;
}

export type JwtPayload = {
  user?: string;
  role?: string;
  user_id?: number;
  company_id?: number;
  exp?: number;
};
