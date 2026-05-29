import * as XLSX from 'xlsx-js-style';

// ── Exact 26 headers in exact order (do not reorder) ──────────────────────
export const FSO_EXPORT_HEADERS = [
  'S/N',
  'FSO Name',
  'DAO Code',
  'Cluster Head',
  'State Cluster',
  'Ind Target',
  'Ind Actual',
  'Ind Valid',
  'Ind Invalid',
  'Ind % Invalid',
  'Ind % Achievement',
  'Ind Score',
  'Ind Current DRR',
  'Ind Required DRR',
  'Bus Target',
  'Bus Actual',
  'Bus Valid',
  'Bus Invalid',
  'Bus % Invalid',
  'Bus % Achievement',
  'Bus Score',
  'Bus Current DRR',
  'Bus Required DRR',
  'Final Scorecard',
  'Position',
  'Status',
] as const;

export interface FsoExportRow {
  name: string;
  dao_code: string;
  cluster_head: string;
  state_cluster: string;
  ind_target: number;
  ind_actual: number;
  ind_valid: number;
  ind_invalid: number;
  ind_pct_invalid: number;
  ind_pct_achievement: number;
  ind_score: number;
  ind_current_drr: number;
  ind_required_drr: number;
  bus_target: number;
  bus_actual: number;
  bus_valid: number;
  bus_invalid: number;
  bus_pct_invalid: number;
  bus_pct_achievement: number;
  bus_score: number;
  bus_current_drr: number;
  bus_required_drr: number;
  final_scorecard: number;
  position: string;
  status: string;
}

const STERLING_RED = 'E4002B';
const DARK = '1A1A1A';
const FILL_GREEN = 'D6F5E3';
const FILL_AMBER = 'FFF1CC';
const FILL_RED = 'FBDDDD';

const rowToValues = (row: FsoExportRow, sn: number): (string | number)[] => [
  sn,
  row.name,
  row.dao_code,
  row.cluster_head,
  row.state_cluster,
  row.ind_target,
  row.ind_actual,
  row.ind_valid,
  row.ind_invalid,
  row.ind_pct_invalid,
  row.ind_pct_achievement,
  row.ind_score,
  row.ind_current_drr,
  row.ind_required_drr,
  row.bus_target,
  row.bus_actual,
  row.bus_valid,
  row.bus_invalid,
  row.bus_pct_invalid,
  row.bus_pct_achievement,
  row.bus_score,
  row.bus_current_drr,
  row.bus_required_drr,
  row.final_scorecard,
  row.position,
  row.status,
];

const scorecardFill = (score: number): string =>
  score >= 80 ? FILL_GREEN : score >= 50 ? FILL_AMBER : FILL_RED;

const thinBorder = {
  top: { style: 'thin', color: { rgb: 'E0E0E0' } },
  bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
  left: { style: 'thin', color: { rgb: 'E0E0E0' } },
  right: { style: 'thin', color: { rgb: 'E0E0E0' } },
};

/**
 * Export an FSO leaderboard to a styled .xlsx file using the exact 26 headers.
 * Rows must already be in the desired display order (sorted/filtered).
 */
export function exportFsoLeaderboard(
  rows: FsoExportRow[],
  reportDateLabel: string,
  fileNameDate: string,
): void {
  const N = FSO_EXPORT_HEADERS.length; // 26
  const title = `NC Performance Dashboard — FSO Leaderboard — ${reportDateLabel}`;

  // Build the worksheet matrix: title, headers, then data rows.
  const matrix: (string | number)[][] = [
    [title, ...Array(N - 1).fill('')],
    [...FSO_EXPORT_HEADERS],
    ...rows.map((row, index) => rowToValues(row, index + 1)),
  ];
  const ws = XLSX.utils.aoa_to_sheet(matrix);

  // Merge the title row across all columns.
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: N - 1 } }];

  // Auto-fit column widths from content.
  ws['!cols'] = FSO_EXPORT_HEADERS.map((header, c) => {
    let width = header.length;
    for (let r = 0; r < rows.length; r++) {
      const value = String(rowToValues(rows[r], r + 1)[c] ?? '');
      if (value.length > width) width = value.length;
    }
    return { wch: Math.min(Math.max(width + 2, 6), 40) };
  });

  // Freeze the title + header rows.
  ws['!freeze'] = { xSplit: 0, ySplit: 2 } as never;

  const cell = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const at = (r: number, c: number): any => ws[cell(r, c)];

  // Style title row (row 0).
  const titleCell = at(0, 0);
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: STERLING_RED } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
  ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }];

  // Style header row (row 1).
  for (let c = 0; c < N; c++) {
    const hc = at(1, c);
    if (hc) {
      hc.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: DARK } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder,
      };
    }
  }

  // Style data rows (row 2+).
  rows.forEach((row, index) => {
    const r = index + 2;
    const fill = scorecardFill(row.final_scorecard);
    for (let c = 0; c < N; c++) {
      const dc = at(r, c);
      if (!dc) continue;
      dc.s = {
        fill: { fgColor: { rgb: fill } },
        alignment: { horizontal: c <= 4 ? 'left' : 'center', vertical: 'center' },
        border: thinBorder,
        font: { color: { rgb: DARK } },
      };
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FSO Leaderboard');
  XLSX.writeFile(wb, `NC_Performance_FSO_Leaderboard_${fileNameDate}.xlsx`);
}
