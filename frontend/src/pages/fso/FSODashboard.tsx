import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { PerformanceBarChart } from '../../components/charts/PerformanceBarChart';
import { PerformancePieChart } from '../../components/charts/PerformancePieChart';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProgressBar } from '../../components/common/ProgressBar';
import { RankingCard } from '../../components/common/RankingCard';
import { ScoreCard } from '../../components/common/ScoreCard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useDashboard } from '../../hooks/useDashboard';
import type { DashboardMetric } from '../../types/dashboard';
import { formatDate, formatNumber, formatPercent } from '../../utils/formatters';

export const AccountCard = ({ title, metric }: { title: string; metric: DashboardMetric }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4}><KPICard label="Target" value={formatNumber(metric.target)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Actual" value={formatNumber(metric.actual)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Valid" value={formatNumber(metric.valid)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Invalid Count" value={formatNumber(metric.invalid)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="% Invalid" value={formatPercent(metric.invalid_percentage)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="% Achievement" value={formatPercent(metric.achievement_percentage)} /></Grid>
        <Grid item xs={12} sm={6}><KPICard label="Current Daily Run Rate" value={metric.current_daily_run_rate} /></Grid>
        <Grid item xs={12} sm={6}><KPICard label="Required Daily Run Rate" value={metric.required_daily_run_rate} /></Grid>
        <Grid item xs={12}><ProgressBar value={metric.achievement_percentage} /></Grid>
        <Grid item xs={12}><PerformancePieChart valid={metric.valid} invalid={metric.invalid} /></Grid>
      </Grid>
    </CardContent>
  </Card>
);

export const FSODashboard = () => {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <LoadingSpinner />;
  return (
    <PageWrapper title={`New to Bank Report as at ${formatDate(data.report_date)}`} subtitle="Individual performance scorecard">
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}><ScoreCard title="My Scorecard" score={data.scorecard} /></Grid>
        <Grid item xs={12} md={6}><RankingCard title="My Regional Ranking" ranking={data.ranking} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Individual Accounts" metric={data.individual} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Business Accounts" metric={data.business} /></Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Performance Summary</Typography>
              <PerformanceBarChart data={[
                { name: 'Individual', achievement: data.individual.achievement_percentage },
                { name: 'Business', achievement: data.business.achievement_percentage }
              ]} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
