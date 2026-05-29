import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { PerformanceBarChart } from '../../components/charts/PerformanceBarChart';
import { TeamComparisonChart } from '../../components/charts/TeamComparisonChart';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RankingCard } from '../../components/common/RankingCard';
import { ScoreCard } from '../../components/common/ScoreCard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useDashboard } from '../../hooks/useDashboard';
import type { LeaderboardRow } from '../../types/dashboard';
import { formatDate, formatPercent } from '../../utils/formatters';
import { AccountCard } from '../fso/FSODashboard';

export const TeamLeaderboard = ({ rows }: { rows: LeaderboardRow[] }) => (
  <DataTable
    rows={rows as unknown as Record<string, unknown>[]}
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
      { key: 'ind_achievement_percentage', label: 'Ind. Achievement %', sortable: true, render: (row) => formatPercent(Number(row.ind_achievement_percentage)) },
      { key: 'bus_achievement_percentage', label: 'Bus. Achievement %', sortable: true, render: (row) => formatPercent(Number(row.bus_achievement_percentage)) },
      { key: 'scorecard', label: 'Scorecard', sortable: true, render: (row) => Number(row.scorecard).toFixed(1) }
    ]}
  />
);

export const ClusterHeadDashboard = () => {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <LoadingSpinner />;
  const top = data.leaderboard.slice(0, 5);
  const bottom = data.leaderboard.slice(-5).reverse();
  return (
    <PageWrapper title={`New to Bank Report as at ${formatDate(data.report_date)}`} subtitle="Cluster performance and FSO leaderboard">
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}><KPICard label="Total Team Target" value={Number(data.team_summary.total_team_target || 0).toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Total Team Valid" value={Number(data.team_summary.total_team_valid || 0).toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Team Achievement %" value={formatPercent(Number(data.team_summary.team_achievement_percentage || 0))} /></Grid>
        <Grid item xs={12} md={3}><ScoreCard title="Team Scorecard" score={Number(data.team_summary.team_scorecard || 0)} /></Grid>
        <Grid item xs={12} md={6}><RankingCard title="Team Ranking" ranking={String(data.team_summary.team_ranking || 'Not ranked')} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Team Current Daily Run Rate" value={Number(data.team_summary.team_current_daily_run_rate || 0)} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Team Required Daily Run Rate" value={Number(data.team_summary.team_required_daily_run_rate || 0)} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Individual Accounts" metric={data.individual} /></Grid>
        <Grid item xs={12} lg={6}><AccountCard title="Business Accounts" metric={data.business} /></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Team Leaderboard</Typography><TeamLeaderboard rows={data.leaderboard} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Team Individual Account Performance</Typography><PerformanceBarChart data={data.leaderboard.map((r) => ({ name: r.dao_code, achievement: r.ind_achievement_percentage }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Team Business Account Performance</Typography><PerformanceBarChart data={data.leaderboard.map((r) => ({ name: r.dao_code, achievement: r.bus_achievement_percentage }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 5 FSOs</Typography><TeamComparisonChart data={top.map((r) => ({ name: r.dao_code, individual: r.ind_achievement_percentage, business: r.bus_achievement_percentage }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Bottom 5 FSOs</Typography><TeamComparisonChart data={bottom.map((r) => ({ name: r.dao_code, individual: r.ind_achievement_percentage, business: r.bus_achievement_percentage }))} /></CardContent></Card></Grid>
      </Grid>
    </PageWrapper>
  );
};
