import { Alert } from '@mui/material';

export const AchievementBanner = ({ achievement, name }: { achievement: number; name?: string }) => {
  if (achievement >= 100) return <Alert severity="success" sx={{ fontWeight: 900 }}>Target Achieved{name ? `, ${name}` : ''}!</Alert>;
  if (achievement >= 80) return <Alert severity="info" sx={{ fontWeight: 900 }}>On Track{name ? `, ${name}` : ''}</Alert>;
  if (achievement < 50) return <Alert severity="error" sx={{ fontWeight: 900 }}>Needs Attention{name ? `, ${name}` : ''}</Alert>;
  return <Alert severity="warning" sx={{ fontWeight: 900 }}>At Risk{name ? `, ${name}` : ''}</Alert>;
};
