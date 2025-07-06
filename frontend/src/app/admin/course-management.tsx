'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  BookOpen,
  Building2,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '@/lib/api'

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
  code: string
  name: string
  department: {
    id: string
    name: string
    code: string
    college: {
      name: string
      code: string
    }
  }
  type: 'core' | 'department_elective' | 'open_elective'
  hasTheoryComponent: boolean
  hasLabComponent: boolean
  offerings?: any[]
}

export default function CourseManagement({ onNavigateToUsers, initialFilters }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminApi.getAllCourses()
        
        if (response.status === 'success') {
          // Transform API data to match our Course interface
          const transformedCourses: Course[] = response.data.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            department: {
              id: course.department?.id || '',
              name: course.department?.name || '',
              code: course.department?.code || '',
              college: {
                name: course.department?.colleges?.name || '',
                code: course.department?.colleges?.code || ''
              }
            },
            type: course.type || 'core',
            hasTheoryComponent: course.hasTheoryComponent || true,
            hasLabComponent: course.hasLabComponent || false,
            offerings: course.courseOfferings || []
          }))
          
          setCourses(transformedCourses)
        } else {
          setError(response.error || 'Failed to fetch courses')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Apply filters based on initialFilters
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.department) setSelectedDepartment(initialFilters.department)
    }
  }, [initialFilters])

  // Get filtered courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.department.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedDepartment !== 'all' && course.department.code !== selectedDepartment) {
      return false
    }

    if (selectedType !== 'all' && course.type !== selectedType) {
      return false
    }

    return true
  })

  // Get unique departments for filter
  const allDepartments = Array.from(new Set(courses.map(course => course.department.code).filter(Boolean))).sort()

  // Refresh data
  const refreshData = () => {
    setLoading(true)
    setError(null)
    const fetchCourses = async () => {
      try {
        const response = await adminApi.getAllCourses()
        
        if (response.status === 'success') {
          const transformedCourses: Course[] = response.data.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            department: {
              id: course.department?.id || '',
              name: course.department?.name || '',
              code: course.department?.code || '',
              college: {
                name: course.department?.colleges?.name || '',
                code: course.department?.colleges?.code || ''
              }
            },
            type: course.type || 'core',
            hasTheoryComponent: course.hasTheoryComponent || true,
            hasLabComponent: course.hasLabComponent || false,
            offerings: course.courseOfferings || []
          }))
          
          setCourses(transformedCourses)
        } else {
          setError(response.error || 'Failed to fetch courses')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }

  // Delete course
  const deleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await adminApi.deleteCourse(courseId)
        if (response.status === 'success') {
          setCourses(prev => prev.filter(course => course.id !== courseId))
          alert('Course deleted successfully')
        } else {
          // Show more detailed error message
          const errorMsg = response.error || 'Unknown error'
          if (response.dependencies) {
            const depDetails = Object.entries(response.dependencies)
              .filter(([, count]) => (count as number) > 0)
              .map(([type, count]) => `${count} ${type}`)
              .join(', ')
            
            // Offer force delete option
            const forceDelete = confirm(
              `Cannot delete course: ${errorMsg}\n\nDependencies found: ${depDetails}\n\n` +
              `⚠️ FORCE DELETE OPTION ⚠️\n` +
              `Click OK to FORCE DELETE this course and ALL related data (enrollments, attendance, grades, etc.)\n` +
              `⚠️ THIS WILL PERMANENTLY DELETE ALL RELATED RECORDS ⚠️\n\n` +
              `Click Cancel to abort the deletion.`
            )
            
            if (forceDelete) {
              await forceDeleteCourse(courseId)
            }
          } else {
            alert('Failed to delete course: ' + errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        alert('Error deleting course: ' + errorMsg)
      }
    }
  }

  // Force delete course (cascading delete)
  const forceDeleteCourse = async (courseId: string) => {
    try {
      const response = await adminApi.forceDeleteCourse(courseId)
      if (response.status === 'success') {
        setCourses(prev => prev.filter(course => course.id !== courseId))
        alert('Course and all related data deleted successfully')
      } else {
        alert('Failed to force delete course: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error force deleting course: ' + errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading courses...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error loading courses</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <Button onClick={refreshData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-800">Manage courses across all departments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border rounded-md"
            title="Filter by department"
          >
            <option value="all">All Departments</option>
            {allDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md"
            title="Filter by course type"
          >
            <option value="all">All Types</option>
            <option value="core">Core</option>
            <option value="department_elective">Department Elective</option>
            <option value="open_elective">Open Elective</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Core Courses</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.type === 'core').length}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Electives</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.type.includes('elective')).length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses ({filteredCourses.length})</CardTitle>
          <CardDescription className="text-gray-800">
            Showing {filteredCourses.length} of {courses.length} courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 font-medium text-gray-900">Name</th>
                  <th className="text-left p-4 font-medium text-gray-900">Department</th>
                  <th className="text-left p-4 font-medium text-gray-900">Type</th>
                  <th className="text-left p-4 font-medium text-gray-900">Components</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{course.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{course.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-800">
                        <div>{course.department.name}</div>
                        <div className="text-gray-700">{course.department.code}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.type === 'core' ? 'bg-blue-100 text-blue-800' :
                        course.type === 'department_elective' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {course.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-800">
                        {course.hasTheoryComponent && <span className="text-blue-600">Theory</span>}
                        {course.hasTheoryComponent && course.hasLabComponent && <span className="text-gray-600"> + </span>}
                        {course.hasLabComponent && <span className="text-green-600">Lab</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteCourse(course.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Course Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Course</h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Code</label>
                  <Input placeholder="e.g., CS301" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Course Name</label>
                  <Input placeholder="e.g., Data Structures" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select Department</option>
                    {allDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Course Type</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="core">Core</option>
                    <option value="department_elective">Department Elective</option>
                    <option value="open_elective">Open Elective</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Theory Component
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Lab Component
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Course
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
