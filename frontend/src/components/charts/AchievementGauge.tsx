import { Box, Typography } from '@mui/material';
import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

export const AchievementGauge = ({ value, max = 100, label }: { value: number; max?: number; label: string }) => {
  const color = value >= 80 ? '#00A651' : value >= 50 ? '#FFC107' : '#E4002B';
  return (
    <Box sx={{ height: 240, position: 'relative' }}>
      <ResponsiveContainer>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: Math.min(value, max), fill: color }]} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" background cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', mt: 5 }}>
        <Box textAlign="center"><Typography variant="h4" fontWeight={900}>{value}%</Typography><Typography color="text.secondary">{label}</Typography></Box>
      </Box>
    </Box>
  );
};
