import { Button, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { getReportStatus } from '../../api/reports';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { formatDate } from '../../utils/formatters';
import { RSMDashboard } from '../rsm/RSMDashboard';

export const AdminDashboard = () => {
  const { data: status, isLoading } = useQuery({ queryKey: ['report-status'], queryFn: getReportStatus });
  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      <PageWrapper title="Admin Control Center" subtitle="Report management, staff operations, and regional analytics" actions={<Button component={RouterLink} to="/admin/performance-upload" variant="contained">Upload new report</Button>}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}><KPICard label="Current Active Report Date" value={formatDate(status?.active_report?.report_date)} /></Grid>
          <Grid item xs={12} md={3}><KPICard label="Report Status" value={status?.active_report ? 'Active' : 'No Report'} /></Grid>
          <Grid item xs={12} md={3}><KPICard label="Active Records" value={status?.total_records || 0} /></Grid>
          <Grid item xs={12} md={3}><KPICard label="Total Reports" value={status?.total_reports || 0} /></Grid>
          <Grid item xs={12}>
            <Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Staff Management Quick Links</Typography><Grid container spacing={2}><Grid item><Button component={RouterLink} to="/admin/staff/create" variant="contained">Add Staff</Button></Grid><Grid item><Button component={RouterLink} to="/admin/staff/bulk" variant="outlined">Bulk Upload</Button></Grid><Grid item><Button component={RouterLink} to="/admin/staff" variant="outlined" color="secondary">View All Staff</Button></Grid></Grid></CardContent></Card>
          </Grid>
        </Grid>
      </PageWrapper>
      <RSMDashboard />
    </>
  );
};
