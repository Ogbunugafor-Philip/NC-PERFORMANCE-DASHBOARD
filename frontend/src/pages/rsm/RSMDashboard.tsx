import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Card, CardContent, Chip, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getRsmFull } from '../../api/dashboard';
import { AchievementGauge } from '../../components/charts/AchievementGauge';
import {
  ClusterGroupedBar,
  DonutChart,
  HorizontalAchievementBar,
  ScoreBarChart,
} from '../../components/charts/DashboardCharts';
import { AIInsightCard } from '../../components/common/AIInsightCard';
import { ClusterCard } from '../../components/common/ClusterCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { DRRComparisonCard } from '../../components/common/DRRComparisonCard';
import { FSOLeaderboardTable, type FsoRow } from '../../components/common/FSOLeaderboardTable';
import { KPICard } from '../../components/common/KPICard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';

const fileDate = (iso: string) => String(iso).split('T')[0];

export const ReportBanner = ({ label }: { label: string }) => (
  <Box sx={{ bgcolor: '#E4002B', color: '#fff', p: 2.5, borderRadius: 2 }}>
    <Typography variant="h5" fontWeight={900}>New to Bank Report as at {label}</Typography>
  </Box>
);

const AchievementStatCard = ({ title, pct }: { title: string; pct: number }) => {
  const color = pct >= 80 ? '#00A651' : pct >= 50 ? '#FFC107' : '#E4002B';
  const status = pct >= 100 ? 'TARGET MET' : pct >= 80 ? 'ON TRACK' : pct >= 50 ? 'AT RISK' : 'CRITICAL';
  return (
    <Card sx={{ borderLeft: `5px solid ${color}`, height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" fontWeight={800}>{title}</Typography>
        <Typography sx={{ mt: 0.5, fontSize: 32, fontWeight: 900 }}>{pct}%</Typography>
        <Box sx={{ mt: 0.5 }}><StatusBadge status={status} /></Box>
      </CardContent>
    </Card>
  );
};

// ── Regional Ind / Bus totals section ─────────────────────────────────────
const RegionalMetricSection = ({ title, metric }: { title: string; metric: any }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 1.5 }}>{title} <StatusBadge status={metric.status} /></Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}><KPICard title="Total Target" value={metric.target.toLocaleString()} color="#1976D2" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Total Actual" value={metric.actual.toLocaleString()} color="#777" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Total Valid" value={metric.valid.toLocaleString()} color="#00A651" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Total Invalid" value={metric.invalid.toLocaleString()} color="#E4002B" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="% Invalid" value={`${metric.pct_invalid}%`} color="#E4002B" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="% Achievement" value={`${metric.pct_achievement}%`} color={metric.pct_achievement >= 80 ? '#00A651' : metric.pct_achievement >= 50 ? '#FFC107' : '#E4002B'} /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Current DRR" value={metric.current_drr} color="#1A1A1A" /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Required DRR" value={metric.required_drr} color="#E4002B" /></Grid>
        <Grid item xs={12} md={7}><ProgressBar value={metric.valid} max={metric.target || 1} label={`${metric.valid.toLocaleString()} of ${metric.target.toLocaleString()} accounts`} /></Grid>
        <Grid item xs={12} md={5}><DRRComparisonCard currentDRR={metric.current_drr} requiredDRR={metric.required_drr} label={`${title} DRR`} /></Grid>
      </Grid>
    </CardContent>
  </Card>
);

const ClusterHighlight = ({ cluster, place }: { cluster: any; place: 'top' | 'bottom'; }) => {
  const colors: Record<number, string> = { 1: '#D4AF37', 2: '#9E9E9E', 3: '#CD7F32' };
  const color = place === 'top' ? (colors[cluster.rank] || '#00A651') : '#E4002B';
  return (
    <Card sx={{ borderTop: `5px solid ${color}`, bgcolor: place === 'bottom' ? 'rgba(228,0,43,0.04)' : undefined, height: '100%' }}>
      <CardContent>
        <Chip size="small" label={`${cluster.rank_display} • ${cluster.state_cluster}`} sx={{ bgcolor: color, color: '#fff', fontWeight: 800, mb: 1 }} />
        <Typography fontWeight={900}>{cluster.name}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color }}>{cluster.team_scorecard}</Typography>
        <Typography variant="caption" color="text.secondary">Team Scorecard • {cluster.total_fso_count} FSOs</Typography>
      </CardContent>
    </Card>
  );
};

