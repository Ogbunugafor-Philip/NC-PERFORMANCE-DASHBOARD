import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SterlingLogo } from '../common/SterlingLogo';
import { useAuthStore } from '../../store/authStore';

export const TopBar = ({ sidebarWidth, isMobile }: { sidebarWidth: number; isMobile: boolean }) => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: `calc(100% - ${sidebarWidth}px)`,
        ml: `${sidebarWidth}px`,
        borderBottom: '1px solid #E8E8E8',
        backgroundColor: '#fff',
        '@media (max-width:767px)': { width: '100%', ml: 0 },
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, md: 68 }, gap: 1.5 }}>
        {isMobile ? (
          <>
            {/* Mobile: small logo + title */}
            <Box sx={{ backgroundColor: '#fff', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
              <SterlingLogo width={72} />
            </Box>
            <Typography
              sx={{ fontWeight: 700, fontSize: 14, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              NC Performance
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {/* Avatar → logout menu */}
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#E4002B', fontSize: 15 }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{user?.name || 'Sterling Bank'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.position?.replace('_', ' ') || 'NC Dashboard'}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={logout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            {/* Desktop / tablet: app name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ backgroundColor: '#F5F5F5', borderRadius: 1, px: 1.5, py: 0.75 }}>
                <SterlingLogo width={90} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#555' }}>
                NC Performance Dashboard
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                {user?.name || 'Sterling Bank'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                {user?.position?.replace('_', ' ') || 'NC Dashboard'}
              </Typography>
            </Box>

            <Button
              startIcon={<LogoutIcon />}
              variant="outlined"
              color="secondary"
              size="small"
              onClick={logout}
              sx={{ ml: 1, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
