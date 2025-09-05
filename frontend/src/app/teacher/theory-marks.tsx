'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, AlertTriangle, CheckCircle, Edit3, Download } from 'lucide-react'
import { Course, Section } from './dropdown-navigation'
import mockTheoryMarksImport from '@/data/mockTheoryMarks.json'

interface TheoryMarksProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
}

interface Student {
  student_id: string
  enrollment_id: string
  usn: string
  student_name: string
}

interface SubColumn {
  id: string
  name: string
  weight: number
  maxMark: number
}

interface ColumnGroup {
  id: string
  name: string
  subColumns: SubColumn[]
}

interface MarksRecord {
  [studentId: string]: { [colId: string]: number | null }
}

const mockStudents: Student[] = (mockTheoryMarksImport as any[]).map(s => ({
  student_id: s.student_id,
  enrollment_id: s.enrollment_id,
  usn: s.usn,
  student_name: s.student_name
}))

export function TheoryMarksManagement({ courseOffering, selectedDepartment, selectedSection }: TheoryMarksProps) {
  const [students] = useState<Student[]>(mockStudents)

  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([
    {
      id: 'theory',
      name: 'Theory Marks',
      subColumns: [
        { id: 'mse1', name: 'MSE1', weight: 20, maxMark: 20 },
        { id: 'mse2', name: 'MSE2', weight: 20, maxMark: 20 },
        { id: 'task1', name: 'Task1', weight: 4, maxMark: 4 },
        { id: 'task2', name: 'Task2', weight: 4, maxMark: 4 },
        { id: 'task3', name: 'Task3', weight: 2, maxMark: 2 }
      ]
    },
    {
      id: 'lab',
      name: 'Lab Marks',
      subColumns: [
        { id: 'record', name: 'Record', weight: 10, maxMark: 10 },
        { id: 'labmse', name: 'Lab MSE', weight: 10, maxMark: 10 }
      ]
    }
  ])

  const [marks, setMarks] = useState<MarksRecord>({})

  const handleMarkChange = (studentId: string, colId: string, value: number) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [colId]: value }
    }))
  }

  const addSubColumn = (groupId: string, afterId?: string) => {
    setColumnGroups(prev =>
      prev.map(group => {
        if (group.id !== groupId) return group
        const newCol: SubColumn = {
          id: Date.now().toString(),
          name: 'New Col',
          weight: 10,
          maxMark: 10
        }
        if (!afterId) return { ...group, subColumns: [...group.subColumns, newCol] }
        const idx = group.subColumns.findIndex(c => c.id === afterId)
        const updated = [...group.subColumns]
        updated.splice(idx + 1, 0, newCol)
        return { ...group, subColumns: updated }
      })
    )
  }

  const removeSubColumn = (groupId: string, colId: string) => {
    setColumnGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, subColumns: group.subColumns.filter(c => c.id !== colId) }
          : group
      )
    )
    setMarks(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(sid => {
        delete updated[sid]?.[colId]
      })
      return updated
    })
  }

  const renameSubColumn = (groupId: string, colId: string, newName: string) => {
    setColumnGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map(c =>
                c.id === colId ? { ...c, name: newName } : c
              )
            }
          : group
      )
    )
  }

  const updateWeight = (groupId: string, colId: string, newWeight: number) => {
    setColumnGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map(c =>
                c.id === colId ? { ...c, weight: newWeight } : c
              )
            }
          : group
      )
    )
  }

  const updateMaxMark = (groupId: string, colId: string, newMax: number) => {
    setColumnGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map(c =>
                c.id === colId ? { ...c, maxMark: newMax } : c
              )
            }
          : group
      )
    )
  }

  const calculateGrandTotal = (studentId: string) => {
    let weightedSum = 0
    let maxWeighted = 0
    columnGroups.forEach(group =>
      group.subColumns.forEach(col => {
        const mark = marks[studentId]?.[col.id] || 0
        const weight = col.weight
        const maxMark = col.maxMark
        weightedSum += (mark / maxMark) * weight
        maxWeighted += weight
      })
    )
    if (maxWeighted === 0) return 0
    return ((weightedSum / maxWeighted) * 50).toFixed(2)
  }
  const [savingStructure, setSavingStructure] = useState(false)

