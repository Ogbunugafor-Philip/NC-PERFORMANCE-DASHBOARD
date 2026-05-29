import { Box } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const TeamComparisonChart = ({ data }: { data: { name: string; individual: number; business: number }[] }) => (
  <Box sx={{ height: 320 }}>
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="individual" fill="#E4002B" radius={[6, 6, 0, 0]} />
        <Bar dataKey="business" fill="#1A1A1A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Box>
);
