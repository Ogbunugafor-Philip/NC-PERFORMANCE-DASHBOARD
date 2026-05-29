import { Box, Typography } from '@mui/material';
import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const ClusterComparisonChart = memo(({ clusterList }: { clusterList: any[] }) => {
  const data = clusterList.map((cluster) => ({
    name: cluster.name || cluster.dao_code,
    individual: cluster.ind_percentage_achievement || cluster.ind_achievement_percentage || 0,
    business: cluster.bus_percentage_achievement || cluster.bus_achievement_percentage || 0
  }));
  return (
    <Box sx={{ height: 340 }}>
      <Typography variant="h6">Cluster Comparison</Typography>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <ReferenceLine y={100} stroke="#00A651" strokeDasharray="4 4" />
          <Bar dataKey="individual" fill="#E4002B" radius={[6, 6, 0, 0]} />
          <Bar dataKey="business" fill="#1A1A1A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});
