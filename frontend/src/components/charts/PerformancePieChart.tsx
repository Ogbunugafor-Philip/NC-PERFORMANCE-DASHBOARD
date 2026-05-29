import { Box, Typography } from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export const PerformancePieChart = ({ valid, invalid }: { valid: number; invalid: number }) => {
  const data = [{ name: 'Valid', value: valid }, { name: 'Invalid', value: invalid }];
  return (
    <Box sx={{ height: 210 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={3}>
            <Cell fill="#16803C" />
            <Cell fill="#E4002B" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.secondary">Valid vs Invalid</Typography>
    </Box>
  );
};
