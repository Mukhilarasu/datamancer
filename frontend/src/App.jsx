  import {useState} from 'react';
  import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
  const [targetInfo, setTargetInfo] = useState(null)

  function App() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileChange = (event) => {
      setFile(event.target.files[0])
    } 

    const handleUpload = async () => {
      if (!file) {
        alert('Please select a file first.');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json();
      setResult(data);
    }

    const handleTargetChange = async (event) => {
    const column = event.target.value
    if (!column) {
      setTargetInfo(null)
      return
    }

    const response = await fetch(
      `http://localhost:8000/target/${result.dataset_id}?column=${encodeURIComponent(column)}`
    )
    if (!response.ok) return

    const data = await response.json()
    setTargetInfo(data)
  }


    return (
      <div>
        <h1>DataMancer</h1>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>

        {result && (
          <div>
            <p>Filename: {result.filename}</p>
            <p>Rows: {result.rows}</p>

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
                    <td>{col.missing_count} ({col.missing_percent}%)</td>
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

            <h2>Target Column</h2>
            <select key={result.dataset_id} onChange={handleTargetChange} defaultValue="">
              <option value="">Select a target column...</option>
              {result.columns.map((col) => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>

            {targetInfo && (
              <div>
                <p>
                  <strong>{targetInfo.column}</strong> looks like a{' '}
                  <strong>{targetInfo.problem_type}</strong> problem
                  ({targetInfo.unique_count} unique values).
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
                  Math.max(...targetInfo.class_balance.map((c) => c.percent)) > 70 && (
                    <p>
                      Warning: one class makes up most of your data, so accuracy can look
                      high even if the model learns nothing useful.
                    </p>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    )

  }

  
  export default App;

