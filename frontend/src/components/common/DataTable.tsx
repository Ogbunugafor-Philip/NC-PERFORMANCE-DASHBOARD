import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField } from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowSx,
  searchable = false,
  sortable = true,
  paginated = true,
  colorRows = false,
  exportFileName = 'NC_Performance_Export.xlsx'
}: {
  columns: Column<T>[];
  rows: T[];
  rowSx?: (row: T, index: number) => object;
  searchable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  colorRows?: boolean;
  exportFileName?: string;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<string>('');
  const [asc, setAsc] = useState(true);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) => Object.values(row).join(' ').toLowerCase().includes(needle));
  }, [rows, search, searchable]);
  const sorted = useMemo(() => {
    if (!orderBy) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[orderBy] ?? '');
      const bv = String(b[orderBy] ?? '');
      return asc ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
    });
  }, [filtered, orderBy, asc]);
  const visible = paginated ? sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : sorted;
  const exportRows = () => {
    const output = sorted.map((row) => Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? ''])));
    const worksheet = XLSX.utils.aoa_to_sheet([['Sterling Bank | NC Performance Dashboard'], []]);
    XLSX.utils.sheet_add_json(worksheet, output, { origin: 'A3' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    XLSX.writeFile(workbook, exportFileName);
  };

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        {searchable && <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: 260 }} />}
        <Button startIcon={<FileDownloadIcon />} onClick={exportRows} variant="outlined">Export to Excel</Button>
      </Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {(sortable && column.sortable !== false) ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={asc ? 'asc' : 'desc'}
                      onClick={() => {
                        if (orderBy === column.key) setAsc(!asc);
                        else {
                          setOrderBy(String(column.key));
                          setAsc(true);
                        }
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row, index) => {
              const absoluteIndex = page * rowsPerPage + index;
              const colorSx = colorRows && absoluteIndex < 3 ? { backgroundColor: 'rgba(0,166,81,0.08)' } : colorRows && absoluteIndex >= sorted.length - 3 ? { backgroundColor: 'rgba(228,0,43,0.07)' } : {};
              return (
              <TableRow key={String(row.id ?? row.dao_code ?? index)} sx={{ ...colorSx, ...rowSx?.(row, absoluteIndex) }}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>{column.render ? column.render(row, index) : String(row[column.key] ?? '')}</TableCell>
                ))}
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Box>}
    </Paper>
  );
}
