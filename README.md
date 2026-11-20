# DataMancer

A dataset analyser. Upload a CSV and get a quick health check of your data before you start modelling: column stats, missing values, data quality warnings, distributions, correlations, and a first look at your target column. You can print the result as a report or download a summary.

## Features

- **CSV upload** with automatic parsing, a loading state, and error messages
- **Summary cards:** rows, columns, warning count, columns with missing values
- **Column overview:** data type, missing values (count and percent), unique values
- **Numeric stats:** mean, median, standard deviation, min, max
- **Missing values chart** per column
- **Data quality warnings:**
  - duplicate rows
  - constant columns (same value in every row)
  - ID-like text columns (most values unique)
  - columns with more than 40% missing values
- **Distributions** for any column: histograms for numeric columns, top-10 value counts for text columns
- **Target column check:**
  - guesses whether the problem is classification or regression
  - shows class balance for classification
  - warns when one class makes up more than 70% of the data
- **Report export:** print or save the page as a PDF, or download the findings as a JSON summary

## Tech stack

- **Backend:** Python, FastAPI, pandas, NumPy
- **Frontend:** React (Vite), Recharts

## How to run it

You need Python 3.9+ and Node.js installed.

**Backend**

```
cd backend
python -m venv venv
# Mac/Linux:   source venv/bin/activate
# Windows:     venv\Scripts\activate
pip install fastapi uvicorn pandas python-multipart
uvicorn main:app --reload
```

The API runs at http://localhost:8000 (interactive docs at /docs).

**Frontend** (in a second terminal)

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and upload a CSV.

## Project Purpose

I built DataMancer as a learning project to get familiar with the technologies and workflows involved in developing a full-stack data analysis application. My main goal was to understand how different components work together, from building REST APIs using FastAPI and processing datasets with pandas and NumPy to connecting a React frontend with backend services.

This project gave me an opportunity to explore the stack hands-on, understand its implementation, and get more comfortable with building data-driven applications. It is primarily a learning experience rather than a production-ready platform.

## Known limitations

- The ID-like check only looks at text columns, so numeric ID columns (1, 2, 3...) are not flagged.
- Classification vs regression is a simple rule: 10 or fewer unique values, or a text column, counts as classification. A numeric column with few distinct values (like age) can be misjudged.
- Correlation only captures straight-line relationships between numeric columns, and a high value does not mean one column causes the other.
- Uploaded datasets are stored in server memory and are lost when the backend restarts.
- The thresholds (40% missing, 70% class share, 50% unique for ID-like) are rough rules of thumb.
- The printed report only includes the distribution and target column that are selected on screen at the time.
