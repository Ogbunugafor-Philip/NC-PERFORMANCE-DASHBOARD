import { Alert, Box, Card, CardContent, Tab, Tabs, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getClusterMe, getClusterTeam, getFsoMe } from '../../api/dashboard';
import { TeamComparisonChart } from '../../components/charts/TeamComparisonChart';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { DataTable } from '../../components/common/DataTable';
import { DRRComparisonCard } from '../../components/common/DRRComparisonCard';
import { KPICard } from '../../components/common/KPICard';
import { LeaderboardRow } from '../../components/common/LeaderboardRow';
import { RankingCard } from '../../components/common/RankingCard';
import { ScorecardCard } from '../../components/common/ScorecardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate, formatPercent } from '../../utils/formatters';
import { AccountPerformanceSection } from '../fso/FSODashboard';

const teamMetric = (metric: any) => ({
  ...metric,
  invalid_count: Math.max((metric.actual || 0) - (metric.valid || 0), 0),
  percentage_invalid: metric.actual ? Math.round((Math.max(metric.actual - metric.valid, 0) / metric.actual) * 100) : 0,
  accounts_outstanding: (metric.target || 0) - (metric.valid || 0)
});

export const TeamLeaderboard = ({ rows }: { rows: Record<string, unknown>[] }) => (
  <DataTable
    searchable
    colorRows
    exportFileName="NC_Performance_Team_Leaderboard.xlsx"
    rows={rows}
    columns={[
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Name' },
      { key: 'dao_code', label: 'DAO Code' },
      { key: 'ind_target', label: 'Ind Target', render: (row) => String((row.individual as any)?.target ?? '') },
      { key: 'ind_valid', label: 'Ind Valid', render: (row) => String((row.individual as any)?.valid ?? '') },
      { key: 'ind', label: 'Ind %', render: (row) => formatPercent(Number((row.individual as any)?.percentage_achievement ?? row.ind_percentage_achievement ?? 0)) },
      { key: 'bus_target', label: 'Bus Target', render: (row) => String((row.business as any)?.target ?? '') },
      { key: 'bus_valid', label: 'Bus Valid', render: (row) => String((row.business as any)?.valid ?? '') },
      { key: 'bus', label: 'Bus %', render: (row) => formatPercent(Number((row.business as any)?.percentage_achievement ?? row.bus_percentage_achievement ?? 0)) },
      { key: 'final_scorecard', label: 'Scorecard' },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={(row.individual as any)?.status || 'ON TRACK'} /> }
    ]}
  />
);

export const ClusterHeadDashboard = () => {
  const [tab, setTab] = useState(0);
  const me = useQuery({ queryKey: ['dashboard-cluster-me'], queryFn: getClusterMe, staleTime: 5 * 60 * 1000 });
  const team = useQuery({ queryKey: ['dashboard-cluster-team'], queryFn: getClusterTeam, staleTime: 5 * 60 * 1000 });
  if (me.isLoading || team.isLoading) return <DashboardSkeleton />;
  if (me.error) return <DashboardErrorState onRetry={() => { me.refetch(); team.refetch(); }} />;
  if (me.data?.empty) return <EmptyReportState />;
  const rows = (team.data || []) as any[];
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5).reverse();
  return (
    <PageWrapper title="My Team" subtitle={`New to Bank Report as at ${formatDate(me.data.report_date)}`}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}><Tab label="My Performance" /><Tab label="My Team" /></Tabs>
      <Box sx={{ bgcolor: '#E4002B', color: '#fff', p: 2.5, borderRadius: 2, mb: 2.5 }}>
        <Typography variant="h5">Team Scorecard {me.data.team_scorecard} | Team Rank {me.data.rank_ordinal} | Total FSOs {me.data.total_fso_count}</Typography>
      </Box>
      <Grid container spacing={2.5}>
        {tab === 0 && (
          <>
            <Grid item xs={12} lg={4}><ScorecardCard scorecard={me.data.team_scorecard} grade={me.data.scorecard_grade} /></Grid>
            <Grid item xs={12} lg={4}><RankingCard rank={me.data.rank_ordinal} total={Math.max(me.data.rank || 0, 1)} type="Cluster Head" /></Grid>
            <Grid item xs={12} lg={4}><KPICard title="Total FSOs" value={me.data.total_fso_count} color="#1A1A1A" /></Grid>
            <Grid item xs={12}><AccountPerformanceSection title="Team Individual Accounts" metric={teamMetric(me.data.individual)} /></Grid>
            <Grid item xs={12}><AccountPerformanceSection title="Team Business Accounts" metric={teamMetric(me.data.business)} /></Grid>
          </>
        )}
        {tab === 1 && (
          <>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Total Team Target" value={me.data.individual.target + me.data.business.target} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Total Team Valid" value={me.data.individual.valid + me.data.business.valid} color="#00A651" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><KPICard title="Team Achievement %" value={formatPercent(me.data.team_scorecard)} color="#FFC107" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><ScorecardCard scorecard={me.data.team_scorecard} grade={me.data.scorecard_grade} /></Grid>
        <Grid item xs={12} lg={6}><RankingCard rank={me.data.rank_ordinal} total={Math.max(me.data.rank || 0, 1)} type="Cluster Head" /></Grid>
        <Grid item xs={12} lg={6}><DRRComparisonCard currentDRR={me.data.individual.current_drr} requiredDRR={me.data.individual.required_drr} label="Team Individual Accounts" /></Grid>
        <Grid item xs={12} lg={6}><DRRComparisonCard currentDRR={me.data.business.current_drr} requiredDRR={me.data.business.required_drr} label="Team Business Accounts" /></Grid>
        <Grid item xs={12} lg={6}><AccountPerformanceSection title="Team Individual Accounts" metric={teamMetric(me.data.individual)} /></Grid>
        <Grid item xs={12} lg={6}><AccountPerformanceSection title="Team Business Accounts" metric={teamMetric(me.data.business)} /></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Individual Achievement</Typography><TeamComparisonChart fsoList={rows} metric="indAchievement" /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Business Achievement</Typography><TeamComparisonChart fsoList={rows} metric="busAchievement" /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 5 Performers</Typography><Box sx={{ display: 'grid', gap: 1 }}>{top.map((r) => <LeaderboardRow key={r.dao_code} rank={r.rank} name={r.name} daoCode={r.dao_code} indAchievement={r.individual.percentage_achievement} busAchievement={r.business.percentage_achievement} scorecard={r.final_scorecard} />)}</Box></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Needs Attention</Typography><Box sx={{ display: 'grid', gap: 1 }}>{bottom.map((r) => <LeaderboardRow key={r.dao_code} rank={r.rank} name={r.name} daoCode={r.dao_code} indAchievement={r.individual.percentage_achievement} busAchievement={r.business.percentage_achievement} scorecard={r.final_scorecard} />)}</Box></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Full Team Leaderboard</Typography><TeamLeaderboard rows={rows} /></CardContent></Card></Grid>
          </>
        )}
      </Grid>
    </PageWrapper>
  );
};
