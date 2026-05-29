import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { ReactNode } from 'react';

export const KPICard = ({
  title,
  label,
  value,
  subtitle,
  helper,
  icon,
  color = '#E4002B',
  trend
}: {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  helper?: string;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down';
}) => (
  <Card sx={{ borderLeft: `5px solid ${color}`, transition: 'box-shadow 180ms ease, transform 180ms ease', '&:hover': { boxShadow: '0 12px 30px rgba(0,0,0,0.10)', transform: 'translateY(-2px)' } }}>
    <CardContent sx={{ minHeight: 132 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={800}>{title || label}</Typography>
        <Box sx={{ color }}>{icon}{trend === 'up' && <ArrowUpwardIcon fontSize="small" />}{trend === 'down' && <ArrowDownwardIcon fontSize="small" />}</Box>
      </Box>
      <Typography sx={{ mt: 0.75, fontSize: { xs: 28, sm: 32 }, lineHeight: 1.1, fontWeight: 900 }}>{value}</Typography>
      {(subtitle || helper) && <Typography variant="caption" color="text.secondary">{subtitle || helper}</Typography>}
    </CardContent>
  </Card>
);