const saveTableStructure = async () => {
  setSavingStructure(true)
  try {
    // Transform columnGroups into MarkComponent[] structure
    const payload: MarkComponent[] = columnGroups.flatMap(group =>
      group.subColumns.map(col => ({
        id: col.id,       // or remove if new
        name: col.name,
        maxMarks: col.maxMark,
        // you can also include weight if needed
      }))
    )

    // Replace with actual API call
    // await saveMarkComponents(courseOffering.course_id, payload)
    console.log('Saving table structure:', payload)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    alert('Table structure saved successfully!')
  } catch (error) {
    console.error('Error saving table structure:', error)
    alert('Failed to save table structure.')
  } finally {
    setSavingStructure(false)
  }
}

  return (
    <div className="p-4 text-black bg-white">
      <h2 className="text-xl font-semibold mb-2">Student Marks</h2>
      <table className="border-collapse border w-full">
        <thead>
          <tr>
            <th rowSpan={2} className="border px-3 py-2 bg-gray-50">Student</th>
            {columnGroups.map(group => (
              <th key={group.id} colSpan={group.subColumns.length} className="border px-3 py-2 bg-gray-50">
                {group.name}
              </th>
            ))}
            <th rowSpan={2} className="border px-3 py-2 bg-gray-50">Grand Total (out of 50)</th>
          </tr>
          <tr>
            {columnGroups.flatMap(group =>
              group.subColumns.map(col => (
                <th key={col.id} className="border px-3 py-1 relative group bg-white">
                  <input
                    type="text"
                    defaultValue={col.name}
                    onBlur={e => renameSubColumn(group.id, col.id, e.target.value)}
                    className="text-center w-20 border-b focus:outline-none"
                  />
                  <div className="absolute inset-x-0 top-6 hidden group-hover:block text-xs bg-gray-50 border rounded p-1 z-10">
                    <div>
                      Wt:
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={col.weight}
                        onChange={e => updateWeight(group.id, col.id, Number(e.target.value))}
                        className="w-14 border px-1 text-center ml-1"
                      /> %
                    </div>
                    <div className="mt-1">
                      Max:
                      <input
                        type="number"
                        min={1}
                        value={col.maxMark}
                        onChange={e => updateMaxMark(group.id, col.id, Number(e.target.value))}
                        className="w-14 border px-1 text-center ml-1"
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-1">
                      <button onClick={() => addSubColumn(group.id, col.id)} className="text-green-600">➕</button>
                      <button onClick={() => removeSubColumn(group.id, col.id)} className="text-red-600">➖</button>
                    </div>
                  </div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {students.map(stu => (
            <tr key={stu.student_id} className="border-b hover:bg-gray-50">
              <td className="border px-3 py-1">{stu.student_name} <br /> <span className="text-xs text-gray-500">{stu.usn}</span></td>
              {columnGroups.flatMap(group =>
                group.subColumns.map(col => (
                  <td key={col.id} className="border px-3 py-1 text-center">
                    <input
                      type="number"
                      className="w-16 text-center"
                      placeholder="-"
                      value={marks[stu.student_id]?.[col.id] ?? ""}
                      onChange={e => handleMarkChange(stu.student_id, col.id, Number(e.target.value))}
                    />
                  </td>
                ))
              )}
              <td className="border px-3 py-1 text-center font-semibold">{calculateGrandTotal(stu.student_id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mb-2">
  <button
    onClick={saveTableStructure}
    disabled={savingStructure}
    className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
  >
    Save Table Structure
  </button>
</div>
    </div>
  )
}
