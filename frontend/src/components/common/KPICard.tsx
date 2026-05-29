import { Card, CardContent, Typography } from '@mui/material';

export const KPICard = ({ label, value, helper }: { label: string; value: string | number; helper?: string }) => (
  <Card>
    <CardContent>
      <Typography variant="body2" color="text.secondary" fontWeight={700}>{label}</Typography>
      <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 900 }}>{value}</Typography>
      {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
    </CardContent>
  </Card>
);
