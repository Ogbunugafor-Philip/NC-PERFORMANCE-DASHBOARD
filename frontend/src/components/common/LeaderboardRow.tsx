import { Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';

const rankColor = (rank: number) => rank === 1 ? '#D4AF37' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#1A1A1A';

export const LeaderboardRow = ({ rank, name, daoCode, indAchievement, busAchievement, scorecard }: { rank: number; name: string; daoCode: string; indAchievement: number; busAchievement: number; scorecard: number }) => (
  <Paper variant="outlined" sx={{ p: 1.5, display: 'grid', gridTemplateColumns: { xs: '44px 1fr', sm: '52px 1fr auto' }, gap: 1.5, alignItems: 'center', borderRadius: 2 }}>
    <Chip label={rank} sx={{ bgcolor: rankColor(rank), color: '#fff', fontWeight: 900 }} />
    <Box>
      <Typography fontWeight={900}>{name}</Typography>
      <Typography variant="caption" color="text.secondary">{daoCode}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
        <Box><Typography variant="caption">Ind {indAchievement}%</Typography><LinearProgress variant="determinate" value={Math.min(indAchievement, 100)} sx={{ height: 6, borderRadius: 4 }} /></Box>
        <Box><Typography variant="caption">Bus {busAchievement}%</Typography><LinearProgress variant="determinate" value={Math.min(busAchievement, 100)} sx={{ height: 6, borderRadius: 4 }} /></Box>
      </Box>
    </Box>
    <Chip label={scorecard} color={scorecard >= 70 ? 'success' : scorecard >= 50 ? 'warning' : 'error'} sx={{ fontWeight: 900 }} />
  </Paper>
);
