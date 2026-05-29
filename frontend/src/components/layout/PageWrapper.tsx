import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

export const PageWrapper = ({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontSize: { xs: 18, sm: 24 } }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 13, sm: 'inherit' } }}>{subtitle}</Typography>}
      </Box>
      {actions}
    </Box>
    {children}
  </Box>
);
