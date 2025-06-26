'use client'

import { useState, useRef } from 'react'
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
  Shield
} from 'lucide-react'

// No props interface needed for this component

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
  email: string
  usn?: string
  employeeId?: string
  role: 'student' | 'teacher' | 'admin'
  roles?: string[]  // Additional roles for multi-role users
  department?: string  // Optional for admins
  year?: string  // Academic year for students and teachers
  section?: string  // Class section for students
  courses?: string[]  // Enrolled courses for students or teaching courses for teachers
  createdAt: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Aditya Sharma',
    email: 'aditya.sharma@nnm.ac.in',
    usn: 'NNM22CS001',
    role: 'student',
    department: 'CSE',
    year: '2nd Year',
    section: 'A',
    courses: ['CS201', 'CS202', 'MA201', 'PH201'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Bhavana Nair',
    email: 'bhavana.nair@nnm.ac.in',
    usn: 'NNM22AIDS002',
    role: 'student',
    department: 'AIDS',
    year: '2nd Year',
    section: 'A',
    courses: ['CS201', 'AIDS201', 'MA201', 'ST201'],
    createdAt: '2024-01-16'
  },
  {
    id: '3',
    name: 'Chetan Kumar',
    email: 'chetan.kumar@nnm.ac.in',
    usn: 'NNM21CS003',
    role: 'student',
    department: 'CSE',
    year: '3rd Year',
    section: 'B',
    courses: ['CS301', 'CS302', 'CS303', 'CS304'],
    createdAt: '2023-01-15'
  },
  {
    id: '4',
    name: 'Divya Rao',
    email: 'divya.rao@nnm.ac.in',
    usn: 'NNM20ECE004',
    role: 'student',
    department: 'ECE',
    year: '4th Year',
    section: 'A',
    courses: ['EC401', 'EC402', 'EC403', 'EC404'],
    createdAt: '2022-01-15'
  },
  {
    id: '5',
    name: 'Dr. Priya Kumar',
    email: 'priya.kumar@nnm.ac.in',
    employeeId: 'TCH001',
    role: 'teacher',
    department: 'CSE',
    year: '2nd Year', // Teaching year
    courses: ['CS201', 'CS301'], // Teaching courses
    createdAt: '2023-08-10'
  },
  {
    id: '6',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@nnm.ac.in',
    employeeId: 'TCH002',
    role: 'teacher',
    department: 'AIDS',
    year: '3rd Year', // Teaching year
    courses: ['AIDS201', 'AIDS301'],
    createdAt: '2023-08-12'
  },
  {
    id: '7',
    name: 'Dr. Suresh Nair',
    email: 'suresh.nair@nnm.ac.in',
    employeeId: 'TCH003',
    role: 'teacher',
    department: 'ISE',
    year: '4th Year', // Teaching year
    courses: ['IS401', 'IS402'],
    createdAt: '2023-08-15'
  },
  {
    id: '8',
    name: 'Admin User',
    email: 'admin@nnm.ac.in',
    employeeId: 'ADM001',
    role: 'admin',
    // No department, year, section, or courses for admin
    createdAt: '2023-01-01'
  },
  {
    id: '9',
    name: 'Rajesh Nair',
    email: 'rajesh.nair@nnm.ac.in',
    usn: 'NNM22CS009',
    role: 'student',
    department: 'CSE',
    year: '2nd Year',
    section: 'B',
    courses: ['CS201', 'CS202', 'MA201', 'PH201'],
    createdAt: '2024-01-18'
  },
  {
    id: '10',
    name: 'Sneha Patel',
    email: 'sneha.patel@nnm.ac.in',
    usn: 'NNM21AIDS010',
    role: 'student',
    department: 'AIDS',
    year: '3rd Year',
    section: 'A',
    courses: ['AIDS301', 'AIDS302', 'CS301', 'MA301'],
    createdAt: '2023-01-20'
  },
  {
    id: '11',
    name: 'Vikram Joshi',
    email: 'vikram.joshi@nnm.ac.in',
    usn: 'NNM20ISE011',
    role: 'student',
    department: 'ISE',
    year: '4th Year',
    section: 'B',
    courses: ['IS401', 'IS402', 'IS403', 'CS401'],
    createdAt: '2022-01-22'
  },
  {
    id: '12',
    name: 'Prof. Rahul Mehta',
    email: 'rahul.mehta@nnm.ac.in',
    employeeId: 'TCH004',
    role: 'teacher',
    roles: ['teacher', 'admin'],
    department: 'CSE',
    year: '3rd Year',
    courses: ['CS301', 'CS401'],
    createdAt: '2022-08-15'
  },
  {
    id: '13',
    name: 'Dr. Anita Sharma',
    email: 'anita.sharma@nnm.ac.in',
    employeeId: 'TCH005',
    role: 'teacher',
    roles: ['teacher', 'admin'],
    department: 'ECE',
    year: '4th Year',
    courses: ['EC401', 'EC501'],
    createdAt: '2021-07-10'
  },
  {
    id: '14',
    name: 'System Admin',
    email: 'system@nnm.ac.in',
    employeeId: 'SYS001',
    role: 'admin',
    roles: ['admin', 'teacher'],
    department: 'Computer Center',
    createdAt: '2020-01-01'
  }
]

