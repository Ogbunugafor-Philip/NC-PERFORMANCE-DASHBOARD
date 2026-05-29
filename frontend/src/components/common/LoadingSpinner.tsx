import { Box, CircularProgress } from '@mui/material';

export const LoadingSpinner = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
    <CircularProgress />
  </Box>
);
