import { Box, Button } from '@mui/material';
import { memo, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const color = (value: number) => value >= 80 ? '#00A651' : value >= 50 ? '#FFC107' : '#E4002B';

export const TeamComparisonChart = memo(({ data, fsoList, metric = 'scorecard' }: { data?: { name: string; individual: number; business: number }[]; fsoList?: any[]; metric?: 'scorecard' | 'indAchievement' | 'busAchievement' }) => {
  const [showAll, setShowAll] = useState(false);
  const chartData = useMemo(() => {
    const source = fsoList ? fsoList.map((row) => ({
      name: row.name || row.dao_code,
      value: metric === 'indAchievement' ? row.individual?.percentage_achievement : metric === 'busAchievement' ? row.business?.percentage_achievement : row.final_scorecard
    })) : (data || []).map((row) => ({ name: row.name, value: Math.max(row.individual, row.business) }));
    return source.sort((a, b) => b.value - a.value).slice(0, showAll ? source.length : 10);
  }, [data, fsoList, metric, showAll]);
  return (
    <Box>
      <Box sx={{ height: Math.max(320, chartData.length * 36) }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={90} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((entry) => <Cell key={entry.name} fill={color(entry.value)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {(fsoList?.length || data?.length || 0) > 10 && <Button onClick={() => setShowAll(!showAll)}>{showAll ? 'Show top 10' : 'Show all'}</Button>}
    </Box>
  );
});
