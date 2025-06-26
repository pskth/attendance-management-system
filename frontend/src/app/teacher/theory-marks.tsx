'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calculator, 
  AlertTriangle,
  CheckCircle,
  Edit3,
  Download
} from 'lucide-react'

import { Course, Section } from './dropdown-navigation'
import mockTheoryMarksImport from '@/data/mockTheoryMarks.json'

interface TheoryMarksProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
}

interface TheoryMarks {
  enrollment_id: string
  student_id: string
  usn: string
  student_name: string
  mse1_marks: number | null
  mse2_marks: number | null
  mse3_marks: number | null
  task1_marks: number | null
  task2_marks: number | null
  task3_marks: number | null
  total_marks: number
  last_updated_at: string
}

// Type the imported data
const mockTheoryMarks: TheoryMarks[] = mockTheoryMarksImport as TheoryMarks[]

export function TheoryMarksManagement({
  courseOffering,
  selectedDepartment,
  selectedSection
}: TheoryMarksProps) {
  const [marks, setMarks] = useState<TheoryMarks[]>(mockTheoryMarks)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)

  // Load marks data when course offering changes
  const loadMarksData = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const data = await fetchTheoryMarks(courseOffering.offering_id, teacherId)
      // setMarks(data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setMarks(mockTheoryMarks)
    } catch (error) {
      console.error('Error loading marks data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarksData()
  }, [courseOffering.course_id])

  const updateMarks = (studentId: string, field: keyof TheoryMarks, value: number | null) => {
    setMarks(prev => prev.map(student => {
      if (student.student_id === studentId) {
        const updated = { ...student, [field]: value }
        
        // Calculate total marks
        const mse1 = updated.mse1_marks || 0
        const mse2 = updated.mse2_marks || 0
        const mse3 = updated.mse3_marks || 0
        const task1 = updated.task1_marks || 0
        const task2 = updated.task2_marks || 0
        const task3 = updated.task3_marks || 0
        
        // MSE3 is only considered if MSE1 + MSE2 < 20
        const mseTotal = (mse1 + mse2 >= 20) ? mse1 + mse2 : Math.max(mse1 + mse2, mse1 + mse3, mse2 + mse3)
        updated.total_marks = mseTotal + task1 + task2 + task3
        
        return updated
      }
      return student
    }))
  }

  const saveMarks = async (studentId: string) => {
    setSaving(true)
    try {
      const studentMarks = marks.find(m => m.student_id === studentId)
      if (!studentMarks) return

      // Replace with actual API call
      // await updateTheoryMarks(studentMarks.enrollment_id, {
      //   mse1_marks: studentMarks.mse1_marks,
      //   mse2_marks: studentMarks.mse2_marks,
      //   mse3_marks: studentMarks.mse3_marks,
      //   task1_marks: studentMarks.task1_marks,
      //   task2_marks: studentMarks.task2_marks,
      //   task3_marks: studentMarks.task3_marks
      // })
      
      console.log('Saving marks for student:', studentMarks)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEditingStudent(null)
      alert(`Marks saved successfully for ${studentMarks.student_name}!`)
    } catch (error) {
      console.error('Error saving marks:', error)
      alert('Error saving marks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exportMarks = () => {
    // Mock export functionality
    const csvContent = [
      ['USN', 'Name', 'MSE1', 'MSE2', 'MSE3', 'Task1', 'Task2', 'Task3', 'Total'].join(','),
      ...marks.map(student => [
        student.usn,
        student.student_name,
        student.mse1_marks || '',
        student.mse2_marks || '',
        student.mse3_marks || '',
        student.task1_marks || '',
        student.task2_marks || '',
        student.task3_marks || '',
        student.total_marks
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseOffering.course_code}_theory_marks.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const isEligibleForMSE3 = (mse1: number | null, mse2: number | null) => {
    return (mse1 || 0) + (mse2 || 0) < 20
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center space-x-2 mb-1">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>Theory Marks Management</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {courseOffering.course_code} - {courseOffering.course_name} • Section {selectedSection.section_name} • {selectedDepartment}
              </CardDescription>
            </div>
            <button
              onClick={exportMarks}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
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
          <CardTitle className="text-lg">Student Marks</CardTitle>
          <CardDescription className="text-sm">
            Click Edit to modify marks. MSE3 is only available if MSE1 + MSE2 &lt; 20.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-900">Student</th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">MSE1<br/><span className="text-xs text-gray-500">(0-20)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">MSE2<br/><span className="text-xs text-gray-500">(0-20)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">MSE3<br/><span className="text-xs text-gray-500">(0-20)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Task1<br/><span className="text-xs text-gray-500">(0-4)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Task2<br/><span className="text-xs text-gray-500">(0-4)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Task3<br/><span className="text-xs text-gray-500">(0-2)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Total<br/><span className="text-xs text-gray-500">(0-50)</span></th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((student) => (
                  <tr 
                    key={student.student_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{student.student_name}</span>
                        <br />
                        <span className="text-xs text-gray-500">{student.usn}</span>
                      </div>
                    </td>
                    
                    {/* MSE1 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={student.mse1_marks || ''}
                          onChange={(e) => updateMarks(student.student_id, 'mse1_marks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="MSE1 Marks (0-20)"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm">{student.mse1_marks ?? '-'}</span>
                      )}
                    </td>
                    
                    {/* MSE2 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={student.mse2_marks || ''}
                          onChange={(e) => updateMarks(student.student_id, 'mse2_marks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="MSE2 Marks (0-20)"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm">{student.mse2_marks ?? '-'}</span>
                      )}
                    </td>
                    
                    {/* MSE3 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        isEligibleForMSE3(student.mse1_marks, student.mse2_marks) ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={student.mse3_marks || ''}
                            onChange={(e) => updateMarks(student.student_id, 'mse3_marks', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            title="MSE3 Marks (0-20)"
                            placeholder="0"
                            aria-label="MSE3 Marks"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )
                      ) : (
                        <span className="text-sm">
                          {isEligibleForMSE3(student.mse1_marks, student.mse2_marks) 
                            ? (student.mse3_marks ?? '-') 
                            : <span className="text-xs text-gray-400">N/A</span>
                          }
                        </span>
                      )}
                    </td>
                    
                    {/* Task1 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={student.task1_marks || ''}
                          onChange={(e) => updateMarks(student.student_id, 'task1_marks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Task1 Marks (0-4)"
                          placeholder="0"
                          aria-label="Task1 Marks"
                        />
                      ) : (
                        <span className="text-sm">{student.task1_marks ?? '-'}</span>
                      )}
                    </td>
                    
                    {/* Task2 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={student.task2_marks || ''}
                          onChange={(e) => updateMarks(student.student_id, 'task2_marks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Task2 Marks (0-4)"
                          placeholder="0"
                          aria-label="Task2 Marks"
                        />
                      ) : (
                        <span className="text-sm">{student.task2_marks ?? '-'}</span>
                      )}
                    </td>
                    
                    {/* Task3 */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <input
                          type="number"
                          min="0"
                          max="2"
                          value={student.task3_marks || ''}
                          onChange={(e) => updateMarks(student.student_id, 'task3_marks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Task3 Marks (0-2)"
                          placeholder="0"
                          aria-label="Task3 Marks"
                        />
                      ) : (
                        <span className="text-sm">{student.task3_marks ?? '-'}</span>
                      )}
                    </td>
                    
                    {/* Total */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-semibold ${
                        student.total_marks >= 40 ? 'text-green-600' :
                        student.total_marks >= 30 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {student.total_marks}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      {editingStudent === student.student_id ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => saveMarks(student.student_id)}
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
                          onClick={() => setEditingStudent(student.student_id)}
                          className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title="Edit marks"
                          aria-label="Edit marks"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Marking Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>MSE3 is only available when MSE1 + MSE2 &lt; 20 marks</li>
                <li>Best two MSE scores will be considered for final calculation</li>
                <li>Total marks = Best 2 MSE scores + Task1 + Task2 + Task3</li>
                <li>Maximum possible total: 50 marks (20+20+4+4+2)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