export function UserManagement({ initialFilters }: UserManagementProps = {}) {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>(initialFilters?.year || 'all')
  const [selectedRole, setSelectedRole] = useState<string>(initialFilters?.role || 'all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialFilters?.department || 'all')
  const [selectedSection, setSelectedSection] = useState<string>(initialFilters?.section || 'all')
  const [selectedCourse, setSelectedCourse] = useState<string>(initialFilters?.course || 'all')
  const [showAddForm, setShowAddForm] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [editingUser, setEditingUser] = useState<User | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null)// Compute filtered users directly
  const filteredUsers = users.filter(user => {
    // Year filter - only filter non-admin users
    if (selectedYear !== 'all' && user.role !== 'admin' && user.year !== selectedYear) {
      return false
    }

    // Search filter
    if (searchTerm) {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // Section filter - only apply to students
    if (selectedSection !== 'all' && user.role === 'student' && user.section !== selectedSection) {
      return false
    }

    // Course filter - apply to students and teachers who have courses
    if (selectedCourse !== 'all' && user.courses && !user.courses.includes(selectedCourse)) {
      return false
    }

    return true
  })
  // Get unique courses from all users for the dropdown
  const allCourses = Array.from(new Set(
    users.flatMap(user => user.courses || [])
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
        user.email,
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
  const deleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== userId))
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <Users className="w-4 h-4 text-blue-500" />
      case 'teacher': return <GraduationCap className="w-4 h-4 text-green-500" />
      case 'admin': return <Shield className="w-4 h-4 text-purple-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
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
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="CSV file upload"
        title="Upload CSV file"
      />      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by year"
            >
              <option value="all">All Years</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
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
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by department"
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
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.usn || user.employeeId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role, index) => (
                            <div key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(role)}`}>
                              {getRoleIcon(role)}
                              <span className="ml-1 capitalize">{role}</span>
                            </div>
                          ))
                        ) : (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </div>
                        )}
                      </div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'student' ? (user.section || '-') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.courses && user.courses.length > 0 ? (
                        <div className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {user.courses.slice(0, 3).map((course, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {course}
                              </span>
                            ))}
                            {user.courses.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{user.courses.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
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

      {/* CSV Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Import Format</CardTitle>
          <CardDescription>
            Use the following format for CSV imports
          </CardDescription>
        </CardHeader>        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg">
            <code className="text-sm">
              Name, Email, USN, Employee ID, Role, Department, Section<br />
              John Doe, john.doe@nnm.ac.in, NNM22CS001, , student, CSE, A<br />
              Dr. Jane Smith, jane.smith@nnm.ac.in, , TCH002, teacher, ECE, 
            </code>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Notes:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>USN is required for students, Employee ID for teachers/admins</li>
              <li>Role should be: student, teacher, or admin</li>
              <li>Department codes: CSE, ECE, ME, CE, AIDS, ISE</li>
              <li>Section is only applicable for students (A, B, etc.)</li>
              <li>Leave empty fields blank, don&apos;t remove columns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
