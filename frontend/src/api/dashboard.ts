import { apiClient } from './axios';
import type { DashboardSummary } from '../types/dashboard';

export const getDashboardSummary = async () => {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
};
