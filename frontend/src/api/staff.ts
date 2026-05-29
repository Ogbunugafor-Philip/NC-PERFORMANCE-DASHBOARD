import { apiClient } from './axios';
import type { StaffMember, StaffPayload } from '../types/staff';
import type { UserPosition } from '../types/auth';

export const getStaff = async (filters?: { position?: UserPosition | ''; search?: string }) => {
  const params = Object.fromEntries(Object.entries(filters || {}).filter(([, value]) => value));
  const { data } = await apiClient.get<StaffMember[]>('/admin/staff', { params });
  return data;
};

export const getClusterHeads = async () => {
  const { data } = await apiClient.get<StaffMember[]>('/staff/cluster-heads');
  return data;
};

export const createStaff = async (payload: StaffPayload) => {
  const { data } = await apiClient.post<StaffMember>('/admin/staff', payload);
  return data;
};

export const updateStaff = async (id: string, payload: Partial<StaffPayload> & { is_active?: boolean }) => {
  const { data } = await apiClient.put<StaffMember>(`/admin/staff/${id}`, payload);
  return data;
};

export const deleteStaff = async (id: string) => {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/staff/${id}`);
  return data;
};

export const uploadStaffBulk = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/admin/staff/bulk', formData);
  return data;
};
