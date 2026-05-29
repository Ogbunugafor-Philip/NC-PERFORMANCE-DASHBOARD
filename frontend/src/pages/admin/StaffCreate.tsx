import { Box, Button, Card, CardContent, MenuItem, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createStaff, getClusterHeads } from '../../api/staff';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import type { StaffPayload } from '../../types/staff';
import { daoCodePattern } from '../../utils/validators';

export const StaffForm = ({ initial, onSubmit, submitLabel }: { initial?: Partial<StaffPayload>; onSubmit: (values: StaffPayload) => void; submitLabel: string }) => {
  const { data: clusterHeads = [] } = useQuery({ queryKey: ['cluster-heads'], queryFn: getClusterHeads });
  const { control, handleSubmit, watch } = useForm<StaffPayload>({ defaultValues: { name: initial?.name || '', dao_code: initial?.dao_code || '', position: initial?.position || 'FSO', cluster_head_id: initial?.cluster_head_id || '' } });
  const position = watch('position');
  return (
    <Card><CardContent>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2, maxWidth: 620 }}>
        <Controller name="name" control={control} rules={{ required: 'Name is required' }} render={({ field, fieldState }) => <TextField {...field} label="Name" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
        <Controller name="dao_code" control={control} rules={{ required: 'DAO Code is required', pattern: { value: daoCodePattern, message: 'Invalid DAO code' } }} render={({ field, fieldState }) => <TextField {...field} label="DAO Code" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
        <Controller name="position" control={control} render={({ field }) => <TextField {...field} select label="Position"><MenuItem value="RSM">RSM</MenuItem><MenuItem value="CLUSTER_HEAD">Cluster Head</MenuItem><MenuItem value="FSO">FSO</MenuItem></TextField>} />
        {position === 'FSO' && <Controller name="cluster_head_id" control={control} render={({ field }) => <TextField {...field} select label="Cluster Head"><MenuItem value="">Unassigned</MenuItem>{clusterHeads.map((head) => <MenuItem key={head.id} value={head.id}>{head.name} ({head.dao_code})</MenuItem>)}</TextField>} />}
        <Box sx={{ display: 'flex', gap: 1 }}><Button type="submit" variant="contained">{submitLabel}</Button><Button href="/admin/staff" color="secondary">Cancel</Button></Box>
      </Box>
    </CardContent></Card>
  );
};

export const StaffCreate = () => {
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      notify('Staff created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      navigate('/admin/staff');
    },
    onError: () => notify('DAO code may already exist or staff data is invalid', 'error')
  });
  return <PageWrapper title="Add Staff" subtitle="Create a single staff member"><StaffForm submitLabel="Save" onSubmit={(values) => mutation.mutate({ ...values, cluster_head_id: values.cluster_head_id || null })} /></PageWrapper>;
};
