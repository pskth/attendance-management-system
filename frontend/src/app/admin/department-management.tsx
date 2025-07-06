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
  Building2,
  Users,
  BookOpen,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '@/lib/api'

interface DepartmentManagementProps {
  onNavigateToUsers?: (filters: {
    department?: string
    section?: string
    year?: string
  }) => void
  onNavigateToCourses?: (filters: {
    department?: string
    year?: string
  }) => void
  initialFilters?: {
    college?: string
  }
}

interface Department {
  id: string
  name: string
  code: string
  college: {
    name: string
    code: string
  }
  courses: any[]
  sections: any[]
  students: any[]
  teachers: any[]
  _count?: {
    students: number
    teachers: number
    courses: number
    sections: number
  }
}

export default function DepartmentManagement({ 
  onNavigateToUsers, 
  onNavigateToCourses, 
  initialFilters 
}: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminApi.getAllDepartments()
        
        if (response.status === 'success') {
          // Transform API data to match our Department interface
          const transformedDepartments: Department[] = response.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            college: {
              name: dept.colleges?.name || '',
              code: dept.colleges?.code || ''
            },
            courses: dept.courses || [],
            sections: dept.sections || [],
            students: dept.students || [],
            teachers: dept.teachers || [],
            _count: dept._count || {
              students: dept.students?.length || 0,
              teachers: dept.teachers?.length || 0,
              courses: dept.courses?.length || 0,
              sections: dept.sections?.length || 0
            }
          }))
          
          setDepartments(transformedDepartments)
        } else {
          setError(response.error || 'Failed to fetch departments')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching departments')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  // Apply filters based on initialFilters
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.college) setSelectedCollege(initialFilters.college)
    }
  }, [initialFilters])

  // Get filtered departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.college.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedCollege !== 'all' && dept.college.code !== selectedCollege) {
      return false
    }

    return true
  })

  // Get unique colleges for filter
  const allColleges = Array.from(new Set(departments.map(dept => dept.college.code).filter(Boolean))).sort()

  // Refresh data
  const refreshData = () => {
    setLoading(true)
    setError(null)
    const fetchDepartments = async () => {
      try {
        const response = await adminApi.getAllDepartments()
        
        if (response.status === 'success') {
          const transformedDepartments: Department[] = response.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            college: {
              name: dept.colleges?.name || '',
              code: dept.colleges?.code || ''
            },
            courses: dept.courses || [],
            sections: dept.sections || [],
            students: dept.students || [],
            teachers: dept.teachers || [],
            _count: dept._count || {
              students: dept.students?.length || 0,
              teachers: dept.teachers?.length || 0,
              courses: dept.courses?.length || 0,
              sections: dept.sections?.length || 0
            }
          }))
          
          setDepartments(transformedDepartments)
        } else {
          setError(response.error || 'Failed to fetch departments')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching departments')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }

  // Delete department
  const deleteDepartment = async (departmentId: string) => {
    if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        const response = await adminApi.deleteDepartment(departmentId)
        if (response.status === 'success') {
          setDepartments(prev => prev.filter(dept => dept.id !== departmentId))
          alert('Department deleted successfully')
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
              `Cannot delete department: ${errorMsg}\n\nDependencies found: ${depDetails}\n\n` +
              `⚠️ FORCE DELETE OPTION ⚠️\n` +
              `Click OK to FORCE DELETE this department and ALL related data (students, teachers, courses, etc.)\n` +
              `⚠️ THIS WILL PERMANENTLY DELETE ALL RELATED RECORDS ⚠️\n\n` +
              `Click Cancel to abort the deletion.`
            )
            
            if (forceDelete) {
              await forceDeleteDepartment(departmentId)
            }
          } else {
            alert('Failed to delete department: ' + errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        alert('Error deleting department: ' + errorMsg)
      }
    }
  }

  // Force delete department (cascading delete)
  const forceDeleteDepartment = async (departmentId: string) => {
    try {
      const response = await adminApi.forceDeleteDepartment(departmentId)
      if (response.status === 'success') {
        setDepartments(prev => prev.filter(dept => dept.id !== departmentId))
        alert('Department and all related data deleted successfully')
      } else {
        alert('Failed to force delete department: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error force deleting department: ' + errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading departments...</span>
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
            <span className="text-red-800 font-medium">Error loading departments</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-800">Manage departments across all colleges</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
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
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="px-3 py-2 border rounded-md"
            title="Filter by college"
          >
            <option value="all">All Colleges</option>
            {allColleges.map(college => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Total Students</p>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum, dept) => sum + (dept._count?.students || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Total Teachers</p>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum, dept) => sum + (dept._count?.teachers || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Total Courses</p>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum, dept) => sum + (dept._count?.courses || 0), 0)}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments ({filteredDepartments.length})</CardTitle>
          <CardDescription className="text-gray-800">
            Showing {filteredDepartments.length} of {departments.length} departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Name</th>
                  <th className="text-left p-4 font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 font-medium text-gray-900">College</th>
                  <th className="text-left p-4 font-medium text-gray-900">Students</th>
                  <th className="text-left p-4 font-medium text-gray-900">Teachers</th>
                  <th className="text-left p-4 font-medium text-gray-900">Courses</th>
                  <th className="text-left p-4 font-medium text-gray-900">Sections</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{dept.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-sm text-gray-800">{dept.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-800">
                        <div>{dept.college.name}</div>
                        <div className="text-gray-700">{dept.college.code}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onNavigateToUsers?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.students || 0}
                      </button>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onNavigateToUsers?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.teachers || 0}
                      </button>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onNavigateToCourses?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.courses || 0}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700">{dept._count?.sections || 0}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteDepartment(dept.id)}>
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

      {/* Add Department Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Department</h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department Name</label>
                  <Input placeholder="e.g., Computer Science and Engineering" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department Code</label>
                  <Input placeholder="e.g., CSE" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">College</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select College</option>
                    {allColleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Department
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
