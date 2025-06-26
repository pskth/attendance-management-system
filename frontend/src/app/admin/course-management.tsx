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
  course_id: string
  course_code: string
  course_name: string
  department_id: string
  course_type: 'core' | 'department_elective' | 'open_elective'
  has_theory_component: boolean
  has_lab_component: boolean
}

// Mock data
const mockCourses: Course[] = [
  {
    course_id: '550e8400-e29b-41d4-a716-446655440001',
    course_code: 'CS301',
    course_name: 'Data Structures and Algorithms',
    department_id: '550e8400-e29b-41d4-a716-446655440001',
    course_type: 'core',
    has_theory_component: true,
    has_lab_component: true
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440002',
    course_code: 'CS302',
    course_name: 'Database Management Systems',
    department_id: '550e8400-e29b-41d4-a716-446655440001',
    course_type: 'core',
    has_theory_component: true,
    has_lab_component: true
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440003',
    course_code: 'CS501',
    course_name: 'Advanced Algorithms',
    department_id: '550e8400-e29b-41d4-a716-446655440001',
    course_type: 'core',
    has_theory_component: true,
    has_lab_component: false
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440004',
    course_code: 'OE101',
    course_name: 'Machine Learning Fundamentals',
    department_id: '550e8400-e29b-41d4-a716-446655440001',
    course_type: 'open_elective',
    has_theory_component: true,
    has_lab_component: false
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440005',
    course_code: 'ECE401',
    course_name: 'Digital Signal Processing',
    department_id: '550e8400-e29b-41d4-a716-446655440002',
    course_type: 'core',
    has_theory_component: true,
    has_lab_component: true
  },
  {
    course_id: '550e8400-e29b-41d4-a716-446655440006',
    course_code: 'ME501',
    course_name: 'Thermal Engineering',
    department_id: '550e8400-e29b-41d4-a716-446655440003',
    course_type: 'department_elective',
    has_theory_component: true,
    has_lab_component: false
  }
]

export function CourseManagement({ onNavigateToUsers, initialFilters }: CourseManagementProps = {}) {
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialFilters?.department || 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [editingCourse, setEditingCourse] = useState<Course | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars

  // Helper to get department code from department_id
  const getDepartmentCode = (departmentId: string) => {
    const deptMap: { [key: string]: string } = {
      '550e8400-e29b-41d4-a716-446655440001': 'CSE',
      '550e8400-e29b-41d4-a716-446655440002': 'ECE',
      '550e8400-e29b-41d4-a716-446655440003': 'ME',
      '550e8400-e29b-41d4-a716-446655440004': 'CE',
      '550e8400-e29b-41d4-a716-446655440005': 'AIDS',
      '550e8400-e29b-41d4-a716-446655440006': 'ISE'
    }
    return deptMap[departmentId] || 'Unknown'
  }

  // Compute filtered courses directly
  const filteredCourses = courses.filter(course => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
    }

    // Department filter
    if (selectedDepartment !== 'all' && getDepartmentCode(course.department_id) !== selectedDepartment) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && course.course_type !== selectedType) {
      return false
    }

    return true
  })

  // Delete course
  const deleteCourse = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This will affect all enrolled students.')) {
      setCourses(prev => prev.filter(course => course.course_id !== courseId))
    }
  }

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'core': return 'bg-blue-100 text-blue-800'
      case 'department_elective': return 'bg-green-100 text-green-800'
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
                Manage courses and curriculum (Schema-compliant view)
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
            </select>
            <select
              aria-label="Filter by course type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="core">Core Courses</option>
              <option value="department_elective">Department Electives</option>
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
          filteredCourses.map((course) => (
            <Card key={course.course_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">
                        {course.course_code} - {course.course_name}
                      </CardTitle>
                      <CardDescription>
                        {getDepartmentCode(course.department_id)} • 
                        {course.has_theory_component && ' Theory'}{course.has_theory_component && course.has_lab_component && ' &'}
                        {course.has_lab_component && ' Lab'}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(course.course_type)}`}>
                      {course.course_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToUsers?.({
                        course: course.course_code,
                        department: getDepartmentCode(course.department_id)
                      })}
                      className="flex items-center space-x-1"
                    >
                      <Users className="w-3 h-3" />
                      <span className="text-xs">View Students</span>
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
                      onClick={() => deleteCourse(course.course_id)}
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
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.course_type === 'core').length}</p>
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
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.course_type === 'department_elective').length}</p>
                <p className="text-xs text-gray-600">Department Electives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{filteredCourses.filter(c => c.course_type === 'open_elective').length}</p>
                <p className="text-xs text-gray-600">Open Electives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
