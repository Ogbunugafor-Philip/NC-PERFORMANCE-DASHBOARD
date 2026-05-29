from datetime import date, datetime
from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile, status

from app.utils.excel_parser import normalize_dao_code


COLUMN_ALIASES = {
    "dao_code": {"dao code", "dao", "dao_code", "staff dao code"},
    "name": {"name", "staff name", "fso name"},
    "ind_target": {"ind target", "individual target", "individual accounts target"},
    "ind_actual": {"ind actual", "individual actual", "individual accounts actual"},
    "ind_valid": {"ind valid", "individual valid", "individual accounts valid"},
    "bus_target": {"bus target", "business target", "business accounts target"},
    "bus_actual": {"bus actual", "business actual", "business accounts actual"},
    "bus_valid": {"bus valid", "business valid", "business accounts valid"},
}
REQUIRED_FIELDS = [
    "dao_code",
    "ind_target",
    "ind_actual",
    "ind_valid",
    "bus_target",
    "bus_actual",
    "bus_valid",
]


def _normalize_header(header: Any) -> str:
    return str(header).strip().lower().replace("_", " ")


def _detect_report_date(dataframe: pd.DataFrame) -> date:
    for value in dataframe.head(10).to_numpy().flatten():
        if pd.isna(value):
            continue
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        parsed = pd.to_datetime(value, errors="coerce")
        if not pd.isna(parsed):
            year = int(parsed.year)
            if 2020 <= year <= 2100:
                return parsed.date()
    return date.today()


def _map_columns(columns: list[Any]) -> dict[str, Any]:
    mapped: dict[str, Any] = {}
    for column in columns:
        normalized = _normalize_header(column)
        for canonical, aliases in COLUMN_ALIASES.items():
            if normalized in aliases:
                mapped[canonical] = column
    return mapped


def _detect_header_row(dataframe: pd.DataFrame) -> int:
    for index, row in dataframe.head(20).iterrows():
        values = {_normalize_header(value) for value in row.to_list() if not pd.isna(value)}
        if values & COLUMN_ALIASES["dao_code"]:
            return int(index)
    return 0


def _to_int(value: Any) -> int:
    if pd.isna(value) or value == "":
        return 0
    return int(float(value))


async def parse_performance_excel(file: UploadFile) -> tuple[date, list[dict[str, Any]], list[str]]:
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be an Excel file",
        )
    content = await file.read()
    raw_dataframe = pd.read_excel(BytesIO(content), sheet_name=0, header=None, engine="openpyxl")
    report_date = _detect_report_date(raw_dataframe)
    header_row = _detect_header_row(raw_dataframe)

    dataframe = pd.read_excel(BytesIO(content), sheet_name=0, header=header_row, engine="openpyxl")
    mapped = _map_columns(list(dataframe.columns))
    missing_columns = [field for field in REQUIRED_FIELDS if field not in mapped]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_columns)}",
        )

    rows: list[dict[str, Any]] = []
    missing_fields: list[str] = []
    for row_number, row in dataframe.iterrows():
        dao_value = row[mapped["dao_code"]]
        if pd.isna(dao_value) or str(dao_value).strip() == "":
            missing_fields.append(f"Row {row_number + 2}: DAO Code")
            continue
        parsed = {
            "dao_code": normalize_dao_code(str(dao_value)),
            "name": str(row[mapped["name"]]).strip() if "name" in mapped and not pd.isna(row[mapped["name"]]) else "",
        }
        for field in REQUIRED_FIELDS:
            if field == "dao_code":
                continue
            value = row[mapped[field]]
            if pd.isna(value):
                missing_fields.append(f"Row {row_number + 2}: {field}")
                parsed[field] = 0
            else:
                parsed[field] = _to_int(value)
        rows.append(parsed)

    return report_date, rows, missing_fields
