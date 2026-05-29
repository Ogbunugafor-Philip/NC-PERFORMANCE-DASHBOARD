import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import type { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserPosition } from '../../types/auth';

interface NavItem { label: string; path: string; icon: ReactElement }

const navByRole: Record<UserPosition, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Staff', path: '/admin/staff', icon: <GroupsIcon /> },
    { label: 'Upload', path: '/admin/performance-upload', icon: <UploadFileIcon /> },
  ],
  RSM: [{ label: 'Dashboard', path: '/rsm/dashboard', icon: <DashboardIcon /> }],
  CLUSTER_HEAD: [{ label: 'Dashboard', path: '/cluster/dashboard', icon: <DashboardIcon /> }],
  FSO: [{ label: 'Dashboard', path: '/fso/dashboard', icon: <DashboardIcon /> }],
};

export const BOTTOM_NAV_HEIGHT = 56;

export const BottomNav = ({ role }: { role: UserPosition }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const items = navByRole[role] ?? [];

  const current = items.find((i) => location.pathname.startsWith(i.path))?.path ?? items[0]?.path ?? '';

  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        borderTop: '1px solid #ECECEC',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        pb: 'env(safe-area-inset-bottom)',
        // Hide on tablet/desktop (>=768px): sidebar handles navigation there
        '@media (min-width:768px)': { display: 'none' },
      }}
    >
      <BottomNavigation
        value={current}
        showLabels
        sx={{ height: BOTTOM_NAV_HEIGHT, '& .Mui-selected': { color: '#E4002B' } }}
        onChange={(_, value) => {
          if (value === '__logout__') {
            clearAuth();
            navigate('/login');
            return;
          }
          navigate(value);
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} sx={{ minWidth: 0 }} />
        ))}
        <BottomNavigationAction label="Logout" value="__logout__" icon={<LogoutIcon />} sx={{ minWidth: 0 }} />
      </BottomNavigation>
    </Paper>
  );
};
