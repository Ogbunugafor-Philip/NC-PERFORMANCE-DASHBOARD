import { Box } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const PerformanceBarChart = ({ data }: { data: { name: string; achievement: number }[] }) => (
  <Box sx={{ height: 280 }}>
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="achievement" fill="#E4002B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Box>
);
