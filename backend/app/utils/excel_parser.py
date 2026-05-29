import re
from io import BytesIO

import pandas as pd
from fastapi import HTTPException, UploadFile, status


DAO_CODE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{2,64}$")
EXPECTED_COLUMNS = {
    "Name": "name",
    "DAO Code": "dao_code",
    "Position": "position",
    "Assigned Cluster Head": "assigned_cluster_head",
}


def normalize_dao_code(dao_code: str) -> str:
    return dao_code.strip().upper()


def validate_dao_code_format(dao_code: str) -> None:
    if not DAO_CODE_PATTERN.fullmatch(dao_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid DAO code format",
        )


async def parse_staff_excel(file: UploadFile) -> list[dict[str, str]]:
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be an Excel file",
        )
    content = await file.read()
    dataframe = pd.read_excel(BytesIO(content), engine="openpyxl")
    missing = [column for column in EXPECTED_COLUMNS if column not in dataframe.columns]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing)}",
        )

    rows: list[dict[str, str]] = []
    for _, row in dataframe.iterrows():
        parsed = {
            output_name: "" if pd.isna(row[input_name]) else str(row[input_name]).strip()
            for input_name, output_name in EXPECTED_COLUMNS.items()
        }
        if not parsed["name"] or not parsed["dao_code"] or not parsed["position"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name, DAO Code, and Position are required for every row",
            )
        rows.append(parsed)
    return rows
