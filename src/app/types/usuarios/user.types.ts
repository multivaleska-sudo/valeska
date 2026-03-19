export type UserRole = "ADMIN_CENTRAL" | "OPERADOR";

export interface User {
  id: string;
  nombre_completo: string;
  username: string;
  rol: UserRole;
  esta_activo: boolean | number;
  dispositivo_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}