import { apiClient } from './axios';
import type { DashboardSummary } from '../types/dashboard';

export const getDashboardSummary = async () => {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
};

export const getFsoMe = async () => {
  const { data } = await apiClient.get('/dashboard/fso/me');
  return data;
};

export const getClusterMe = async () => {
  const { data } = await apiClient.get('/dashboard/cluster/me');
  return data;
};

export const getClusterTeam = async () => {
  const { data } = await apiClient.get('/dashboard/cluster/team');
  return data;
};

export const getRsmSummary = async () => {
  const { data } = await apiClient.get('/dashboard/rsm/summary');
  return data;
};

export const getFsoLeaderboard = async () => {
  const { data } = await apiClient.get('/dashboard/rsm/fso-leaderboard');
  return data;
};

export const getClusterLeaderboard = async () => {
  const { data } = await apiClient.get('/dashboard/rsm/cluster-leaderboard');
  return data;
};

export const getTopPerformers = async () => {
  const { data } = await apiClient.get('/dashboard/rsm/top-performers');
  return data;
};

export const getBottomPerformers = async () => {
  const { data } = await apiClient.get('/dashboard/rsm/bottom-performers');
  return data;
};

export const getAdminSummary = async () => {
  const { data } = await apiClient.get('/dashboard/admin/summary');
  return data;
};

export const recalculate = async () => {
  const { data } = await apiClient.post('/dashboard/admin/recalculate');
  return data;
};

export const getValidation = async () => {
  const { data } = await apiClient.get('/dashboard/admin/validation');
  return data;
};
