import { apiClient } from './axios';
import type { LoginResponse, UserProfile } from '../types/auth';

export const login = async (identifier: string, password: string) => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { identifier, password });
  return data;
};

export const firstLogin = async (dao_code: string, email: string) => {
  const { data } = await apiClient.post<{ message: string }>('/auth/first-login', { dao_code, email });
  return data;
};

export const changePassword = async (current_password: string, new_password: string) => {
  const { data } = await apiClient.post<{ message: string }>('/auth/change-password', {
    current_password,
    new_password
  });
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
};
