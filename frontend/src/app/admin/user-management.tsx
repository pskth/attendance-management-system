'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Users,
  GraduationCap,
  Shield,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '@/lib/api'

interface UserManagementProps {
  initialFilters?: {
    course?: string
    department?: string
    section?: string
    year?: string
    role?: string
  }
}

interface User {
  id: string
  name: string
  email?: string
  username: string
  phone?: string
  usn?: string
  employeeId?: string
  role: 'student' | 'teacher' | 'admin'
  roles?: string[]  // Additional roles for multi-role users
  department?: string  // Optional for admins
  departmentCode?: string
  year?: string  // Academic year for students and teachers
  section?: string  // Class section for students
  courses?: string[]  // Enrolled courses for students or teaching courses for teachers
  createdAt: string
  college?: string
  collegeCode?: string
  semester?: number
  batchYear?: number
}

export default function UserManagement({ initialFilters }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>(initialFilters?.year || 'all')
  const [selectedRole, setSelectedRole] = useState<string>(initialFilters?.role || 'all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialFilters?.department || 'all')
  const [selectedSection, setSelectedSection] = useState<string>(initialFilters?.section || 'all')
  const [selectedCourse, setSelectedCourse] = useState<string>(initialFilters?.course || 'all')
  const [selectedCollege, setSelectedCollege] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit functionality state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    role: 'student' as 'student' | 'teacher' | 'admin'
  })

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminApi.getAllUsers()
        
        if (response.status === 'success') {
          console.log('Raw API response:', response.data.slice(0, 2)); // Debug: log first 2 users
          console.log('Total users from API:', response.data.length);
          console.log('User roles distribution:', response.data.map(u => u.userRoles?.map(r => r.role)).flat().reduce((acc, role) => { acc[role] = (acc[role] || 0) + 1; return acc; }, {}));
          console.log('Student departments:', response.data.filter(u => u.student).map(u => u.student.departments?.code).filter(Boolean).reduce((acc, dept) => { acc[dept] = (acc[dept] || 0) + 1; return acc; }, {}));
          console.log('Student sections:', response.data.filter(u => u.student).map(u => u.student.sections?.section_name).filter(Boolean).reduce((acc, section) => { acc[section] = (acc[section] || 0) + 1; return acc; }, {}));
          
          // Transform API data to match our User interface
          const transformedUsers: User[] = response.data.map((user: any) => {
            const roles = user.userRoles?.map((ur: any) => ur.role) || []
            const primaryRole = roles[0] || 'student'
            
            // Helper function to convert semester to academic year
            const getAcademicYear = (semester: number): string => {
              if (semester <= 2) return '1st year'
              if (semester <= 4) return '2nd year'
              if (semester <= 6) return '3rd year'
              if (semester <= 8) return '4th year'
              return `${Math.ceil(semester / 2)}th year`
            }
            
            // Extract data based on role
            const transformedUser: User = {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              phone: user.phone,
              role: primaryRole,
              roles: roles,
              createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }

            // Student-specific data
            if (user.student) {
              transformedUser.usn = user.student.usn
              transformedUser.semester = user.student.semester
              transformedUser.batchYear = user.student.batchYear
              transformedUser.year = getAcademicYear(user.student.semester || 1)
              transformedUser.department = user.student.departments?.name
              transformedUser.departmentCode = user.student.departments?.code
              transformedUser.section = user.student.sections?.section_name
              transformedUser.college = user.student.colleges?.name
              transformedUser.collegeCode = user.student.colleges?.code
              
              // Extract courses from enrollments
              if (user.student.enrollments && user.student.enrollments.length > 0) {
                transformedUser.courses = user.student.enrollments.map((enrollment: any) => 
                  enrollment.offering?.course?.name || enrollment.offering?.course?.code
                ).filter(Boolean)
              }
            }

            // Teacher-specific data
            if (user.teacher) {
              transformedUser.employeeId = user.teacher.id
              transformedUser.department = user.teacher.department?.name
              transformedUser.departmentCode = user.teacher.department?.code
              transformedUser.college = user.teacher.colleges?.name
              transformedUser.collegeCode = user.teacher.colleges?.code
              
              // For teachers, we could also extract courses they teach
              // This would require course offerings data in the API
            }

            return transformedUser
          })
          
          console.log('Transformed users:', transformedUsers.slice(0, 2)); // Debug: log first 2 transformed users
          console.log('All departments:', Array.from(new Set(transformedUsers.map(u => u.department).filter(Boolean))));
          console.log('All years:', Array.from(new Set(transformedUsers.map(u => u.year).filter(Boolean))));
          
          setUsers(transformedUsers)
        } else {
          setError(response.error || 'Failed to fetch users')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Apply filters based on initialFilters
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.role) setSelectedRole(initialFilters.role)
      if (initialFilters.department) setSelectedDepartment(initialFilters.department)
      if (initialFilters.year) setSelectedYear(initialFilters.year)
      if (initialFilters.course) setSelectedCourse(initialFilters.course)
    }
  }, [initialFilters])

  // Compute filtered users directly
  const filteredUsers = users.filter(user => {
    // Year filter - only filter non-admin users
    if (selectedYear !== 'all' && user.role !== 'admin' && user.year !== selectedYear) {
      return false
    }

    // Search filter
    if (searchTerm) {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.usn && user.usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchesSearch) return false
    }

    // Role filter
    if (selectedRole !== 'all' && user.role !== selectedRole) {
      return false
    }

    // Department filter
    if (selectedDepartment !== 'all' && user.department !== selectedDepartment) {
      return false
    }

    // College filter
    if (selectedCollege !== 'all' && user.college !== selectedCollege) {
      return false
    }

    // Section filter - only apply to students
    if (selectedSection !== 'all' && user.role === 'student' && user.section !== selectedSection) {
      return false
    }

    // Course filter - apply to students who have courses
    if (selectedCourse !== 'all') {
      if (user.courses && user.courses.length > 0) {
        if (!user.courses.includes(selectedCourse)) {
          return false
        }
      } else {
        // If user has no courses, don't show them when a course filter is applied
        return false
      }
    }

    return true
  })

  // Get unique values for filter dropdowns from actual data
  const allDepartments = Array.from(new Set(
    users.map(user => user.department).filter(Boolean)
  )).sort()
  
  const allYears = Array.from(new Set(
    users.map(user => user.year).filter(Boolean)
  )).sort()
  
  const allSections = Array.from(new Set(
    users.map(user => user.section).filter(Boolean)
  )).sort()
  
  const allCourses = Array.from(new Set(
    users.flatMap(user => user.courses || [])
  )).sort()

  const allColleges = Array.from(new Set(
    users.map(user => user.college).filter(Boolean)
  )).sort()

  // Handle CSV import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const lines = csv.split('\n')
      
      const newUsers: User[] = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim())
          const user: User = {
            id: Date.now().toString() + i,
            name: values[0] || '',
            email: values[1] || '',
            username: values[1] || '',
            usn: values[2] || undefined,
            employeeId: values[3] || undefined,
            role: (values[4] as 'student' | 'teacher' | 'admin') || 'student',
            department: values[4] === 'admin' ? undefined : (values[5] || ''), // No department for admin
            section: values[4] === 'student' ? (values[6] || undefined) : undefined, // Only section for students
            courses: values[7] ? values[7].split(';').filter(Boolean) : undefined, // Parse courses from semicolon-separated string
            createdAt: new Date().toISOString().split('T')[0]
          }
          newUsers.push(user)
        }
      }
      
      setUsers(prev => [...prev, ...newUsers])
      alert(`Successfully imported ${newUsers.length} users`)
    }
    reader.readAsText(file)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'USN', 'Employee ID', 'Role', 'Department', 'Section', 'Courses']
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email || '',
        user.usn || '',
        user.employeeId || '',
        user.role,
        user.department || '',
        user.section || '',
        user.courses ? user.courses.join(';') : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${selectedYear}_${selectedRole}_${selectedSection}.csv`
    a.click()
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await adminApi.deleteUser(userId)
        if (response.status === 'success') {
          setUsers(prev => prev.filter(user => user.id !== userId))
          alert('User deleted successfully')
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
              `Cannot delete user: ${errorMsg}\n\nDependencies found: ${depDetails}\n\n` +
              `⚠️ FORCE DELETE OPTION ⚠️\n` +
              `Click OK to FORCE DELETE this user and ALL related data (enrollments, attendance, grades, etc.)\n` +
              `⚠️ THIS WILL PERMANENTLY DELETE ALL RELATED RECORDS ⚠️\n\n` +
              `Click Cancel to abort the deletion.`
            )
            
            if (forceDelete) {
              await forceDeleteUser(userId)
            }
          } else {
            alert('Failed to delete user: ' + errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        alert('Error deleting user: ' + errorMsg)
      }
    }
  }

  // Force delete user (cascading delete)
  const forceDeleteUser = async (userId: string) => {
    try {
      const response = await adminApi.forceDeleteUser(userId)
      if (response.status === 'success') {
        setUsers(prev => prev.filter(user => user.id !== userId))
        alert('User and all related data deleted successfully')
      } else {
        alert('Failed to force delete user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error force deleting user: ' + errorMsg)
    }
  }

  // Edit user functionality
  const startEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      email: user.email || '',
      username: user.username,
      phone: user.phone || '',
      role: user.role
    })
    setShowEditForm(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return
    
    try {
      const response = await adminApi.updateUser(editingUser.id, editFormData)
      
      if (response.status === 'success') {
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...editFormData }
            : user
        ))
        setShowEditForm(false)
        setEditingUser(null)
        setEditFormData({ name: '', email: '', username: '', phone: '', role: 'student' })
        alert('User updated successfully')
      } else {
        alert('Failed to update user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error updating user: ' + errorMsg)
    }
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setEditingUser(null)
    setEditFormData({ name: '', email: '', username: '', phone: '', role: 'student' })
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <Users className="w-4 h-4 text-blue-500" />
      case 'teacher': return <GraduationCap className="w-4 h-4 text-green-500" />
      case 'admin': return <Shield className="w-4 h-4 text-purple-500" />
      default: return <Users className="w-4 h-4 text-gray-700" />
    }
  }

  // Get role badge style
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200'
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading Users...
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
              Error Loading Users
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
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription className="text-gray-800">
                Total: {filteredUsers.length} users
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="CSV file upload"
        title="Upload CSV file"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                // Reset section filter when role changes
                if (e.target.value !== 'student') {
                  setSelectedSection('all')
                }
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Administrators</option>
            </select>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by college"
            >
              <option value="all">All Colleges</option>
              {allColleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {allDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by year"
            >
              <option value="all">All Years</option>
              {allYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={`rounded-md border border-gray-300 px-3 py-2 text-sm ${
                selectedRole !== 'student' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Filter by section"
              disabled={selectedRole !== 'student'}
            >
              <option value="all">All Sections</option>
              {allSections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by course"
            >
              <option value="all">All Courses</option>
              {allCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Year/Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-700">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.usn || user.employeeId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'student' ? (
                        <div>
                          <div className="font-medium">{user.year || '-'}</div>
                          <div className="text-xs text-gray-700">Batch: {user.batchYear || '-'}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'student' ? (user.section || '-') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user)
                          setEditFormData({
                            name: user.name,
                            email: user.email || '',
                            username: user.username,
                            phone: user.phone || '',
                            role: user.role as 'student' | 'teacher' | 'admin'
                          })
                          setShowEditForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Form */}
      {showEditForm && editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'student' | 'teacher' | 'admin' })}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm mt-1"
                  aria-label="Edit user role"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await adminApi.updateUser(editingUser.id, editFormData)
                      if (response.status === 'success') {
                        setUsers(prev => prev.map(user => user.id === editingUser.id ? { ...user, ...editFormData } : user))
                        setShowEditForm(false)
                        alert('User updated successfully')
                      } else {
                        alert('Failed to update user: ' + (response.error || 'Unknown error'))
                      }
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                      alert('Error updating user: ' + errorMsg)
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Import Format</CardTitle>
          <CardDescription className="text-gray-800">
            Use the following format for CSV imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg">
            <code className="text-sm">
              <strong>Students CSV Format:</strong><br />
              username,college_code,department_code,section_name,usn,semester,batch_year<br />
              student_nit_cse_a_3rd_1,NIT,CSE,A,&quot;NIT2022CSE001&quot;,6,2022<br />
              student_nit_ise_a_2nd_1,NIT,ISE,A,&quot;NIT2023ISE001&quot;,4,2023<br />
              <br />
              <strong>Teachers CSV Format:</strong><br />
              username,college_code,department_code<br />
              prof_cse_nit,NIT,CSE<br />
              prof_ise_nit,NIT,ISE
            </code>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <p><strong>Student Year System Notes:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Semester</strong>: Current semester (1-8) determines academic year display</li>
              <li><strong>Batch Year</strong>: Year of joining (e.g. 2021, 2022, 2023, 2024)</li>
              <li><strong>Academic Year</strong>: Auto-calculated (sem 1-2 = 1st year, 3-4 = 2nd year, etc.)</li>
              <li>Students are organized by academic year but retain batch year for identification</li>
              <li>USN format should include batch year for proper identification</li>
              <li>Section is only applicable for students (A, B, etc.)</li>
              <li>Courses should be separated by semicolons</li>
              <li>Leave empty fields blank, don&apos;t remove columns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
