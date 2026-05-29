import { Box, CircularProgress, Typography } from '@mui/material';
import { memo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const GREEN = '#00A651';
const AMBER = '#FFC107';
const RED = '#E4002B';
const DARK = '#1A1A1A';

export const achievementColor = (value: number): string =>
  value >= 80 ? GREEN : value >= 50 ? AMBER : RED;

// ── Donut: Valid vs Invalid ───────────────────────────────────────────────
export const DonutChart = memo(({ valid, invalid, title }: { valid: number; invalid: number; title?: string }) => {
  const total = valid + invalid;
  const pct = total > 0 ? Math.round((valid / total) * 100) : 0;
  const data = [
    { name: 'Valid', value: valid },
    { name: 'Invalid', value: invalid },
  ];
  return (
    <Box sx={{ height: { xs: 200, sm: 260 } }}>
      {title && <Typography fontWeight={900} sx={{ mb: 0.5 }}>{title}</Typography>}
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} innerRadius={62} outerRadius={92} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
            <Cell fill={GREEN} />
            <Cell fill={RED} />
          </Pie>
          <Tooltip formatter={(v, n) => [Number(v).toLocaleString(), String(n)]} />
          <Legend />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontWeight: 900, fontSize: 22 }}>{pct}%</text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#777' }}>Valid</text>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
});

// ── Cluster grouped bar: Ind vs Bus % Achievement, benchmark 100 ──────────
interface ClusterDatum { name: string; ind: number; bus: number }
export const ClusterGroupedBar = memo(({ clusters }: { clusters: any[] }) => {
  const data: ClusterDatum[] = clusters.map((c) => ({
    name: c.state_cluster || c.name,
    ind: c.individual?.pct_achievement ?? 0,
    bus: c.business?.pct_achievement ?? 0,
  }));
  return (
    <Box sx={{ height: { xs: 300, sm: 380 } }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Cluster Performance Comparison</Typography>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 'dataMax']} />
          <Tooltip formatter={(v, n) => [`${v}%`, n === 'ind' ? 'Ind % Achievement' : 'Bus % Achievement']} />
          <Legend formatter={(v) => (v === 'ind' ? 'Ind % Achievement' : 'Bus % Achievement')} />
          <ReferenceLine y={100} stroke={GREEN} strokeDasharray="6 4" label={{ value: 'Target 100%', position: 'right', fontSize: 10 }} />
          <Bar dataKey="ind" radius={[5, 5, 0, 0]} animationDuration={800}>
            {data.map((d) => <Cell key={`i-${d.name}`} fill={achievementColor(d.ind)} />)}
          </Bar>
          <Bar dataKey="bus" radius={[5, 5, 0, 0]} animationDuration={800}>
            {data.map((d) => <Cell key={`b-${d.name}`} fill={DARK} fillOpacity={0.55} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

// ── Vertical bar: top/bottom N by scorecard ───────────────────────────────
export const ScoreBarChart = memo(({ data, title }: { data: { name: string; score: number }[]; title?: string }) => (
  <Box sx={{ height: { xs: 240, sm: 320 } }}>
    {title && <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>}
    <ResponsiveContainer>
      <BarChart data={data} margin={{ bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(v) => [`${v}`, 'Final Scorecard']} />
        <Bar dataKey="score" radius={[5, 5, 0, 0]} animationDuration={800}>
          {data.map((d) => <Cell key={d.name} fill={achievementColor(d.score)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </Box>
));

// ── Horizontal bar: all FSOs achievement, colored by value ────────────────
export const HorizontalAchievementBar = memo(({ data, title }: { data: { name: string; value: number }[]; title?: string }) => (
  <Box>
    {title && <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>}
    <Box sx={{ height: Math.max(320, data.length * 26) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip formatter={(v) => [`${v}%`, '% Achievement']} />
          <ReferenceLine x={100} stroke={GREEN} strokeDasharray="6 4" />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} animationDuration={800}>
            {data.map((d) => <Cell key={d.name} fill={achievementColor(d.value)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
));

// ── Compact circular gauge for cluster cards ──────────────────────────────
export const MiniScoreGauge = ({ score, size = 110, label }: { score: number; size?: number; label?: string }) => {
  const color = achievementColor(score);
  return (
    <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <CircularProgress variant="determinate" value={100} size={size} thickness={5} sx={{ color: '#EEE', position: 'absolute' }} />
      <CircularProgress variant="determinate" value={Math.min(score, 100)} size={size} thickness={5} sx={{ color }} />
      <Box sx={{ position: 'absolute', textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={900}>{score}</Typography>
        {label && <Typography variant="caption" color="text.secondary">{label}</Typography>}
      </Box>
    </Box>
  );
};
