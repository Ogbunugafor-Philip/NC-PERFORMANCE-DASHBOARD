import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { InsightData } from '../../api/insights';
import { getMyInsight, getRegionalInsight, refreshInsight } from '../../api/insights';

interface AIInsightCardProps {
  source: 'me' | 'regional';
  title?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  CEREBRAS: 'Powered by Cerebras',
  FALLBACK: 'Smart Analysis',
};

const SOURCE_COLORS: Record<string, string> = {
  CEREBRAS: '#00897B',
  FALLBACK: '#757575',
};

function formatTs(iso: string): string {
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

export const AIInsightCard = ({ source, title = 'AI Performance Insight' }: AIInsightCardProps) => {
  const queryClient = useQueryClient();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const queryKey = source === 'me' ? ['insight-me'] : ['insight-regional'];
  const fetchFn = source === 'me' ? getMyInsight : getRegionalInsight;

  const query = useQuery<InsightData>({
    queryKey,
    queryFn: fetchFn,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const refresh = useMutation({
    mutationFn: refreshInsight,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      setRefreshError(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? 'Unable to refresh. Please try again.';
      setRefreshError(detail);
    },
  });

  const handleRefresh = () => {
    setRefreshError(null);
    refresh.mutate();
  };

  return (
    <Card
      sx={{
        border: '1px solid transparent',
        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #E4002B, #1A1A1A) border-box',
        borderRadius: 2,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#E4002B', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {query.data && (
              <Chip
                label={SOURCE_LABELS[query.data.insight_source] ?? 'Smart Analysis'}
                size="small"
                sx={{
                  bgcolor: SOURCE_COLORS[query.data.insight_source] ?? '#757575',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                }}
              />
            )}
            <Tooltip title="Refresh insight">
              <span>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={refresh.isPending || query.isLoading}
                  sx={{ color: '#E4002B' }}
                >
                  {refresh.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Body */}
        {query.isLoading && (
          <>
            <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="95%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="88%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="72%" height={20} />
          </>
        )}

        {!query.isLoading && query.error && !query.data && (
          <Box>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem', mb: 1 }}>
              {(query.error as any)?.response?.status === 404
                ? 'Upload a performance report to see AI insights.'
                : 'Unable to generate insight at this time. Please try again.'}
            </Typography>
          </Box>
        )}

        {!query.isLoading && query.data && (
          <>
            {refresh.isPending && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  zIndex: 2,
                }}
              >
                <CircularProgress size={28} sx={{ color: '#E4002B' }} />
              </Box>
            )}
            <Typography
              sx={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: '#1A1A1A',
                mb: 1.5,
              }}
            >
              {query.data.insight_text}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generated {formatTs(query.data.generated_at)}
            </Typography>
          </>
        )}

        {refreshError && (
          <Typography
            variant="caption"
            sx={{ color: '#E4002B', display: 'block', mt: 1 }}
          >
            {refreshError}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
