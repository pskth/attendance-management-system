'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Database, Calendar, CheckCircle, AlertCircle, Info, FileArchive, RefreshCw } from 'lucide-react'

interface AcademicYear {
    year_id: string
    year_name: string
    start_date: string
    end_date: string
    is_active: boolean
    college_id: string
    colleges: {
        name: string
        code: string
    }
}

interface ExportStatus {
    success: boolean
    message: string
    filesGenerated?: number
    zipFileName?: string
}

export default function AcademicYearExport() {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(false)
    const [exportingYearId, setExportingYearId] = useState<string | null>(null)
    const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({})

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    const fetchAcademicYears = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/admin/academic-years', {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setAcademicYears(data)
            }
        } catch (error) {
            console.error('Failed to fetch academic years:', error)
        }
    }

    const exportAcademicYearData = async (yearId: string, yearName: string) => {
        setLoading(true)
        setExportingYearId(yearId)
        setExportStatus(prev => ({ ...prev, [yearId]: { success: false, message: 'Exporting...' } }))

        try {
            const response = await fetch(`http://localhost:4000/api/admin/export-academic-year/${yearId}`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Export failed')
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition')
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
                : `academic-year-${yearName.replace(/\//g, '-')}.zip`

            // Download the zip file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setExportStatus(prev => ({
                ...prev,
                [yearId]: {
                    success: true,
                    message: `Successfully exported data for ${yearName}`,
                    filesGenerated: 8,
                    zipFileName: filename
                }
            }))
        } catch (error) {
            setExportStatus(prev => ({
                ...prev,
                [yearId]: {
                    success: false,
                    message: error instanceof Error ? error.message : 'Export failed'
                }
            }))
        } finally {
            setLoading(false)
            setExportingYearId(null)
        }
    }

    const exportAllCurrentData = async () => {
        setLoading(true)
        setExportStatus(prev => ({ ...prev, 'all': { success: false, message: 'Exporting all data...' } }))

        try {
            const response = await fetch('http://localhost:4000/api/admin/export-all-data', {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Export failed')
            }

            const contentDisposition = response.headers.get('Content-Disposition')
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
                : `complete-backup-${new Date().toISOString().split('T')[0]}.zip`

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setExportStatus(prev => ({
                ...prev,
                'all': {
                    success: true,
                    message: 'Successfully exported complete database backup',
                    filesGenerated: 8,
                    zipFileName: filename
                }
            }))
        } catch (error) {
            setExportStatus(prev => ({
                ...prev,
                'all': {
                    success: false,
                    message: error instanceof Error ? error.message : 'Export failed'
                }
            }))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Academic Year Data Export</h1>
                <p className="text-gray-600 mt-2">Export and backup data for academic year migration</p>
            </div>

            {/* Instructions Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Info className="w-5 h-5" />
                        About Academic Year Export
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-900">
                    <div className="space-y-2">
                        <p className="font-semibold">What gets exported?</p>
                        <p>Each export creates a ZIP file containing 10 Excel files with all data related to the selected academic year:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><span className="font-mono bg-white px-1">colleges.xlsx</span> - College information</li>
                            <li><span className="font-mono bg-white px-1">departments.xlsx</span> - Departments for the college</li>
                            <li><span className="font-mono bg-white px-1">sections.xlsx</span> - Class sections</li>
                            <li><span className="font-mono bg-white px-1">users.xlsx</span> - All users (students, teachers, admins)</li>
                            <li><span className="font-mono bg-white px-1">students.xlsx</span> - Student enrollment details</li>
                            <li><span className="font-mono bg-white px-1">teachers.xlsx</span> - Teacher assignments</li>
                            <li><span className="font-mono bg-white px-1">courses.xlsx</span> - Course catalog</li>
                            <li><span className="font-mono bg-white px-1">academic_years.xlsx</span> - Academic year information</li>
                            <li><span className="font-mono bg-white px-1">course_offerings.xlsx</span> - Course-section assignments</li>
                            <li><span className="font-mono bg-white px-1">attendance_records.xlsx</span> - Attendance history (archival)</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold">How to use exported data?</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Extract the ZIP file to get individual Excel files</li>
                            <li>Modify the data as needed for the new academic year (update year, dates, etc.)</li>
                            <li>Use the <span className="font-semibold">Excel Import</span> tab to reimport the data</li>
                            <li>This allows you to easily migrate to a new academic year with updated information</li>
                        </ul>
                    </div>
                    <div className="space-y-2 border-t border-blue-300 pt-3">
                        <p className="font-semibold">💡 Typical Workflow:</p>
                        <ol className="list-decimal list-inside ml-4 space-y-1">
                            <li>Export current academic year data at end of year</li>
                            <li>Modify Excel files: update academic year, increment student semesters, update dates</li>
                            <li>Clear old data or create new database</li>
                            <li>Import modified Excel files to populate new academic year</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Complete Backup Option */}
            <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Complete Database Backup
                    </CardTitle>
                    <CardDescription>
                        Export all data from the entire database (all academic years and colleges)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={exportAllCurrentData}
                            disabled={loading}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading && exportStatus['all']?.message.includes('Exporting') ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileArchive className="w-4 h-4 mr-2" />
                                    Export Complete Backup
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-gray-600">
                            Downloads a ZIP file with all data from the database
                        </p>
                    </div>

                    {/* Export Result for All Data */}
                    {exportStatus['all'] && (
                        <div className={`mt-3 p-3 rounded-lg ${exportStatus['all'].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-start gap-2">
                                {exportStatus['all'].success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${exportStatus['all'].success ? 'text-green-800' : 'text-red-800'}`}>
                                        {exportStatus['all'].message}
                                    </p>
                                    {exportStatus['all'].success && exportStatus['all'].zipFileName && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Downloaded: <span className="font-mono">{exportStatus['all'].zipFileName}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Academic Years List */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Export by Academic Year</h2>
                {academicYears.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No academic years found in the database.</p>
                            <p className="text-sm mt-2">Create academic years first using the Excel Import tab.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {academicYears.map((year) => {
                            const status = exportStatus[year.year_id]
                            const isExporting = exportingYearId === year.year_id

                            return (
                                <Card key={year.year_id} className={year.is_active ? 'border-blue-500 border-2' : ''}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            {year.year_name}
                                            {year.is_active && (
                                                <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                                    Active
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {year.colleges.name} ({year.colleges.code})
                                        </CardDescription>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            onClick={() => exportAcademicYearData(year.year_id, year.year_name)}
                                            disabled={loading}
                                            className="w-full"
                                            variant={year.is_active ? 'default' : 'outline'}
                                        >
                                            {isExporting ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Exporting...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Export Data
                                                </>
                                            )}
                                        </Button>

                                        {/* Export Result */}
                                        {status && (
                                            <div className={`p-2 rounded text-sm ${status.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                <div className="flex items-start gap-2">
                                                    {status.success ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className={status.success ? 'text-green-800' : 'text-red-800'}>
                                                            {status.message}
                                                        </p>
                                                        {status.success && status.zipFileName && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {status.zipFileName}
                                                            </p>
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
                )}
            </div>

            {/* Tips Card */}
            <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                        <Info className="w-5 h-5" />
                        Tips for Academic Year Migration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-orange-900">
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Export data at the end of each academic year for backup</li>
                        <li>When modifying for new year: update academic year name, dates, and student semesters</li>
                        <li>Keep user passwords unchanged or use batch password reset after import</li>
                        <li>Verify data integrity after reimporting to new database</li>
                        <li>Store exported ZIP files securely as they contain sensitive data</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
