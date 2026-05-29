import { Box, Card, CardContent, Chip, Tab, Tabs, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getClusterMe, getClusterTeamFull } from '../../api/dashboard';
import { AchievementGauge } from '../../components/charts/AchievementGauge';
import { DonutChart, HorizontalAchievementBar } from '../../components/charts/DashboardCharts';
import { AIInsightCard } from '../../components/common/AIInsightCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { DRRComparisonCard } from '../../components/common/DRRComparisonCard';
import { FSOLeaderboardTable, type FsoRow } from '../../components/common/FSOLeaderboardTable';
import { KPICard } from '../../components/common/KPICard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { RankingCard } from '../../components/common/RankingCard';
import { ScorecardCard } from '../../components/common/ScorecardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { ReportBanner } from '../rsm/RSMDashboard';
import { AccountPerformanceSection, type AccountMetric } from '../fso/FSODashboard';

const fileDate = (iso: string) => String(iso).split('T')[0];

// Adapt the cluster/me metric (team aggregate) into the full AccountMetric shape.
const toMetric = (m: any): AccountMetric => {
  const invalid = Math.max((m.actual || 0) - (m.valid || 0), 0);
  return {
    target: m.target || 0,
    actual: m.actual || 0,
    valid: m.valid || 0,
    invalid_count: invalid,
    percentage_invalid: m.actual ? Math.round((invalid / m.actual) * 100) : 0,
    percentage_achievement: m.percentage_achievement || 0,
    current_drr: m.current_drr || 0,
    required_drr: m.required_drr || 0,
    accounts_outstanding: Math.max((m.target || 0) - (m.valid || 0), 0),
    status: m.status || 'CRITICAL',
    drr_status: m.drr_status || 'BEHIND PACE',
  };
};

const PerformerCard = ({ row, place, rank }: { row: FsoRow; place: 'top' | 'bottom'; rank: number }) => {
  const colors: Record<number, string> = { 1: '#D4AF37', 2: '#9E9E9E', 3: '#CD7F32' };
  const color = place === 'top' ? (colors[rank] || '#00A651') : '#E4002B';
  return (
    <Card sx={{ borderTop: `5px solid ${color}`, bgcolor: place === 'bottom' ? 'rgba(228,0,43,0.04)' : undefined, height: '100%' }}>
      <CardContent>
        <Chip size="small" label={`#${row.rank} • ${row.dao_code}`} sx={{ bgcolor: color, color: '#fff', fontWeight: 800, mb: 1 }} />
        <Typography fontWeight={900}>{row.name}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color }}>{row.final_scorecard}</Typography>
        <Typography variant="caption" color="text.secondary">Ind {row.ind_pct_achievement}% • Bus {row.bus_pct_achievement}%</Typography>
      </CardContent>
    </Card>
  );
};

