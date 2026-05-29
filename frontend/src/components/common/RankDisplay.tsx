import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Box, Card, CardContent, Typography } from '@mui/material';

export const RankDisplay = ({ ordinal, total }: { ordinal: string; total: number }) => {
  const numeric = Number.parseInt(ordinal, 10);
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {numeric <= 3 && numeric > 0 && <EmojiEventsIcon color="warning" fontSize="large" />}
        <Box>
          <Typography variant="h4" fontWeight={900}>{ordinal}</Typography>
          <Typography color="text.secondary">out of {total} FSOs in North Central</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
