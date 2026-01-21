export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  fullName: string;
  role: UserRole;
}

export interface TimeRecord {
  id: string;
  userId: string;
  timestamp: number;
  type: 'IN' | 'OUT';
  photoUrl: string; // Base64 string
  latitude: number;
  longitude: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}