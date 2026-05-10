import api from '@/services/api';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', payload);
  const { data } = response.data;

  if (!response.data.success || !data?.accessToken) {
    throw new Error(response.data.message || 'Đăng nhập thất bại.');
  }

  return data;
};

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', payload);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Đăng ký thất bại.');
  }

  return response.data.data;
};