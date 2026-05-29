import { Button, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Link as RouterLink } from 'react-router-dom';
import { KPICard } from '../../components/common/KPICard';
import { formatDate, formatPercent } from '../../utils/formatters';

export const ReportSummary = ({ report, validation, summary }: { report: any; validation: any; summary: any }) => (
  <Card>
    <CardContent>
      <Typography variant="h6">Report Summary</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={3}><KPICard title="Report Date" value={formatDate(report?.report_date)} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Total FSOs in Report" value={validation?.processed_records || 0} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Matched to System" value={validation?.processed_records || 0} color="#00A651" /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Unmatched" value={validation?.missing_rank_count || 0} color="#E4002B" /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Ind Target" value={summary?.total_ind_target || 0} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Ind Valid" value={summary?.total_ind_valid || 0} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Bus Target" value={summary?.total_bus_target || 0} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Bus Valid" value={summary?.total_bus_valid || 0} /></Grid>
        <Grid item xs={12} md={3}><KPICard title="Regional Achievement" value={formatPercent(summary?.regional_percentage_achievement || 0)} /></Grid>
        <Grid item xs={12}><Button component={RouterLink} to="/rsm/dashboard" variant="contained">View FSO Rankings</Button></Grid>
      </Grid>
    </CardContent>
  </Card>
);
