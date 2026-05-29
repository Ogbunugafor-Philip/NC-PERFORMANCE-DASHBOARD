import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAdminFull, getValidation, recalculate } from '../../api/dashboard';
import { generateAllInsights } from '../../api/insights';
import { getReportStatus } from '../../api/reports';
import { CerebrasStatusCard } from '../../components/common/CerebrasStatusCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { KPICard } from '../../components/common/KPICard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import { formatDate } from '../../utils/formatters';
import { ClusterSummaryTab, FSOLeaderboardTab, RegionalOverviewTab } from '../rsm/RSMDashboard';
import { PerformanceUpload } from './PerformanceUpload';
import { StaffManagementContent } from './StaffManagement';

const fileDate = (iso: string) => String(iso).split('T')[0];

const ReportManagementTab = () => {
  const [confirm, setConfirm] = useState(false);
  const status = useQuery({ queryKey: ['report-status'], queryFn: getReportStatus, staleTime: 60 * 1000 });
  const validation = useQuery({ queryKey: ['dashboard-admin-validation'], queryFn: getValidation });
  const queryClient = useQueryClient();
  const notify = useNotificationStore((s) => s.notify);
  const recalc = useMutation({
    mutationFn: recalculate,
    onSuccess: () => { notify('Recalculation completed', 'success'); queryClient.invalidateQueries(); setConfirm(false); },
    onError: () => notify('Recalculation failed', 'error'),
  });
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Card sx={{ borderLeft: '5px solid #E4002B' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" fontWeight={800}>Current Active Report</Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 900, mt: 0.5 }}>
              {status.data?.active_report?.report_date ? `New to Bank Report as at ${formatDate(status.data.active_report.report_date)}` : 'No active report'}
            </Typography>
            <Box sx={{ mt: 1 }}><StatusBadge status={status.data?.active_report ? 'ON TRACK' : 'CRITICAL'} /></Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}><Alert severity="warning">Uploading a new report will replace the current active report.</Alert></Grid>
      <Grid item xs={12}><PerformanceUpload /></Grid>
      <Grid item xs={12}>
        <Card><CardContent>
          <Typography variant="h6">Upload Validation Results</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}><KPICard title="Processed Records" value={validation.data?.processed_records || 0} color="#00A651" /></Grid>
            <Grid item xs={12} md={3}><KPICard title="Missing Ranks" value={validation.data?.missing_rank_count || 0} color="#E4002B" /></Grid>
            <Grid item xs={12} md={3}><KPICard title="Validation" value={validation.data?.status || 'N/A'} color="#FFC107" /></Grid>
            <Grid item xs={12} md={3}><KPICard title="Total Records" value={status.data?.total_records || 0} /></Grid>
          </Grid>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" onClick={() => setConfirm(true)}>Recalculate All KPIs</Button>
      </Grid>
      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Recalculate all KPIs?</DialogTitle>
        <DialogContent>This rebuilds processed scorecards, FSO rankings, and Cluster Head rankings for the active report.</DialogContent>
        <DialogActions><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="contained" onClick={() => recalc.mutate()} disabled={recalc.isPending}>Recalculate</Button></DialogActions>
      </Dialog>
    </Grid>
  );
};

const SystemStatusTab = ({ system }: { system: any }) => {
  const notify = useNotificationStore((s) => s.notify);
  const genInsights = useMutation({
    mutationFn: generateAllInsights,
    onSuccess: () => notify('Insight generation started in the background', 'success'),
    onError: () => notify('Failed to start insight generation', 'error'),
  });
  const dbOk = system?.database === 'connected';
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={3}><KPICard title="Database" value={dbOk ? 'Connected' : 'Disconnected'} icon={<StorageIcon />} color={dbOk ? '#00A651' : '#E4002B'} /></Grid>
      <Grid item xs={12} md={3}><KPICard title="Last Calculation Run" value={system?.last_calculation_run ? formatDate(system.last_calculation_run) : 'N/A'} /></Grid>
      <Grid item xs={12} md={3}><KPICard title="Total Users" value={system?.total_users || 0} /></Grid>
      <Grid item xs={12} md={3}><KPICard title="Active Report" value={system?.report_date_label || 'N/A'} /></Grid>
      <Grid item xs={12} md={3}><KPICard title="Total FSOs" value={system?.total_fsos || 0} color="#1A1A1A" /></Grid>
      <Grid item xs={12} md={3}><KPICard title="Total Cluster Heads" value={system?.total_cluster_heads || 0} color="#1A1A1A" /></Grid>
      <Grid item xs={12} md={3}>
        <KPICard title="Cerebras AI" value={system?.cerebras_configured ? 'Configured' : 'Offline'} icon={system?.cerebras_configured ? <CheckCircleIcon /> : <ErrorIcon />} color={system?.cerebras_configured ? '#00A651' : '#E4002B'} />
      </Grid>
      <Grid item xs={12} md={6}><CerebrasStatusCard /></Grid>
      <Grid item xs={12}>
        <Button variant="outlined" onClick={() => genInsights.mutate()} disabled={genInsights.isPending}>
          {genInsights.isPending ? 'Generating…' : 'Generate All Insights'}
        </Button>
      </Grid>
    </Grid>
  );
};

export const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const full = useQuery({ queryKey: ['dashboard-admin-full'], queryFn: getAdminFull, staleTime: 5 * 60 * 1000 });

  const data = full.data;
  const hasReport = !!data?.summary?.report_date;

  return (
    <PageWrapper title="Admin Control Center" subtitle="Full regional analytics, report management, and system status">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Regional Overview" />
        <Tab label="Cluster Summary" />
        <Tab label="FSO Leaderboard" />
        <Tab label="Report Management" />
        <Tab label="Staff Management" />
        <Tab label="System Status" />
      </Tabs>

      {/* Tabs 0-2 require an active report */}
      {tab <= 2 && (
        full.isLoading ? <DashboardSkeleton />
          : full.error ? <DashboardErrorState onRetry={() => full.refetch()} />
          : !hasReport ? <EmptyReportState />
          : tab === 0 ? <RegionalOverviewTab summary={data.summary} clusters={data.clusters} />
          : tab === 1 ? <ClusterSummaryTab clusters={data.clusters} fsos={data.fsos} reportDateLabel={data.summary.report_date_label} fileNameDate={fileDate(data.summary.report_date)} />
          : <FSOLeaderboardTab fsos={data.fsos} summary={data.summary} />
      )}

      {tab === 3 && <ReportManagementTab />}
      {tab === 4 && <StaffManagementContent />}
      {tab === 5 && <SystemStatusTab system={data?.system_status} />}
    </PageWrapper>
  );
};
