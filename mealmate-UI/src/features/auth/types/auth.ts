export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  gender?: string;
}

export interface AuthResponse {
  userId: number;
  accessToken?: string;
  tokenType?: string;
  email: string;
  fullName: string;
  role?: string;
  gender?: string;
  familyId?: number;
  familyName?: string;
}

export interface AuthSession {
  userId: number;
  accessToken: string;
  tokenType?: string;
  email: string;
  fullName: string;
  familyId?: number;
  familyName?: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
