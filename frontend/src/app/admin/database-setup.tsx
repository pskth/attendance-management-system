'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Trash2, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportStatus {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}

interface DatabaseCounts {
  colleges: number;
  users: number;
  departments: number;
  sections: number;
  students: number;
  teachers: number;
  courses: number;
  userRoles: number;
  academicYears: number;
  courseOfferings: number;
  attendance: number;
  attendanceRecords: number;
  enrollments: number;
  theoryMarks: number;
  labMarks: number;
}

const IMPORT_STEPS = [
  // Phase 1: Foundation Data (Required)
  { id: 'colleges', name: '1. Colleges', description: 'Institution information', required: true },
  { id: 'users', name: '2. Users', description: 'All system users', required: true },
  { id: 'departments', name: '3. Departments', description: 'Academic departments', required: true },
  { id: 'sections', name: '4. Sections', description: 'Class sections', required: true },
  { id: 'academic_years', name: '5. Academic Years', description: 'Academic year definitions', required: true },
  
  // Phase 2: User-Specific Data
  { id: 'students', name: '6. Students', description: 'Student records', required: false },
  { id: 'teachers', name: '7. Teachers', description: 'Faculty records', required: false },
  { id: 'courses', name: '8. Courses', description: 'Course catalog', required: false },
  { id: 'user_roles', name: '9. User Roles', description: 'User role assignments', required: false },
  
  // Phase 3: Academic Structure
  { id: 'course_offerings', name: '10. Course Offerings', description: 'Course instances per semester', required: false },
  { id: 'student_enrollments', name: '11. Student Enrollments', description: 'Student course registrations', required: false },
  
  // Phase 4: Academic Records
  { id: 'attendance', name: '12. Attendance', description: 'Attendance session definitions', required: false },
  { id: 'attendance_records', name: '13. Attendance Records', description: 'Individual attendance records', required: false },
  { id: 'theory_marks', name: '14. Theory Marks', description: 'Theory component marks', required: false },
  { id: 'lab_marks', name: '15. Lab Marks', description: 'Lab component marks', required: false }
]

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false)
  const [importResults, setImportResults] = useState<Record<string, ImportStatus>>({})
  const [dbCounts, setDbCounts] = useState<DatabaseCounts | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({})

  const handleFileSelect = (stepId: string, file: File | null) => {
    setSelectedFiles(prev => {
      const updated = { ...prev }
      if (file) {
        updated[stepId] = file
      } else {
        delete updated[stepId]
      }
      return updated
    })
  }

  const importTable = async (stepId: string) => {
    const file = selectedFiles[stepId]
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`http://localhost:4000/api/admin/import/${stepId}`, {
        method: 'POST',
        body: formData
      })

      const result: ImportStatus = await response.json()
      setImportResults(prev => ({ ...prev, [stepId]: result }))
      
      // Refresh database counts
      await refreshStatus()
    } catch (error) {
      setImportResults(prev => ({ 
        ...prev, 
        [stepId]: { 
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

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear the entire database? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:4000/api/admin/clear-database', {
        method: 'POST'
      })

      const result = await response.json()
      if (result.success) {
        setImportResults({})
        await refreshStatus()
        alert('Database cleared successfully')
      } else {
        alert(`Failed to clear database: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/import-status')
      const result = await response.json()
      if (result.success) {
        setDbCounts(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch database status:', error)
    }
  }

  const downloadSampleCSV = (stepId: string) => {
    const samples: Record<string, string> = {
      colleges: 'college_name,college_code,logo_url\n"Nitte Institute of Technology","NIT","https://example.com/logos/nit.png"\n"NMAM Institute of Technology","NMAMIT","https://example.com/logos/nmamit.png"',
      users: 'username,password_hash,name,phone\nadmin_user,"$2b$10$hashedpassword","System Admin","9999999999"\njohn_doe,"$2b$10$hashedpassword","John Doe","8888888888"',
      departments: 'college_code,department_name,department_code\nNIT,"Computer Science Engineering","CSE"\nNIT,"Information Science Engineering","ISE"',
      sections: 'college_code,department_code,section_name\nNIT,CSE,A\nNIT,CSE,B\nNIT,ISE,A',
      students: 'username,college_code,department_code,section_name,usn,semester,batch_year\nstudent1,NIT,CSE,A,"NIT2022CSE001",5,2022\nstudent2,NIT,CSE,A,"NIT2022CSE002",5,2022',
      teachers: 'username,college_code,department_code\nprof_smith,NIT,CSE\nprof_jones,NIT,ISE',
      courses: 'college_code,course_code,course_name,department_code,course_type,has_theory_component,has_lab_component\nNIT,CSE501,"Data Structures",CSE,core,true,true\nNIT,CSE502,"Algorithms",CSE,core,true,false',
      user_roles: 'username,role\nnit_admin,admin\nprof_smith,teacher\nstudent1,student',
      academic_years: 'college_code,year_name,start_date,end_date,is_active\nNIT,"2024-25","2024-06-01","2025-05-31",TRUE\nNIT,"2023-24","2023-06-01","2024-05-31",FALSE',
      course_offerings: 'course_code,academic_year,semester,section_dept_code,section_name,teacher_username\nCSE501,"2024-25",5,CSE,A,prof_smith\nCSE502,"2024-25",5,CSE,A,prof_smith',
      attendance: 'course_code,section_dept_code,section_name,teacher_username,class_date,period_number,syllabus_covered\nCSE501,CSE,A,prof_smith,2025-07-01,1,"Introduction to Data Structures"\nCSE501,CSE,A,prof_smith,2025-07-02,1,"Arrays and Linked Lists"',
      attendance_records: 'student_usn,course_code,section_dept_code,section_name,class_date,period_number,status\nNIT2022CSE001,CSE501,CSE,A,2025-07-01,1,present\nNIT2022CSE002,CSE501,CSE,A,2025-07-01,1,absent',
      student_enrollments: 'student_usn,course_code,academic_year,semester\nNIT2022CSE001,CSE501,"2024-25",5\nNIT2022CSE002,CSE501,"2024-25",5',
      theory_marks: 'student_usn,course_code,mse1_marks,mse2_marks,mse3_marks,task1_marks,task2_marks,task3_marks\nNIT2022CSE001,CSE501,18,17,,4,3,2\nNIT2022CSE002,CSE501,15,16,,3,3,1',
      lab_marks: 'student_usn,course_code,record_marks,continuous_evaluation_marks,lab_mse_marks\nNIT2022CSE001,CSE501,9,18,17\nNIT2022CSE002,CSE501,8,16,16'
    }

    const csvContent = samples[stepId] || ''
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stepId}_sample.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Load initial status
  useState(() => {
    refreshStatus()
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          <p className="text-gray-800 mt-2">Import data from CSV files to set up your College ERP system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshStatus} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button onClick={clearDatabase} variant="destructive" disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Database
          </Button>
        </div>
      </div>

      {/* Database Status */}
      {dbCounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {Object.entries(dbCounts).map(([key, count]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Steps */}
      <div className="grid gap-4">
        {IMPORT_STEPS.map((step, index) => {
          const result = importResults[step.id]
          const file = selectedFiles[step.id]
          
          return (
            <Card key={step.id} className={`${step.required ? 'border-l-4 border-l-orange-500' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      {step.name}
                      {step.required && <span className="text-orange-500 text-sm">(Required)</span>}
                    </CardTitle>
                    <CardDescription className="text-gray-800">{step.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      <div className="flex items-center gap-1">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.recordsProcessed} records
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(step.id, e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => downloadSampleCSV(step.id)}
                    variant="outline"
                    size="sm"
                  >
                    Sample
                  </Button>
                  <Button
                    onClick={() => importTable(step.id)}
                    disabled={!file || loading}
                    className="min-w-[100px]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>

                {result && (
                  <div className={`p-3 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message}
                    </p>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-700">Errors:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {result.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>... and {result.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>1.</strong> Import tables in the order shown above (required tables first)</p>
          <p><strong>2.</strong> Download sample CSV files to see the expected format</p>
          <p><strong>3.</strong> Ensure your CSV files have headers that match the sample format</p>
          <p><strong>4.</strong> Foreign key relationships will be resolved automatically (e.g., college_code → college_id)</p>
          <p><strong>5.</strong> Course Offerings must be imported before Student Enrollments</p>
          <p><strong>6.</strong> Student Enrollments must be imported before Theory/Lab Marks</p>
          <p><strong>7.</strong> Use the &quot;Clear Database&quot; button to start over if needed</p>
        </CardContent>
      </Card>
    </div>
  )
}
