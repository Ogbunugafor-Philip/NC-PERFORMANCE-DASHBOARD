import CloudOffIcon from '@mui/icons-material/CloudOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Alert, Box, Button, Card, CardContent, Skeleton, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Link as RouterLink } from 'react-router-dom';

export const DashboardSkeleton = () => (
  <Grid container spacing={2.5}>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <Grid item xs={12} sm={6} lg={4} key={item}>
        <Card><CardContent><Skeleton height={22} width="50%" /><Skeleton height={52} /><Skeleton height={18} width="70%" /></CardContent></Card>
      </Grid>
    ))}
  </Grid>
);

export const EmptyReportState = ({ admin = false }: { admin?: boolean }) => (
  <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
    <Card sx={{ maxWidth: 520, textAlign: 'center' }}>
      <CardContent sx={{ p: 5 }}>
        <CloudOffIcon sx={{ fontSize: 64, color: '#E4002B' }} />
        <Typography variant="h5" sx={{ mt: 2 }}>No Active Report</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{admin ? 'Please upload the latest performance report.' : 'Please contact your administrator to upload the latest report.'}</Typography>
        {admin && <Button component={RouterLink} to="/admin/performance-upload" variant="contained" sx={{ mt: 3 }}>Upload Report</Button>}
      </CardContent>
    </Card>
  </Box>
);

export const DashboardErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <Alert severity="error" icon={<ErrorOutlineIcon />} action={onRetry && <Button onClick={onRetry}>Retry</Button>}>
    Failed to load performance data
  </Alert>
);
