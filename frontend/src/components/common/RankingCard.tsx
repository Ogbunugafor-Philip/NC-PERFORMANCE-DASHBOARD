import { Card, CardContent, Typography } from '@mui/material';

export const RankingCard = ({ title, ranking }: { title: string; ranking: string }) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" fontWeight={800}>{title}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 900 }}>{ranking}</Typography>
    </CardContent>
  </Card>
);
