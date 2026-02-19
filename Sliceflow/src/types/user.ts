export type UserRole = "admin" | "user";
export type UserStatus = "active" | "disabled";

export type User = {
  id: number;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
};

export type UserCreateCreds = {
  username: string;
  password: string;
  role?: UserRole; // default user
};

export type UserUpdateCreds = {
  username?: string;
  password?: string;
  role?: UserRole; // backend only allows admin to change
};
