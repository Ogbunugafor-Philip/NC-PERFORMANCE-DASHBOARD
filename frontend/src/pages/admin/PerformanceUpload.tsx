import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
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

// ── Fixed column positions (0-indexed, matching the NTB Excel report) ─────────
const COL_DAO_CODE     = 1;   // B
const COL_STAFF_NAME   = 3;   // D
const COL_IND_TARGET   = 9;   // J
const COL_IND_ACTUAL   = 10;  // K
const COL_IND_VALID    = 11;  // L
const COL_BUS_TARGET   = 16;  // Q
const COL_BUS_ACTUAL   = 17;  // R
const COL_BUS_VALID    = 18;  // S
const COL_DATE_SOURCE  = 9;   // J — also contains the date in row 1
const ROW_DATE         = 0;   // Row 1 (0-indexed)
const ROW_DATA_START   = 6;   // Row 7 (0-indexed)

type PreviewRow = {
  dao_code: string;
  name: string;
  ind_target: number;
  ind_actual: number;
  ind_valid: number;
  bus_target: number;
  bus_actual: number;
  bus_valid: number;
};

const _DATE_RE =
  /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i;

function _toInt(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : Math.round(n);
}

function _normDao(v: unknown): string {
  if (v === null || v === undefined) return '';
  // Handle numeric DAO codes (e.g., 520264 or 520264.0)
  const n = Number(v);
  const s = !isNaN(n) && isFinite(n) ? String(Math.round(n)) : String(v).trim();
  return s.toUpperCase();
}

