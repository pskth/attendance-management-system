'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  BookOpen,
  Building2,
  Users
} from 'lucide-react'

// No props interface needed for this component

interface CourseManagementProps {
  onNavigateToUsers?: (filters: {
    course?: string
    department?: string
    section?: string
    year?: string
  }) => void
  initialFilters?: {
    department?: string
    year?: string
  }
}

interface Course {
  id: string
  courseCode: string
  courseName: string
  department: string
  semester: number
  credits: number
  type: 'core' | 'elective' | 'open_elective'
  teacherId?: string
  teacherName?: string
  year: string  // Academic year the course is offered
  createdAt: string
  enrolledStudents?: Student[]
}

interface Student {
  id: string
  name: string
  usn: string
  department: string
  year: string
  section: string
}

// Mock data
const mockCourses: Course[] = [
  {
    id: '1',
    courseCode: 'CS301',
    courseName: 'Data Structures and Algorithms',
    department: 'CSE',
    semester: 3,
    credits: 4,
    type: 'core',
    teacherId: 't1',
    teacherName: 'Dr. Priya Kumar',
    year: '2nd Year',
    createdAt: '2024-01-15',
    enrolledStudents: [
      { id: '1', name: 'Aditya Sharma', usn: 'NNM22CS001', department: 'CSE', year: '2nd Year', section: 'A' },
      { id: '9', name: 'Rajesh Nair', usn: 'NNM22CS009', department: 'CSE', year: '2nd Year', section: 'B' },
    ]
  },
  {
    id: '2',
    courseCode: 'CS302',
    courseName: 'Database Management Systems',
    department: 'CSE',
    semester: 4,
    credits: 4,
    type: 'core',
    teacherId: 't2',
    teacherName: 'Prof. Rajesh Sharma',
    year: '2nd Year',
    createdAt: '2024-01-16',
    enrolledStudents: [
      { id: '1', name: 'Aditya Sharma', usn: 'NNM22CS001', department: 'CSE', year: '2nd Year', section: 'A' },
      { id: '2', name: 'Bhavana Nair', usn: 'NNM22AIDS002', department: 'AIDS', year: '2nd Year', section: 'A' },
      { id: '9', name: 'Rajesh Nair', usn: 'NNM22CS009', department: 'CSE', year: '2nd Year', section: 'B' },
    ]
  },
  {
    id: '3',
    courseCode: 'CS501',
    courseName: 'Advanced Algorithms',
    department: 'CSE',
    semester: 5,
    credits: 4,
    type: 'core',
    teacherId: 't3',
    teacherName: 'Dr. Suresh Nair',
    year: '3rd Year',
    createdAt: '2023-01-15',
    enrolledStudents: [
      { id: '3', name: 'Chetan Kumar', usn: 'NNM22ISE003', department: 'ISE', year: '3rd Year', section: 'B' },
      { id: '4', name: 'Divya Rao', usn: 'NNM22ECE004', department: 'ECE', year: '3rd Year', section: 'A' },
      { id: '8', name: 'Sneha Patel', usn: 'NNM21AIDS010', department: 'AIDS', year: '3rd Year', section: 'A' },
    ]
  },
  {
    id: '4',
    courseCode: 'CS701',
    courseName: 'Software Engineering',
    department: 'CSE',
    semester: 7,
    credits: 4,
    type: 'core',
    teacherId: 't4',
    teacherName: 'Prof. Kavita Reddy',
    year: '4th Year',
    createdAt: '2022-01-15',
    enrolledStudents: [
      { id: '5', name: 'Rahul Verma', usn: 'NNM22ME005', department: 'ME', year: '4th Year', section: 'B' },
      { id: '6', name: 'Priya Singh', usn: 'NNM22CE006', department: 'CE', year: '4th Year', section: 'A' },
      { id: '11', name: 'Vikram Joshi', usn: 'NNM20ISE011', department: 'ISE', year: '4th Year', section: 'B' },
    ]
  },
  {
    id: '5',
    courseCode: 'OE101',
    courseName: 'Machine Learning Fundamentals',
    department: 'Open Elective',
    semester: 5,
    credits: 3,
    type: 'open_elective',
    teacherId: 't3',
    teacherName: 'Dr. Anita Desai',
    year: '3rd Year',
    createdAt: '2023-02-01',
    enrolledStudents: [
      { id: '3', name: 'Chetan Kumar', usn: 'NNM22ISE003', department: 'ISE', year: '3rd Year', section: 'B' },
      { id: '4', name: 'Divya Rao', usn: 'NNM22ECE004', department: 'ECE', year: '3rd Year', section: 'A' },
      { id: '8', name: 'Sneha Patel', usn: 'NNM21AIDS010', department: 'AIDS', year: '3rd Year', section: 'A' },
      { id: '5', name: 'Rahul Verma', usn: 'NNM22ME005', department: 'ME', year: '4th Year', section: 'B' },
      { id: '6', name: 'Priya Singh', usn: 'NNM22CE006', department: 'CE', year: '4th Year', section: 'A' },
    ]
  },
  {
    id: '6',
    courseCode: 'ECE401',
    courseName: 'Digital Signal Processing',
    department: 'ECE',
    semester: 7,
    credits: 4,
    type: 'core',
    teacherId: 't4',
    teacherName: 'Dr. Kavita Rao',
    year: '4th Year',
    createdAt: '2022-02-05',
    enrolledStudents: [
      { id: '4', name: 'Divya Rao', usn: 'NNM22ECE004', department: 'ECE', year: '3rd Year', section: 'A' },
    ]
  },
  {
    id: '7',
    courseCode: 'ME501',
    courseName: 'Thermal Engineering',
    department: 'ME',
    semester: 5,
    credits: 3,
    type: 'elective',
    teacherId: 't5',
    teacherName: 'Prof. Suresh Kumar',
    year: '3rd Year',
    createdAt: '2023-02-10',
    enrolledStudents: [
      { id: '5', name: 'Rahul Verma', usn: 'NNM22ME005', department: 'ME', year: '4th Year', section: 'B' },
    ]
  }
]

