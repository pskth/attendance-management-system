'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Beaker,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Download,
  Loader2
} from 'lucide-react'

import { Course, Section } from './dropdown-navigation'
import { TeacherAPI, StudentMarksData } from '@/lib/teacher-api'

interface LabMarksProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
}

export function LabMarksManagement({
  courseOffering,
  selectedDepartment,
  selectedSection
}: Omit<LabMarksProps, 'selectedYear'>) {
  const [marks, setMarks] = useState<StudentMarksData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)

  // Load marks data when course offering changes
  const loadMarksData = async () => {
    if (!courseOffering.course_id) {
      setError('No course ID available')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await TeacherAPI.getMarks(courseOffering.course_id)
      setMarks(data)
    } catch (err) {
      console.error('Error loading marks data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load marks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarksData()
  }, [courseOffering.course_id])

  const updateMarks = (studentId: string, field: 'record_marks' | 'continuous_evaluation_marks' | 'lab_mse_marks', value: number | null) => {
    setMarks(prev => prev.map(student => {
      if (student.student.id === studentId) {
        const updated = { ...student }

        // Initialize labMarks if it doesn't exist
        if (!updated.labMarks) {
          updated.labMarks = {
            id: '',
            record_marks: null,
            continuous_evaluation_marks: null,
            lab_mse_marks: null,
            last_updated_at: new Date()
          }
        } else {
          updated.labMarks = { ...updated.labMarks }
        }

        // Update the specific field
        updated.labMarks[field] = value

        return updated
      }
      return student
    }))
  }

  const calculateTotal = (labMarks: StudentMarksData['labMarks']) => {
    if (!labMarks) return 0
    const record = labMarks.record_marks || 0
    const continuous = labMarks.continuous_evaluation_marks || 0
    const labMse = labMarks.lab_mse_marks || 0
    return record + continuous + labMse
  }

  const saveMarks = async (studentId: string) => {
    setSaving(true)
    try {
      const studentData = marks.find(m => m.student.id === studentId)
      if (!studentData || !studentData.labMarks) return

      // TODO: Replace with actual API call to update marks
      console.log('Saving lab marks for student:', studentData)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setEditingStudent(null)
      alert(`Lab marks saved successfully for ${studentData.student.user.name}!`)
    } catch (error) {
      console.error('Error saving marks:', error)
      alert('Error saving marks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exportMarks = () => {
    // Export real data to CSV
    const csvContent = [
      ['USN', 'Name', 'Record', 'Continuous Evaluation', 'Lab MSE', 'Total'].join(','),
      ...marks.map(student => [
        student.student.usn,
        student.student.user.name,
        student.labMarks?.record_marks || '',
        student.labMarks?.continuous_evaluation_marks || '',
        student.labMarks?.lab_mse_marks || '',
        calculateTotal(student.labMarks)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseOffering.course_code}_lab_marks.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Marks</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center space-x-2 mb-1">
                <Beaker className="w-5 h-5 text-purple-600" />
                <span>Lab Marks Management</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {courseOffering.course_code} - {courseOffering.course_name} • Section {selectedSection.section_name} • {selectedDepartment}
              </CardDescription>
            </div>
            <button
              onClick={exportMarks}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Marks</span>
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Marks Entry Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Student Lab Marks</CardTitle>
          <CardDescription className="text-sm">
            Click Edit to modify marks. Total = Record + Continuous Evaluation + Lab MSE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Record<br /><span className="text-xs text-gray-500">(0-10)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Continuous Evaluation<br /><span className="text-xs text-gray-500">(0-20)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Lab MSE<br /><span className="text-xs text-gray-500">(0-20)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Total<br /><span className="text-xs text-gray-500">(0-50)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((student) => {
                  const total = calculateTotal(student.labMarks)
                  return (
                    <tr
                      key={student.student.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{student.student.user.name}</span>
                          <br />
                          <span className="text-xs text-gray-500">{student.student.usn}</span>
                        </div>
                      </td>

                      {/* Record Marks */}
                      <td className="py-3 px-3 text-center">
                        {editingStudent === student.student.id ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={student.labMarks?.record_marks ?? ''}
                            onChange={(e) => updateMarks(student.student.id, 'record_marks', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            title="Record Marks (0-10)"
                            placeholder="0"
                            aria-label="Record Marks"
                          />
                        ) : (
                          <span className="text-sm">{student.labMarks?.record_marks ?? '-'}</span>
                        )}
                      </td>

                      {/* Continuous Evaluation */}
                      <td className="py-3 px-3 text-center">
                        {editingStudent === student.student.id ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={student.labMarks?.continuous_evaluation_marks ?? ''}
                            onChange={(e) => updateMarks(student.student.id, 'continuous_evaluation_marks', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            title="Continuous Evaluation Marks (0-20)"
                            placeholder="0"
                            aria-label="Continuous Evaluation Marks"
                          />
                        ) : (
                          <span className="text-sm">{student.labMarks?.continuous_evaluation_marks ?? '-'}</span>
                        )}
                      </td>

                      {/* Lab MSE */}
                      <td className="py-3 px-3 text-center">
                        {editingStudent === student.student.id ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={student.labMarks?.lab_mse_marks ?? ''}
                            onChange={(e) => updateMarks(student.student.id, 'lab_mse_marks', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            title="Lab MSE Marks (0-20)"
                            placeholder="0"
                            aria-label="Lab MSE Marks"
                          />
                        ) : (
                          <span className="text-sm">{student.labMarks?.lab_mse_marks ?? '-'}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-semibold ${total >= 40 ? 'text-green-600' :
                            total >= 30 ? 'text-orange-600' :
                              'text-red-600'
                          }`}>
                          {total}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        {editingStudent === student.student.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => saveMarks(student.student.id)}
                              disabled={saving}
                              className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                              title="Save marks"
                              aria-label="Save marks"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingStudent(null)}
                              className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              title="Cancel editing"
                              aria-label="Cancel editing"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingStudent(student.student.id)}
                            className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                            title="Edit marks"
                            aria-label="Edit marks"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-purple-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Lab Marking Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Record marks: 0-10 points for lab record maintenance</li>
                <li>Continuous Evaluation: 0-20 points for ongoing lab performance</li>
                <li>Lab MSE: 0-20 points for lab mid-semester examination</li>
                <li>Total marks = Record + Continuous Evaluation + Lab MSE</li>
                <li>Maximum possible total: 50 marks (10+20+20)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
