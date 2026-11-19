import uuid
import pandas as pd
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

datasets = {}  # holds uploaded DataFrames in memory, keyed by an ID


@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    dataset_id = str(uuid.uuid4())
    datasets[dataset_id] = df

    columns_info = []
    for col in df.columns:
        col_data = df[col]
        is_numeric = pd.api.types.is_numeric_dtype(col_data)

        col_info = {
            "name": col,
            "dtype": str(col_data.dtype),
            "missing_count": int(col_data.isnull().sum()),
            "missing_percent": round(col_data.isnull().mean() * 100, 2),
            "unique_count": int(col_data.nunique()),
            "is_numeric": is_numeric,
        }

        if is_numeric:
            col_info["mean"] = round(float(col_data.mean()), 2)
            col_info["median"] = round(float(col_data.median()), 2)
            col_info["std"] = round(float(col_data.std()), 2)
            col_info["min"] = round(float(col_data.min()), 2)
            col_info["max"] = round(float(col_data.max()), 2)

        columns_info.append(col_info)

    for info in columns_info:
        if info["missing_percent"] > 40:
            warnings.append(
                f"'{info['name']}' is missing {info['missing_percent']}% of its values. "
                "Consider dropping it or filling the gaps before modelling."
            )

    warnings = []

    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        dup_percent = round(dup_count / len(df) * 100, 2)
        warnings.append(
            f"{dup_count} duplicate rows found ({dup_percent}% of the data). "
            "Duplicates can leak between train and test sets and inflate your scores."
        )

    for col in df.columns:
        unique = int(df[col].nunique())
        is_numeric = pd.api.types.is_numeric_dtype(df[col])

        if unique <= 1:
            warnings.append(
                f"'{col}' has the same value in every row, so it adds no information."
            )
        elif not is_numeric and unique > 0.5 * len(df):
            warnings.append(
                f"'{col}' is a text column where most values are unique "
                f"({unique} of {len(df)} rows). It's probably an ID or free text, "
                "so it likely won't help a model."
            )

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": columns_info,
        "warnings": warnings,
    }



@app.get("/target/{dataset_id}")
def analyze_target(dataset_id: str, column: str):
    df = datasets.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload again.")
    if column not in df.columns:
        raise HTTPException(status_code=404, detail="Column not found.")

    col_data = df[column].dropna()
    unique_count = int(col_data.nunique())
    is_numeric = pd.api.types.is_numeric_dtype(col_data)

    if unique_count <= 10 or not is_numeric:
        problem_type = "classification"
        counts = col_data.value_counts()
        class_balance = [
            {
                "label": str(label),
                "count": int(count),
                "percent": round(count / len(col_data) * 100, 2),
            }
            for label, count in counts.items()
        ]
    else:
        problem_type = "regression"
        class_balance = None

    return {
        "column": column,
        "problem_type": problem_type,
        "unique_count": unique_count,
        "class_balance": class_balance,
    }

@app.get("/distribution/{dataset_id}")
def distribution(dataset_id: str, column: str):
    df = datasets.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload again.")
    if column not in df.columns:
        raise HTTPException(status_code=404, detail="Column not found.")

    col_data = df[column].dropna()
    if not pd.api.types.is_numeric_dtype(col_data):
        raise HTTPException(status_code=400, detail="Distribution is only available for numeric columns.")

    counts, edges = np.histogram(col_data, bins=10)
    bins = [
        {"range": f"{edges[i]:.1f}-{edges[i + 1]:.1f}", "count": int(counts[i])}
        for i in range(len(counts))
    ]

    return {"column": column, "bins": bins}