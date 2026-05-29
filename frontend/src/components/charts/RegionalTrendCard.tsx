import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { ProgressBar } from '../common/ProgressBar';

export const RegionalTrendCard = ({ regionalSummary }: { regionalSummary: any }) => (
  <Card>
    <CardContent>
      <Typography variant="h6">Regional Trend Snapshot</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={4}><Typography variant="h5" fontWeight={900}>{regionalSummary.total_fsos || 0}</Typography><Typography variant="caption">Total FSOs</Typography></Grid>
        <Grid item xs={4}><Typography variant="h5" fontWeight={900}>{regionalSummary.total_target || 0}</Typography><Typography variant="caption">Total Targets</Typography></Grid>
        <Grid item xs={4}><Typography variant="h5" fontWeight={900}>{regionalSummary.total_valid || 0}</Typography><Typography variant="caption">Total Valid</Typography></Grid>
        <Grid item xs={12}><ProgressBar value={regionalSummary.total_valid || 0} max={regionalSummary.total_target || 100} label="Regional achievement" /></Grid>
      </Grid>
    </CardContent>
  </Card>
);
