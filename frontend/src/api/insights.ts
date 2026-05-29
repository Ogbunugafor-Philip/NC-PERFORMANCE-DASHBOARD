import { apiClient } from './axios';

export interface InsightData {
  insight_text: string;
  insight_source: 'CEREBRAS' | 'FALLBACK';
  generated_at: string;
  role: string;
}

export interface InsightStatus {
  cerebras_available: boolean;
  cerebras_model: string;
  total_insights: number;
  cerebras_count: number;
  fallback_count: number;
  last_generated_at: string | null;
}

export const getMyInsight = async (): Promise<InsightData> => {
  const { data } = await apiClient.get<InsightData>('/insights/me');
  return data;
};

export const refreshInsight = async (): Promise<InsightData> => {
  const { data } = await apiClient.post<InsightData>('/insights/refresh');
  return data;
};

export const getRegionalInsight = async (): Promise<InsightData> => {
  const { data } = await apiClient.get<InsightData>('/insights/regional');
  return data;
};

export const getInsightStatus = async (): Promise<InsightStatus> => {
  const { data } = await apiClient.get<InsightStatus>('/insights/status');
  return data;
};

export const generateAllInsights = async (): Promise<{ status: string; message: string }> => {
  const { data } = await apiClient.post('/insights/generate-all');
  return data;
};
