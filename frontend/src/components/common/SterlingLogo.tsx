import { Box, Typography } from '@mui/material';
import { useState } from 'react';

interface SterlingLogoProps {
  width?: number;
  sx?: object;
}

export const SterlingLogo = ({ width = 120, sx = {} }: SterlingLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Typography
        sx={{
          color: '#E4002B',
          fontWeight: 900,
          fontSize: width > 100 ? 22 : 16,
          letterSpacing: '-0.5px',
          ...sx,
        }}
      >
        Sterling Bank
      </Typography>
    );
  }

  return (
    <Box
      component="img"
      src="/sterling-logo.png"
      alt="Sterling Bank"
      onError={() => setFailed(true)}
      sx={{ width, height: 'auto', display: 'block', objectFit: 'contain', ...sx }}
    />
  );
};
