import { Alert, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { getClusterMe, getClusterTeam } from '../../api/dashboard';
import { PerformanceBarChart } from '../../components/charts/PerformanceBarChart';
import { TeamComparisonChart } from '../../components/charts/TeamComparisonChart';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RankDisplay } from '../../components/common/RankDisplay';
import { ScorecardGauge } from '../../components/common/ScorecardGauge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate, formatPercent } from '../../utils/formatters';
import { AccountCard } from '../fso/FSODashboard';

export const TeamLeaderboard = ({ rows }: { rows: Record<string, unknown>[] }) => (
  <DataTable
    rows={rows}
    rowSx={(row) => {
      const rank = Number(row.rank);
      if (rank <= 3) return { backgroundColor: 'rgba(22,128,60,0.08)' };
      if (rank > rows.length - 3) return { backgroundColor: 'rgba(228,0,43,0.07)' };
      return {};
    }}
    columns={[
      { key: 'rank', label: 'Rank', sortable: true },
      { key: 'name', label: 'FSO Name', sortable: true },
      { key: 'dao_code', label: 'DAO Code' },
      { key: 'ind', label: 'Ind. Achievement %', render: (row) => formatPercent(Number((row.individual as any)?.percentage_achievement ?? row.ind_percentage_achievement ?? 0)) },
      { key: 'bus', label: 'Bus. Achievement %', render: (row) => formatPercent(Number((row.business as any)?.percentage_achievement ?? row.bus_percentage_achievement ?? 0)) },
      { key: 'final_scorecard', label: 'Scorecard', sortable: true, render: (row) => Number(row.final_scorecard ?? row.scorecard ?? 0).toFixed(0) }
    ]}
  />
);

export const ClusterHeadDashboard = () => {
  const me = useQuery({ queryKey: ['dashboard-cluster-me'], queryFn: getClusterMe });
  const team = useQuery({ queryKey: ['dashboard-cluster-team'], queryFn: getClusterTeam });
  if (me.isLoading || team.isLoading) return <LoadingSpinner />;
  if (me.error) return <Alert severity="info">No active report. Please contact your administrator.</Alert>;
  if (me.data?.empty) return <Alert severity="info">{me.data.message}</Alert>;
  const rows = (team.data || []) as any[];
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5).reverse();
  return (
    <PageWrapper title={`New to Bank Report as at ${formatDate(me.data.report_date)}`} subtitle="Cluster performance and FSO leaderboard">
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}><KPICard label="Total Team Target" value={me.data.individual.target + me.data.business.target} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Total Team Valid" value={me.data.individual.valid + me.data.business.valid} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Team Achievement %" value={formatPercent(me.data.team_scorecard)} /></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><ScorecardGauge score={me.data.team_scorecard} /></CardContent></Card></Grid>
        <Grid item xs={12} md={6}><RankDisplay ordinal={me.data.rank_ordinal} total={Math.max(me.data.rank || 0, 1)} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Individual Accounts" metric={{ ...me.data.individual, invalid_count: Math.max(me.data.individual.actual - me.data.individual.valid, 0), percentage_invalid: 0, accounts_outstanding: me.data.individual.target - me.data.individual.valid }} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Business Accounts" metric={{ ...me.data.business, invalid_count: Math.max(me.data.business.actual - me.data.business.valid, 0), percentage_invalid: 0, accounts_outstanding: me.data.business.target - me.data.business.valid }} /></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Team Leaderboard</Typography><TeamLeaderboard rows={rows} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Team Individual Account Performance</Typography><PerformanceBarChart data={rows.map((r) => ({ name: r.dao_code, achievement: r.individual.percentage_achievement }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Team Business Account Performance</Typography><PerformanceBarChart data={rows.map((r) => ({ name: r.dao_code, achievement: r.business.percentage_achievement }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 5 FSOs</Typography><TeamComparisonChart data={top.map((r) => ({ name: r.dao_code, individual: r.individual.percentage_achievement, business: r.business.percentage_achievement }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Bottom 5 FSOs</Typography><TeamComparisonChart data={bottom.map((r) => ({ name: r.dao_code, individual: r.individual.percentage_achievement, business: r.business.percentage_achievement }))} /></CardContent></Card></Grid>
      </Grid>
    </PageWrapper>
  );
};
