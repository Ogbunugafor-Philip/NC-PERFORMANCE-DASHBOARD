import { Box } from '@mui/material';
import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const PerformanceBarChart = memo(({ data, title, xKey = 'name', bars }: { data: Record<string, any>[]; title?: string; xKey?: string; bars?: { key: string; color: string; name?: string }[] }) => (
  <Box sx={{ height: 280 }}>
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        {(bars || [{ key: 'achievement', color: '#E4002B' }]).map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} radius={[6, 6, 0, 0]}>
            <LabelList dataKey={bar.key} position="top" />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  </Box>
));
