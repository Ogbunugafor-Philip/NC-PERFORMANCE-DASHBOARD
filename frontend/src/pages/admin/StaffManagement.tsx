import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { deleteStaff, getStaff } from '../../api/staff';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import type { UserPosition } from '../../types/auth';

export const StaffManagementContent = () => {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<UserPosition | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['staff', search, position], queryFn: () => getStaff({ search, position }) });
  const mutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      notify('Staff deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteId(null);
    },
    onError: () => notify('Unable to delete staff', 'error')
  });
  if (isLoading) return <LoadingSpinner />;
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/admin/staff/bulk" variant="outlined">Bulk Upload</Button>
        <Button component={RouterLink} to="/admin/staff/create" variant="contained">Add Staff</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField select label="Position" value={position} onChange={(e) => setPosition(e.target.value as UserPosition | '')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="RSM">RSM</MenuItem>
          <MenuItem value="CLUSTER_HEAD">Cluster Head</MenuItem>
          <MenuItem value="FSO">FSO</MenuItem>
        </TextField>
      </Box>
      <DataTable rows={data as unknown as Record<string, unknown>[]} columns={[
        { key: 'name', label: 'Name', sortable: true },
        { key: 'dao_code', label: 'DAO Code', sortable: true },
        { key: 'position', label: 'Position', sortable: true },
        { key: 'cluster_name', label: 'Cluster' },
        { key: 'is_active', label: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive' },
        { key: 'actions', label: 'Actions', render: (row) => <><IconButton onClick={() => navigate(`/admin/staff/${row.id}/edit`)}><EditIcon /></IconButton><IconButton color="error" onClick={() => setDeleteId(String(row.id))}><DeleteIcon /></IconButton></> }
      ]} />
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete staff record?</DialogTitle>
        <DialogContent>This action removes the staff member and related access.</DialogContent>
        <DialogActions><Button onClick={() => setDeleteId(null)}>Cancel</Button><Button color="error" variant="contained" onClick={() => deleteId && mutation.mutate(deleteId)}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export const StaffManagement = () => (
  <PageWrapper title="Staff Management" subtitle="Manage RSM, Cluster Head, and FSO records">
    <StaffManagementContent />
  </PageWrapper>
);