// ════════════════════ TAB 1 — REGIONAL OVERVIEW ════════════════════
export const RegionalOverviewTab = ({ summary, clusters }: { summary: any; clusters: any[] }) => {
  const top3 = clusters.slice(0, 3);
  const bottom3 = [...clusters].slice(-3).reverse();
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}><ReportBanner label={summary.report_date_label} /></Grid>

      {/* Hero KPI row */}
      <Grid item xs={12} sm={6} lg={2}><KPICard title="Total FSOs" value={summary.total_fsos} icon={<PersonIcon />} /></Grid>
      <Grid item xs={12} sm={6} lg={2}><KPICard title="Cluster Heads" value={summary.total_cluster_heads} icon={<GroupsIcon />} color="#1A1A1A" /></Grid>
      <Grid item xs={12} sm={6} lg={2}><AchievementStatCard title="Regional Ind % Achievement" pct={summary.regional_ind_pct_achievement} /></Grid>
      <Grid item xs={12} sm={6} lg={2}><AchievementStatCard title="Regional Bus % Achievement" pct={summary.regional_bus_pct_achievement} /></Grid>
      <Grid item xs={12} sm={6} lg={2}><Card sx={{ height: '100%' }}><CardContent sx={{ p: 1 }}><AchievementGauge value={summary.regional_scorecard} label="Regional Scorecard" /></CardContent></Card></Grid>
      <Grid item xs={12} sm={6} lg={2}><KPICard title="Active Report Date" value={summary.report_date_label} icon={<CalendarMonthIcon />} color="#1A1A1A" /></Grid>

      <Grid item xs={12}><RegionalMetricSection title="Individual Accounts — Regional Totals" metric={summary.individual} /></Grid>
      <Grid item xs={12}><RegionalMetricSection title="Business Accounts — Regional Totals" metric={summary.business} /></Grid>

      <Grid item xs={12} md={6}><Card><CardContent><DonutChart valid={summary.individual.valid} invalid={summary.individual.invalid} title="Regional Individual — Valid vs Invalid" /></CardContent></Card></Grid>
      <Grid item xs={12} md={6}><Card><CardContent><DonutChart valid={summary.business.valid} invalid={summary.business.invalid} title="Regional Business — Valid vs Invalid" /></CardContent></Card></Grid>

      <Grid item xs={12}><Card><CardContent><ClusterGroupedBar clusters={clusters} /></CardContent></Card></Grid>

      <Grid item xs={12}><Typography variant="h6" fontWeight={900}>Top 3 Cluster Heads</Typography></Grid>
      {top3.map((c) => <Grid item xs={12} md={4} key={c.cluster_head_id}><ClusterHighlight cluster={c} place="top" /></Grid>)}
      <Grid item xs={12}><Typography variant="h6" fontWeight={900}>Needs Attention — Bottom 3 Cluster Heads</Typography></Grid>
      {bottom3.map((c) => <Grid item xs={12} md={4} key={c.cluster_head_id}><ClusterHighlight cluster={c} place="bottom" /></Grid>)}

      <Grid item xs={12}><AIInsightCard source="regional" title="Regional Performance Insight" /></Grid>
    </Grid>
  );
};

