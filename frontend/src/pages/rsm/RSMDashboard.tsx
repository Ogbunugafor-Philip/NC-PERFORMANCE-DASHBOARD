import { Card, CardContent, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useMemo, useState } from 'react';
import { TeamComparisonChart } from '../../components/charts/TeamComparisonChart';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ScoreCard } from '../../components/common/ScoreCard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useDashboard } from '../../hooks/useDashboard';
import { formatDate, formatPercent } from '../../utils/formatters';
import { TeamLeaderboard } from '../clusterhead/ClusterHeadDashboard';

export const RSMDashboard = () => {
  const { data, isLoading } = useDashboard();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => (data?.leaderboard || []).filter((row) => `${row.name} ${row.dao_code}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  if (isLoading || !data) return <LoadingSpinner />;
  const top = filtered.slice(0, 10);
  const bottom = filtered.slice(-10).reverse();
  const topCluster = data.cluster_leaderboard[0];
  const lowCluster = data.cluster_leaderboard[data.cluster_leaderboard.length - 1];
  return (
    <PageWrapper title="Regional Overview" subtitle={`New to Bank Report as at ${formatDate(data.report_date)}`}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}><KPICard label="Total Regional Target" value={Number(data.team_summary.total_team_target || 0).toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Total Valid" value={Number(data.team_summary.total_team_valid || 0).toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Regional Achievement %" value={formatPercent(data.scorecard)} /></Grid>
        <Grid item xs={12} md={3}><ScoreCard title="Regional Scorecard" score={data.scorecard} /></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Performance Trend</Typography><TeamComparisonChart data={data.leaderboard.slice(0, 12).map((r) => ({ name: r.dao_code, individual: r.ind_achievement_percentage, business: r.bus_achievement_percentage }))} /></CardContent></Card></Grid>
        <Grid item xs={12}><TextField label="Search FSOs" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ maxWidth: 360 }} fullWidth /></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" id="fsos">Full FSO Leaderboard</Typography><TeamLeaderboard rows={filtered} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 10 FSOs</Typography><TeamLeaderboard rows={top} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Bottom 10 FSOs</Typography><TeamLeaderboard rows={bottom} /></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" id="clusters">Cluster Head Leaderboard</Typography><DataTable rows={data.cluster_leaderboard as unknown as Record<string, unknown>[]} columns={[
          { key: 'rank', label: 'Rank', sortable: true },
          { key: 'name', label: 'Cluster Head', sortable: true },
          { key: 'dao_code', label: 'DAO Code' },
          { key: 'scorecard', label: 'Scorecard', sortable: true, render: (row) => Number(row.scorecard).toFixed(1) }
        ]} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={8}><Card><CardContent><Typography variant="h6">Cluster Comparison</Typography><TeamComparisonChart data={data.cluster_leaderboard.map((r) => ({ name: r.dao_code, individual: r.ind_achievement_percentage, business: r.bus_achievement_percentage }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={4}><Grid container spacing={2}><Grid item xs={12}><KPICard label="Top Performing Cluster" value={topCluster?.name || 'N/A'} helper={topCluster ? `${topCluster.scorecard.toFixed(1)} score` : undefined} /></Grid><Grid item xs={12}><KPICard label="Lowest Performing Cluster" value={lowCluster?.name || 'N/A'} helper={lowCluster ? `${lowCluster.scorecard.toFixed(1)} score` : undefined} /></Grid></Grid></Grid>
      </Grid>
    </PageWrapper>
  );
};
