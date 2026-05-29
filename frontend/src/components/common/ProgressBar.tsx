import { Box, LinearProgress, Typography } from '@mui/material';
import { scoreColor } from '../../utils/formatters';

export const ProgressBar = ({ value }: { value: number }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
      <Typography variant="caption" fontWeight={800}>Achievement</Typography>
      <Typography variant="caption" fontWeight={800}>{value.toFixed(1)}%</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={Math.min(value, 100)}
      sx={{
        height: 9,
        borderRadius: 8,
        backgroundColor: '#EFEFEF',
        '& .MuiLinearProgress-bar': { backgroundColor: (theme) => theme.palette[scoreColor(value).split('.')[0] as 'success' | 'warning' | 'error'].main }
      }}
    />
  </Box>
);
