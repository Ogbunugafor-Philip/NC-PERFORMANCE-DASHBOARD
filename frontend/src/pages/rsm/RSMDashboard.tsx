import { Alert, Card, CardContent, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getBottomPerformers, getClusterLeaderboard, getFsoLeaderboard, getRsmSummary, getTopPerformers } from '../../api/dashboard';
import { TeamComparisonChart } from '../../components/charts/TeamComparisonChart';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ScorecardGauge } from '../../components/common/ScorecardGauge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate, formatPercent } from '../../utils/formatters';
import { TeamLeaderboard } from '../clusterhead/ClusterHeadDashboard';

export const RSMDashboard = () => {
  const summary = useQuery({ queryKey: ['dashboard-rsm-summary'], queryFn: getRsmSummary });
  const fso = useQuery({ queryKey: ['dashboard-fso-leaderboard'], queryFn: getFsoLeaderboard });
  const clusters = useQuery({ queryKey: ['dashboard-cluster-leaderboard'], queryFn: getClusterLeaderboard });
  const top = useQuery({ queryKey: ['dashboard-top-performers'], queryFn: getTopPerformers });
  const bottom = useQuery({ queryKey: ['dashboard-bottom-performers'], queryFn: getBottomPerformers });
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => ((fso.data || []) as any[]).filter((row) => `${row.name} ${row.dao_code}`.toLowerCase().includes(search.toLowerCase())), [fso.data, search]);
  if (summary.isLoading || fso.isLoading || clusters.isLoading) return <LoadingSpinner />;
  if (summary.error) return <Alert severity="info">No active report. Please contact your administrator.</Alert>;
  return (
    <PageWrapper title="Regional Overview" subtitle={`New to Bank Report as at ${formatDate(summary.data.report_date)}`}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}><KPICard label="Total Regional Target" value={summary.data.total_target.toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Total Valid" value={summary.data.total_valid.toLocaleString()} /></Grid>
        <Grid item xs={12} md={3}><KPICard label="Regional Achievement %" value={formatPercent(summary.data.regional_percentage_achievement)} /></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><ScorecardGauge score={summary.data.regional_scorecard} label="Regional Score" /></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6">Performance Trend</Typography><TeamComparisonChart data={filtered.slice(0, 12).map((r) => ({ name: r.dao_code, individual: r.individual?.percentage_achievement ?? r.ind_percentage_achievement ?? 0, business: r.business?.percentage_achievement ?? r.bus_percentage_achievement ?? 0 }))} /></CardContent></Card></Grid>
        <Grid item xs={12}><TextField label="Search FSOs" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ maxWidth: 360 }} fullWidth /></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" id="fsos">Full FSO Leaderboard</Typography><TeamLeaderboard rows={filtered as Record<string, unknown>[]} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 10 FSOs</Typography><TeamLeaderboard rows={(top.data || []) as Record<string, unknown>[]} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Bottom 10 FSOs</Typography><TeamLeaderboard rows={(bottom.data || []) as Record<string, unknown>[]} /></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="h6" id="clusters">Cluster Head Leaderboard</Typography><DataTable rows={(clusters.data || []) as Record<string, unknown>[]} columns={[
          { key: 'rank', label: 'Rank', sortable: true },
          { key: 'name', label: 'Cluster Head', sortable: true },
          { key: 'dao_code', label: 'DAO Code' },
          { key: 'team_scorecard', label: 'Team Scorecard', sortable: true }
        ]} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={8}><Card><CardContent><Typography variant="h6">Cluster Comparison</Typography><TeamComparisonChart data={((clusters.data || []) as any[]).map((r) => ({ name: r.dao_code, individual: r.ind_percentage_achievement, business: r.bus_percentage_achievement }))} /></CardContent></Card></Grid>
        <Grid item xs={12} lg={4}><Grid container spacing={2}><Grid item xs={12}><KPICard label="Top Performing Cluster" value={summary.data.top_performing_cluster_head?.name || 'N/A'} /></Grid><Grid item xs={12}><KPICard label="Lowest Performing Cluster" value={summary.data.bottom_performing_cluster_head?.name || 'N/A'} /></Grid></Grid></Grid>
      </Grid>
    </PageWrapper>
  );
};
