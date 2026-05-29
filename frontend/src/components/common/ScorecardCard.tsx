import { Card, CardContent, Typography } from '@mui/material';
import { ScorecardGauge } from './ScorecardGauge';

export const ScorecardCard = ({ scorecard, grade, maxScore = 100 }: { scorecard: number; grade: string; maxScore?: number }) => (
  <Card>
    <CardContent sx={{ textAlign: 'center' }}>
      <ScorecardGauge score={Math.min(scorecard, maxScore)} label="Scorecard" />
      <Typography variant="h6" fontWeight={900}>{grade}</Typography>
    </CardContent>
  </Card>
);
