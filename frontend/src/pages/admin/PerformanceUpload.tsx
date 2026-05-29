import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { getReportStatus, uploadReport } from '../../api/reports';
import { getStaff } from '../../api/staff';
import { DataTable } from '../../components/common/DataTable';
import { KPICard } from '../../components/common/KPICard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useNotificationStore } from '../../store/reportStore';
import { formatDate } from '../../utils/formatters';

type PreviewRow = Record<string, unknown> & {
  dao_code: string;
  name?: string;
  ind_target: number;
  ind_actual: number;
  ind_valid: number;
  bus_target: number;
  bus_actual: number;
  bus_valid: number;
};

const aliases: Record<keyof Omit<PreviewRow, 'name'> | 'name', string[]> = {
  dao_code: ['dao code', 'dao', 'dao_code'],
  name: ['name', 'staff name', 'fso name'],
  ind_target: ['ind target', 'individual target'],
  ind_actual: ['ind actual', 'individual actual'],
  ind_valid: ['ind valid', 'individual valid'],
  bus_target: ['bus target', 'business target'],
  bus_actual: ['bus actual', 'business actual'],
  bus_valid: ['bus valid', 'business valid']
};

const normalize = (value: unknown) => String(value || '').trim().toLowerCase().replaceAll('_', ' ');
const toNumber = (value: unknown) => Number(value || 0);

