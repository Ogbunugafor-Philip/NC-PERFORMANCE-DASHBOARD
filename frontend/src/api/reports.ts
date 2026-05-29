import { apiClient } from './axios';
import type { ReportStatus } from '../types/dashboard';

export const uploadReport = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/reports/upload', formData);
  return data;
};

export const getReportStatus = async () => {
  const { data } = await apiClient.get<ReportStatus>('/reports/status');
  return data;
};

export const getActiveReport = async () => {
  const { data } = await apiClient.get('/reports/active');
  return data;
};
