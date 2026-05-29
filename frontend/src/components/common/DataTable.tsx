import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel } from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, rowSx }: { columns: Column<T>[]; rows: T[]; rowSx?: (row: T, index: number) => object }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('');
  const [asc, setAsc] = useState(true);
  const sorted = useMemo(() => {
    if (!orderBy) return rows;
    return [...rows].sort((a, b) => {
      const av = String(a[orderBy] ?? '');
      const bv = String(b[orderBy] ?? '');
      return asc ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
    });
  }, [rows, orderBy, asc]);
  const visible = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.sortable ? (
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
            {visible.map((row, index) => (
              <TableRow key={String(row.id ?? row.dao_code ?? index)} sx={rowSx?.(row, index)}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>{column.render ? column.render(row, index) : String(row[column.key] ?? '')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Box>
    </Paper>
  );
}
