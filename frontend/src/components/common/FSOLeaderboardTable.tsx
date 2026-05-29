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

// Column order matches the exact Excel header order. minWidth keeps data readable
// while the table scrolls horizontally on small screens.
const baseCols = (showCluster: boolean) => [
  { key: 'sn', label: 'S/N', minWidth: 50 },
  { key: 'name', label: 'FSO Name', minWidth: 150 },
  { key: 'dao_code', label: 'DAO Code', minWidth: 100 },
  ...(showCluster
    ? [
        { key: 'cluster_head', label: 'Cluster Head', minWidth: 140 },
        { key: 'state_cluster', label: 'State Cluster', minWidth: 100 },
      ]
    : []),
  { key: 'ind_target', label: 'Ind Target', minWidth: 80 },
  { key: 'ind_actual', label: 'Ind Actual', minWidth: 80 },
  { key: 'ind_valid', label: 'Ind Valid', minWidth: 80 },
  { key: 'ind_invalid', label: 'Ind Invalid', minWidth: 80 },
  { key: 'ind_pct_invalid', label: 'Ind % Invalid', isPct: true, minWidth: 80 },
  { key: 'ind_pct_achievement', label: 'Ind % Achievement', isPct: true, minWidth: 80 },
  { key: 'ind_score', label: 'Ind Score', minWidth: 80 },
  { key: 'ind_current_drr', label: 'Ind Current DRR', minWidth: 80 },
  { key: 'ind_required_drr', label: 'Ind Required DRR', minWidth: 80 },
  { key: 'bus_target', label: 'Bus Target', minWidth: 80 },
  { key: 'bus_actual', label: 'Bus Actual', minWidth: 80 },
  { key: 'bus_valid', label: 'Bus Valid', minWidth: 80 },
  { key: 'bus_invalid', label: 'Bus Invalid', minWidth: 80 },
  { key: 'bus_pct_invalid', label: 'Bus % Invalid', isPct: true, minWidth: 80 },
  { key: 'bus_pct_achievement', label: 'Bus % Achievement', isPct: true, minWidth: 80 },
  { key: 'bus_score', label: 'Bus Score', minWidth: 80 },
  { key: 'bus_current_drr', label: 'Bus Current DRR', minWidth: 80 },
  { key: 'bus_required_drr', label: 'Bus Required DRR', minWidth: 80 },
  { key: 'final_scorecard', label: 'Final Scorecard', minWidth: 90 },
  { key: 'position', label: 'Position', minWidth: 120 },
  { key: 'status', label: 'Status', minWidth: 100 },
] as { key: string; label: string; isPct?: boolean; minWidth: number }[];

// First two columns stay pinned while scrolling horizontally.
const STICKY_LEFT: Record<string, number> = { sn: 0, name: 50 };

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
      {/* Filter bar — stacks vertically and goes full-width on mobile */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
        <TextField fullWidth size="small" label="Search name or DAO code" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', md: 220 } }} />
        {showCluster && (
          <TextField fullWidth size="small" select label="Cluster Head" value={clusterHead} onChange={(e) => { setClusterHead(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', md: 180 } }}>
            <MenuItem value="">All Cluster Heads</MenuItem>
            {clusterHeads.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        )}
        {showCluster && (
          <TextField fullWidth size="small" select label="State Cluster" value={stateCluster} onChange={(e) => { setStateCluster(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', md: 150 } }}>
            <MenuItem value="">All Clusters</MenuItem>
            {stateClusters.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        )}
        <TextField fullWidth size="small" select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', md: 150 } }}>
          <MenuItem value="">All Statuses</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField fullWidth size="small" select label="Sort by" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} sx={{ width: { xs: '100%', md: 180 } }}>
          {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField fullWidth size="small" select label="Direction" value={desc ? 'desc' : 'asc'} onChange={(e) => setDesc(e.target.value === 'desc')} sx={{ width: { xs: '100%', md: 150 } }}>
          <MenuItem value="desc">Highest to Lowest</MenuItem>
          <MenuItem value="asc">Lowest to Highest</MenuItem>
        </TextField>
        <Button startIcon={<RestartAltIcon />} onClick={reset} color="inherit" sx={{ width: { xs: '100%', md: 'auto' } }}>Reset</Button>
        <Button
          startIcon={<FileDownloadIcon />}
          variant="contained"
          sx={{ ml: { md: 'auto' }, width: { xs: '100%', md: 'auto' } }}
          onClick={() => exportFsoLeaderboard(filtered, reportDateLabel, fileNameDate)}
        >
          Export to Excel
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 640, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table stickyHeader size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap', '@media (max-width:767px)': { fontSize: 12, padding: '6px 8px' } } }}>
            <TableHead>
              <TableRow>
                {cols.map((c) => {
                  const stickyLeft = STICKY_LEFT[c.key];
                  return (
                    <TableCell
                      key={c.key}
                      sx={{
                        fontWeight: 800,
                        bgcolor: '#1A1A1A',
                        color: '#fff',
                        minWidth: c.minWidth,
                        ...(stickyLeft !== undefined && { position: 'sticky', left: stickyLeft, zIndex: 4, bgcolor: '#1A1A1A' }),
                      }}
                    >
                      {c.label}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((row, i) => {
                const sn = page * rowsPerPage + i + 1;
                const isTop = row.rank > 0 && row.rank <= 3;
                const isBottom = row.rank > 0 && row.rank > total - 3;
                const stripeBg = i % 2 === 1 ? '#FAFAFA' : '#fff';
                const cellSx = (c: { key: string; minWidth: number }) => {
                  const stickyLeft = STICKY_LEFT[c.key];
                  return {
                    minWidth: c.minWidth,
                    ...(stickyLeft !== undefined && { position: 'sticky' as const, left: stickyLeft, zIndex: 1, bgcolor: stripeBg }),
                  };
                };
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
                          <TableCell key="sn" sx={cellSx(c)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isTop && <Tooltip title="Top performer"><EmojiEventsIcon sx={{ color: '#D4AF37', fontSize: 18 }} /></Tooltip>}
                              {isBottom && <Tooltip title="Needs attention"><WarningIcon sx={{ color: '#E4002B', fontSize: 18 }} /></Tooltip>}
                              {sn}
                            </Box>
                          </TableCell>
                        );
                      }
                      if (c.key === 'status') {
                        return <TableCell key="status" sx={cellSx(c)}><StatusBadge status={row.status} /></TableCell>;
                      }
                      const value = (row as unknown as Record<string, unknown>)[c.key];
                      return <TableCell key={c.key} sx={cellSx(c)}>{c.isPct ? pct(Number(value)) : String(value ?? '')}</TableCell>;
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
