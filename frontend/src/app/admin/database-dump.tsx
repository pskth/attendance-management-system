'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Download, Upload, AlertTriangle, CheckCircle, AlertCircle, Info, Trash2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { authService } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface StatusMessage {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    details?: string;
}

export default function DatabaseDump() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<StatusMessage | null>(null)
    const [dumpAvailable, setDumpAvailable] = useState<boolean | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    useEffect(() => {
        checkDumpAvailability()
    }, [])

    const checkDumpAvailability = async () => {
        try {
            const token = authService.getToken()
            if (!token) {
                setStatus({
                    type: 'error',
                    message: 'Authentication Required',
                    details: 'Please login as admin to use this feature.'
                })
                setDumpAvailable(false)
                return
            }

            const response = await axios.get(`${API_BASE_URL}/api/admin/dump-info`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDumpAvailable(response.data.available)
            if (!response.data.available) {
                setStatus({
                    type: 'warning',
                    message: 'PostgreSQL Tools Not Found',
                    details: response.data.message + '. ' + response.data.instructions
                })
            }
        } catch (error: any) {
            console.error('Error checking dump availability:', error)
            if (error.response?.status === 401) {
                setStatus({
                    type: 'error',
                    message: 'Authentication Failed',
                    details: 'Your session has expired or user was deleted. Redirecting to login...'
                })
                setTimeout(() => {
                    authService.logout()
                }, 2000)
            }
            setDumpAvailable(false)
        }
    }

    const exportDump = async () => {
        setLoading(true)
        setStatus(null)

        try {
            const token = authService.getToken()
            const response = await axios.get(`${API_BASE_URL}/api/admin/export-dump`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            })

            // Check if the response is an error (JSON) disguised as a blob
            const contentType = response.headers['content-type']
            if (contentType && contentType.includes('application/json')) {
                // It's an error response
                const text = await response.data.text()
                const errorData = JSON.parse(text)
                throw new Error(errorData.error || 'Export failed')
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition']
            let fileName = 'database-dump.sql'
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
                if (fileNameMatch) {
                    fileName = fileNameMatch[1]
                }
            }

            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            setStatus({
                type: 'success',
                message: 'Database dump exported successfully!',
                details: `Downloaded: ${fileName}`
            })
        } catch (error: any) {
            console.error('Export error:', error)
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data
            })

            if (error.response?.status === 401) {
                setStatus({
                    type: 'error',
                    message: 'Authentication Failed',
                    details: 'Your session has expired or user was deleted. Redirecting to login...'
                })
                // Clear auth and redirect after 2 seconds
                setTimeout(() => {
                    authService.logout()
                }, 2000)
            } else {
                // Try to extract error message from blob response
                let errorMessage = error.message || 'Unknown error occurred'

                if (error.response?.data instanceof Blob) {
                    try {
                        const text = await error.response.data.text()
                        const errorData = JSON.parse(text)
                        errorMessage = errorData.error || errorMessage
                    } catch (e) {
                        // If parsing fails, use the original error message
                    }
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error
                }

                setStatus({
                    type: 'error',
                    message: 'Export failed',
                    details: errorMessage
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.sql')) {
                setStatus({
                    type: 'error',
                    message: 'Invalid file type',
                    details: 'Please select a .sql file'
                })
                return
            }
            setSelectedFile(file)
            setStatus({
                type: 'info',
                message: 'File selected',
                details: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
            })
        }
    }

    const importDump = async () => {
        if (!selectedFile) {
            setStatus({
                type: 'error',
                message: 'No file selected',
                details: 'Please select a .sql dump file to import'
            })
            return
        }

        setLoading(true)
        setStatus(null)

        try {
            const token = authService.getToken()
            const formData = new FormData()
            formData.append('dumpFile', selectedFile)

            const response = await axios.post(
                `${API_BASE_URL}/api/admin/import-dump`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            setStatus({
                type: 'success',
                message: 'Database dump imported successfully!',
                details: response.data.message
            })
            setSelectedFile(null)

            // Reset file input
            const fileInput = document.getElementById('dump-file-input') as HTMLInputElement
            if (fileInput) fileInput.value = ''

        } catch (error: any) {
            console.error('Import error:', error)
            if (error.response?.status === 401) {
                setStatus({
                    type: 'error',
                    message: 'Authentication Failed',
                    details: 'Your session has expired or user was deleted. Redirecting to login...'
                })
                setTimeout(() => {
                    authService.logout()
                }, 2000)
            } else {
                setStatus({
                    type: 'error',
                    message: 'Failed to import database dump',
                    details: error.response?.data?.error || error.message
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const clearDatabase = async () => {
        setLoading(true)
        setStatus(null)

        try {
            const token = authService.getToken()
            const response = await axios.post(
                `${API_BASE_URL}/api/admin/clear-database`,
                { confirmation: 'DELETE_ALL_DATA' },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            setStatus({
                type: 'warning',
                message: response.data.message,
                details: response.data.warning
            })
            setShowClearConfirm(false)
        } catch (error: any) {
            console.error('Clear error:', error)
            if (error.response?.status === 401) {
                setStatus({
                    type: 'error',
                    message: 'Authentication Failed',
                    details: 'Your session has expired or user was deleted. Redirecting to login...'
                })
                setTimeout(() => {
                    authService.logout()
                }, 2000)
            } else {
                setStatus({
                    type: 'error',
                    message: 'Failed to clear database',
                    details: error.response?.data?.error || error.message
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const StatusAlert = ({ status }: { status: StatusMessage }) => {
        const icons = {
            success: <CheckCircle className="w-5 h-5 text-green-600" />,
            error: <AlertCircle className="w-5 h-5 text-red-600" />,
            warning: <AlertTriangle className="w-5 h-5 text-orange-600" />,
            info: <Info className="w-5 h-5 text-blue-600" />
        }

        const colors = {
            success: 'bg-green-50 border-green-200',
            error: 'bg-red-50 border-red-200',
            warning: 'bg-orange-50 border-orange-200',
            info: 'bg-blue-50 border-blue-200'
        }

        const textColors = {
            success: 'text-green-900',
            error: 'text-red-900',
            warning: 'text-orange-900',
            info: 'text-blue-900'
        }

        return (
            <div className={`p-4 rounded-lg border ${colors[status.type]} ${textColors[status.type]}`}>
                <div className="flex items-start gap-3">
                    {icons[status.type]}
                    <div className="flex-1">
                        <p className="font-semibold">{status.message}</p>
                        {status.details && (
                            <p className="text-sm mt-1 opacity-90">{status.details}</p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6  text-black">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Database className="w-8 h-8 text-black" />
                    Database Dump Operations
                </h1>
                <p className="text-gray-600 mt-2">
                    Export and import PostgreSQL database dumps (.sql files) for complete backup and restoration
                </p>
            </div>

            {/* Status Messages */}
            {status && (
                <StatusAlert status={status} />
            )}

            {/* Export Dump Card */}
            <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export Database Dump
                    </CardTitle>
                    <CardDescription>
                        Download a complete PostgreSQL dump file of your database
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold">What gets exported:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>Complete database schema (tables, indexes, constraints)</li>
                                    <li>All data from all tables</li>
                                    <li>SQL format compatible with pg_restore or psql</li>
                                    <li>Can be used for disaster recovery or migration</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={exportDump}
                        disabled={loading || dumpAvailable === false}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export Database Dump
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Import Dump Card */}
            <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import Database Dump
                    </CardTitle>
                    <CardDescription>
                        Restore database from a PostgreSQL dump file (.sql)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-orange-900">
                                <p className="font-semibold">Important:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>This will ADD data to your existing database</li>
                                    <li>May cause duplicate key errors if data exists</li>
                                    <li>Recommended: Clear database before importing</li>
                                    <li>Only .sql dump files are supported</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="dump-file-input"
                                accept=".sql"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                onClick={() => document.getElementById('dump-file-input')?.click()}
                                variant="outline"
                                disabled={loading}
                            >
                                Select .sql File
                            </Button>
                            {selectedFile && (
                                <span className="text-sm text-gray-600">
                                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                            )}
                        </div>

                        <Button
                            onClick={importDump}
                            disabled={loading || !selectedFile || dumpAvailable === false}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Database Dump
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Clear Database Card */}
            <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-900">
                        <Trash2 className="w-5 h-5" />
                        Clear Database
                    </CardTitle>
                    <CardDescription className="text-red-700">
                        ⚠️ DANGER: Remove all data from the database (except admin users)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-900">
                                <p className="font-bold">⚠️ DESTRUCTIVE OPERATION ⚠️</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>This will DELETE ALL DATA from the database</li>
                                    <li>Students, teachers, courses, attendance - all deleted</li>
                                    <li>Admin users will be PRESERVED (you won't lose access)</li>
                                    <li>This action CANNOT be undone</li>
                                    <li>Use before importing a dump to avoid conflicts</li>
                                    <li>Always export a backup before clearing!</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-green-900">
                                <p className="font-semibold">✅ Admin users are preserved</p>
                                <p className="mt-1">You will remain logged in and can continue using the system after clearing.</p>
                            </div>
                        </div>
                    </div>

                    {!showClearConfirm ? (
                        <Button
                            onClick={() => setShowClearConfirm(true)}
                            variant="destructive"
                            disabled={loading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Database
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <p className="font-semibold text-red-900">
                                Are you absolutely sure? This action cannot be undone!
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={clearDatabase}
                                    variant="destructive"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Clearing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Yes, Delete Everything
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowClearConfirm(false)}
                                    variant="outline"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Usage Guidelines
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-semibold mb-2">When to use Database Dumps:</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Full Backups:</strong> Create complete snapshots of your database</li>
                            <li><strong>Migration:</strong> Move database between servers or environments</li>
                            <li><strong>Disaster Recovery:</strong> Restore from catastrophic failures</li>
                            <li><strong>Development:</strong> Clone production data to development</li>
                            <li><strong>Version Control:</strong> Track database state over time</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Recommended Workflow:</h3>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Export dump from source database</li>
                            <li>Clear target database (if restoring clean)</li>
                            <li>Import dump into target database</li>
                            <li>Verify data integrity and application functionality</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Dump vs Excel Export:</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Dump:</strong> Complete database snapshot, preserves all data types, indexes, and constraints</li>
                            <li><strong>Excel:</strong> Human-readable format for selective data migration and editing</li>
                            <li>Use dumps for full backups, use Excel for data manipulation</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
