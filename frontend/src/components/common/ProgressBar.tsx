import { Box, LinearProgress, Typography } from '@mui/material';
import { scoreColor } from '../../utils/formatters';

export const ProgressBar = ({ value, max = 100, label, color }: { value: number; max?: number; label?: string; color?: string }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
      <Typography variant="caption" fontWeight={800}>{label || 'Achievement'}</Typography>
      <Typography variant="caption" fontWeight={800}>{value} of {max} accounts</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={Math.min(max ? (value / max) * 100 : value, 100)}
      sx={{
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EFEFEF',
        '& .MuiLinearProgress-bar': {
          transition: 'transform 900ms ease',
          backgroundColor: color || ((theme) => theme.palette[scoreColor(max ? (value / max) * 100 : value).split('.')[0] as 'success' | 'warning' | 'error'].main)
        }
      }}
    />
  </Box>
);
