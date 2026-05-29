import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { sidebarWidth } from './Sidebar';

export const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ width: { md: `calc(100% - ${sidebarWidth}px)` }, ml: { md: `${sidebarWidth}px` }, borderBottom: '1px solid #E8E8E8' }}>
      <Toolbar sx={{ minHeight: 72 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: 'none' }, mr: 1 }}><MenuIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography fontWeight={900}>{user?.name || 'Sterling Bank'}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.position?.replace('_', ' ') || 'NC Performance Dashboard'}</Typography>
        </Box>
        <Button
          startIcon={<LogoutIcon />}
          variant="outlined"
          color="secondary"
          onClick={() => {
            clearAuth();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};
