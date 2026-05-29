import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from './BottomNav';
import { Sidebar, sidebarWidth } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();
  // Restore the original desktop boundary: full sidebar at >=900px (md),
  // mobile (bottom nav) below it. Desktop layout is unchanged.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sw = isMobile ? 0 : sidebarWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {user && !isMobile && <Sidebar role={user.position} />}
      <TopBar sidebarWidth={sw} isMobile={isMobile} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${sw}px)`,
          ml: `${sw}px`,
          p: { xs: 2, sm: 3 },
          // Mobile only: tighter horizontal padding + room for the fixed bottom nav
          ...(isMobile && { px: '12px', pb: '70px', ml: 0, width: '100%' }),
        }}
      >
        <Toolbar />
        {/* Desktop only (>=1024px): cap content width and centre it so large
            screens don't stretch; tablet/mobile are untouched. */}
        <Box sx={{ '@media (min-width:1024px)': { maxWidth: 1600, mx: 'auto' } }}>
          <Outlet />
        </Box>
      </Box>
      {user && isMobile && <BottomNav role={user.position} />}
    </Box>
  );
};