function _extractDate(matrix: unknown[][]): string {
  try {
    const cell = matrix[ROW_DATE]?.[COL_DATE_SOURCE];
    if (cell instanceof Date) {
      return cell.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const text = String(cell ?? '');
    const m = _DATE_RE.exec(text);
    if (m) return `${m[1]} ${m[2]}, ${m[3]}`;
  } catch {
    // fall through
  }
  return '';
}

export const PerformanceUpload = () => {
  const [file, setFile]           = useState<File | null>(null);
  const [rows, setRows]           = useState<PreviewRow[]>([]);
  const [skipped, setSkipped]     = useState(0);
  const [reportDateLabel, setReportDateLabel] = useState('');
  const notify        = useNotificationStore((s) => s.notify);
  const queryClient   = useQueryClient();
  const { data: status } = useQuery({ queryKey: ['report-status'], queryFn: getReportStatus });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => getStaff() });

  const staffDaoCodes = useMemo(() => new Set(staff.map((s) => s.dao_code)), [staff]);
  const unmatched     = useMemo(() => [...new Set(rows.map((r) => r.dao_code).filter((c) => !staffDaoCodes.has(c)))], [rows, staffDaoCodes]);
  const matched       = rows.length - unmatched.length;

  // Upload is allowed as long as at least one row is matched; unmatched are just warned
  const canUpload = rows.length > 0 && matched > 0;

  const mutation = useMutation({
    mutationFn: uploadReport,
    onSuccess: (data) => {
      const d = data.validation?.report_date_extracted || formatDate(data.report.report_date);
      notify(`Report uploaded — New to Bank Report as at ${d}`, 'success');
      queryClient.invalidateQueries();
    },
    onError: () => notify('Upload failed. Check validation results.', 'error'),
  });

  const parseFile = async (selected: File) => {
    setFile(selected);
    setRows([]);
    setSkipped(0);
    setReportDateLabel('');

    const workbook = XLSX.read(await selected.arrayBuffer(), { cellDates: true });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    // Read as matrix (no header processing) so column positions are stable
    const matrix   = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

    setReportDateLabel(_extractDate(matrix));

    const parsed: PreviewRow[] = [];
    let skippedCount = 0;

    for (let i = ROW_DATA_START; i < matrix.length; i++) {
      const row = matrix[i] as unknown[];
      const daoRaw  = row[COL_DAO_CODE];
      const nameRaw = row[COL_STAFF_NAME];

      const daoStr  = _normDao(daoRaw);
      const nameStr = nameRaw != null ? String(nameRaw).trim() : '';

      if (!daoStr || daoStr === '0' || !nameStr) {
        skippedCount++;
        continue;
      }

      parsed.push({
        dao_code:   daoStr,
        name:       nameStr,
        ind_target: _toInt(row[COL_IND_TARGET]),
        ind_actual: _toInt(row[COL_IND_ACTUAL]),
        ind_valid:  _toInt(row[COL_IND_VALID]),
        bus_target: _toInt(row[COL_BUS_TARGET]),
        bus_actual: _toInt(row[COL_BUS_ACTUAL]),
        bus_valid:  _toInt(row[COL_BUS_VALID]),
      });
    }

    setRows(parsed);
    setSkipped(skippedCount);
  };

  return (
    <PageWrapper
      title="Performance Upload"
      subtitle="Upload New to Bank report data for the active period"
    >
      <Grid container spacing={2.5}>
        {/* Status */}
        <Grid item xs={12} md={4}>
          <KPICard
            label="Current Active Report"
            value={
              status?.active_report?.report_date
                ? `New to Bank Report as at ${formatDate(status.active_report.report_date)}`
                : 'No active report'
            }
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Alert severity="warning">
            Uploading a new report will replace the current active report.
          </Alert>
        </Grid>

        {/* Drop zone */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) parseFile(dropped);
                }}
                sx={{ border: '2px dashed #E4002B', borderRadius: 2, p: 4, textAlign: 'center' }}
              >
                <Typography fontWeight={900}>Drag and drop Excel report here</Typography>
                <Typography color="text.secondary">Accepts .xlsx and .xls only</Typography>
                <Button component="label" variant="contained" sx={{ mt: 2 }}>
                  Choose File
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
                  />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {mutation.isPending && (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        )}
        {file && (
          <Grid item xs={12}>
            <Alert severity="info">{file.name} selected. Review validation below before uploading.</Alert>
          </Grid>
        )}

        {rows.length > 0 && (
          <>
            {/* Summary cards */}
            {reportDateLabel && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  Report date extracted: <strong>New to Bank Report as at {reportDateLabel}</strong>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} md={3}><KPICard label="Total rows found" value={rows.length + skipped} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Rows skipped (blank)" value={skipped} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Matched to users" value={matched} /></Grid>
            <Grid item xs={12} md={3}><KPICard label="Unmatched DAO Codes" value={unmatched.length} /></Grid>

            {/* Preview table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Preview (first 50 rows)</Typography>
                  <DataTable
                    rows={(rows.slice(0, 50)) as unknown as Record<string, unknown>[]}
                    columns={[
                      { key: 'dao_code',   label: 'DAO Code'    },
                      { key: 'name',       label: 'Name'        },
                      { key: 'ind_target', label: 'Ind Target'  },
                      { key: 'ind_actual', label: 'Ind Actual'  },
                      { key: 'ind_valid',  label: 'Ind Valid'   },
                      { key: 'bus_target', label: 'Bus Target'  },
                      { key: 'bus_actual', label: 'Bus Actual'  },
                      { key: 'bus_valid',  label: 'Bus Valid'   },
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Validation report */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Upload Validation</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {reportDateLabel ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Report date"
                        secondary={reportDateLabel ? `New to Bank Report as at ${reportDateLabel}` : 'Could not extract date from Row 1, Column J'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                      <ListItemText primary="Data rows found" secondary={`${rows.length} data rows, ${skipped} blank rows skipped`} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {matched > 0 ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="DAO code matching"
                        secondary={`${matched} matched, ${unmatched.length} unmatched`}
                      />
                    </ListItem>
                    {unmatched.length > 0 && (
                      <ListItem sx={{ pl: 4 }}>
                        <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                        <ListItemText
                          primary="Unmatched DAO codes (will be skipped)"
                          secondary={unmatched.join(', ')}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip
                      color={canUpload ? 'success' : 'error'}
                      label={canUpload ? `Ready to upload — ${matched} records` : 'Cannot upload — no matched users'}
                    />
                    {unmatched.length > 0 && (
                      <Chip
                        color="warning"
                        label={`${unmatched.length} DAO code(s) not found in system — will be skipped`}
                      />
                    )}
                    {canUpload && file && (
                      <Button
                        variant="contained"
                        onClick={() => mutation.mutate(file)}
                        disabled={mutation.isPending}
                        sx={{ ml: 'auto' }}
                      >
                        Confirm Upload
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </PageWrapper>
  );
};
