import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, Divider, IconButton, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SterlingLogo } from '../common/SterlingLogo';
import { useAuthStore } from '../../store/authStore';
import { sidebarWidth } from './Sidebar';

export const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        borderBottom: '1px solid #E8E8E8',
        backgroundColor: '#fff',
      }}
    >
      <Toolbar sx={{ minHeight: 68, gap: 1.5 }}>
        {/* Mobile hamburger */}
        <IconButton onClick={onMenuClick} sx={{ display: { md: 'none' }, mr: 0.5 }}>
          <MenuIcon />
        </IconButton>

        {/* Sterling logo — mobile only (desktop has sidebar) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 1 }}>
          <Box sx={{ backgroundColor: '#fff', borderRadius: 1, p: 0.5 }}>
            <SterlingLogo width={80} />
          </Box>
        </Box>

        {/* Desktop: app name */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ backgroundColor: '#F5F5F5', borderRadius: 1, px: 1.5, py: 0.75 }}>
            <SterlingLogo width={90} />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#555' }}>
            NC Performance Dashboard
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* User info */}
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
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
          onClick={() => {
            clearAuth();
            navigate('/login');
          }}
          sx={{ ml: 1, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};
