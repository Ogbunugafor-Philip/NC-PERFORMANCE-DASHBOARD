import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Card, CardContent, Chip, Collapse, Divider, Typography } from '@mui/material';
import { useState } from 'react';
import { MiniScoreGauge } from '../charts/DashboardCharts';
import { FSOLeaderboardTable, type FsoRow } from './FSOLeaderboardTable';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

const medalBorder = (rank: number) =>
  rank === 1 ? '#D4AF37' : rank === 2 ? '#9E9E9E' : rank === 3 ? '#CD7F32' : '#E4002B';

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
    <Typography fontWeight={900}>{value}</Typography>
  </Box>
);

export const ClusterCard = ({
  cluster,
  teamFsos,
  reportDateLabel,
  fileNameDate,
}: {
  cluster: any;
  teamFsos: FsoRow[];
  reportDateLabel: string;
  fileNameDate: string;
}) => {
  const [open, setOpen] = useState(false);
  const ind = cluster.individual;
  const bus = cluster.business;
  return (
    <Card sx={{ borderTop: `5px solid ${medalBorder(cluster.rank)}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>{cluster.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip size="small" label={cluster.state_cluster} sx={{ bgcolor: '#E4002B', color: '#fff', fontWeight: 800 }} />
              <Chip size="small" variant="outlined" label={`${cluster.rank_display} out of ${cluster.rank_total}`} sx={{ fontWeight: 800 }} />
              <Chip size="small" icon={<GroupsIcon />} label={`${cluster.total_fso_count} FSOs`} variant="outlined" />
            </Box>
          </Box>
          <MiniScoreGauge score={cluster.team_scorecard} label="Team Score" />
        </Box>

        <Box sx={{ mt: 1 }}><StatusBadge status={cluster.status} /></Box>

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.5 }}>Team Individual</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1 }}>
          <Metric label="Target" value={ind.target.toLocaleString()} />
          <Metric label="Valid" value={ind.valid.toLocaleString()} />
          <Metric label="% Achievement" value={`${ind.pct_achievement}%`} />
          <Metric label="Current DRR" value={ind.current_drr} />
          <Metric label="Required DRR" value={ind.required_drr} />
        </Box>
        <Box sx={{ mt: 1 }}><ProgressBar value={ind.valid} max={ind.target || 1} label="Individual Achievement" /></Box>

        <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 1.5, mb: 0.5 }}>Team Business</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1 }}>
          <Metric label="Target" value={bus.target.toLocaleString()} />
          <Metric label="Valid" value={bus.valid.toLocaleString()} />
          <Metric label="% Achievement" value={`${bus.pct_achievement}%`} />
          <Metric label="Current DRR" value={bus.current_drr} />
          <Metric label="Required DRR" value={bus.required_drr} />
        </Box>
        <Box sx={{ mt: 1 }}><ProgressBar value={bus.valid} max={bus.target || 1} label="Business Achievement" /></Box>

        <Button
          fullWidth
          variant={open ? 'outlined' : 'contained'}
          startIcon={open ? <ExpandLessIcon /> : <VisibilityIcon />}
          onClick={() => setOpen((v) => !v)}
          sx={{ mt: 2 }}
        >
          {open ? 'Hide Team' : `View Team (${teamFsos.length})`}
        </Button>
        <Collapse in={open} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <FSOLeaderboardTable rows={teamFsos} reportDateLabel={reportDateLabel} fileNameDate={fileNameDate} variant="team" />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
