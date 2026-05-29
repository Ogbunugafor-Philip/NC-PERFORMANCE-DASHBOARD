import { Chip } from '@mui/material';

const colorFor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  if (['TARGET MET', 'ON TRACK', 'AHEAD OF PACE'].includes(status)) return 'success';
  if (['AT RISK', 'CLOSE TO PACE'].includes(status)) return 'warning';
  if (['CRITICAL', 'BEHIND PACE'].includes(status)) return 'error';
  return 'default';
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Chip size="small" label={status} color={colorFor(status)} sx={{ fontWeight: 800 }} />
);
