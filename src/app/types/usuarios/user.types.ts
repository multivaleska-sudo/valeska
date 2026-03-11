export type UserRole = "ADMIN" | "USER";
export type UserStatus = "active" | "blocked";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}