export function CourseManagement({ onNavigateToUsers, initialFilters }: CourseManagementProps = {}) {
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>(initialFilters?.year || 'all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialFilters?.department || 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [editingCourse, setEditingCourse] = useState<Course | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars

  // Compute filtered courses directly
  const filteredCourses = courses.filter(course => {
    // Year filter
    if (selectedYear !== 'all' && course.year !== selectedYear) {
      return false
    }

    // Search filter
    if (searchTerm) {
      const matchesSearch = course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    // Department filter
    if (selectedDepartment !== 'all' && course.department !== selectedDepartment) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && course.type !== selectedType) {
      return false
    }

    return true
  })

  // Delete course
  const deleteCourse = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This will affect all enrolled students.')) {
      setCourses(prev => prev.filter(course => course.id !== courseId))
    }
  }

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'core': return 'bg-blue-100 text-blue-800'
      case 'elective': return 'bg-green-100 text-green-800'
      case 'open_elective': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Course Management</CardTitle>
              <CardDescription>
                Manage courses, subjects, and curriculum for {selectedYear}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardHeader>        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by course code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              aria-label="Filter by year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Years</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <select
              aria-label="Filter by department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="ECE">Electronics</option>
              <option value="ME">Mechanical</option>
              <option value="CE">Civil</option>
              <option value="AIDS">AI & Data Science</option>
              <option value="ISE">Information Science</option>
              <option value="Open Elective">Open Elective</option>
            </select>
            <select
              aria-label="Filter by course type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="core">Core Courses</option>
              <option value="elective">Department Electives</option>
              <option value="open_elective">Open Electives</option>
            </select>
            <div className="text-sm text-gray-600 flex items-center">
              Total: {filteredCourses.length} courses
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="space-y-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">
                        {course.courseCode} - {course.courseName}
                      </CardTitle>                      <CardDescription>
                        {course.department} • Semester {course.semester}
                        {course.teacherName && ` • ${course.teacherName}`}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(course.type)}`}>
                      {course.type.replace('_', ' ')}
                    </span>
                  </div>                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToUsers?.({
                        course: course.courseCode,
                        department: course.department,
                        year: course.year
                      })}
                      className="flex items-center space-x-1"
                    >
                      <Users className="w-3 h-3" />
                      <span className="text-xs">View Students ({course.enrolledStudents?.length || 0})</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCourse(course)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCourse(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No courses found</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.type === 'core').length}</p>
                <p className="text-xs text-gray-600">Core Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.type === 'elective').length}</p>
                <p className="text-xs text-gray-600">Electives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.type === 'open_elective').length}</p>
                <p className="text-xs text-gray-600">Open Electives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
