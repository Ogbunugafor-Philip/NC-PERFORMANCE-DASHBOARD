import { Box, Toolbar, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from './BottomNav';
import { Sidebar, collapsedSidebarWidth, sidebarWidth } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  // Spec breakpoints: mobile <=767, tablet 768-1023, desktop >=1024
  const isMobile = useMediaQuery('(max-width:767px)');
  const isTablet = useMediaQuery('(min-width:768px) and (max-width:1023px)');

  // Sidebar width by device: hidden on mobile, collapsed on tablet, full on desktop
  const sw = isMobile ? 0 : isTablet ? collapsedSidebarWidth : sidebarWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {user && !isMobile && <Sidebar role={user.position} collapsed={isTablet} />}
      <TopBar sidebarWidth={sw} isMobile={isMobile} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${sw}px)`,
          ml: `${sw}px`,
          p: { xs: 2, sm: 3 },
          // Mobile: tighter horizontal padding + room for the fixed bottom nav
          '@media (max-width:767px)': { px: '12px', pb: '70px', ml: 0, width: '100%' },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      {user && isMobile && <BottomNav role={user.position} />}
    </Box>
  );
};
