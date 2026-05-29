import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Box, Card, CardContent, Divider, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { InsightStatus } from '../../api/insights';
import { getInsightStatus } from '../../api/insights';

function formatTs(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const CerebrasStatusCard = () => {
  const { data, isLoading } = useQuery<InsightStatus>({
    queryKey: ['insight-status'],
    queryFn: getInsightStatus,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return (
    <Card sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon sx={{ color: '#E4002B' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            AI Engine Status
          </Typography>
        </Box>

        {isLoading ? (
          <>
            <Skeleton width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton width="50%" height={20} />
          </>
        ) : data ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <FiberManualRecordIcon
                sx={{
                  fontSize: 14,
                  color: data.cerebras_available ? '#00A651' : '#E4002B',
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Cerebras API:{' '}
                <span style={{ color: data.cerebras_available ? '#00A651' : '#E4002B' }}>
                  {data.cerebras_available ? 'Online' : 'Offline'}
                </span>
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Model: {data.cerebras_model}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Insights</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.total_insights}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Via Cerebras</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#00897B' }}>
                  {data.cerebras_count}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Via Smart Analysis</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#757575' }}>
                  {data.fallback_count}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last Generated</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatTs(data.last_generated_at)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              All dashboards remain fully functional regardless of AI status.
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Status unavailable
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
