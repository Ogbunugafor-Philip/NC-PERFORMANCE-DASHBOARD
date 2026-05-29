import { Alert } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getStaff, updateStaff } from '../../api/staff';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import { StaffForm } from './StaffCreate';

export const StaffEdit = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['staff'], queryFn: () => getStaff() });
  const staff = data.find((item) => item.id === id);
  const mutation = useMutation({
    mutationFn: (values: Parameters<typeof updateStaff>[1]) => updateStaff(id, values),
    onSuccess: () => {
      notify('Staff updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      navigate('/admin/staff');
    },
    onError: () => notify('Unable to update staff', 'error')
  });
  if (isLoading) return <LoadingSpinner />;
  if (!staff) return <Alert severity="error">Staff record not found.</Alert>;
  return <PageWrapper title="Edit Staff" subtitle={staff.dao_code}><StaffForm initial={staff} submitLabel="Save Changes" onSubmit={(values) => mutation.mutate({ ...values, cluster_head_id: values.cluster_head_id || null })} /></PageWrapper>;
};
