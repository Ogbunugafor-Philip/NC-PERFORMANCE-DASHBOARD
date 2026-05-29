"""
NC Performance Dashboard — NTB Excel Report Parser

Fixed column positions (0-indexed, columns A=0 … S=18):
  B=1  DAO Code        D=3  Staff Name      G=6  Cluster Head
  J=9  Ind Target      K=10 Ind Actual      L=11 Ind Valid
  Q=16 Bus Target      R=17 Bus Actual      S=18 Bus Valid

Layout:
  Row 1 (index 0): date cell in column J — "NTB as at May 28, 2026"
  Row 6 (index 5): headers row  (not used for mapping — positions are fixed)
  Row 7 (index 6+): data rows
"""
import re
from datetime import date, datetime
from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile, status

# ── Column positions (0-indexed) ──────────────────────────────────────────────
COL_DAO_CODE     = 1   # B
COL_STAFF_NAME   = 3   # D
COL_CLUSTER_HEAD = 6   # G
COL_IND_TARGET   = 9   # J  ← also contains date in row 1
COL_IND_ACTUAL   = 10  # K
COL_IND_VALID    = 11  # L
COL_BUS_TARGET   = 16  # Q
COL_BUS_ACTUAL   = 17  # R
COL_BUS_VALID    = 18  # S

ROW_DATE   = 0   # Row 1 (0-indexed)
ROW_DATA_START = 6   # Row 7 (0-indexed) — first FSO data row
MIN_COLS   = COL_BUS_VALID + 1  # must have at least 19 columns

# "Month DD, YYYY" or "Month DD YYYY"
_DATE_RE = re.compile(
    r"\b(January|February|March|April|May|June|July|August|"
    r"September|October|November|December|"
    r"Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\s+(\d{1,2}),?\s+(\d{4})\b",
    re.IGNORECASE,
)


# ── DAO code normalisation ────────────────────────────────────────────────────

def normalize_dao_code(raw: Any) -> str:
    """Return a clean, uppercase DAO code string.

    Handles Excel numeric cells (520264 → "520264") and float
    representations (520264.0 → "520264").
    """
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return ""
    s = str(raw).strip()
    # Collapse float-ish strings:  "520264.0" → "520264"
    try:
        f = float(s)
        if f == int(f):
            s = str(int(f))
    except (ValueError, TypeError, OverflowError):
        pass
    return s.upper()


# ── Date extraction ───────────────────────────────────────────────────────────

def _extract_report_date(raw_df: pd.DataFrame) -> date:
    """Extract the report date from Row 1, Column J.

    Expected cell content: "NTB as at May 28, 2026"
    Falls back to scanning row 1 if column J is empty.
    """
    def _parse_text(text: str) -> date | None:
        m = _DATE_RE.search(text)
        if not m:
            return None
        parsed = pd.to_datetime(f"{m.group(1)} {m.group(2)} {m.group(3)}", errors="coerce")
        return None if pd.isna(parsed) else parsed.date()

    # Primary: Row 1 Col J
    try:
        cell = raw_df.iloc[ROW_DATE, COL_IND_TARGET]
        if pd.notna(cell):
            if isinstance(cell, datetime):
                return cell.date()
            if isinstance(cell, date):
                return cell
            result = _parse_text(str(cell))
            if result:
                return result
    except (IndexError, KeyError):
        pass

    # Fallback: scan entire row 1 for any recognisable date
    try:
        for col_idx in range(min(raw_df.shape[1], 30)):
            val = raw_df.iloc[ROW_DATE, col_idx]
            if pd.isna(val):
                continue
            if isinstance(val, (datetime, date)):
                return val.date() if isinstance(val, datetime) else val
            result = _parse_text(str(val))
            if result:
                return result
    except (IndexError, KeyError):
        pass

    return date.today()


# ── Integer coercion ──────────────────────────────────────────────────────────

def _to_int(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, float) and pd.isna(value):
        return 0
    if str(value).strip() in ("", "nan", "None"):
        return 0
    try:
        return round(float(value))
    except (ValueError, TypeError):
        return 0


# ── Main parser ───────────────────────────────────────────────────────────────

async def parse_performance_excel(
    file: UploadFile,
) -> tuple[date, list[dict[str, Any]], dict[str, int]]:
    """Parse NTB performance Excel report using fixed column positions.

    Returns:
        report_date  — extracted from Row 1, Column J
        rows         — list of dicts with raw KPI values (pre-calculation)
        parse_meta   — {"total_rows_found": N, "rows_skipped": N}
    """
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be an Excel file (.xlsx or .xls)",
        )

    content = await file.read()
    raw_df = pd.read_excel(BytesIO(content), sheet_name=0, header=None, engine="openpyxl")

    if raw_df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if raw_df.shape[1] < MIN_COLS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Report must have at least {MIN_COLS} columns (A–S). "
                f"Found {raw_df.shape[1]} columns."
            ),
        )

    report_date = _extract_report_date(raw_df)

    # Slice out data rows (Row 7 onwards)
    data_section = raw_df.iloc[ROW_DATA_START:].reset_index(drop=True)

    rows: list[dict[str, Any]] = []
    rows_skipped = 0

    for _, row in data_section.iterrows():
        n = len(row)

        def _col(idx: int) -> Any:
            return row.iloc[idx] if idx < n else None

        dao_raw  = _col(COL_DAO_CODE)
        name_raw = _col(COL_STAFF_NAME)

        # Normalise to strings for blank checks
        dao_str  = "" if pd.isna(dao_raw)  else str(dao_raw).strip()
        name_str = "" if pd.isna(name_raw) else str(name_raw).strip()

        # Skip blank / sentinel rows
        if dao_str  in ("", "0", "nan", "None"):
            rows_skipped += 1
            continue
        if name_str in ("", "nan", "None"):
            rows_skipped += 1
            continue

        dao_code = normalize_dao_code(dao_raw)
        if not dao_code or dao_code == "0":
            rows_skipped += 1
            continue

        ch_raw = _col(COL_CLUSTER_HEAD)
        cluster_head = "" if pd.isna(ch_raw) else str(ch_raw).strip()

        rows.append({
            "dao_code":     dao_code,
            "name":         name_str,
            "cluster_head": cluster_head,
            "ind_target":   _to_int(_col(COL_IND_TARGET)),
            "ind_actual":   _to_int(_col(COL_IND_ACTUAL)),
            "ind_valid":    _to_int(_col(COL_IND_VALID)),
            "bus_target":   _to_int(_col(COL_BUS_TARGET)),
            "bus_actual":   _to_int(_col(COL_BUS_ACTUAL)),
            "bus_valid":    _to_int(_col(COL_BUS_VALID)),
        })

    parse_meta: dict[str, int] = {
        "total_rows_found": len(rows) + rows_skipped,
        "rows_skipped":     rows_skipped,
    }
    return report_date, rows, parse_meta