// ════════════════════ TAB 2 — CLUSTER SUMMARY ════════════════════
export const ClusterSummaryTab = ({ clusters, fsos, reportDateLabel, fileNameDate }: { clusters: any[]; fsos: FsoRow[]; reportDateLabel: string; fileNameDate: string }) => {
  const [sort, setSort] = useState<'scorecard' | 'ind' | 'bus' | 'drr'>('scorecard');
  const sorted = useMemo(() => {
    const copy = [...clusters];
    copy.sort((a, b) => {
      if (sort === 'ind') return b.individual.pct_achievement - a.individual.pct_achievement;
      if (sort === 'bus') return b.business.pct_achievement - a.business.pct_achievement;
      if (sort === 'drr') return b.individual.current_drr - a.individual.current_drr;
      return b.team_scorecard - a.team_scorecard;
    });
    return copy;
  }, [clusters, sort]);
  const fsosByHead = useMemo(() => {
    const map: Record<string, FsoRow[]> = {};
    for (const f of fsos) {
      const key = f.cluster_head_id || '';
      (map[key] ||= []).push(f);
    }
    return map;
  }, [fsos]);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <TextField size="small" select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} sx={{ minWidth: 220 }}>
          <MenuItem value="scorecard">Team Scorecard</MenuItem>
          <MenuItem value="ind">Ind % Achievement</MenuItem>
          <MenuItem value="bus">Bus % Achievement</MenuItem>
          <MenuItem value="drr">Current DRR</MenuItem>
        </TextField>
      </Box>
      <Grid container spacing={2.5}>
        {sorted.map((c) => (
          <Grid item xs={12} lg={6} key={c.cluster_head_id}>
            <ClusterCard cluster={c} teamFsos={fsosByHead[c.cluster_head_id] || []} reportDateLabel={reportDateLabel} fileNameDate={fileNameDate} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// ════════════════════ TAB 3 — FSO LEADERBOARD ════════════════════
export const FSOLeaderboardTab = ({ fsos, summary }: { fsos: FsoRow[]; summary: any }) => {
  const top15 = useMemo(() => [...fsos].sort((a, b) => b.final_scorecard - a.final_scorecard).slice(0, 15).map((f) => ({ name: f.name, score: f.final_scorecard })), [fsos]);
  const bottom15 = useMemo(() => [...fsos].sort((a, b) => a.final_scorecard - b.final_scorecard).slice(0, 15).map((f) => ({ name: f.name, score: f.final_scorecard })), [fsos]);
  const indAch = useMemo(() => fsos.map((f) => ({ name: f.name, value: f.ind_pct_achievement })), [fsos]);
  const busAch = useMemo(() => fsos.map((f) => ({ name: f.name, value: f.bus_pct_achievement })), [fsos]);
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Card><CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>FSO Leaderboard — All {fsos.length} FSOs</Typography>
          <FSOLeaderboardTable rows={fsos} reportDateLabel={summary.report_date_label} fileNameDate={fileDate(summary.report_date)} variant="region" />
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} lg={6}><Card><CardContent><ScoreBarChart data={top15} title="Top 15 FSOs by Final Scorecard" /></CardContent></Card></Grid>
      <Grid item xs={12} lg={6}><Card><CardContent><ScoreBarChart data={bottom15} title="Bottom 15 FSOs by Final Scorecard" /></CardContent></Card></Grid>
      <Grid item xs={12} lg={6}><Card><CardContent><HorizontalAchievementBar data={indAch} title="All FSOs — Ind % Achievement" /></CardContent></Card></Grid>
      <Grid item xs={12} lg={6}><Card><CardContent><HorizontalAchievementBar data={busAch} title="All FSOs — Bus % Achievement" /></CardContent></Card></Grid>
    </Grid>
  );
};

// ════════════════════ RSM DASHBOARD ════════════════════
export const RSMDashboard = () => {
  const [tab, setTab] = useState(0);
  const full = useQuery({ queryKey: ['dashboard-rsm-full'], queryFn: getRsmFull, staleTime: 5 * 60 * 1000 });
  if (full.isLoading) return <DashboardSkeleton />;
  if (full.error) return <DashboardErrorState onRetry={() => full.refetch()} />;
  if (!full.data?.summary?.report_date) return <EmptyReportState />;
  const { summary, clusters, fsos } = full.data;
  return (
    <PageWrapper title="North Central Region Performance" subtitle={`New to Bank Report as at ${summary.report_date_label}`}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Regional Overview" />
        <Tab label="Cluster Summary" />
        <Tab label="FSO Leaderboard" />
      </Tabs>
      {tab === 0 && <RegionalOverviewTab summary={summary} clusters={clusters} />}
      {tab === 1 && <ClusterSummaryTab clusters={clusters} fsos={fsos} reportDateLabel={summary.report_date_label} fileNameDate={fileDate(summary.report_date)} />}
      {tab === 2 && <FSOLeaderboardTab fsos={fsos} summary={summary} />}
    </PageWrapper>
  );
};
