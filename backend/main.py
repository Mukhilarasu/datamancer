from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"status":"ok"}

import pandas as pd
from fastapi import File, UploadFile

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

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

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": columns_info,
    }