export const ClusterHeadDashboard = () => {
  const [tab, setTab] = useState(0);
  const me = useQuery({ queryKey: ['dashboard-cluster-me'], queryFn: getClusterMe, staleTime: 5 * 60 * 1000 });
  const team = useQuery({ queryKey: ['dashboard-cluster-team-full'], queryFn: getClusterTeamFull, staleTime: 5 * 60 * 1000 });

  const teamRows: FsoRow[] = (team.data || []) as FsoRow[];
  const top3 = useMemo(() => [...teamRows].sort((a, b) => b.final_scorecard - a.final_scorecard).slice(0, 3), [teamRows]);
  const bottom3 = useMemo(() => [...teamRows].sort((a, b) => a.final_scorecard - b.final_scorecard).slice(0, 3), [teamRows]);
  const indAch = useMemo(() => teamRows.map((f) => ({ name: f.name, value: f.ind_pct_achievement })), [teamRows]);
  const busAch = useMemo(() => teamRows.map((f) => ({ name: f.name, value: f.bus_pct_achievement })), [teamRows]);

  if (me.isLoading || team.isLoading) return <DashboardSkeleton />;
  if (me.error) return <DashboardErrorState onRetry={() => { me.refetch(); team.refetch(); }} />;
  if (me.data?.empty) return <EmptyReportState />;

  const d = me.data;
  const ind = toMetric(d.individual);
  const bus = toMetric(d.business);
  const overall = Math.round((ind.percentage_achievement + bus.percentage_achievement) / 2);

  return (
    <PageWrapper title="Cluster Head Dashboard" subtitle={`New to Bank Report as at ${d.report_date_label}`}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="My Performance" />
        <Tab label="Team Summary" />
        <Tab label="My Team" />
      </Tabs>

      {/* ── TAB 1 — MY PERFORMANCE ── */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}><ReportBanner label={d.report_date_label} /></Grid>
          <Grid item xs={12} lg={4}><ScorecardCard scorecard={d.team_scorecard} grade={d.scorecard_grade} /></Grid>
          <Grid item xs={12} lg={4}><RankingCard rank={d.rank_ordinal} total={d.rank_total} type="Cluster Head" /></Grid>
          <Grid item xs={12} lg={4}><Card><CardContent><AchievementGauge value={d.team_scorecard} label="Overall Scorecard" /></CardContent></Card></Grid>
          <Grid item xs={12}><AccountPerformanceSection title="Individual Accounts" metric={ind} /></Grid>
          <Grid item xs={12}><AccountPerformanceSection title="Business Accounts" metric={bus} /></Grid>
          <Grid item xs={12}><AIInsightCard source="me" title="Your Performance Insight" /></Grid>
        </Grid>
      )}

      {/* ── TAB 2 — TEAM SUMMARY ── */}
      {tab === 1 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} lg={3}><ScorecardCard scorecard={d.team_scorecard} grade={d.scorecard_grade} /></Grid>
          <Grid item xs={12} sm={6} lg={3}><RankingCard rank={d.rank_ordinal} total={d.rank_total} type="Cluster Head" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><KPICard title="State Cluster" value={d.state_cluster} color="#1A1A1A" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><KPICard title="Total FSOs" value={d.total_fso_count} /></Grid>

          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Team Individual <StatusBadge status={ind.status} /></Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <KPICard title="Target" value={ind.target.toLocaleString()} color="#1976D2" />
                <KPICard title="Actual" value={ind.actual.toLocaleString()} color="#777" />
                <KPICard title="Valid" value={ind.valid.toLocaleString()} color="#00A651" />
                <KPICard title="Invalid" value={ind.invalid_count.toLocaleString()} color="#E4002B" />
                <KPICard title="% Invalid" value={`${ind.percentage_invalid}%`} color="#E4002B" />
                <KPICard title="% Achievement" value={`${ind.percentage_achievement}%`} color={ind.percentage_achievement >= 80 ? '#00A651' : ind.percentage_achievement >= 50 ? '#FFC107' : '#E4002B'} />
                <KPICard title="Current DRR" value={ind.current_drr} color="#1A1A1A" />
                <KPICard title="Required DRR" value={ind.required_drr} color="#E4002B" />
              </Box>
              <Box sx={{ mt: 2 }}><ProgressBar value={ind.valid} max={ind.target || 1} label="Individual Achievement" /></Box>
            </CardContent></Card>
          </Grid>

          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Team Business <StatusBadge status={bus.status} /></Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <KPICard title="Target" value={bus.target.toLocaleString()} color="#1976D2" />
                <KPICard title="Actual" value={bus.actual.toLocaleString()} color="#777" />
                <KPICard title="Valid" value={bus.valid.toLocaleString()} color="#00A651" />
                <KPICard title="Invalid" value={bus.invalid_count.toLocaleString()} color="#E4002B" />
                <KPICard title="% Invalid" value={`${bus.percentage_invalid}%`} color="#E4002B" />
                <KPICard title="% Achievement" value={`${bus.percentage_achievement}%`} color={bus.percentage_achievement >= 80 ? '#00A651' : bus.percentage_achievement >= 50 ? '#FFC107' : '#E4002B'} />
                <KPICard title="Current DRR" value={bus.current_drr} color="#1A1A1A" />
                <KPICard title="Required DRR" value={bus.required_drr} color="#E4002B" />
              </Box>
              <Box sx={{ mt: 2 }}><ProgressBar value={bus.valid} max={bus.target || 1} label="Business Achievement" /></Box>
            </CardContent></Card>
          </Grid>

          <Grid item xs={12} md={6}><Card><CardContent><DonutChart valid={ind.valid} invalid={ind.invalid_count} title="Team Individual — Valid vs Invalid" /></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card><CardContent><DonutChart valid={bus.valid} invalid={bus.invalid_count} title="Team Business — Valid vs Invalid" /></CardContent></Card></Grid>
          <Grid item xs={12} lg={6}><Card><CardContent><HorizontalAchievementBar data={indAch} title="All FSOs — Ind % Achievement" /></CardContent></Card></Grid>
          <Grid item xs={12} lg={6}><Card><CardContent><HorizontalAchievementBar data={busAch} title="All FSOs — Bus % Achievement" /></CardContent></Card></Grid>

          <Grid item xs={12}><Typography variant="h6" fontWeight={900}>Top 3 Performers</Typography></Grid>
          {top3.map((r, i) => <Grid item xs={12} md={4} key={r.user_id}><PerformerCard row={r} place="top" rank={i + 1} /></Grid>)}
          <Grid item xs={12}><Typography variant="h6" fontWeight={900}>Needs Attention — Bottom 3 Performers</Typography></Grid>
          {bottom3.map((r, i) => <Grid item xs={12} md={4} key={r.user_id}><PerformerCard row={r} place="bottom" rank={i + 1} /></Grid>)}

          <Grid item xs={12}><DRRComparisonCard currentDRR={ind.current_drr} requiredDRR={ind.required_drr} label="Team Individual DRR" /></Grid>
          <Grid item xs={12}><AIInsightCard source="me" title="Team Performance Insight" /></Grid>
        </Grid>
      )}

      {/* ── TAB 3 — MY TEAM ── */}
      {tab === 2 && (
        <Card><CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>My Team — {teamRows.length} FSOs</Typography>
          <FSOLeaderboardTable rows={teamRows} reportDateLabel={d.report_date_label} fileNameDate={fileDate(d.report_date)} variant="team" />
        </CardContent></Card>
      )}
    </PageWrapper>
  );
};
