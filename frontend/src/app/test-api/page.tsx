'use client'

import { useState } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TestApiPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testBackendConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('Testing backend at:', API_BASE_URL)
      
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Health check successful:', data)
        setResult(JSON.stringify(data, null, 2))
      } else {
        const text = await response.text()
        console.error('Health check failed:', text)
        setResult(`Error ${response.status}: ${text}`)
      }
    } catch (error) {
      console.error('API test error:', error)
      setResult(`Error: ${error}`)
    }
    
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('Testing login at:', API_BASE_URL)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      })
      
      console.log('Login response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Login successful:', data)
        setResult(JSON.stringify(data, null, 2))
      } else {
        const text = await response.text()
        console.error('Login failed:', text)
        setResult(`Error ${response.status}: ${text}`)
      }
    } catch (error) {
      console.error('Login test error:', error)
      setResult(`Error: ${error}`)
    }
    
    setLoading(false)
  }
//checking for dynamic table
  type Row = Record<string, string>;
  const [columns, setColumns] = useState<string[]>(["Name", "Age"]);
  const [rows, setRows] = useState<Row[]>([{ Name: "", Age: "" }]);
  const [newColumn, setNewColumn] = useState<string>("");

  // Add a new column
  const addColumn = () => {
    if (!newColumn.trim()) return;
    setColumns((prev) => [...prev, newColumn]);
    setRows((prevRows) =>
      prevRows.map((row) => ({ ...row, [newColumn]: "" }))
    );
    setNewColumn("");
  };

  // Add a new row
  const addRow = () => {
    const emptyRow: Row = {};
    columns.forEach((col) => {
      emptyRow[col] = "";
    });
    setRows((prev) => [...prev, emptyRow]);
  };

  // Update a cell
  const updateCell = (rowIndex: number, column: string, value: string) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], [column]: value };
      return updatedRows;
    });
  };

  // Remove a column
  const removeColumn = (colToRemove: string) => {
    setColumns((prev) => prev.filter((col) => col !== colToRemove));
    setRows((prevRows) =>
      prevRows.map(({ [colToRemove]: _, ...rest }) => rest)
    );
  };

  return (
    <>
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Health Endpoint'}
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 ml-2"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}





















    </div> 
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Dynamic Table</h2>

      {/* Input for new column */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newColumn}
          onChange={(e) => setNewColumn(e.target.value)}
          placeholder="New Column Name"
          className="border rounded px-2 py-1"
        />
        <button
          onClick={addColumn}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add Column
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse border w-full min-w-max">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="border px-3 py-1">
                  <div className="flex justify-between items-center">
                    {col}
                    <button
                      onClick={() => removeColumn(col)}
                      className="text-red-500 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col} className="border px-3 py-1">
                    <input
                      type="text"
                      value={row[col] || ""}
                      onChange={(e) =>
                        updateCell(rowIndex, col, e.target.value)
                      }
                      className="w-full px-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="mt-4 bg-green-500 text-white px-3 py-1 rounded"
      >
        Add Row
      </button>
    </div></>
  )
}
