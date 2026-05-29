import { Alert, Box, Button, Card, CardContent, LinearProgress, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { uploadStaffBulk } from '../../api/staff';
import { DataTable } from '../../components/common/DataTable';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';

export const StaffBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const notify = useNotificationStore((state) => state.notify);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: uploadStaffBulk,
    onSuccess: () => {
      notify('Bulk staff upload completed', 'success');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: () => notify('Bulk upload failed. Review the template columns.', 'error')
  });
  const parse = async (selected: File) => {
    setFile(selected);
    const workbook = XLSX.read(await selected.arrayBuffer());
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
    setRows(json);
  };
  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{ Name: 'Jane Doe', 'DAO Code': 'DAO001', Position: 'FSO', 'Assigned Cluster Head': 'CH001' }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');
    XLSX.writeFile(workbook, 'staff-upload-template.xlsx');
  };
  return (
    <PageWrapper title="Bulk Upload Staff" subtitle="Upload Excel with Name, DAO Code, Position, Assigned Cluster Head">
      <Card><CardContent>
        <Box onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const dropped = e.dataTransfer.files[0]; if (dropped) parse(dropped); }} sx={{ border: '2px dashed #E4002B', borderRadius: 2, p: 4, textAlign: 'center', mb: 2 }}>
          <Typography fontWeight={800}>Drag and drop Excel file here</Typography>
          <Button component="label" variant="contained" sx={{ mt: 2 }}>Choose File<input hidden type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} /></Button>
          <Button onClick={downloadTemplate} sx={{ mt: 2, ml: 1 }}>Download template</Button>
        </Box>
        {mutation.isPending && <LinearProgress sx={{ mb: 2 }} />}
        {file && <Alert severity="info" sx={{ mb: 2 }}>{file.name} selected. Preview {rows.length} records before confirming.</Alert>}
        {rows.length > 0 && <DataTable rows={rows} columns={Object.keys(rows[0]).map((key) => ({ key, label: key }))} />}
        {file && <Button variant="contained" sx={{ mt: 2 }} onClick={() => mutation.mutate(file)} disabled={mutation.isPending}>Confirm Upload</Button>}
      </CardContent></Card>
    </PageWrapper>
  );
};
