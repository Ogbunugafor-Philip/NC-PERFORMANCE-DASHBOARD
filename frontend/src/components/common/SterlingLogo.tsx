import { Box, Typography } from '@mui/material';
import { useState } from 'react';

export const SterlingLogo = ({ compact = false }: { compact?: boolean }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      {!failed && (
        <Box
          component="img"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Sterling_Bank_Logo.png/320px-Sterling_Bank_Logo.png"
          alt="Sterling Bank"
          onError={() => setFailed(true)}
          sx={{ width: compact ? 38 : 58, height: compact ? 38 : 58, objectFit: 'contain', flex: '0 0 auto' }}
        />
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: '#E4002B', fontWeight: 900, lineHeight: 1.05, fontSize: compact ? 15 : 18 }}>
          Sterling Bank
        </Typography>
        {!compact && (
          <Typography sx={{ color: '#1A1A1A', fontWeight: 800, fontSize: 13 }}>
            NC Performance Dashboard
          </Typography>
        )}
      </Box>
    </Box>
  );
};
