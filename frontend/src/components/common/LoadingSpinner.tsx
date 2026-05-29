import { Box, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

export const LoadingSpinner = () => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            backgroundColor: '#fff',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          {logoFailed ? (
            <Typography sx={{ color: '#E4002B', fontWeight: 900, fontSize: 24 }}>
              Sterling Bank
            </Typography>
          ) : (
            <Box
              component="img"
              src="/sterling-logo.png"
              alt="Sterling Bank"
              onError={() => setLogoFailed(true)}
              sx={{ width: 160, height: 'auto', display: 'block' }}
            />
          )}
        </Box>

        {/* Spinner */}
        <CircularProgress
          size={36}
          thickness={3.5}
          sx={{ color: '#E4002B' }}
        />

        <Typography sx={{ color: '#999', fontSize: 13 }}>
          NC Performance Dashboard
        </Typography>
      </Box>
    </Box>
  );
};
