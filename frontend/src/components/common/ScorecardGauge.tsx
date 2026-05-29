import { Box, CircularProgress, Typography } from '@mui/material';

const color = (score: number) => (score >= 70 ? 'success.main' : score >= 50 ? 'warning.main' : 'error.main');

export const ScorecardGauge = ({ score, label = 'Scorecard' }: { score: number; label?: string }) => (
  <Box sx={{ display: 'grid', placeItems: 'center', position: 'relative', minHeight: 180 }}>
    <CircularProgress variant="determinate" value={Math.min(score, 100)} size={150} thickness={5} sx={{ color: color(score) }} />
    <Box sx={{ position: 'absolute', textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={900}>{score}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Box>
);
