import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 30000
  });
