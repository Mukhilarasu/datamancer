  import {useState} from 'react';
  import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.columns}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missing_percent" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

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
          </div>
        )}
      </div>
    )

  }

  
  export default App;

