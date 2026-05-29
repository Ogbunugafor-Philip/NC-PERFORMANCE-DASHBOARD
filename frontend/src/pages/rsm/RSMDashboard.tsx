import { Box, Card, CardContent, Tab, Tabs, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getBottomPerformers, getClusterLeaderboard, getFsoLeaderboard, getRsmSummary, getTopPerformers } from '../../api/dashboard';
import { AchievementGauge } from '../../components/charts/AchievementGauge';
import { ClusterComparisonChart } from '../../components/charts/ClusterComparisonChart';
import { RegionalTrendCard } from '../../components/charts/RegionalTrendCard';
import { AIInsightCard } from '../../components/common/AIInsightCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { LeaderboardRow } from '../../components/common/LeaderboardRow';
import { ScorecardCard } from '../../components/common/ScorecardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate, formatPercent } from '../../utils/formatters';

export const RSMDashboard = () => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const summary = useQuery({ queryKey: ['dashboard-rsm-summary'], queryFn: getRsmSummary, staleTime: 5 * 60 * 1000 });
  const fso = useQuery({ queryKey: ['dashboard-fso-leaderboard'], queryFn: getFsoLeaderboard, staleTime: 5 * 60 * 1000 });
  const clusters = useQuery({ queryKey: ['dashboard-cluster-leaderboard'], queryFn: getClusterLeaderboard, staleTime: 5 * 60 * 1000 });
  const top = useQuery({ queryKey: ['dashboard-top-performers'], queryFn: getTopPerformers, staleTime: 5 * 60 * 1000 });
  const bottom = useQuery({ queryKey: ['dashboard-bottom-performers'], queryFn: getBottomPerformers, staleTime: 5 * 60 * 1000 });
  const filtered = useMemo(() => ((fso.data || []) as any[]).filter((row) => `${row.name} ${row.dao_code}`.toLowerCase().includes(search.toLowerCase())), [fso.data, search]);
  if (summary.isLoading || fso.isLoading || clusters.isLoading) return <DashboardSkeleton />;
  if (summary.error) return <DashboardErrorState onRetry={() => { summary.refetch(); fso.refetch(); clusters.refetch(); }} />;
  if (!summary.data?.report_date) return <EmptyReportState />;
  const clusterRows = (clusters.data || []) as any[];
  return (
    <PageWrapper title="North Central Region Performance" subtitle={`Report date: ${formatDate(summary.data.report_date)}`}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Regional Overview" />
        <Tab label="FSO Rankings" />
        <Tab label="Cluster Head Rankings" />
      </Tabs>
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}><Box sx={{ bgcolor: '#E4002B', color: '#fff', p: 2.5, borderRadius: 2 }}><Typography variant="h5">North Central Region Performance</Typography></Box></Grid>
          <Grid item xs={12} sm={6} lg={2}><KPICard title="Total FSOs" value={summary.data.total_fsos} /></Grid>
          <Grid item xs={12} sm={6} lg={2}><KPICard title="Cluster Heads" value={summary.data.total_cluster_heads} color="#1A1A1A" /></Grid>
          <Grid item xs={12} sm={6} lg={2}><KPICard title="Regional Achievement" value={formatPercent(summary.data.regional_percentage_achievement)} color="#00A651" /></Grid>
          <Grid item xs={12} sm={6} lg={2}><KPICard title="Regional Scorecard" value={summary.data.regional_scorecard} color="#FFC107" /></Grid>
          <Grid item xs={12} sm={6} lg={2}><KPICard title="Active Report Date" value={formatDate(summary.data.report_date)} /></Grid>
          <Grid item xs={12} lg={5}><Card><CardContent><AchievementGauge value={summary.data.regional_percentage_achievement} label="Regional Achievement" /></CardContent></Card></Grid>
          <Grid item xs={12} lg={7}><RegionalTrendCard regionalSummary={summary.data} /></Grid>
          <Grid item xs={12} lg={8}><Card><CardContent><ClusterComparisonChart clusterList={clusterRows} /></CardContent></Card></Grid>
          <Grid item xs={12} lg={4}><Grid container spacing={2}><Grid item xs={12}><KPICard title="Top Cluster" value={summary.data.top_performing_cluster_head?.name || 'N/A'} color="#00A651" /></Grid><Grid item xs={12}><KPICard title="Lowest Cluster" value={summary.data.bottom_performing_cluster_head?.name || 'N/A'} color="#E4002B" /></Grid></Grid></Grid>
          <Grid item xs={12}>
            <AIInsightCard source="regional" title="Regional Performance Insight" />
          </Grid>
        </Grid>
      )}
      {tab === 1 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={6}><Card><CardContent><Typography variant="h6">Top 10 FSOs</Typography><Box sx={{ display: 'grid', gap: 1 }}>{((top.data || []) as any[]).map((r) => <LeaderboardRow key={r.dao_code} rank={r.rank} name={r.name} daoCode={r.dao_code} indAchievement={r.ind_percentage_achievement} busAchievement={r.bus_percentage_achievement} scorecard={r.final_scorecard} />)}</Box></CardContent></Card></Grid>
          <Grid item xs={12} lg={6}><Card sx={{ bgcolor: 'rgba(228,0,43,0.03)' }}><CardContent><Typography variant="h6">Needs Attention</Typography><Typography color="text.secondary" sx={{ mb: 1 }}>These FSOs need support</Typography><Box sx={{ display: 'grid', gap: 1 }}>{((bottom.data || []) as any[]).map((r) => <LeaderboardRow key={r.dao_code} rank={r.rank} name={r.name} daoCode={r.dao_code} indAchievement={r.ind_percentage_achievement} busAchievement={r.bus_percentage_achievement} scorecard={r.final_scorecard} />)}</Box></CardContent></Card></Grid>
          <Grid item xs={12}><TextField label="Search by name or DAO code" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ maxWidth: 360 }} fullWidth /></Grid>
          <Grid item xs={12}><Card><CardContent><Typography variant="h6">Full FSO Leaderboard</Typography><DataTable searchable colorRows exportFileName={`NC_Performance_${summary.data.report_date}_RSM_FSOs.xlsx`} rows={filtered as Record<string, unknown>[]} columns={[
            { key: 'rank', label: 'Rank' },
            { key: 'name', label: 'Name' },
            { key: 'dao_code', label: 'DAO Code' },
            { key: 'cluster_head_id', label: 'Cluster Head' },
            { key: 'ind_percentage_achievement', label: 'Ind %' },
            { key: 'bus_percentage_achievement', label: 'Bus %' },
            { key: 'final_scorecard', label: 'Scorecard' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={Number(row.final_scorecard) >= 80 ? 'ON TRACK' : Number(row.final_scorecard) >= 50 ? 'AT RISK' : 'CRITICAL'} /> },
            { key: 'drr', label: 'DRR Status', render: () => <StatusBadge status="AHEAD OF PACE" /> }
          ]} /></CardContent></Card></Grid>
        </Grid>
      )}
      {tab === 2 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}><Card><CardContent><Typography variant="h6">Cluster Leaderboard</Typography><DataTable searchable colorRows exportFileName={`NC_Performance_${summary.data.report_date}_Clusters.xlsx`} rows={clusterRows as Record<string, unknown>[]} columns={[
            { key: 'rank', label: 'Rank' },
            { key: 'name', label: 'Name' },
            { key: 'total_fso_count', label: 'Team Size' },
            { key: 'ind_percentage_achievement', label: 'Team Ind %' },
            { key: 'bus_percentage_achievement', label: 'Team Bus %' },
            { key: 'team_scorecard', label: 'Team Scorecard' }
          ]} /></CardContent></Card></Grid>
          <Grid item xs={12}><Card><CardContent><ClusterComparisonChart clusterList={clusterRows} /></CardContent></Card></Grid>
          {clusterRows.slice(0, 3).map((cluster) => <Grid item xs={12} md={4} key={cluster.dao_code}><KPICard title={`Top ${cluster.rank}`} value={cluster.name} subtitle={`${cluster.team_scorecard} score`} color="#00A651" /></Grid>)}
        </Grid>
      )}
    </PageWrapper>
  );
};
