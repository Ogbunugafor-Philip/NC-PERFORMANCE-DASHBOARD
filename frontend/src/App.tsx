import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PerformanceUpload } from './pages/admin/PerformanceUpload';
import { StaffBulkUpload } from './pages/admin/StaffBulkUpload';
import { StaffCreate } from './pages/admin/StaffCreate';
import { StaffEdit } from './pages/admin/StaffEdit';
import { StaffManagement } from './pages/admin/StaffManagement';
import { ReportSummary } from './pages/admin/ReportSummary';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { FirstLoginPage } from './pages/auth/FirstLoginPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ClusterHeadDashboard } from './pages/clusterhead/ClusterHeadDashboard';
import { FSODashboard } from './pages/fso/FSODashboard';
import { RSMDashboard } from './pages/rsm/RSMDashboard';
import { useAuthStore } from './store/authStore';
import type { UserPosition } from './types/auth';

const roleHome: Record<UserPosition, string> = {
  ADMIN: '/admin/dashboard',
  RSM: '/rsm/dashboard',
  CLUSTER_HEAD: '/cluster/dashboard',
  FSO: '/fso/dashboard'
};

const Protected = ({ roles, allowPasswordChange = false, children }: { roles?: UserPosition[]; allowPasswordChange?: boolean; children: ReactElement }) => {
  const { token, user, isLoading } = useAuth();
  const requiresPasswordChange = useAuthStore((state) => state.requiresPasswordChange);
  if (!token) return <Navigate to="/login" replace />;
  if (isLoading || !user) return <LoadingSpinner />;
  if (requiresPasswordChange && !allowPasswordChange) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.position)) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRedirect = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <LoadingSpinner />;
  return <Navigate to={roleHome[user.position]} replace />;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/first-login" element={<FirstLoginPage />} />
    <Route path="/change-password" element={<Protected allowPasswordChange><ChangePasswordPage /></Protected>} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<Protected><DashboardRedirect /></Protected>} />
    <Route element={<Protected><AppLayout /></Protected>}>
      <Route path="/admin/dashboard" element={<Protected roles={['ADMIN']}><AdminDashboard /></Protected>} />
      <Route path="/admin/staff" element={<Protected roles={['ADMIN']}><StaffManagement /></Protected>} />
      <Route path="/admin/staff/create" element={<Protected roles={['ADMIN']}><StaffCreate /></Protected>} />
      <Route path="/admin/staff/:id/edit" element={<Protected roles={['ADMIN']}><StaffEdit /></Protected>} />
      <Route path="/admin/staff/bulk" element={<Protected roles={['ADMIN']}><StaffBulkUpload /></Protected>} />
      <Route path="/admin/performance-upload" element={<Protected roles={['ADMIN']}><PerformanceUpload /></Protected>} />
      <Route path="/admin/report-summary" element={<Protected roles={['ADMIN']}><ReportSummary report={null} validation={null} summary={null} /></Protected>} />
      <Route path="/rsm/dashboard" element={<Protected roles={['RSM']}><RSMDashboard /></Protected>} />
      <Route path="/cluster/dashboard" element={<Protected roles={['CLUSTER_HEAD']}><ClusterHeadDashboard /></Protected>} />
      <Route path="/fso/dashboard" element={<Protected roles={['FSO']}><FSODashboard /></Protected>} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
