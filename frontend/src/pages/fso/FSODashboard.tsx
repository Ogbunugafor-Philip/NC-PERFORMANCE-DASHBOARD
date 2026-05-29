import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FlagIcon from '@mui/icons-material/Flag';
import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { getFsoMe } from '../../api/dashboard';
import { AchievementGauge } from '../../components/charts/AchievementGauge';
import { PerformanceBarChart } from '../../components/charts/PerformanceBarChart';
import { PerformancePieChart } from '../../components/charts/PerformancePieChart';
import { AchievementBanner } from '../../components/common/AchievementBanner';
import { AIInsightCard } from '../../components/common/AIInsightCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { DRRComparisonCard } from '../../components/common/DRRComparisonCard';
import { KPICard } from '../../components/common/KPICard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { RankingCard } from '../../components/common/RankingCard';
import { ScorecardCard } from '../../components/common/ScorecardCard';
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

const kpiColor = (value: number) => value >= 80 ? '#00A651' : value >= 50 ? '#FFC107' : '#E4002B';

export const AccountPerformanceSection = ({ title, metric }: { title: string; metric: AccountMetric }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalanceIcon color="primary" /> {title} <StatusBadge status={metric.status} />
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Target" value={formatNumber(metric.target)} icon={<FlagIcon />} color="#1976D2" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Actual" value={formatNumber(metric.actual)} color="#777" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Valid" value={formatNumber(metric.valid)} icon={<CheckCircleIcon />} color="#00A651" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Invalid" value={formatNumber(metric.invalid_count)} icon={<ErrorIcon />} color="#E4002B" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="% Invalid" value={formatPercent(metric.percentage_invalid)} color="#E4002B" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="% Achievement" value={formatPercent(metric.percentage_achievement)} subtitle={metric.status} color={kpiColor(metric.percentage_achievement)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Current DRR" value={metric.current_drr} color="#1A1A1A" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Required DRR" value={metric.required_drr} color="#E4002B" /></Grid>
        <Grid item xs={12} lg={7}><ProgressBar value={metric.valid} max={metric.target || 1} label={`${metric.valid} of ${metric.target} accounts`} /></Grid>
        <Grid item xs={12} lg={5}><PerformancePieChart valid={metric.valid} invalid={metric.invalid_count} title={`${title} Quality`} /></Grid>
        <Grid item xs={12}><DRRComparisonCard currentDRR={metric.current_drr} requiredDRR={metric.required_drr} label={`${title} DRR`} /></Grid>
      </Grid>
    </CardContent>
  </Card>
);

export const FSODashboard = () => {
  const query = useQuery({ queryKey: ['dashboard-fso-me'], queryFn: getFsoMe, staleTime: 5 * 60 * 1000 });
  const data = query.data;
  if (query.isLoading) return <DashboardSkeleton />;
  if (query.error) return <DashboardErrorState onRetry={() => query.refetch()} />;
  if (data?.empty) return <EmptyReportState />;
  const overallAchievement = Math.round((data.individual.percentage_achievement + data.business.percentage_achievement) / 2);
  return (
    <PageWrapper title="My Performance" subtitle="New to Bank individual dashboard">
      <Box sx={{ bgcolor: '#E4002B', color: '#fff', p: 2.5, borderRadius: 2, mb: 2.5 }}>
        <Typography variant="h5">New to Bank Report as at {formatDate(data.report_date)}</Typography>
      </Box>
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={4}><ScorecardCard scorecard={data.final_scorecard} grade={data.scorecard_grade} /></Grid>
        <Grid item xs={12} lg={4}><RankingCard rank={data.rank_ordinal} total={data.rank_total} type="FSO" /></Grid>
        <Grid item xs={12} lg={4}><AchievementBanner achievement={overallAchievement} name={data.name} /></Grid>
        <Grid item xs={12}><AccountPerformanceSection title="Individual Accounts" metric={data.individual} /></Grid>
        <Grid item xs={12}><AccountPerformanceSection title="Business Accounts" metric={data.business} /></Grid>
        <Grid item xs={12} lg={7}>
          <Card><CardContent><Typography variant="h6">Performance Summary</Typography><PerformanceBarChart data={[
            { name: 'Individual', achievement: data.individual.percentage_achievement },
            { name: 'Business', achievement: data.business.percentage_achievement }
          ]} /></CardContent></Card>
        </Grid>
        <Grid item xs={12} lg={5}><Card><CardContent><AchievementGauge value={data.final_scorecard} label="Overall Scorecard" /></CardContent></Card></Grid>
        <Grid item xs={12}>
          <AIInsightCard source="me" title="Your Personal Performance Insight" />
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
