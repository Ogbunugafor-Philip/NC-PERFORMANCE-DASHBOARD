import { Box, Toolbar } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar, sidebarWidth } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {user && <Sidebar role={user.position} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}
      <TopBar onMenuClick={() => setMobileOpen(true)} />
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${sidebarWidth}px)` }, ml: { md: `${sidebarWidth}px` }, p: { xs: 2, sm: 3 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
