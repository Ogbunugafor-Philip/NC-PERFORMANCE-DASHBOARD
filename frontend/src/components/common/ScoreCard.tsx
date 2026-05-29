import { Box, Card, CardContent, Typography } from '@mui/material';
import { scoreColor } from '../../utils/formatters';

export const ScoreCard = ({ title, score, subtitle }: { title: string; score: number; subtitle?: string }) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" fontWeight={800}>{title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
        <Typography variant="h4" sx={{ color: scoreColor(score), fontWeight: 900 }}>{score.toFixed(1)}</Typography>
        <Typography fontWeight={800}>/ 100</Typography>
      </Box>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </CardContent>
  </Card>
);
