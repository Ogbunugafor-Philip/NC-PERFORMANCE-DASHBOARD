import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { InsightData } from '../../api/insights';
import { getMyInsight, getRegionalInsight, refreshInsight } from '../../api/insights';

interface AIInsightCardProps {
  source: 'me' | 'regional';
  title?: string;
}

// ─── Text formatting helpers ────────────────────────────────────────────────

function renderInline(text: string): ReactNode {
  const re =
    /(\*\*[^*]+\*\*|\b\d+(?:\.\d+)?%|\b\d+\/\d+\b|\b(?:target met|on track|at risk|ahead of pace|behind pace|critical)\b)/gi;

  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  // Reset lastIndex for global re-use
  re.lastIndex = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const s = m[0];
    key++;

    if (s.startsWith('**')) {
      parts.push(
        <strong key={key} style={{ fontWeight: 700, color: '#1A1A1A' }}>
          {s.slice(2, -2)}
        </strong>,
      );
    } else if (/^(target met|on track|ahead of pace)$/i.test(s)) {
      parts.push(
        <strong key={key} style={{ fontWeight: 600, color: '#00A651' }}>
          {s}
        </strong>,
      );
    } else if (/^(at risk|critical|behind pace)$/i.test(s)) {
      parts.push(
        <strong key={key} style={{ fontWeight: 600, color: '#E4002B' }}>
          {s}
        </strong>,
      );
    } else {
      // Number or percentage → red bold
      parts.push(
        <strong key={key} style={{ fontWeight: 600, color: '#E4002B' }}>
          {s}
        </strong>,
      );
    }
    last = re.lastIndex;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 0 ? text : <>{parts}</>;
}

