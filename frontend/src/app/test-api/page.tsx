'use client'

import { useState } from 'react'

export default function TestApiPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testBackendConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
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

  return (
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
  )
}
