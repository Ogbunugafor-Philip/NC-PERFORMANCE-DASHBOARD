import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { KPICard } from '../../components/common/KPICard';
import { ProgressBar } from '../../components/common/ProgressBar';

const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

export const PerformanceTrendDashboard = ({ metric, reportDate }: { metric: { target: number; valid: number; current_drr: number }; reportDate: string }) => {
  const date = new Date(reportDate);
  const totalDays = daysInMonth(date);
  const elapsed = date.getDate();
  const remaining = Math.max(totalDays - elapsed, 0);
  const projectedFinal = metric.current_drr * totalDays;
  const projectedAchievement = metric.target ? Math.round((projectedFinal / metric.target) * 100) : 0;
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Performance Trend</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}><KPICard title="Projected Month-End Accounts" value={projectedFinal} /></Grid>
          <Grid item xs={12} md={4}><KPICard title="Projected Achievement" value={`${projectedAchievement}%`} /></Grid>
          <Grid item xs={12} md={4}><KPICard title="Days Remaining" value={remaining} /></Grid>
          <Grid item xs={12}><ProgressBar value={elapsed} max={totalDays} label={`${elapsed} days elapsed | ${remaining} days remaining`} color="#E4002B" /></Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
