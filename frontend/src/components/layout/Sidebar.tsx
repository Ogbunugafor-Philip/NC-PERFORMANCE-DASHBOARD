import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import InsightsIcon from '@mui/icons-material/Insights';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { SterlingLogo } from '../common/SterlingLogo';
import type { UserPosition } from '../../types/auth';
import type { ReactElement } from 'react';

const width = 280;

const menuByRole: Record<UserPosition, { label: string; path: string; icon: ReactElement }[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Staff Management', path: '/admin/staff', icon: <GroupsIcon /> },
    { label: 'Performance Upload', path: '/admin/performance-upload', icon: <UploadFileIcon /> },
    { label: 'Reports', path: '/admin/reports', icon: <AssessmentIcon /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <InsightsIcon /> }
  ],
  RSM: [
    { label: 'Dashboard', path: '/rsm/dashboard', icon: <DashboardIcon /> },
    { label: 'FSO Rankings', path: '/rsm/dashboard#fsos', icon: <LeaderboardIcon /> },
    { label: 'Cluster Rankings', path: '/rsm/dashboard#clusters', icon: <GroupsIcon /> },
    { label: 'Analytics', path: '/rsm/dashboard#analytics', icon: <InsightsIcon /> }
  ],
  CLUSTER_HEAD: [
    { label: 'Dashboard', path: '/cluster/dashboard', icon: <DashboardIcon /> },
    { label: 'My Team', path: '/cluster/dashboard#team', icon: <GroupsIcon /> },
    { label: 'Team Rankings', path: '/cluster/dashboard#rankings', icon: <LeaderboardIcon /> },
    { label: 'Analytics', path: '/cluster/dashboard#analytics', icon: <InsightsIcon /> }
  ],
  FSO: [
    { label: 'Dashboard', path: '/fso/dashboard', icon: <DashboardIcon /> },
    { label: 'My Performance', path: '/fso/dashboard#performance', icon: <AssessmentIcon /> }
  ]
};

export const Sidebar = ({ role, mobileOpen, onClose }: { role: UserPosition; mobileOpen: boolean; onClose: () => void }) => {
  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: '#1A1A1A', color: '#fff' }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#fff',
            borderRadius: 1.5,
            px: 2,
            py: 1.25,
            mb: 1.25,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <SterlingLogo width={120} />
        </Box>
        <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
          NC Performance Dashboard
        </Typography>
        <Typography sx={{ color: '#9E9E9E', fontSize: 11, mt: 0.25 }}>
          North Central Region
        </Typography>
      </Box>
      <List sx={{ px: 1.5 }}>
        {menuByRole[role].map((item) => (
          <ListItemButton
            key={item.label}
            component={NavLink}
            to={item.path}
            onClick={onClose}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              color: '#D7D7D7',
              '&.active': { backgroundColor: '#E4002B', color: '#fff' },
              '&:hover': { backgroundColor: 'rgba(228,0,43,0.18)' }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800, fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width, border: 0 } }} open>
        {drawer}
      </Drawer>
    </>
  );
};

export const sidebarWidth = width;
