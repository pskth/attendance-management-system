'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  Shield,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Calendar
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { ApiUser, UserRole } from '@/types/admin'
import MarksAttendanceManagement from './marks-attendance'

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

  // Edit functionality state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    // Student/Teacher-specific fields for editing
    departmentId: '',
    collegeId: '',
    year: 1,
    section: '',
    usn: ''
  })

  // Add user functionality state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    password: '',
    // Student/Teacher-specific fields
    departmentId: '',
    collegeId: '',
    year: 1,
    section: '',
    usn: ''
  })

  // Fetch departments and colleges for form dropdowns
  const [departments, setDepartments] = useState<{ id: string, name: string, code: string, college: { name: string, code: string } }[]>([])
  const [colleges, setColleges] = useState<{ id: string, name: string, code: string }[]>([])
  const [sections, setSections] = useState<{ id: string, section_name: string }[]>([])

  // Marks and attendance management state
  const [showMarksAttendance, setShowMarksAttendance] = useState(false)
  const [marksAttendanceUser, setMarksAttendanceUser] = useState<User | null>(null)
  const [marksAttendanceMode, setMarksAttendanceMode] = useState<'marks' | 'attendance'>('marks')

  // Fetch users, departments, and colleges from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch users, departments, and colleges in parallel
        const [usersResponse, departmentsResponse, collegesResponse] = await Promise.all([
          adminApi.getAllUsers(),
          adminApi.getAllDepartments(),
          adminApi.getAllColleges()
        ]);
        if (usersResponse.status === 'success') {
          // ...existing user transformation code...
          const transformedUsers: User[] = usersResponse.data.map((user: ApiUser) => {
            const roles = user.userRoles?.map(ur => ur.role) || [];
            const primaryRole = roles[0] || 'student';
            const getAcademicYear = (semester: number): string => {
              if (semester <= 2) return '1st year';
              if (semester <= 4) return '2nd year';
              if (semester <= 6) return '3rd year';
              if (semester <= 8) return '4th year';
              return `${Math.ceil(semester / 2)}th year`;
            };
            const transformedUser: User = {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              phone: user.phone,
              role: primaryRole,
              roles: roles,
              createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };
            if (user.student) {
              transformedUser.usn = user.student.usn;
              transformedUser.semester = user.student.semester;
              transformedUser.batchYear = user.student.batchYear;
              transformedUser.year = getAcademicYear(user.student.semester || 1);
              transformedUser.department = user.student.departments?.name;
              transformedUser.departmentCode = user.student.departments?.code;
              transformedUser.section = user.student.sections?.section_name;
              transformedUser.college = user.student.colleges?.name;
              transformedUser.collegeCode = user.student.colleges?.code;
              if (user.student.enrollments && user.student.enrollments.length > 0) {
                transformedUser.courses = user.student.enrollments.map(enrollment =>
                  enrollment.course?.course_name || enrollment.course?.course_code || 'Unknown Course'
                ).filter(Boolean).filter(Boolean);
              }
            }
            if (user.teacher) {
              transformedUser.employeeId = user.teacher.id;
              transformedUser.department = user.teacher.department?.name;
              transformedUser.departmentCode = user.teacher.department?.code;
              transformedUser.college = user.teacher.colleges?.name;
              transformedUser.collegeCode = user.teacher.colleges?.code;
            }
            return transformedUser;
          });
          setUsers(transformedUsers);
        } else {
          setError(usersResponse.error || 'Failed to fetch users');
        }
        if (departmentsResponse.status === 'success') {
          setDepartments(departmentsResponse.data.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            college: {
              name: dept.colleges?.name || '',
              code: dept.colleges?.code || ''
            }
          })));
        }
        if (collegesResponse.status === 'success') {
          setColleges(collegesResponse.data.map((college: any) => ({
            id: college.id,
            name: college.name,
            code: college.code
          })));
        }
      } catch (err) {
        console.error('Error loading users:', err);
        if (err instanceof Error) {
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
        }
        setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      console.log('SEARCHING FOR:', searchTerm);
      console.log('SAMPLE USER FOR SEARCH DEBUG:', user.name, user.email, user.usn, user.employeeId);
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.usn && user.usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
      console.log('SEARCH MATCHES:', matchesSearch, 'for user:', user.name);
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

  // Debug: Log filtered users
  console.log('FILTERED USERS COUNT:', filteredUsers.length);
  console.log('TOTAL USERS COUNT:', users.length);

  // Temporary pagination for debugging
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Show 50 users per page for testing
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  console.log('PAGINATED USERS:', paginatedUsers.length, 'Page:', currentPage, 'Total pages:', totalPages);

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

  // Add user functionality
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addFormData.name || !addFormData.username || !addFormData.role) {
      alert('Please fill in all required fields')
      return
    }

    // Validate required fields for students
    if (addFormData.role === 'student') {
      if (!addFormData.email) {
        alert('Email is required for students')
        return
      }
      if (!addFormData.collegeId) {
        alert('College is required for students')
        return
      }
      if (!addFormData.departmentId) {
        alert('Department is required for students')
        return
      }
      if (!addFormData.section) {
        alert('Section is required for students')
        return
      }
      if (!addFormData.usn) {
        alert('USN is required for students')
        return
      }
    }

    try {
      const response = await adminApi.createUser(addFormData)

      if (response.status === 'success') {
        // Transform the new user data to match our interface
        const roles = (response.data.userRoles || []).map((ur: UserRole) => ur.role)
        const primaryRole = roles[0] || 'student'

        const transformedUser: User = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          username: response.data.username,
          phone: response.data.phone,
          role: primaryRole,
          roles: roles,
          createdAt: response.data.createdAt ? new Date(response.data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }

        // Add role-specific data
        if (response.data.student) {
          transformedUser.usn = response.data.student.usn
          transformedUser.semester = response.data.student.semester
          transformedUser.batchYear = response.data.student.batchYear
          transformedUser.college = response.data.student.colleges?.name
          transformedUser.collegeCode = response.data.student.colleges?.code
          transformedUser.department = response.data.student.departments?.name
          transformedUser.departmentCode = response.data.student.departments?.code
          transformedUser.section = response.data.student.sections?.section_name
        }

        if (response.data.teacher) {
          transformedUser.college = response.data.teacher.colleges?.name
          transformedUser.collegeCode = response.data.teacher.colleges?.code
          transformedUser.department = response.data.teacher.department?.name
          transformedUser.departmentCode = response.data.teacher.department?.code
        }

        setUsers(prev => [transformedUser, ...prev])
        setShowAddForm(false)
        setAddFormData({
          name: '',
          email: '',
          username: '',
          phone: '',
          role: 'student',
          password: '',
          departmentId: '',
          collegeId: '',
          year: 1,
          section: '',
          usn: ''
        })
        alert('User created successfully')
      } else {
        alert('Failed to create user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error creating user: ' + errorMsg)
    }
  }

  const cancelAdd = () => {
    setShowAddForm(false)
    setAddFormData({
      name: '',
      email: '',
      username: '',
      phone: '',
      role: 'student',
      password: '',
      departmentId: '',
      collegeId: '',
      year: 1,
      section: '',
      usn: ''
    })
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
                Total: {filteredUsers.length} users (Page {currentPage} of {totalPages} - Showing {paginatedUsers.length} users)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

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
              className={`rounded-md border border-gray-300 px-3 py-2 text-sm ${selectedRole !== 'student' ? 'opacity-50 cursor-not-allowed' : ''
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
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ID/USN
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                      {user.role === 'student' ? (user.usn || user.username) :
                        user.role === 'teacher' ? user.username :
                          (user.employeeId || user.username)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-sm text-gray-900">
                      <div className="truncate" title={user.department || '-'}>
                        {user.department || '-'}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                      {user.role === 'student' ? (
                        <div>
                          <div className="font-medium">{user.year || '-'}</div>
                          <div className="text-xs text-gray-500">Batch: {user.batchYear || '-'}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                      {user.role === 'student' ? (user.section || '-') : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex justify-center space-x-1">
                        {/* Edit Button */}
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
                              role: user.role as 'student' | 'teacher' | 'admin',
                              // Populate departmentId for both students and teachers
                              departmentId: (user.role === 'student' || user.role === 'teacher') && user.department ?
                                departments.find(d => d.name === user.department)?.id || '' : '',
                              collegeId: (user.role === 'student' || user.role === 'teacher') && user.college ?
                                colleges.find(c => c.name === user.college)?.id || '' : '',
                              year: user.year ? parseInt(user.year.replace(/\D/g, '')) || 1 : 1,
                              section: user.section || '',
                              usn: user.usn || ''
                            })
                            setShowEditForm(true)
                          }}
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Student-specific buttons */}
                        {user.role === 'student' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMarksAttendanceUser(user)
                                setMarksAttendanceMode('marks')
                                setShowMarksAttendance(true)
                              }}
                              title="View/Edit Marks"
                              className="bg-blue-50 hover:bg-blue-100"
                            >
                              <BookOpen className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMarksAttendanceUser(user)
                                setMarksAttendanceMode('attendance')
                                setShowMarksAttendance(true)
                              }}
                              title="View/Edit Attendance"
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {/* Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Form Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Username</label>
                  <Input
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'student' | 'teacher' | 'admin' })}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                    title="Edit user role"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>


                {/* Student-specific fields for editing */}
                {editFormData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">USN</label>
                      <Input
                        value={editFormData.usn}
                        onChange={(e) => setEditFormData({ ...editFormData, usn: e.target.value })}
                        className="text-gray-900"
                        placeholder="University Seat Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                      <select
                        value={editFormData.collegeId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, collegeId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="College"
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Department</label>
                      <select
                        value={editFormData.departmentId}
                        onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Department"
                        disabled={!editFormData.collegeId}
                      >
                        <option value="">Select Department</option>
                        {departments
                          .filter(dept => {
                            if (!editFormData.collegeId) return false;
                            const selectedCollege = colleges.find(c => c.id === editFormData.collegeId);
                            return selectedCollege && dept.college.code === selectedCollege.code;
                          })
                          .map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                      </select>
                      {!editFormData.collegeId && (
                        <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Year</label>
                      <select
                        value={editFormData.year}
                        onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Academic Year"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Section</label>
                      <Input
                        value={editFormData.section}
                        onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                        className="text-gray-900"
                        placeholder="e.g., A, B, C"
                      />
                    </div>
                  </>
                )}

                {/* Teacher-specific fields for editing */}
                {editFormData.role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                      <select
                        value={editFormData.collegeId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, collegeId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="College"
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Department</label>
                      <select
                        value={editFormData.departmentId}
                        onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Department"
                        disabled={!editFormData.collegeId}
                      >
                        <option value="">Select Department</option>
                        {departments
                          .filter(dept => {
                            if (!editFormData.collegeId) return false;
                            const selectedCollege = colleges.find(c => c.id === editFormData.collegeId);
                            return selectedCollege && dept.college.code === selectedCollege.code;
                          })
                          .map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                      </select>
                      {!editFormData.collegeId && (
                        <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Always send departmentId and collegeId for student or teacher
                        const payload: any = { ...editFormData };
                        if (editFormData.role === 'student' || editFormData.role === 'teacher') {
                          payload.departmentId = editFormData.departmentId ? String(editFormData.departmentId) : '';
                          payload.collegeId = editFormData.collegeId ? String(editFormData.collegeId) : '';
                        } else {
                          // Only remove departmentId/collegeId for admin
                          delete payload.departmentId;
                          delete payload.collegeId;
                        }
                        const response = await adminApi.updateUser(editingUser.id, payload);
                        if (response.status === 'success') {
                          // Refresh the entire user list to get updated data
                          const usersResponse = await adminApi.getAllUsers();
                          if (usersResponse.status === 'success') {
                            const transformedUsers: User[] = usersResponse.data.map((user: ApiUser) => {
                              const roles = (user.userRoles || []).map((ur: UserRole) => ur.role);
                              const primaryRole = roles[0] || 'student';
                              const transformedUser: User = {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                username: user.username,
                                phone: user.phone,
                                role: primaryRole,
                                roles: roles,
                                createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                              };
                              // Student-specific data
                              if (user.student) {
                                transformedUser.usn = user.student.usn;
                                transformedUser.semester = user.student.semester;
                                transformedUser.batchYear = user.student.batchYear;
                                const getAcademicYear = (semester: number): string => {
                                  if (semester <= 2) return '1st year';
                                  if (semester <= 4) return '2nd year';
                                  if (semester <= 6) return '3rd year';
                                  if (semester <= 8) return '4th year';
                                  return `${Math.ceil(semester / 2)}th year`;
                                };
                                transformedUser.year = getAcademicYear(user.student.semester || 1);
                                transformedUser.department = user.student.departments?.name;
                                transformedUser.departmentCode = user.student.departments?.code;
                                transformedUser.section = user.student.sections?.section_name;
                                transformedUser.college = user.student.colleges?.name;
                                transformedUser.collegeCode = user.student.colleges?.code;
                                // Extract courses from enrollments
                                if (user.student.enrollments && user.student.enrollments.length > 0) {
                                  transformedUser.courses = user.student.enrollments.map(enrollment =>
                                    enrollment.course?.course_name || enrollment.course?.course_code || 'Unknown Course'
                                  ).filter(Boolean);
                                }
                              }
                              // Teacher-specific data
                              if (user.teacher) {
                                transformedUser.employeeId = user.teacher.id;
                                transformedUser.department = user.teacher.department?.name;
                                transformedUser.departmentCode = user.teacher.department?.code;
                                transformedUser.college = user.teacher.colleges?.name;
                                transformedUser.collegeCode = user.teacher.colleges?.code;
                              }
                              return transformedUser;
                            });
                            setUsers(transformedUsers);
                            setShowEditForm(false);
                          }
                        } else {
                          setError(response.error || 'Failed to update user');
                        }
                      } catch {
                        setError('Failed to update user');
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Name *</label>
                  <Input
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Username *</label>
                  <Input
                    value={addFormData.username}
                    onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                  <Input
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Role *</label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as 'student' | 'teacher' | 'admin' })}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                    title="User role"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Password</label>
                  <Input
                    type="password"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="text-gray-900"
                    placeholder="Leave empty for default password"
                  />
                </div>

                {/* Student-specific fields */}
                {addFormData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        College <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={addFormData.collegeId || ''}
                        onChange={(e) => setAddFormData({ ...addFormData, collegeId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="College"
                        required
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={addFormData.departmentId}
                        onChange={(e) => setAddFormData({ ...addFormData, departmentId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Department"
                        disabled={!addFormData.collegeId}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments
                          .filter(dept => {
                            if (!addFormData.collegeId) return false;
                            const selectedCollege = colleges.find(c => c.id === addFormData.collegeId);
                            return selectedCollege && dept.college.code === selectedCollege.code;
                          })
                          .map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                      </select>
                      {!addFormData.collegeId && (
                        <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={addFormData.year}
                        onChange={(e) => setAddFormData({ ...addFormData, year: parseInt(e.target.value) })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Academic Year"
                        required
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Section <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={addFormData.section}
                        onChange={(e) => setAddFormData({ ...addFormData, section: e.target.value })}
                        className="text-gray-900"
                        placeholder="e.g., A, B, C"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        USN <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={addFormData.usn}
                        onChange={(e) => setAddFormData({ ...addFormData, usn: e.target.value })}
                        className="text-gray-900"
                        placeholder="e.g., 1NH21CS001"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Teacher-specific fields */}
                {addFormData.role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                      <select
                        value={addFormData.collegeId || ''}
                        onChange={(e) => setAddFormData({ ...addFormData, collegeId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="College"
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Department</label>
                      <select
                        value={addFormData.departmentId}
                        onChange={(e) => setAddFormData({ ...addFormData, departmentId: e.target.value })}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full text-gray-900"
                        title="Department"
                        disabled={!addFormData.collegeId}
                      >
                        <option value="">Select Department</option>
                        {departments
                          .filter(dept => {
                            if (!addFormData.collegeId) return false;
                            const selectedCollege = colleges.find(c => c.id === addFormData.collegeId);
                            return selectedCollege && dept.college.code === selectedCollege.code;
                          })
                          .map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                      </select>
                      {!addFormData.collegeId && (
                        <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelAdd}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Marks and Attendance Management Modal */}
      {showMarksAttendance && marksAttendanceUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {marksAttendanceMode === 'marks' ? 'Marks Management' : 'Attendance Management'} - {marksAttendanceUser.name}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMarksAttendance(false)
                    setMarksAttendanceUser(null)
                  }}
                >
                  Close
                </Button>
              </div>

              <MarksAttendanceManagement
                selectedStudentId={marksAttendanceUser.usn || marksAttendanceUser.username}
                selectedStudentName={marksAttendanceUser.name}
                initialMode={marksAttendanceMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