function formatInsightText(text: string): ReactNode {
  if (!text?.trim()) return null;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  type Block =
    | { type: 'numbered'; items: string[] }
    | { type: 'bullet'; items: string[] }
    | { type: 'para'; items: string[] };

  const blocks: Block[] = [];

  for (const line of lines) {
    const isNumbered = /^(\d+[.):]|\(\d+\))\s/.test(line);
    const isBullet = /^[-•*]\s/.test(line);
    const last = blocks[blocks.length - 1];

    if (isNumbered) {
      const content = line.replace(/^(\d+[.):]|\(\d+\))\s*/, '').trim();
      if (last?.type === 'numbered') {
        last.items.push(content);
      } else {
        blocks.push({ type: 'numbered', items: [content] });
      }
    } else if (isBullet) {
      const content = line.replace(/^[-•*]\s*/, '').trim();
      if (last?.type === 'bullet') {
        last.items.push(content);
      } else {
        blocks.push({ type: 'bullet', items: [content] });
      }
    } else {
      if (last?.type === 'para') {
        last.items.push(line);
      } else {
        blocks.push({ type: 'para', items: [line] });
      }
    }
  }

  return (
    <Box>
      {blocks.map((block, bi) => {
        if (block.type === 'numbered') {
          return (
            <Box
              key={bi}
              component="ol"
              sx={{ pl: 2.5, my: 1, '& li': { mb: 0.75, lineHeight: 1.8, fontSize: '0.93rem', color: '#333' } }}
            >
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </Box>
          );
        }

        if (block.type === 'bullet') {
          return (
            <Box
              key={bi}
              component="ul"
              sx={{ pl: 2.5, my: 1, '& li': { mb: 0.75, lineHeight: 1.8, fontSize: '0.93rem', color: '#333' } }}
            >
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </Box>
          );
        }

        // Paragraph block
        return (
          <Box key={bi} sx={{ mb: 1.25 }}>
            {block.items.map((line, i) => (
              <Typography
                key={i}
                sx={{ fontSize: '0.93rem', lineHeight: 1.8, color: '#333' }}
              >
                {renderInline(line)}
              </Typography>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Timestamp formatter ─────────────────────────────────────────────────────

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

// ─── Source chip ─────────────────────────────────────────────────────────────

function SourceChip({ source }: { source: string }) {
  const isCerebras = source === 'CEREBRAS';
  return (
    <Chip
      label={isCerebras ? 'Powered by Cerebras AI' : 'Smart Analysis'}
      size="small"
      sx={{
        bgcolor: isCerebras ? 'rgba(0,137,123,0.12)' : 'rgba(117,117,117,0.10)',
        color: isCerebras ? '#00695C' : '#616161',
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
        border: `1px solid ${isCerebras ? 'rgba(0,137,123,0.25)' : 'rgba(117,117,117,0.2)'}`,
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
      const detail =
        err?.response?.data?.detail ?? 'Unable to refresh. Please try again.';
      setRefreshError(detail);
    },
  });

  const is404 = (query.error as any)?.response?.status === 404;

  return (
    <Card
      sx={{
        borderRadius: '12px',
        border: '1px solid rgba(228,0,43,0.12)',
        borderLeft: '4px solid #E4002B',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
        position: 'relative',
        overflow: 'visible',
        bgcolor: '#fff',
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#E4002B', fontSize: 20, flexShrink: 0 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A' }}>
              {title}
            </Typography>
          </Box>
          {query.data && <SourceChip source={query.data.insight_source} />}
        </Box>

        {/* Timestamp */}
        {query.data && (
          <Typography sx={{ fontSize: '0.7rem', color: '#999', mb: 1.5, ml: 3.5 }}>
            Generated: {formatTs(query.data.generated_at)}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ── Loading skeleton ── */}
        {query.isLoading && (
          <Box>
            <Skeleton variant="text" width="96%" height={18} sx={{ mb: 0.75 }} />
            <Skeleton variant="text" width="88%" height={18} sx={{ mb: 0.75 }} />
            <Skeleton variant="text" width="92%" height={18} sx={{ mb: 0.75 }} />
            <Skeleton variant="text" width="60%" height={18} />
          </Box>
        )}

        {/* ── Empty / no report ── */}
        {!query.isLoading && (query.error || !query.data) && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 36, color: '#e0e0e0', mb: 1 }} />
            <Typography sx={{ color: '#999', fontSize: '0.875rem', mb: 0.5 }}>
              {is404 ? 'No insight available yet' : 'Unable to generate insight at this time.'}
            </Typography>
            <Typography sx={{ color: '#bbb', fontSize: '0.78rem' }}>
              {is404
                ? 'Insights are generated automatically after each report upload.'
                : 'Please try refreshing or check back shortly.'}
            </Typography>
          </Box>
        )}

        {/* ── Insight content ── */}
        {!query.isLoading && query.data && (
          <Box sx={{ position: 'relative' }}>
            {/* Refresh overlay */}
            {refresh.isPending && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: -4,
                  bgcolor: 'rgba(255,255,255,0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  borderRadius: 1,
                  gap: 1,
                }}
              >
                <CircularProgress size={28} sx={{ color: '#E4002B' }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#E4002B', fontWeight: 600 }}>
                  Refreshing insight…
                </Typography>
              </Box>
            )}

            {/* Formatted insight text */}
            <Box sx={{ opacity: refresh.isPending ? 0.35 : 1, transition: 'opacity 0.2s' }}>
              {formatInsightText(query.data.insight_text)}
            </Box>
          </Box>
        )}

        {/* ── Footer ── */}
        {!query.isLoading && (
          <>
            <Divider sx={{ mt: 2, mb: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tooltip title="Regenerate this insight (max 5 per hour)">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    refresh.isPending ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <RefreshIcon fontSize="small" />
                    )
                  }
                  onClick={() => { setRefreshError(null); refresh.mutate(); }}
                  disabled={refresh.isPending}
                  sx={{
                    color: '#E4002B',
                    borderColor: 'rgba(228,0,43,0.35)',
                    fontSize: '0.75rem',
                    py: 0.4,
                    '&:hover': { borderColor: '#E4002B', bgcolor: 'rgba(228,0,43,0.04)' },
                  }}
                >
                  Refresh Insight
                </Button>
              </Tooltip>

              {refreshError && (
                <Typography sx={{ fontSize: '0.72rem', color: '#E4002B' }}>
                  {refreshError}
                </Typography>
              )}
            </Box>
          </>
        )}

      </Box>
    </Card>
  );
};