export const PerformanceUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const notify = useNotificationStore((state) => state.notify);
  const queryClient = useQueryClient();
  const { data: status } = useQuery({ queryKey: ['report-status'], queryFn: getReportStatus });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => getStaff() });
  const staffDaoCodes = useMemo(() => new Set(staff.map((item) => item.dao_code)), [staff]);
  const duplicates = useMemo(() => rows.map((r) => r.dao_code).filter((code, index, all) => all.indexOf(code) !== index), [rows]);
  const unmatched = useMemo(() => rows.map((r) => r.dao_code).filter((code) => !staffDaoCodes.has(code)), [rows, staffDaoCodes]);
  const matched = rows.length - new Set(unmatched).size;
  const validationPasses = rows.length > 0 && unmatched.length === 0 && duplicates.length === 0 && missing.length === 0;
  const mutation = useMutation({
    mutationFn: uploadReport,
    onSuccess: (data) => {
      notify(`Report uploaded successfully for ${data.report.report_date}`, 'success');
      queryClient.invalidateQueries();
    },
    onError: () => notify('Report upload failed. Review validation results.', 'error')
  });

  const parseFile = async (selected: File) => {
    setFile(selected);
    const workbook = XLSX.read(await selected.arrayBuffer(), { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    const headerIndex = matrix.findIndex((row) => row.some((cell) => aliases.dao_code.includes(normalize(cell))));
    const headers = (matrix[headerIndex] || []) as string[];
    const raw = matrix.slice(headerIndex + 1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]]))) as Record<string, unknown>[];
    const mapped = Object.fromEntries(Object.entries(aliases).map(([key, values]) => [key, headers.find((header) => values.includes(normalize(header)))]));
    const missingColumns = Object.entries(mapped).filter(([key, value]) => key !== 'name' && !value).map(([key]) => key);
    setMissing(missingColumns);
    setRows(raw.map((row) => ({
      dao_code: String(row[mapped.dao_code as string] || '').trim().toUpperCase(),
      name: String(row[mapped.name as string] || ''),
      ind_target: toNumber(row[mapped.ind_target as string]),
      ind_actual: toNumber(row[mapped.ind_actual as string]),
      ind_valid: toNumber(row[mapped.ind_valid as string]),
      bus_target: toNumber(row[mapped.bus_target as string]),
      bus_actual: toNumber(row[mapped.bus_actual as string]),
      bus_valid: toNumber(row[mapped.bus_valid as string])
    })));
  };

  const downloadValidation = () => {
    const worksheet = XLSX.utils.json_to_sheet([{ total_records: rows.length, matched, unmatched: unmatched.join(', '), duplicates: duplicates.join(', '), missing: missing.join(', ') }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation');
    XLSX.writeFile(workbook, 'performance-validation-report.xlsx');
  };

  return (
    <PageWrapper title="Performance Upload" subtitle="Upload New to Bank report data for the active period">
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}><KPICard label="Current Active Report" value={formatDate(status?.active_report?.report_date)} /></Grid>
        <Grid item xs={12} md={8}><Alert severity="warning">Uploading a new report will replace the current active report.</Alert></Grid>
        <Grid item xs={12}>
          <Card><CardContent>
            <Box onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const dropped = e.dataTransfer.files[0]; if (dropped) parseFile(dropped); }} sx={{ border: '2px dashed #E4002B', borderRadius: 2, p: 4, textAlign: 'center' }}>
              <Typography fontWeight={900}>Drag and drop Excel report here</Typography>
              <Typography color="text.secondary">Accepts .xlsx and .xls only</Typography>
              <Button component="label" variant="contained" sx={{ mt: 2 }}>Choose File<input hidden type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} /></Button>
            </Box>
          </CardContent></Card>
        </Grid>
        {mutation.isPending && <Grid item xs={12}><LinearProgress /></Grid>}
        {file && <Grid item xs={12}><Alert severity="info">{file.name} selected. Review validation before confirming upload.</Alert></Grid>}
        {rows.length > 0 && (
          <>
            <Grid item xs={12} md={3}><KPICard label="Total records found" value={rows.length} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Matched DAO Codes" value={matched} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Unmatched DAO Codes" value={new Set(unmatched).size} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Duplicate records" value={new Set(duplicates).size} /></Grid>
            <Grid item xs={12}><Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography><DataTable rows={rows as unknown as Record<string, unknown>[]} columns={[
              { key: 'dao_code', label: 'DAO Code' },
              { key: 'name', label: 'Name' },
              { key: 'ind_target', label: 'Ind. Target' },
              { key: 'ind_actual', label: 'Ind. Actual' },
              { key: 'ind_valid', label: 'Ind. Valid' },
              { key: 'bus_target', label: 'Bus. Target' },
              { key: 'bus_actual', label: 'Bus. Actual' },
              { key: 'bus_valid', label: 'Bus. Valid' }
            ]} /></CardContent></Card></Grid>
            <Grid item xs={12}><Card><CardContent>
              <Typography variant="h6">Report Validation</Typography>
              <List dense>
                <ListItem><ListItemIcon>{rows.length ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}</ListItemIcon><ListItemText primary="Records found" secondary={`${rows.length} rows`} /></ListItem>
                <ListItem><ListItemIcon>{unmatched.length ? <ErrorIcon color="error" /> : <CheckCircleIcon color="success" />}</ListItemIcon><ListItemText primary="DAO code matching" secondary={unmatched.length ? [...new Set(unmatched)].join(', ') : 'All DAO codes matched'} /></ListItem>
                <ListItem><ListItemIcon>{duplicates.length ? <WarningIcon color="warning" /> : <CheckCircleIcon color="success" />}</ListItemIcon><ListItemText primary="Duplicate records" secondary={duplicates.length ? [...new Set(duplicates)].join(', ') : 'No duplicates'} /></ListItem>
                <ListItem><ListItemIcon>{missing.length ? <ErrorIcon color="error" /> : <CheckCircleIcon color="success" />}</ListItemIcon><ListItemText primary="Missing required fields" secondary={missing.length ? missing.join(', ') : 'All required fields present'} /></ListItem>
              </List>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip color={validationPasses ? 'success' : 'error'} label={validationPasses ? 'Validation passed' : 'Validation failed'} />
                <Button onClick={downloadValidation}>Download validation report</Button>
                {validationPasses && file && <Button variant="contained" onClick={() => mutation.mutate(file)} disabled={mutation.isPending}>Confirm Upload</Button>}
              </Box>
            </CardContent></Card></Grid>
          </>
        )}
      </Grid>
    </PageWrapper>
  );
};
