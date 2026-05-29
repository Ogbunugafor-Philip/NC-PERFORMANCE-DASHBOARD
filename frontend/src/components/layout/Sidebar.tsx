import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import InsightsIcon from '@mui/icons-material/Insights';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { SterlingLogo } from '../common/SterlingLogo';
import type { UserPosition } from '../../types/auth';
import type { ReactElement } from 'react';

const FULL_WIDTH = 280;
const COLLAPSED_WIDTH = 76;

const menuByRole: Record<UserPosition, { label: string; path: string; icon: ReactElement }[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Staff Management', path: '/admin/staff', icon: <GroupsIcon /> },
    { label: 'Performance Upload', path: '/admin/performance-upload', icon: <UploadFileIcon /> },
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

export const Sidebar = ({ role, collapsed = false }: { role: UserPosition; collapsed?: boolean }) => {
  const width = collapsed ? COLLAPSED_WIDTH : FULL_WIDTH;
  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: '#1A1A1A', color: '#fff' }}>
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
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
            px: collapsed ? 0.75 : 2,
            py: collapsed ? 0.75 : 1.25,
            mb: collapsed ? 0 : 1.25,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <SterlingLogo width={collapsed ? 40 : 120} />
        </Box>
        {!collapsed && (
          <>
            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
              NC Performance Dashboard
            </Typography>
            <Typography sx={{ color: '#9E9E9E', fontSize: 11, mt: 0.25 }}>
              North Central Region
            </Typography>
          </>
        )}
      </Box>
      <List sx={{ px: collapsed ? 0.75 : 1.5 }}>
        {menuByRole[role].map((item) => (
          <Tooltip key={item.label} title={collapsed ? item.label : ''} placement="right" arrow>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                color: '#D7D7D7',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                '&.active': { backgroundColor: '#E4002B', color: '#fff' },
                '&:hover': { backgroundColor: 'rgba(228,0,43,0.18)' }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 38, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800, fontSize: 14 }} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
  return (
    <Drawer variant="permanent" sx={{ width, flexShrink: 0, '& .MuiDrawer-paper': { width, border: 0, boxSizing: 'border-box' } }} open>
      {drawer}
    </Drawer>
  );
};

export const sidebarWidth = FULL_WIDTH;
export const collapsedSidebarWidth = COLLAPSED_WIDTH;
