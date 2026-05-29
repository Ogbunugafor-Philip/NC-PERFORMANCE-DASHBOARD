import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Box, Card, CardContent, Typography } from '@mui/material';

const medal = (rank: number) => rank === 1 ? '#D4AF37' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#E4002B';

export const RankingCard = ({ title, ranking, rank, total, type = 'FSO' }: { title?: string; ranking?: string; rank?: string | number; total?: number; type?: 'FSO' | 'Cluster Head' }) => (
  <Card>
    <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
      {Number(rank) <= 3 && Number(rank) > 0 && <EmojiEventsIcon sx={{ color: medal(Number(rank)), position: 'absolute', right: 18, top: 18, fontSize: 36 }} />}
      <Typography color="text.secondary" fontWeight={800}>{title || `${type} Ranking`}</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontSize: 48, lineHeight: 1, fontWeight: 900, color: '#E4002B' }}>{rank || ranking}</Typography>
        {total && <Typography color="text.secondary">out of {total} {type === 'FSO' ? 'FSOs' : 'Cluster Heads'} in North Central</Typography>}
      </Box>
    </CardContent>
  </Card>
);
