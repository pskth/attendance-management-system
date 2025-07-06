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
  Building,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '@/lib/api'

interface CollegeManagementProps {
  onNavigateToUsers?: (filters: {
    college?: string
    department?: string
  }) => void
  onNavigateToDepartments?: (filters: {
    college?: string
  }) => void
}

interface College {
  id: string
  name: string
  code: string
  departments?: any[]
  students?: any[]
  teachers?: any[]
  stats?: {
    totalStudents: number
    totalTeachers: number
    totalDepartments: number
    totalCourses: number
  }
}

export default function CollegeManagement({ 
  onNavigateToUsers, 
  onNavigateToDepartments 
}: CollegeManagementProps) {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCollege, setNewCollege] = useState({ name: '', code: '' })
  
  // Edit functionality state
  const [editingCollege, setEditingCollege] = useState<College | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: '', code: '' })

  // Fetch colleges from API
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await adminApi.getAllColleges()
        
        if (response.status === 'success') {
          console.log('Raw college API response:', response.data.slice(0, 2)); // Debug: log first 2 colleges
          console.log('Total colleges from API:', response.data.length);
          
          // Transform API data to match our College interface
          const transformedColleges: College[] = response.data.map((college: any) => ({
            id: college.id,
            name: college.name,
            code: college.code,
            departments: college.departments || [],
            stats: college.stats || {
              totalStudents: 0,
              totalTeachers: 0,
              totalDepartments: 0,
              totalCourses: 0
            }
          }))
          
          setColleges(transformedColleges)
        } else {
          setError(response.error || 'Failed to fetch colleges')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching colleges')
      } finally {
        setLoading(false)
      }
    }

    fetchColleges()
  }, [])

  // Filter colleges based on search term
  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add new college
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newCollege.name.trim() && newCollege.code.trim()) {
      try {
        const response = await adminApi.createCollege(newCollege)
        
        if (response.status === 'success') {
          const college: College = {
            id: response.data.id,
            name: response.data.name,
            code: response.data.code,
            stats: {
              totalStudents: 0,
              totalTeachers: 0,
              totalDepartments: 0,
              totalCourses: 0
            }
          }
          setColleges(prev => [...prev, college])
          setNewCollege({ name: '', code: '' })
          setShowAddForm(false)
          alert('College created successfully')
        } else {
          alert('Failed to create college: ' + (response.error || 'Unknown error'))
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        alert('Error creating college: ' + errorMsg)
      }
    }
  }

  // Edit college
  const handleEditCollege = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCollege) return
    
    try {
      const response = await adminApi.updateCollege(editingCollege.id, editFormData)
      
      if (response.status === 'success') {
        setColleges(prev => prev.map(college => 
          college.id === editingCollege.id 
            ? { ...college, name: editFormData.name, code: editFormData.code }
            : college
        ))
        setShowEditForm(false)
        setEditingCollege(null)
        setEditFormData({ name: '', code: '' })
        alert('College updated successfully')
      } else {
        alert('Failed to update college: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error updating college: ' + errorMsg)
    }
  }

  // Delete college
  const deleteCollege = async (collegeId: string) => {
    if (confirm('Are you sure you want to delete this college? This action cannot be undone and will affect all associated data.')) {
      try {
        const response = await adminApi.deleteCollege(collegeId)
        
        if (response.status === 'success') {
          setColleges(prev => prev.filter(college => college.id !== collegeId))
          alert('College deleted successfully')
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
              `Cannot delete college: ${errorMsg}\n\nDependencies found: ${depDetails}\n\n` +
              `⚠️ FORCE DELETE OPTION ⚠️\n` +
              `Click OK to FORCE DELETE this college and ALL related data (departments, students, teachers, courses, etc.)\n` +
              `⚠️ THIS WILL PERMANENTLY DELETE ALL RELATED RECORDS ⚠️\n\n` +
              `Click Cancel to abort the deletion.`
            )
            
            if (forceDelete) {
              await forceDeleteCollege(collegeId)
            }
          } else {
            alert('Failed to delete college: ' + errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        alert('Error deleting college: ' + errorMsg)
      }
    }
  }

  // Force delete college (cascading delete)
  const forceDeleteCollege = async (collegeId: string) => {
    try {
      const response = await adminApi.forceDeleteCollege(collegeId)
      
      if (response.status === 'success') {
        setColleges(prev => prev.filter(college => college.id !== collegeId))
        alert('College and all related data deleted successfully')
      } else {
        alert('Failed to force delete college: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error force deleting college: ' + errorMsg)
    }
  }

  // Edit college functionality
  const startEditCollege = (college: College) => {
    setEditingCollege(college)
    setEditFormData({ name: college.name, code: college.code })
    setShowEditForm(true)
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setEditingCollege(null)
    setEditFormData({ name: '', code: '' })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading Colleges...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error Loading Colleges
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                College Management
              </CardTitle>
              <CardDescription className="text-gray-800">
                Manage colleges and their institutional data
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add College
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add College Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New College</CardTitle>
            <CardDescription className="text-gray-800">
              Enter the college information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="collegeName" className="block text-sm font-medium mb-1">
                    College Name
                  </label>
                  <Input
                    id="collegeName"
                    placeholder="e.g., National Institute of Technology"
                    value={newCollege.name}
                    onChange={(e) => setNewCollege(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="collegeCode" className="block text-sm font-medium mb-1">
                    College Code
                  </label>
                  <Input
                    id="collegeCode"
                    placeholder="e.g., NIT"
                    value={newCollege.code}
                    onChange={(e) => setNewCollege(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  Add College
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false)
                    setNewCollege({ name: '', code: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit College Form */}
      {showEditForm && editingCollege && (
        <Card>
          <CardHeader>
            <CardTitle>Edit College</CardTitle>
            <CardDescription className="text-gray-800">
              Update the college information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditCollege} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editCollegeName" className="block text-sm font-medium mb-1">
                    College Name
                  </label>
                  <Input
                    id="editCollegeName"
                    placeholder="e.g., National Institute of Technology"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editCollegeCode" className="block text-sm font-medium mb-1">
                    College Code
                  </label>
                  <Input
                    id="editCollegeCode"
                    placeholder="e.g., NIT"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  Update College
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Colleges Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredColleges.map((college) => (
          <Card key={college.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{college.name}</CardTitle>
                  <CardDescription className="text-gray-800">Code: {college.code}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingCollege(college)
                      setEditFormData({ name: college.name, code: college.code })
                      setShowEditForm(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => deleteCollege(college.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stats */}
                {college.stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {college.stats.totalStudents}
                      </div>
                      <div className="text-sm text-blue-600">Students</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {college.stats.totalTeachers}
                      </div>
                      <div className="text-sm text-green-600">Teachers</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {college.stats.totalDepartments}
                      </div>
                      <div className="text-sm text-purple-600">Departments</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {college.stats.totalCourses}
                      </div>
                      <div className="text-sm text-orange-600">Courses</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onNavigateToDepartments?.({ college: college.code })}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    View Departments
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onNavigateToUsers?.({ college: college.code })}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Users
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredColleges.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No colleges found</h3>
              <p className="text-gray-700 mb-4">
                {searchTerm 
                  ? `No colleges match "${searchTerm}"`
                  : 'Get started by adding your first college'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add College
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
