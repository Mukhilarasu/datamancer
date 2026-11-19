import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [targetInfo, setTargetInfo] = useState(null)
  const [distInfo, setDistInfo] = useState(null)
  const [corrInfo, setCorrInfo] = useState(null)

  const handleFileChange = (event) => {
    setFile(event.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    setResult(data)
    setTargetInfo(null)
    setDistInfo(null)

    const corrResponse = await fetch(
      `http://localhost:8000/correlation/${data.dataset_id}`
    )
    if (corrResponse.ok) {
      setCorrInfo(await corrResponse.json())
    } else {
      setCorrInfo(null)
    }
  }

  const handleTargetChange = async (event) => {
    const column = event.target.value
    if (!column) {
      setTargetInfo(null)
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8000/target/${result.dataset_id}?column=${encodeURIComponent(column)}`
      )
      if (!response.ok) {
        const err = await response.json()
        alert('Error: ' + (err.detail || response.status))
        return
      }

      const data = await response.json()
      setTargetInfo(data)
    } catch (e) {
      alert('Request failed: ' + e.message)
    }
  }

  const handleDistChange = async (event) => {
    const column = event.target.value
    if (!column) {
      setDistInfo(null)
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8000/distribution/${result.dataset_id}?column=${encodeURIComponent(column)}`
      )
      if (!response.ok) {
        const err = await response.json()
        alert('Error: ' + (err.detail || response.status))
        return
      }

      const data = await response.json()
      setDistInfo(data)
    } catch (e) {
      alert('Request failed: ' + e.message)
    }
  }

  const handleDownload = () => {
    const summary = {
      filename: result.filename,
      rows: result.rows,
      warnings: result.warnings,
      columns: result.columns,
      target: targetInfo,
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.filename.replace('.csv', '')}_summary.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <h1>DataMancer</h1>
      <input
        className="no-print"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
      <button className="no-print" onClick={handleUpload}>
        Upload
      </button>

      {result && (
        <div>
          <p>Filename: {result.filename}</p>
          <p>Rows: {result.rows}</p>

          <div className="no-print">
            <button onClick={() => window.print()}>Print / Save as PDF</button>{' '}
            <button onClick={handleDownload}>Download summary (JSON)</button>
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div>
              <h2>Warnings</h2>
              <ul>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <h2>Missing Values by Column</h2>
          {result.columns.every((col) => col.missing_count === 0) ? (
            <p>No missing values found. Your dataset is complete.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.columns}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missing_percent" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}

          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Missing</th>
                <th>Unique</th>
                <th>Mean</th>
                <th>Median</th>
                <th>Std Dev</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {result.columns.map((col) => (
                <tr key={col.name}>
                  <td>{col.name}</td>
                  <td>{col.dtype}</td>
                  <td>
                    {col.missing_count} ({col.missing_percent}%)
                  </td>
                  <td>{col.unique_count}</td>
                  <td>{col.is_numeric ? col.mean : '—'}</td>
                  <td>{col.is_numeric ? col.median : '—'}</td>
                  <td>{col.is_numeric ? col.std : '—'}</td>
                  <td>{col.is_numeric ? col.min : '—'}</td>
                  <td>{col.is_numeric ? col.max : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Column Distribution</h2>
          <select
            className="no-print"
            key={'dist-' + result.dataset_id}
            onChange={handleDistChange}
            defaultValue=""
          >
            <option value="">Select a column...</option>
            {result.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>

          {distInfo && (
            <div>
              <p>
                <strong>{distInfo.column}</strong>
                {distInfo.kind === 'categorical' &&
                  distInfo.unique_count > 10 &&
                  ` (showing the 10 most common of ${distInfo.unique_count} values)`}
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distInfo.bins}>
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6c5ce7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {corrInfo && (
            <div>
              <h2>Correlation</h2>
              <p>Closer to 1 or -1 means two columns move together more strongly.</p>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      {corrInfo.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corrInfo.columns.map((rowName, i) => (
                      <tr key={rowName}>
                        <th>{rowName}</th>
                        {corrInfo.matrix[i].map((v, j) => (
                          <td
                            key={j}
                            style={{
                              backgroundColor:
                                v === null
                                  ? 'transparent'
                                  : v >= 0
                                  ? `rgba(108, 92, 231, ${Math.abs(v)})`
                                  : `rgba(231, 76, 60, ${Math.abs(v)})`,
                              color:
                                v !== null && Math.abs(v) > 0.6
                                  ? 'white'
                                  : 'inherit',
                            }}
                          >
                            {v === null ? '—' : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h2>Target Column</h2>
          <select
            className="no-print"
            key={result.dataset_id}
            onChange={handleTargetChange}
            defaultValue=""
          >
            <option value="">Select a target column...</option>
            {result.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>

          {targetInfo && (
            <div>
              <p>
                <strong>{targetInfo.column}</strong> looks like a{' '}
                <strong>{targetInfo.problem_type}</strong> problem (
                {targetInfo.unique_count} unique values).
              </p>

              {targetInfo.class_balance && (
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Count</th>
                      <th>Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetInfo.class_balance.map((c) => (
                      <tr key={c.label}>
                        <td>{c.label}</td>
                        <td>{c.count}</td>
                        <td>{c.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {targetInfo.class_balance &&
                Math.max(...targetInfo.class_balance.map((c) => c.percent)) >
                  70 && (
                  <p>
                    Warning: one class makes up most of your data, so accuracy
                    can look high even if the model learns nothing useful.
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App