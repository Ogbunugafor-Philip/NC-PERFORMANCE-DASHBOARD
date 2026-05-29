import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAdminSummary, getValidation, recalculate } from '../../api/dashboard';
import { generateAllInsights } from '../../api/insights';
import { getReportStatus } from '../../api/reports';
import { AIInsightCard } from '../../components/common/AIInsightCard';
import { CerebrasStatusCard } from '../../components/common/CerebrasStatusCard';
import { DashboardErrorState, DashboardSkeleton, EmptyReportState } from '../../components/common/DashboardStates';
import { KPICard } from '../../components/common/KPICard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import { formatDate } from '../../utils/formatters';
import { RSMDashboard } from '../rsm/RSMDashboard';
import { PerformanceUpload } from './PerformanceUpload';

export const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const status = useQuery({ queryKey: ['report-status'], queryFn: getReportStatus, staleTime: 5 * 60 * 1000 });
  const summary = useQuery({ queryKey: ['dashboard-admin-summary'], queryFn: getAdminSummary, staleTime: 5 * 60 * 1000 });
  const validation = useQuery({ queryKey: ['dashboard-admin-validation'], queryFn: getValidation, staleTime: 5 * 60 * 1000 });
  const queryClient = useQueryClient();
  const notify = useNotificationStore((state) => state.notify);
  const recalc = useMutation({
    mutationFn: recalculate,
    onSuccess: () => {
      notify('Recalculation completed', 'success');
      queryClient.invalidateQueries();
      setConfirm(false);
    },
    onError: () => notify('Recalculation failed', 'error'),
  });

  const genInsights = useMutation({
    mutationFn: generateAllInsights,
    onSuccess: () => notify('Insight generation started in the background', 'success'),
    onError: () => notify('Failed to start insight generation', 'error'),
  });
  if (status.isLoading || summary.isLoading) return <DashboardSkeleton />;
  if (summary.error) return <DashboardErrorState onRetry={() => { summary.refetch(); status.refetch(); validation.refetch(); }} />;
  return (
    <PageWrapper title="Admin Control Center" subtitle="Dashboard analytics, report management, and system status">
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Report Management" />
        <Tab label="Staff Management" />
        <Tab label="System Status" />
      </Tabs>
      {tab === 0 && (
        <>
          <RSMDashboard />
          <Box sx={{ mt: 2.5 }}>
            <AIInsightCard source="regional" title="Regional Performance Insight" />
          </Box>
        </>
      )}
      {tab === 1 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Current Report Status</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={3}><KPICard title="Active Report Date" value={formatDate(status.data?.active_report?.report_date)} /></Grid>
                  <Grid item xs={12} md={3}><KPICard title="Upload Date" value={formatDate(status.data?.active_report?.uploaded_at)} /></Grid>
                  <Grid item xs={12} md={3}><KPICard title="Total Records" value={status.data?.total_records || 0} /></Grid>
                  <Grid item xs={12} md={3}><Box sx={{ mt: 2 }}><StatusBadge status={status.data?.active_report ? 'TARGET MET' : 'CRITICAL'} /></Box></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}><Alert severity="warning">Uploading a new report will replace the current active report.</Alert></Grid>
          <Grid item xs={12}><PerformanceUpload /></Grid>
          <Grid item xs={12}>
            <Card><CardContent><Typography variant="h6">Upload Validation Results</Typography><Grid container spacing={2} sx={{ mt: 1 }}><Grid item xs={12} md={3}><KPICard title="Processed" value={validation.data?.processed_records || 0} color="#00A651" /></Grid><Grid item xs={12} md={3}><KPICard title="Missing Ranks" value={validation.data?.missing_rank_count || 0} color="#E4002B" /></Grid><Grid item xs={12} md={3}><KPICard title="Validation" value={validation.data?.status || 'N/A'} color="#FFC107" /></Grid></Grid></CardContent></Card>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => setConfirm(true)}>Recalculate All KPIs</Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => genInsights.mutate()}
                disabled={genInsights.isPending}
              >
                {genInsights.isPending ? 'Generating…' : 'Generate All Insights'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
      {tab === 2 && (
        <Card><CardContent><Typography variant="h6">Staff Management</Typography><Button component={RouterLink} to="/admin/staff" variant="contained" sx={{ mt: 2 }}>Open Staff Management</Button></CardContent></Card>
      )}
      {tab === 3 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={3}><KPICard title="Database Status" value="Online" icon={<StorageIcon />} color="#00A651" /></Grid>
          <Grid item xs={12} md={3}><KPICard title="Last Calculation Run" value={validation.data?.report_date ? formatDate(validation.data.report_date) : 'N/A'} /></Grid>
          <Grid item xs={12} md={3}><KPICard title="Total Users" value={(summary.data?.total_fsos || 0) + (summary.data?.total_cluster_heads || 0)} /></Grid>
          <Grid item xs={12} md={3}><KPICard title="Active FSOs" value={summary.data?.total_fsos || 0} /></Grid>
          <Grid item xs={12} md={3}><KPICard title="Active Cluster Heads" value={summary.data?.total_cluster_heads || 0} /></Grid>
          <Grid item xs={12} md={3}><KPICard title="Report History" value={status.data?.total_reports || 0} /></Grid>
          <Grid item xs={12} md={6}><CerebrasStatusCard /></Grid>
        </Grid>
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Recalculate all KPIs?</DialogTitle>
        <DialogContent>This will rebuild processed scorecards, FSO rankings, and Cluster Head rankings for the active report.</DialogContent>
        <DialogActions><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="contained" onClick={() => recalc.mutate()} disabled={recalc.isPending}>Recalculate</Button></DialogActions>
      </Dialog>
    </PageWrapper>
  );
};
