'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Download, RefreshCw, AlertCircle, CheckCircle, FileSpreadsheet, Info } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ImportStatus {
    success: boolean;
    message: string;
    recordsProcessed: number;
    errors?: string[];
}

const EXCEL_TABLES = [
    {
        id: 'colleges',
        name: 'Colleges',
        description: 'Institution information',
        columns: [
            { name: 'code', type: 'Text', required: true, example: 'NMAMIT', description: 'Unique college code' },
            { name: 'name', type: 'Text', required: true, example: 'NMAM Institute of Technology', description: 'Full college name' }
        ]
    },
    {
        id: 'departments',
        name: 'Departments',
        description: 'Academic departments',
        columns: [
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'code', type: 'Text', required: true, example: 'CS', description: 'Department code' },
            { name: 'name', type: 'Text', required: true, example: 'Computer Science and Engineering', description: 'Department name' }
        ]
    },
    {
        id: 'sections',
        name: 'Sections',
        description: 'Class sections',
        columns: [
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'department_code', type: 'Text', required: true, example: 'CS', description: 'Reference to department' },
            { name: 'section_name', type: 'Text', required: true, example: 'A', description: 'Section name (A, B, C)' }
        ]
    },
    {
        id: 'users',
        name: 'Users',
        description: 'All system users (students, teachers, admin)',
        columns: [
            { name: 'username', type: 'Text', required: true, example: 'NNM23CSA01', description: 'Unique username (USN for students)' },
            { name: 'name', type: 'Text', required: true, example: 'Rahul Kumar', description: 'Full name' },
            { name: 'email', type: 'Text', required: false, example: 'rahul@example.com', description: 'Email address' },
            { name: 'phone', type: 'Text', required: false, example: '9876543210', description: 'Phone number' },
            { name: 'role', type: 'Text', required: true, example: 'student', description: 'User role: student, teacher, or admin' }
        ],
        note: 'All users will be created with default password: password123'
    },
    {
        id: 'students',
        name: 'Students',
        description: 'Student enrollment details',
        columns: [
            { name: 'usn', type: 'Text', required: true, example: 'NNM23CSA01', description: 'University Seat Number (must exist in users)' },
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'department_code', type: 'Text', required: true, example: 'CS', description: 'Reference to department' },
            { name: 'section', type: 'Text', required: true, example: 'A', description: 'Section name' },
            { name: 'semester', type: 'Number', required: true, example: '5', description: 'Current semester (1-8)' },
            { name: 'batch_year', type: 'Number', required: true, example: '2023', description: 'Year of admission' }
        ]
    },
    {
        id: 'teachers',
        name: 'Teachers',
        description: 'Teacher assignments',
        columns: [
            { name: 'username', type: 'Text', required: true, example: 'teacher1', description: 'Teacher username (must exist in users)' },
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'department_code', type: 'Text', required: true, example: 'CS', description: 'Reference to department' }
        ]
    },
    {
        id: 'courses',
        name: 'Courses',
        description: 'Course catalog',
        columns: [
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'department_code', type: 'Text', required: true, example: 'CS', description: 'Reference to department' },
            { name: 'code', type: 'Text', required: true, example: 'CS301', description: 'Course code' },
            { name: 'name', type: 'Text', required: true, example: 'Data Structures', description: 'Course name' },
            { name: 'type', type: 'Text', required: true, example: 'core', description: 'Type: core, department_elective, or open_elective' },
            { name: 'year', type: 'Number', required: true, example: '3', description: 'Year of study (1-4)' },
            { name: 'has_theory', type: 'Boolean', required: true, example: 'true', description: 'Has theory component (true/false or 1/0)' },
            { name: 'has_lab', type: 'Boolean', required: true, example: 'true', description: 'Has lab component (true/false or 1/0)' }
        ]
    },
    {
        id: 'academic_years',
        name: 'Academic Years',
        description: 'Academic year definitions',
        columns: [
            { name: 'college_code', type: 'Text', required: true, example: 'NMAMIT', description: 'Reference to college' },
            { name: 'year_name', type: 'Text', required: true, example: '2024-2025', description: 'Academic year name' },
            { name: 'start_date', type: 'Date', required: true, example: '2024-08-01', description: 'Start date (YYYY-MM-DD)' },
            { name: 'end_date', type: 'Date', required: true, example: '2025-07-31', description: 'End date (YYYY-MM-DD)' }
        ]
    }
]

