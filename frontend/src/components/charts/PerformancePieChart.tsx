import { Box, Typography } from '@mui/material';
import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export const PerformancePieChart = memo(({ valid, invalid, title }: { valid: number; invalid: number; title?: string }) => {
  const data = [{ name: 'Valid', value: valid }, { name: 'Invalid', value: invalid }];
  const pct = valid + invalid > 0 ? Math.round((valid / (valid + invalid)) * 100) : 0;
  return (
    <Box sx={{ height: 210 }}>
      {title && <Typography fontWeight={900}>{title}</Typography>}
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={3} labelLine={false}>
            <Cell fill="#00A651" />
            <Cell fill="#E4002B" />
          </Pie>
          <Tooltip />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontWeight: 900 }}>{pct}% Valid</text>
        </PieChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.secondary">Valid vs Invalid</Typography>
    </Box>
  );
});
