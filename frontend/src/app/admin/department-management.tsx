'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Edit, 
  Trash2,
  Building2,
  Users,
  GraduationCap,
  BookOpen
} from 'lucide-react'

interface DepartmentManagementProps {
  selectedYear: string
  onNavigateToUsers?: (filters: {
    department?: string
    role?: string
    year?: string
  }) => void
  onNavigateToCourses?: (filters: {
    department?: string
    year?: string
  }) => void
}

interface Department {
  id: string
  name: string
  code: string
  hodName: string
  hodId: string
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  averageAttendance: number
  establishedYear: string
  status: 'active' | 'inactive'
  courses: DepartmentCourse[]
  teachers: DepartmentTeacher[]
}

interface DepartmentCourse {
  id: string
  courseCode: string
  courseName: string
  semester: number
  enrolledStudents: number
}

interface DepartmentTeacher {
  id: string
  name: string
  designation: string
  experience: number
  coursesAssigned: number
}

// Mock data
const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Computer Science Engineering',
    code: 'CSE',
    hodName: 'Dr. Rajesh Kumar',
    hodId: 'TCH001',
    totalStudents: 890,
    totalTeachers: 25,
    totalCourses: 45,
    averageAttendance: 85.2,
    establishedYear: '1995',
    status: 'active',
    courses: [
      { id: 'c1', courseCode: 'CS101', courseName: 'Programming in C', semester: 1, enrolledStudents: 180 },
      { id: 'c2', courseCode: 'CS201', courseName: 'Data Structures', semester: 3, enrolledStudents: 165 },
      { id: 'c3', courseCode: 'CS301', courseName: 'Database Systems', semester: 5, enrolledStudents: 150 }
    ],
    teachers: [
      { id: 't1', name: 'Dr. Priya Sharma', designation: 'Professor', experience: 15, coursesAssigned: 3 },
      { id: 't2', name: 'Prof. Anil Kumar', designation: 'Associate Professor', experience: 10, coursesAssigned: 4 },
      { id: 't3', name: 'Dr. Sneha Reddy', designation: 'Assistant Professor', experience: 5, coursesAssigned: 3 }
    ]
  },
  {
    id: '2',
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    hodName: 'Dr. Sunita Patel',
    hodId: 'TCH002',
    totalStudents: 756,
    totalTeachers: 22,
    totalCourses: 42,
    averageAttendance: 82.8,
    establishedYear: '1998',
    status: 'active',
    courses: [
      { id: 'c4', courseCode: 'EC101', courseName: 'Basic Electronics', semester: 1, enrolledStudents: 160 },
      { id: 'c5', courseCode: 'EC201', courseName: 'Digital Electronics', semester: 3, enrolledStudents: 145 },
      { id: 'c6', courseCode: 'EC301', courseName: 'Communication Systems', semester: 5, enrolledStudents: 140 }
    ],
    teachers: [
      { id: 't4', name: 'Dr. Ramesh Gupta', designation: 'Professor', experience: 18, coursesAssigned: 2 },
      { id: 't5', name: 'Prof. Kavya Menon', designation: 'Associate Professor', experience: 12, coursesAssigned: 3 }
    ]
  },
  {
    id: '3',
    name: 'Artificial Intelligence & Data Science',
    code: 'AIDS',
    hodName: 'Dr. Anita Desai',
    hodId: 'TCH003',
    totalStudents: 650,
    totalTeachers: 18,
    totalCourses: 38,
    averageAttendance: 87.5,
    establishedYear: '2020',
    status: 'active',
    courses: [
      { id: 'c7', courseCode: 'AI101', courseName: 'Introduction to AI', semester: 3, enrolledStudents: 130 },
      { id: 'c8', courseCode: 'DS201', courseName: 'Machine Learning', semester: 5, enrolledStudents: 125 },
      { id: 'c9', courseCode: 'DS301', courseName: 'Deep Learning', semester: 7, enrolledStudents: 120 }
    ],
    teachers: [
      { id: 't6', name: 'Dr. Vikram Joshi', designation: 'Professor', experience: 14, coursesAssigned: 3 },
      { id: 't7', name: 'Prof. Neha Singh', designation: 'Assistant Professor', experience: 6, coursesAssigned: 4 }
    ]
  }
]

export function DepartmentManagement({ 
  selectedYear, 
  onNavigateToUsers, 
  onNavigateToCourses 
}: DepartmentManagementProps) {  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [showAddForm, setShowAddForm] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars

  // Delete department
  const deleteDepartment = (deptId: string) => {
    if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      setDepartments(prev => prev.filter(dept => dept.id !== deptId))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Department Management</CardTitle>            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>      {/* Department Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-xs text-gray-600">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((acc, dept) => acc + dept.totalStudents, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((acc, dept) => acc + dept.totalTeachers, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Faculty</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <div className="space-y-4">
        {departments.map((department) => (
          <Card key={department.id}>
            <CardHeader>
              <div className="flex items-center justify-between">                <div className="flex items-center space-x-4">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">
                      {department.name} ({department.code})
                    </CardTitle>
                  </div>
                </div><div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToUsers?.({
                      department: department.code,
                      role: 'teacher'
                    })}
                    className="flex items-center space-x-1"
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span className="text-xs">Faculty ({department.totalTeachers})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToCourses?.({
                      department: department.code
                    })}
                    className="flex items-center space-x-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">Courses ({department.totalCourses})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToUsers?.({
                      department: department.code,
                      role: 'student'
                    })}
                    className="flex items-center space-x-1"
                  >
                    <Users className="w-3 h-3" />
                    <span className="text-xs">Students ({department.totalStudents.toLocaleString()})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDepartment(department)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDepartment(department.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>              </div>
            </CardHeader>
          </Card>
        ))}      </div>
    </div>
  )
}
