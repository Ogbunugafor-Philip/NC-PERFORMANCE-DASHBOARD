import { Alert, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { getFsoMe } from '../../api/dashboard';
import { PerformanceBarChart } from '../../components/charts/PerformanceBarChart';
import { PerformancePieChart } from '../../components/charts/PerformancePieChart';
import { DRRComparison } from '../../components/common/DRRComparison';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProgressBar } from '../../components/common/ProgressBar';
import { RankDisplay } from '../../components/common/RankDisplay';
import { ScorecardGauge } from '../../components/common/ScorecardGauge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate, formatNumber, formatPercent } from '../../utils/formatters';

export interface AccountMetric {
  target: number;
  actual: number;
  valid: number;
  invalid_count: number;
  percentage_invalid: number;
  percentage_achievement: number;
  current_drr: number;
  required_drr: number;
  accounts_outstanding: number;
  status: string;
  drr_status: string;
}

export const AccountCard = ({ title, metric }: { title: string; metric: AccountMetric }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2 }}>{title} <StatusBadge status={metric.status} /></Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4}><KPICard label="Target" value={formatNumber(metric.target)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Actual" value={formatNumber(metric.actual)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Valid" value={formatNumber(metric.valid)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="Invalid Count" value={formatNumber(metric.invalid_count)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="% Invalid" value={formatPercent(metric.percentage_invalid)} /></Grid>
        <Grid item xs={6} sm={4}><KPICard label="% Achievement" value={formatPercent(metric.percentage_achievement)} /></Grid>
        <Grid item xs={12} sm={6}><KPICard label="Accounts Outstanding" value={formatNumber(metric.accounts_outstanding)} /></Grid>
        <Grid item xs={12} sm={6}><DRRComparison current={metric.current_drr} required={metric.required_drr} status={metric.drr_status} /></Grid>
        <Grid item xs={12}><ProgressBar value={metric.percentage_achievement} /></Grid>
        <Grid item xs={12}><PerformancePieChart valid={metric.valid} invalid={metric.invalid_count} /></Grid>
      </Grid>
    </CardContent>
  </Card>
);

export const FSODashboard = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard-fso-me'], queryFn: getFsoMe });
  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert severity="info">No active report. Please contact your administrator.</Alert>;
  if (data?.empty) return <Alert severity="info">{data.message || 'No active report. Please contact your administrator.'}</Alert>;
  return (
    <PageWrapper title={`New to Bank Report as at ${formatDate(data.report_date)}`} subtitle="Individual performance scorecard">
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}><Card><CardContent><ScorecardGauge score={data.final_scorecard} /><Typography textAlign="center" fontWeight={900}>{data.scorecard_grade}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={6}><RankDisplay ordinal={data.rank_ordinal} total={data.rank_total} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Individual Accounts" metric={data.individual} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Business Accounts" metric={data.business} /></Grid>
        <Grid item xs={12}>
          <Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Performance Summary</Typography><PerformanceBarChart data={[
            { name: 'Individual', achievement: data.individual.percentage_achievement },
            { name: 'Business', achievement: data.business.percentage_achievement }
          ]} /></CardContent></Card>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