export default function DatabaseSetupExcel() {
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({})
    const [importResults, setImportResults] = useState<Record<string, ImportStatus>>({})
    const [loading, setLoading] = useState(false)
    const [expandedTable, setExpandedTable] = useState<string | null>(null)

    const handleFileSelect = (tableId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFiles(prev => ({ ...prev, [tableId]: file }))
        }
    }

    const importExcel = async (tableId: string) => {
        const file = selectedFiles[tableId]
        if (!file) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${API_BASE_URL}/api/admin/import-excel/${tableId}`, {
                method: 'POST',
                body: formData
            })

            const result: ImportStatus = await response.json()
            setImportResults(prev => ({ ...prev, [tableId]: result }))

            if (result.success) {
                // Clear the file selection
                setSelectedFiles(prev => {
                    const updated = { ...prev }
                    delete updated[tableId]
                    return updated
                })
            }
        } catch (error) {
            setImportResults(prev => ({
                ...prev,
                [tableId]: {
                    success: false,
                    message: error instanceof Error ? error.message : 'Import failed',
                    recordsProcessed: 0,
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                }
            }))
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = (tableId: string) => {
        const table = EXCEL_TABLES.find(t => t.id === tableId)
        if (!table) return

        // Create CSV content with headers and sample row
        const headers = table.columns.map(col => col.name).join(',')
        const sample = table.columns.map(col => col.example).join(',')
        const csvContent = `${headers}\n${sample}`

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${tableId}_template.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Excel Data Import</h1>
                <p className="text-gray-600 mt-2">Import data from Excel/CSV files to populate your database</p>
            </div>

            {/* Instructions Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Info className="w-5 h-5" />
                        How to Use Excel Import
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-900">
                    <div className="space-y-2">
                        <p className="font-semibold">Step 1: Download Template</p>
                        <p>Click "Download Template" for each table to get a CSV file with the correct format and sample data.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold">Step 2: Fill Your Data</p>
                        <p>Open the template in Excel/Google Sheets, replace the sample row with your actual data. You can add as many rows as needed.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold">Step 3: Save as Excel/CSV</p>
                        <p>Save your file as .xlsx (Excel) or .csv format.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold">Step 4: Upload and Import</p>
                        <p>Upload your file and click "Import" to add the data to your database.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold">⚠️ Important:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Import in order: Colleges → Departments → Sections → Users → Students/Teachers → Courses</li>
                            <li>Make sure referenced data exists (e.g., college_code must exist before creating departments)</li>
                            <li>All users are created with default password: <span className="font-mono bg-white px-1">password123</span></li>
                            <li>Existing records will be updated (based on unique keys like code, username, USN)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Import Tables */}
            <div className="space-y-4">
                {EXCEL_TABLES.map((table, index) => {
                    const result = importResults[table.id]
                    const file = selectedFiles[table.id]
                    const isExpanded = expandedTable === table.id

                    return (
                        <Card key={table.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <FileSpreadsheet className="w-5 h-5" />
                                            {table.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{table.description}</CardDescription>
                                        {table.note && (
                                            <p className="text-xs text-orange-600 mt-1">ℹ️ {table.note}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedTable(isExpanded ? null : table.id)}
                                    >
                                        {isExpanded ? 'Hide Format' : 'Show Format'}
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Column Format Details */}
                            {isExpanded && (
                                <div className="border-t bg-gray-50 p-4">
                                    <h4 className="font-semibold text-sm mb-3">Excel Columns Format:</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse border">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border p-2 text-left">Column Name</th>
                                                    <th className="border p-2 text-left">Type</th>
                                                    <th className="border p-2 text-center">Required</th>
                                                    <th className="border p-2 text-left">Example</th>
                                                    <th className="border p-2 text-left">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.columns.map(col => (
                                                    <tr key={col.name}>
                                                        <td className="border p-2 font-mono text-xs bg-blue-50">{col.name}</td>
                                                        <td className="border p-2">{col.type}</td>
                                                        <td className="border p-2 text-center">
                                                            {col.required ? (
                                                                <span className="text-red-600 font-bold">✓</span>
                                                            ) : (
                                                                <span className="text-gray-400">○</span>
                                                            )}
                                                        </td>
                                                        <td className="border p-2 font-mono text-xs">{col.example}</td>
                                                        <td className="border p-2 text-gray-600">{col.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <CardContent className="pt-4">
                                <div className="flex items-center gap-3">
                                    {/* Download Template Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadTemplate(table.id)}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Template
                                    </Button>

                                    {/* File Upload */}
                                    <div className="flex-1">
                                        <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-500 transition-colors">
                                            <Upload className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                {file ? file.name : 'Choose Excel/CSV file...'}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => handleFileSelect(table.id, e)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Import Button */}
                                    <Button
                                        onClick={() => importExcel(table.id)}
                                        disabled={!file || loading}
                                        size="sm"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Import
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Import Result */}
                                {result && (
                                    <div className={`mt-3 p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                        <div className="flex items-start gap-2">
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                                    {result.message}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Records processed: {result.recordsProcessed}
                                                </p>
                                                {result.errors && result.errors.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm font-medium text-red-700">Errors:</p>
                                                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                                            {result.errors.slice(0, 10).map((error, i) => (
                                                                <li key={i}>• {error}</li>
                                                            ))}
                                                            {result.errors.length > 10 && (
                                                                <li>... and {result.errors.length - 10} more errors</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
