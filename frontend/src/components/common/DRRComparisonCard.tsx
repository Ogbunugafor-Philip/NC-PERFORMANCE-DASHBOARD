import { Box, Card, CardContent, Typography } from '@mui/material';
import { StatusBadge } from './StatusBadge';

export const DRRComparisonCard = ({ currentDRR, requiredDRR, label }: { currentDRR: number; requiredDRR: number; label: string }) => {
  const gap = requiredDRR - currentDRR;
  const ahead = gap <= 0;
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">{label}</Typography>
          <StatusBadge status={ahead ? 'AHEAD OF PACE' : 'BEHIND PACE'} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box><Typography color="text.secondary" fontWeight={800}>Current DRR</Typography><Typography variant="h4" fontWeight={900}>{currentDRR}</Typography></Box>
          <Box><Typography color="text.secondary" fontWeight={800}>Required DRR</Typography><Typography variant="h4" fontWeight={900}>{requiredDRR}</Typography></Box>
        </Box>
        <Typography sx={{ mt: 1.5 }} color={ahead ? 'success.main' : 'error.main'} fontWeight={800}>
          {ahead ? `You are ${Math.abs(gap)} accounts/day ahead of pace` : `You need ${gap} more accounts/day to hit target`}
        </Typography>
      </CardContent>
    </Card>
  );
};
