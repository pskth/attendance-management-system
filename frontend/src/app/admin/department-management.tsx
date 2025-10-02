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
  const [colleges, setColleges] = useState<{code: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    college: ''
  })
  
  // Edit functionality state
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    college: ''
  })
  
  // Section management state (department-specific)
  const [sections, setSections] = useState<{[key: string]: string[]}>({
    '1': [],
    '2': [],
    '3': [],
    '4': []
  })
  const [newSectionNames, setNewSectionNames] = useState<{[key: string]: string}>({
    '1': '',
    '2': '',
    '3': '',
    '4': ''
  })

  // Helper function to get ordinal numbers
  const getOrdinal = (num: string) => {
    const n = parseInt(num)
    const suffix = ['th', 'st', 'nd', 'rd'][n] || 'th'
    return suffix
  }

  // Fetch departments and colleges from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch both departments and colleges
        const [departmentsResponse, collegesResponse] = await Promise.all([
          adminApi.getAllDepartments(),
          adminApi.getAllColleges()
        ])
        
        if (departmentsResponse.status === 'success') {
          // Transform API data to match our Department interface
          const transformedDepartments: Department[] = departmentsResponse.data.map((dept: unknown) => ({
            id: (dept as any).id,
            name: (dept as any).name,
            code: (dept as any).code,
            college: {
              name: (dept as any).colleges?.name || '',
              code: (dept as any).colleges?.code || ''
            },
            courses: (dept as any).courses || [],
            sections: (dept as any).sections || [],
            students: (dept as any).students || [],
            teachers: (dept as any).teachers || [],
            _count: (dept as any)._count || {
              students: (dept as any).students?.length || 0,
              teachers: (dept as any).teachers?.length || 0,
              courses: (dept as any).courses?.length || 0,
              sections: (dept as any).sections?.length || 0
            }
          }))
          
          setDepartments(transformedDepartments)
        } else {
          setError(departmentsResponse.error || 'Failed to fetch departments')
        }

        if (collegesResponse.status === 'success') {
          // Set colleges for the dropdown
          const collegeList = collegesResponse.data.map((college: any) => ({
            code: college.code,
            name: college.name
          }))
          setColleges(collegeList)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }    }
    fetchData()
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

  // Add new department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newDepartment.name.trim() && newDepartment.code.trim() && newDepartment.college) {
      try {
        const response = await adminApi.createDepartment({
          name: newDepartment.name.trim(),
          code: newDepartment.code.trim(),
          college: newDepartment.college
        })
        
        if (response.status === 'success') {
          // Add the new department to the list
          const newDept: Department = {
            id: response.data.id,
            name: response.data.name,
            code: response.data.code,
            college: {
              name: response.data.college?.name || '',
              code: response.data.college?.code || newDepartment.college
            },
            courses: [],
            sections: [],
            students: [],
            teachers: [],
            _count: {
              students: 0,
              teachers: 0,
              courses: 0,
              sections: 0
            }
          }
          
          setDepartments(prev => [...prev, newDept])
          setNewDepartment({ name: '', code: '', college: '' })
          setShowAddForm(false)
          alert('Department created successfully')
        } else {
          alert('Failed to create department: ' + (response.error || 'Unknown error'))
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        alert('Error creating department: ' + errorMsg)
      }
    } else {
      alert('Please fill in all required fields')
    }
  }

  // Open edit form
  const openEditForm = (department: Department) => {
    setEditingDepartment(department)
    setEditFormData({
      name: department.name,
      code: department.code,
      college: department.college.code
    })
    
    // Load existing sections grouped by year
    const sectionsByYear: {[key: string]: string[]} = {
      '1': [],
      '2': [],
      '3': [],
      '4': []
    }
    
    // Group sections by year (extract year from section name if possible)
    department.sections.forEach((section: { section_name?: string; name?: string }) => {
      const sectionName = section.section_name || section.name
      if (sectionName) {
        const yearMatch = sectionName.match(/^(\d)/)
        const year = yearMatch ? yearMatch[1] : '1'
        const sectionWithoutYear = sectionName.replace(/^(\d)/, '')
        if (sectionsByYear[year] && sectionWithoutYear) {
          sectionsByYear[year].push(sectionWithoutYear)
        }
      }
    })
    
    setSections(sectionsByYear)
    setNewSectionNames({ '1': '', '2': '', '3': '', '4': '' })
    setShowEditForm(true)
  }

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment) return

    try {
      // Flatten sections into a single array for the backend
      // Include year information in the section name
      const allSections = Object.entries(sections).flatMap(([year, sectionList]) => 
        sectionList.map(sectionName => ({
          name: `${year}${sectionName}`
        }))
      )

      const response = await adminApi.updateDepartment(editingDepartment.id, {
        name: editFormData.name,
        code: editFormData.code,
        college: editFormData.college,
        sections: allSections
      })
      
      if (response.status === 'success') {
        setDepartments(prev => prev.map(dept => 
          dept.id === editingDepartment.id 
            ? { ...dept, name: editFormData.name, code: editFormData.code, college: { ...dept.college, code: editFormData.college } }
            : dept
        ))
        alert('Department and sections updated successfully')
        setShowEditForm(false)
        setEditingDepartment(null)
        refreshData() // Refresh to get updated data from server
      } else {
        alert('Failed to update department: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error updating department: ' + errorMsg)
    }
  }

  // Add section to specific year
  const addSectionToYear = (year: string) => {
    const sectionName = newSectionNames[year]
    if (sectionName && sectionName.trim()) {
      setSections(prev => ({
        ...prev,
        [year]: [...(prev[year] || []), sectionName.trim()]
      }))
      setNewSectionNames(prev => ({
        ...prev,
        [year]: ''
      }))
    }
  }

  // Remove section from specific year
  const removeSectionFromYear = (year: string, sectionIndex: number) => {
    setSections(prev => ({
      ...prev,
      [year]: prev[year].filter((_, index) => index !== sectionIndex)
    }))
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
            className="px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Filter by college"
          >
            <option value="all">All Colleges</option>
            {colleges.map(college => (
              <option key={college.code} value={college.code}>
                {college.name} ({college.code})
              </option>
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
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">College</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Students</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Teachers</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Courses</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sections</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-medium text-gray-900">{dept.name}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-mono text-sm text-gray-800">{dept.code}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        <div>{dept.college.name}</div>
                        <div className="text-gray-700">{dept.college.code}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button 
                        onClick={() => onNavigateToUsers?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.students || 0}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button 
                        onClick={() => onNavigateToUsers?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.teachers || 0}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button 
                        onClick={() => onNavigateToCourses?.({ department: dept.code })}
                        className="text-blue-600 hover:underline"
                      >
                        {dept._count?.courses || 0}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        {(() => {
                          // Get all section names
                          const sectionNames = dept.sections
                            .map((section: { section_name?: string; name?: string }) => 
                              section.section_name || section.name
                            )
                            .filter((name): name is string => !!name)
                            .sort()
                          
                          return sectionNames.length > 0 ? sectionNames.join(', ') : 'No sections'
                        })()}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEditForm(dept)}>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Department</h2>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department Name</label>
                  <Input 
                    placeholder="e.g., Computer Science and Engineering"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department Code</label>
                  <Input 
                    placeholder="e.g., CSE"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select College"
                    value={newDepartment.college}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, college: e.target.value }))}
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.code} value={college.code}>
                        {college.name} ({college.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Department
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false)
                    setNewDepartment({ name: '', code: '', college: '' })
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Form Modal */}
      {showEditForm && editingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Department</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department Name</label>
                  <Input
                    placeholder="e.g., Computer Science and Engineering"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department Code</label>
                  <Input
                    placeholder="e.g., CSE"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.college}
                    onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                    title="Select College"
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.code} value={college.code}>
                        {college.name} ({college.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Section Management */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Section Management</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Add or remove sections for each year. Changes will be saved when you update the department.
                  </p>
                  <div className="space-y-4">
                    {['1', '2', '3', '4'].map(year => (
                      <div key={year} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Year {year}</h4>
                          <span className="text-sm text-gray-600">{sections[year]?.length || 0} sections</span>
                        </div>
                        
                        {/* Existing sections */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {sections[year]?.map((section, index) => (
                            <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              <span>{section}</span>
                              <button
                                type="button"
                                onClick={() => removeSectionFromYear(year, index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add new section */}
                        <div className="flex gap-2">
                          <Input
                            placeholder={`e.g., ${year}A, ${year}B, ${year}C`}
                            value={newSectionNames[year] || ''}
                            onChange={(e) => setNewSectionNames(prev => ({ ...prev, [year]: e.target.value }))}
                            className="flex-1 text-gray-900"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addSectionToYear(year)
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addSectionToYear(year)}
                            disabled={!newSectionNames[year]?.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Update Department
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowEditForm(false)
                    setEditingDepartment(null)
                    setSections({ '1': [], '2': [], '3': [], '4': [] })
                    setNewSectionNames({ '1': '', '2': '', '3': '', '4': '' })
                  }}>
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
