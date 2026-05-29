import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { exportFsoLeaderboard, type FsoExportRow } from '../../utils/excelExport';
import { StatusBadge } from './StatusBadge';

export interface FsoRow extends FsoExportRow {
  user_id: string;
  cluster_head_id: string | null;
  rank: number;
}

type SortKey =
  | 'final_scorecard'
  | 'ind_pct_achievement'
  | 'bus_pct_achievement'
  | 'ind_current_drr'
  | 'bus_current_drr';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'final_scorecard', label: 'Final Scorecard' },
  { value: 'ind_pct_achievement', label: 'Ind % Achievement' },
  { value: 'bus_pct_achievement', label: 'Bus % Achievement' },
  { value: 'ind_current_drr', label: 'Ind Current DRR' },
  { value: 'bus_current_drr', label: 'Bus Current DRR' },
];

const STATUSES = ['TARGET MET', 'ON TRACK', 'AT RISK', 'CRITICAL'];

const borderColor = (score: number): string =>
  score >= 80 ? '#00A651' : score >= 50 ? '#FFC107' : '#E4002B';

const pct = (n: number) => `${n}%`;

// Column order matches the exact Excel header order.
const baseCols = (showCluster: boolean) => [
  { key: 'sn', label: 'S/N' },
  { key: 'name', label: 'FSO Name' },
  { key: 'dao_code', label: 'DAO Code' },
  ...(showCluster
    ? [
        { key: 'cluster_head', label: 'Cluster Head' },
        { key: 'state_cluster', label: 'State Cluster' },
      ]
    : []),
  { key: 'ind_target', label: 'Ind Target' },
  { key: 'ind_actual', label: 'Ind Actual' },
  { key: 'ind_valid', label: 'Ind Valid' },
  { key: 'ind_invalid', label: 'Ind Invalid' },
  { key: 'ind_pct_invalid', label: 'Ind % Invalid', isPct: true },
  { key: 'ind_pct_achievement', label: 'Ind % Achievement', isPct: true },
  { key: 'ind_score', label: 'Ind Score' },
  { key: 'ind_current_drr', label: 'Ind Current DRR' },
  { key: 'ind_required_drr', label: 'Ind Required DRR' },
  { key: 'bus_target', label: 'Bus Target' },
  { key: 'bus_actual', label: 'Bus Actual' },
  { key: 'bus_valid', label: 'Bus Valid' },
  { key: 'bus_invalid', label: 'Bus Invalid' },
  { key: 'bus_pct_invalid', label: 'Bus % Invalid', isPct: true },
  { key: 'bus_pct_achievement', label: 'Bus % Achievement', isPct: true },
  { key: 'bus_score', label: 'Bus Score' },
  { key: 'bus_current_drr', label: 'Bus Current DRR' },
  { key: 'bus_required_drr', label: 'Bus Required DRR' },
  { key: 'final_scorecard', label: 'Final Scorecard' },
  { key: 'position', label: 'Position' },
  { key: 'status', label: 'Status' },
] as { key: string; label: string; isPct?: boolean }[];

export function FSOLeaderboardTable({
  rows,
  reportDateLabel,
  fileNameDate,
  variant = 'region',
}: {
  rows: FsoRow[];
  reportDateLabel: string;
  fileNameDate: string;
  variant?: 'region' | 'team';
}) {
  const showCluster = variant === 'region';
  const [search, setSearch] = useState('');
  const [clusterHead, setClusterHead] = useState('');
  const [stateCluster, setStateCluster] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('final_scorecard');
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const clusterHeads = useMemo(
    () => [...new Set(rows.map((r) => r.cluster_head).filter(Boolean))].sort(),
    [rows],
  );
  const stateClusters = useMemo(
    () => [...new Set(rows.map((r) => r.state_cluster).filter((s) => s && s !== '—'))].sort(),
    [rows],
  );
  const total = rows.length;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = rows.filter((r) => {
      if (needle && !`${r.name} ${r.dao_code}`.toLowerCase().includes(needle)) return false;
      if (clusterHead && r.cluster_head !== clusterHead) return false;
      if (stateCluster && r.state_cluster !== stateCluster) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    result.sort((a, b) => (desc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
    return result;
  }, [rows, search, clusterHead, stateCluster, status, sortKey, desc]);

  const visible = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const cols = baseCols(showCluster);

  const reset = () => {
    setSearch('');
    setClusterHead('');
    setStateCluster('');
    setStatus('');
    setSortKey('final_scorecard');
    setDesc(true);
    setPage(0);
  };

  return (
    <Box>
      {/* Filter bar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <TextField size="small" label="Search name or DAO code" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 220 }} />
        {showCluster && (
          <TextField size="small" select label="Cluster Head" value={clusterHead} onChange={(e) => { setClusterHead(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All Cluster Heads</MenuItem>
            {clusterHeads.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        )}
        {showCluster && (
          <TextField size="small" select label="State Cluster" value={stateCluster} onChange={(e) => { setStateCluster(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
            <MenuItem value="">All Clusters</MenuItem>
            {stateClusters.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        )}
        <TextField size="small" select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Sort by" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} sx={{ minWidth: 180 }}>
          {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Direction" value={desc ? 'desc' : 'asc'} onChange={(e) => setDesc(e.target.value === 'desc')} sx={{ minWidth: 150 }}>
          <MenuItem value="desc">Highest to Lowest</MenuItem>
          <MenuItem value="asc">Lowest to Highest</MenuItem>
        </TextField>
        <Button startIcon={<RestartAltIcon />} onClick={reset} color="inherit">Reset</Button>
        <Button
          startIcon={<FileDownloadIcon />}
          variant="contained"
          sx={{ ml: 'auto' }}
          onClick={() => exportFsoLeaderboard(filtered, reportDateLabel, fileNameDate)}
        >
          Export to Excel
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 640, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow>
                {cols.map((c) => (
                  <TableCell key={c.key} sx={{ fontWeight: 800, bgcolor: '#1A1A1A', color: '#fff' }}>{c.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((row, i) => {
                const sn = page * rowsPerPage + i + 1;
                const isTop = row.rank > 0 && row.rank <= 3;
                const isBottom = row.rank > 0 && row.rank > total - 3;
                return (
                  <TableRow
                    key={row.user_id}
                    hover
                    sx={{
                      borderLeft: `5px solid ${borderColor(row.final_scorecard)}`,
                      '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' },
                    }}
                  >
                    {cols.map((c) => {
                      if (c.key === 'sn') {
                        return (
                          <TableCell key="sn">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isTop && <Tooltip title="Top performer"><EmojiEventsIcon sx={{ color: '#D4AF37', fontSize: 18 }} /></Tooltip>}
                              {isBottom && <Tooltip title="Needs attention"><WarningIcon sx={{ color: '#E4002B', fontSize: 18 }} /></Tooltip>}
                              {sn}
                            </Box>
                          </TableCell>
                        );
                      }
                      if (c.key === 'status') {
                        return <TableCell key="status"><StatusBadge status={row.status} /></TableCell>;
                      }
                      const value = (row as unknown as Record<string, unknown>)[c.key];
                      return <TableCell key={c.key}>{c.isPct ? pct(Number(value)) : String(value ?? '')}</TableCell>;
                    })}
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow><TableCell colSpan={cols.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>No FSOs match the current filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        />
      </Paper>
    </Box>
  );
}
