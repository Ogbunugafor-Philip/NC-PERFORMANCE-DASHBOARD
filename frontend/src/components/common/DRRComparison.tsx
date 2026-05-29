import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { StatusBadge } from './StatusBadge';

export const DRRComparison = ({ current, required, status }: { current: number; required: number; status: string }) => {
  const ahead = current >= required;
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography fontWeight={900}>DRR Pace</Typography>
          <StatusBadge status={status} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          {ahead ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
          <Typography><b>{current}</b> current vs <b>{required}</b> required</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {ahead ? 'Current pace is enough to hit target.' : `You need ${Math.max(required - current, 0)} more accounts per day to hit target.`}
        </Typography>
      </CardContent>
    </Card>
  );
};
