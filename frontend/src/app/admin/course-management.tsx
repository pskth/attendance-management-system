'use client'

import { useState, useEffect, useCallback } from 'react'
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
  AlertCircle,
  MessageSquarePlusIcon,
  UserPlus,
  UserCheck

} from 'lucide-react'
import { adminApi } from '@/lib/api'
import Cookies from '@/lib/cookies'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
  year?: number // Add year field that comes from backend
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
  offerings?: {
    id: string
    semester: number
    section?: string
    academicYear: string
    teacher?: {
      id: string
      name: string
    }
    hasTeacher: boolean
  }[]
  teacher?: {
    id: string
    name: string
  }
  teacherAssigned?: boolean
  openElectiveRestrictions?: {
    restrictedDepartment: {
      id: string
      code: string
      name: string
    }
  }[]
}

// Helper function to extract year from course - now uses backend year data
const getCourseYear = (course: Course): string => {
  // First, try to use the year from backend
  if (course.year) {
    switch (course.year) {
      case 1: return '1st'
      case 2: return '2nd'
      case 3: return '3rd'
      case 4: return '4th'
      default: return '1st'
    }
  }

  // Fallback to extracting from course code if no year field
  const yearMatch = course.code.match(/[A-Z]{2,4}([1-4])[0-9]{2,3}/)
  if (yearMatch) {
    const yearNum = parseInt(yearMatch[1])
    switch (yearNum) {
      case 1: return '1st'
      case 2: return '2nd'
      case 3: return '3rd'
      case 4: return '4th'
      default: return '1st'
    }
  }

  // Default to 1st if no pattern matches
  return '1st'
}

export default function CourseManagement({ onNavigateToUsers, initialFilters }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string; college_id: string; college_name?: string }[]>([])
  const [colleges, setColleges] = useState<{ id: string; code: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    college: '',
    department: '',
    year: '1', // Add year field with default value
    type: 'core' as 'core' | 'department_elective' | 'open_elective',
    hasTheoryComponent: true,
    hasLabComponent: false,
    restrictedDepartments: [] as string[] // Add restricted departments for open electives
  })

  // Edit functionality state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    department: '',
    year: '1',
    type: 'core' as 'core' | 'department_elective' | 'open_elective',
    hasTheoryComponent: true,
    hasLabComponent: false,
    restrictedDepartments: [] as string[]
  })

  // Enrollment management state
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [enrollmentSemester, setEnrollmentSemester] = useState('5') // Default to 5th semester (Year 3)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedSection, setSelectedSection] = useState('')
  const [sections, setSections] = useState<any[]>([])
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)

  // Teacher Assignment Modal state
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherModalCourse, setTeacherModalCourse] = useState<Course | null>(null)
  const [teacherModalTeacher, setTeacherModalTeacher] = useState('')
  const [teacherModalSection, setTeacherModalSection] = useState('')
  const [teacherModalSemester, setTeacherModalSemester] = useState('5')
  const [teacherModalLoading, setTeacherModalLoading] = useState(false)
  const [teacherModalSections, setTeacherModalSections] = useState<any[]>([])
  const [teacherModalDataLoading, setTeacherModalDataLoading] = useState(false)

  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvUploadLoading, setCsvUploadLoading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [showManualSelection, setShowManualSelection] = useState(true)

  // Handle enrollment filter changes
  const handleEnrollmentFilterChange = useCallback(async () => {
    if (selectedCourse) {
      setEnrollmentLoading(true)
      await fetchEligibleStudents(selectedCourse.id, enrollmentSemester)
      setEnrollmentLoading(false)
      setSelectedStudents([]) // Clear selections when filters change
    }
  }, [selectedCourse, enrollmentSemester])

  useEffect(() => {
    if (selectedCourse && showEnrollmentModal) {
      handleEnrollmentFilterChange()
    }
  }, [handleEnrollmentFilterChange, selectedCourse, showEnrollmentModal])

  // Fetch courses from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch courses, departments, and colleges using the new course management endpoint
        const [coursesResponse, departmentsResponse, collegesResponse] = await Promise.all([
          adminApi.getCourseManagement(),
          adminApi.getAllDepartments(),
          adminApi.getAllColleges()
        ])
        console.log(coursesResponse)
        console.log('Colleges response:', collegesResponse)
        if (coursesResponse.status === 'success') {
          // Transform API data to match our Course interface
          const transformedCourses: Course[] = coursesResponse.data.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            year: course.year || 1, // Include year from backend
            department: {
              id: course.department?.id || '',
              name: course.department?.name || '',
              code: course.department?.code || '',
              college: {
                name: course.college?.name || '',
                code: course.college?.code || ''
              }
            },
            type: course.type || 'core',
            hasTheoryComponent: course.hasTheoryComponent || true,
            hasLabComponent: course.hasLabComponent || false,
            offerings: course.offerings || [],
            teacher: course.teacher || undefined,
            teacherAssigned: course.teacherAssigned || false,
            openElectiveRestrictions: course.openElectiveRestrictions || []
          }))

          setCourses(transformedCourses)
        } else {
          setError(coursesResponse.error || 'Failed to fetch courses')
        }

        if (departmentsResponse.status === 'success') {
          setDepartments(departmentsResponse.data.map((dept: any) => ({
            id: dept.id,
            code: dept.code,
            name: dept.name,
            college_id: dept.college_id
          })))
        }

        if (collegesResponse.status === 'success') {
          setColleges(collegesResponse.data.map((college: any) => ({
            id: college.id,
            code: college.code,
            name: college.name
          })))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

    if (selectedYear !== 'all') {
      // Use the same logic as getCourseYear to extract year consistently
      const courseYear = getCourseYear(course)
      const expectedYear = selectedYear === '1' ? '1st' :
        selectedYear === '2' ? '2nd' :
          selectedYear === '3' ? '3rd' :
            selectedYear === '4' ? '4th' :
              '1st' // default fallback

      if (courseYear !== expectedYear) {
        return false
      }
    }

    return true
  })

  // Get unique departments for filter
  const allDepartments = Array.from(new Set(courses.map(course => course.department.code).filter(Boolean))).sort()

  // Get unique years for filter (extract using getCourseYear function)
  const allYears = Array.from(new Set(
    courses.map(course => {
      const yearString = getCourseYear(course)
      // Extract number from "1st", "2nd", "3rd", "4th"
      const yearMatch = yearString.match(/(\d+)/)
      return yearMatch ? yearMatch[1] : '1' // default to 1 if no match
    })
  )).sort()

  // Refresh data
  const refreshData = () => {
    setLoading(true)
    setError(null)
    const fetchData = async () => {
      try {
        const [coursesResponse, departmentsResponse, collegesResponse] = await Promise.all([
          adminApi.getAllCourses(),
          adminApi.getAllDepartments(),
          adminApi.getAllColleges()
        ])

        if (coursesResponse.status === 'success') {
          const transformedCourses: Course[] = coursesResponse.data.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            year: course.year || 1, // Include year from backend
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
            offerings: course.courseOfferings || [],
            openElectiveRestrictions: course.openElectiveRestrictions || []
          }))

          setCourses(transformedCourses)
        } else {
          setError(coursesResponse.error || 'Failed to fetch courses')
        }

        if (departmentsResponse.status === 'success') {
          setDepartments(departmentsResponse.data.map((dept: any) => ({
            id: dept.id,
            code: dept.code,
            name: dept.name,
            college_id: dept.college_id,
            college_name: dept.colleges?.name || ''
          })))
        }

        if (collegesResponse.status === 'success') {
          setColleges(collegesResponse.data.map((college: any) => ({
            id: college.id,
            code: college.code,
            name: college.name
          })))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  // Open edit form
  const openEditForm = (course: Course) => {
    setEditingCourse(course)

    // Extract year as string from course year or course code
    let yearString = '1'; // default
    if (course.year) {
      yearString = course.year.toString();
    } else {
      // Extract from course code as fallback
      const yearMatch = course.code.match(/[A-Z]{2,4}([1-4])[0-9]{2,3}/);
      if (yearMatch) {
        yearString = yearMatch[1];
      }
    }

    setEditFormData({
      code: course.code,
      name: course.name,
      department: course.department.code,
      year: yearString,
      type: course.type,
      hasTheoryComponent: course.hasTheoryComponent,
      hasLabComponent: course.hasLabComponent,
      restrictedDepartments: course.openElectiveRestrictions?.map(r => r.restrictedDepartment.code) || []
    })
    setShowEditForm(true)
  }

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return

    try {
      const response = await adminApi.updateCourse(editingCourse.id, {
        code: editFormData.code,
        name: editFormData.name,
        department: editFormData.department,
        year: editFormData.year,
        type: editFormData.type,
        hasTheoryComponent: editFormData.hasTheoryComponent,
        hasLabComponent: editFormData.hasLabComponent,
        restrictedDepartments: editFormData.restrictedDepartments
      })

      if (response.status === 'success') {
        // Refresh the data instead of trying to merge form data
        refreshData()
        alert('Course updated successfully')
        setShowEditForm(false)
        setEditingCourse(null)
      } else {
        alert('Failed to update course: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert('Error updating course: ' + errorMsg)
    }
  }

  // Add new course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newCourse.code.trim() && newCourse.name.trim() && newCourse.college && newCourse.department && newCourse.year) {
      try {
        const response = await adminApi.createCourse({
          code: newCourse.code.trim(),
          name: newCourse.name.trim(),
          department: newCourse.department,
          year: newCourse.year,
          type: newCourse.type,
          hasTheoryComponent: newCourse.hasTheoryComponent,
          hasLabComponent: newCourse.hasLabComponent,
          restrictedDepartments: newCourse.restrictedDepartments
        })

        if (response.status === 'success') {
          // Add the new course to the list
          const newCourseData: Course = {
            id: response.data.id,
            code: response.data.code,
            name: response.data.name,
            department: {
              id: response.data.department?.id || '',
              name: response.data.department?.name || '',
              code: response.data.department?.code || newCourse.department,
              college: {
                name: response.data.department?.colleges?.name || '',
                code: response.data.department?.colleges?.code || ''
              }
            },
            type: response.data.type || newCourse.type,
            hasTheoryComponent: response.data.hasTheoryComponent || newCourse.hasTheoryComponent,
            hasLabComponent: response.data.hasLabComponent || newCourse.hasLabComponent,
            offerings: []
          }

          setCourses(prev => [...prev, newCourseData])
          setNewCourse({
            code: '',
            name: '',
            college: '',
            department: '',
            year: '1',
            type: 'core',
            hasTheoryComponent: true,
            hasLabComponent: false,
            restrictedDepartments: []
          })
          setShowAddForm(false)
          alert('Course created successfully')
        } else {
          alert('Failed to create course: ' + (response.error || 'Unknown error'))
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        alert('Error creating course: ' + errorMsg)
      }
    } else {
      alert('Please fill in all required fields')
    }
  }

  // Open enrollment modal
  const openEnrollmentModal = async (course: Course) => {
    setSelectedCourse(course)
    setShowEnrollmentModal(true)
    setSelectedStudents([]) // Clear previous selections
    setSelectedSection('') // Clear previous section selection

    try {
      setEnrollmentLoading(true)

      // Fetch teachers and departments in parallel
      const [teachersResponse, departmentsResponse] = await Promise.all([
        adminApi.getUsersByRole('teacher'),
        adminApi.getAllDepartments()
      ])

      if (teachersResponse.status === 'success') {
        // Filter teachers to only show those from the course's college
        // Teachers from API have nested structure: teacher.colleges.code
        const filteredTeachers = teachersResponse.data.filter((user: any) =>
          user.teacher?.colleges?.code === course.department.college.code
        )

        // Transform to add collegeCode at the top level for easier access
        const transformedTeachers = filteredTeachers.map((user: any) => ({
          ...user,
          collegeCode: user.teacher?.colleges?.code
        }))

        setTeachers(transformedTeachers)

        // Pre-select teacher AFTER teachers are loaded
        if (course.teacherAssigned && course.teacher) {
          setSelectedTeacher(course.teacher.id)
        } else {
          setSelectedTeacher('')
        }
      }

      if (departmentsResponse.status === 'success') {
        // Get course's department to find its sections
        const courseDept = departmentsResponse.data.find((dept: any) =>
          dept.code === course.department.code &&
          dept.colleges?.code === course.department.college.code
        )

        // Get all sections from all departments in the same college
        const allSections: any[] = []
        departmentsResponse.data.forEach((dept: any) => {
          if (dept.colleges?.code === course.department.college.code && dept.sections) {
            dept.sections.forEach((section: any) => {
              allSections.push({
                ...section,
                departmentName: dept.name,
                departmentCode: dept.code
              })
            })
          }
        })

        setSections(allSections)
      }

      // Fetch eligible students
      await fetchEligibleStudents(course.id, enrollmentSemester)

    } catch (error) {
      console.error('Error fetching enrollment data:', error)
      setError('Failed to load enrollment data')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  // Fetch eligible students based on course type and restrictions
  const fetchEligibleStudents = async (courseId: string, semester: string) => {
    try {
      // Use current academic year 2025
      const response = await adminApi.getEligibleStudents(courseId, '2025', semester)
      if (response.status === 'success') {
        setEligibleStudents(response.data.eligibleStudents)
        setEnrollmentData(response.data)
      } else {
        setEligibleStudents([])
        setEnrollmentData(null)
      }
    } catch (error) {
      console.error('Error fetching eligible students:', error)
      setEligibleStudents([])
      setEnrollmentData(null)
    }
  }

  // Handle enrollment filter changes
  useEffect(() => {
    if (selectedCourse && showEnrollmentModal) {
      handleEnrollmentFilterChange()
    }
  }, [handleEnrollmentFilterChange, selectedCourse, showEnrollmentModal])

  // Handle student enrollment
  const handleEnrollStudents = async () => {
    if (!selectedCourse) {
      alert('No course selected')
      return
    }

    // For core courses, automatically enroll all eligible students
    const studentsToEnroll = selectedCourse.type === 'core'
      ? eligibleStudents.map(s => s.id)
      : selectedStudents

    // Only require students for electives if no teacher is selected
    if (studentsToEnroll.length === 0 && !selectedTeacher && !selectedSection) {
      alert('Please select at least one student, assign a teacher, or assign a section')
      return
    }

    try {
      setEnrollmentLoading(true)
      const response = await adminApi.enrollStudents(
        selectedCourse.id,
        studentsToEnroll,
        '2025', // Current academic year
        enrollmentSemester,
        selectedTeacher || undefined,
        selectedSection || undefined
      )

      if (response.status === 'success') {
        const enrolledCount = response.data.enrollmentsCreated
        const courseTypeText = selectedCourse.type === 'core' ? 'automatically enrolled' : 'enrolled'
        alert(`Successfully ${courseTypeText} ${enrolledCount} students`)

        // For core courses, clear the students list since they're all enrolled
        // For electives, clear selections and refresh
        if (selectedCourse.type === 'core') {
          setEligibleStudents([])
        } else {
          setSelectedStudents([])
          // Refresh eligible students
          const refreshResponse = await adminApi.getEligibleStudents(selectedCourse.id, '2025', enrollmentSemester)
          if (refreshResponse.status === 'success') {
            setEligibleStudents(refreshResponse.data.eligibleStudents)
          }
        }
      } else {
        alert('Enrollment failed: ' + (response.data?.errors?.join(', ') || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error enrolling students:', error)
      alert('Error enrolling students')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  // Handle enrollment form submission
  const handleEnrollmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleEnrollStudents()
  }

  // Handle CSV file selection
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setUploadResults(null)
    } else {
      alert('Please select a valid CSV file')
      e.target.value = ''
    }
  }

  // Handle CSV upload
  const handleCsvUpload = async () => {
    if (!csvFile || !selectedCourse) {
      alert('Please select a CSV file and ensure a course is selected')
      return
    }

    try {
      setCsvUploadLoading(true)
      setUploadResults(null)

      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('academicYear', '2025') // Current academic year
      formData.append('semester', enrollmentSemester)

      // Get auth token from cookies (consistent with API client)
      const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null

      const response = await fetch(`${API_BASE_URL}/api/courses/${selectedCourse.id}/students/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      const result = await response.json()

      if (response.ok && result.status === 'success') {
        setUploadResults(result.data.results)
        setCsvFile(null)
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        // Refresh eligible students list
        if (selectedCourse) {
          await fetchEligibleStudents(selectedCourse.id, enrollmentSemester)
        }
      } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      alert('Error uploading CSV file')
    } finally {
      setCsvUploadLoading(false)
    }
  }

  // Open teacher assignment modal
  const openTeacherModal = async (course: Course) => {
    console.log('=== openTeacherModal called ===')
    console.log('Full course object:', JSON.stringify(course, null, 2))
    console.log('Department:', course.department)
    console.log('Department ID:', course.department?.id)

    setTeacherModalCourse(course)
    setTeacherModalTeacher('')
    setTeacherModalSection('')
    setTeacherModalSemester('5')
    setTeacherModalSections([])
    setShowTeacherModal(true)
    setTeacherModalDataLoading(true)

    // Fetch both teachers and sections
    try {
      const departmentId = course.department?.id
      console.log('Extracted departmentId:', departmentId, 'Type:', typeof departmentId)

      if (!departmentId || departmentId.trim() === '') {
        console.error('Department ID is missing for course:', course)
        alert('Error: Department information is missing for this course')
        setShowTeacherModal(false)
        return
      }

      console.log('Fetching sections for department:', departmentId)

      // Fetch sections
      const sectionsResponse = await adminApi.getSectionsByDepartment(departmentId)
      console.log('Sections response:', sectionsResponse)

      if (sectionsResponse.status === 'success') {
        setTeacherModalSections(sectionsResponse.data.map((section: any) => ({
          section_id: section.section_id,
          section_name: section.section_name,
          departmentName: section.departmentName,
          departmentCode: section.departmentCode
        })))
      } else {
        console.error('Failed to fetch sections:', sectionsResponse)
      }

      // Fetch teachers if not already loaded
      if (teachers.length === 0) {
        console.log('Fetching teachers...')
        const teachersResponse = await adminApi.getUsersByRole('teacher')
        console.log('Teachers response:', teachersResponse)
        if (teachersResponse.status === 'success') {
          setTeachers(teachersResponse.data)
        }
      }
    } catch (error) {
      console.error('Error fetching sections or teachers:', error)
      alert('Failed to load sections or teachers. Please try again.')
    } finally {
      setTeacherModalDataLoading(false)
    }
  }

  // Handle teacher assignment submission
  const handleTeacherAssignment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teacherModalCourse) {
      alert('No course selected')
      return
    }

    if (!teacherModalTeacher) {
      alert('Please select a teacher')
      return
    }

    if (!teacherModalSection) {
      alert('Please select a section')
      return
    }

    try {
      setTeacherModalLoading(true)

      // Call API to assign teacher to course offering
      const response = await adminApi.assignTeacherToCourse(
        teacherModalCourse.id,
        teacherModalTeacher,
        teacherModalSection,
        parseInt(teacherModalSemester),
        '2025' // Current academic year
      )

      if (response.status === 'success') {
        alert('Teacher assigned successfully!')
        setShowTeacherModal(false)
        // Refresh courses list
        const coursesResponse = await adminApi.getCourseManagement()
        if (coursesResponse.status === 'success') {
          const transformedCourses: Course[] = coursesResponse.data.map((course: any) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            year: course.year || 1,
            department: {
              id: course.department?.id || '',
              name: course.department?.name || '',
              code: course.department?.code || '',
              college: {
                name: course.college?.name || '',
                code: course.college?.code || ''
              }
            },
            type: course.type || 'core',
            hasTheoryComponent: course.hasTheoryComponent || true,
            hasLabComponent: course.hasLabComponent || false,
            offerings: course.offerings || [],
            teacher: course.teacher || undefined,
            teacherAssigned: course.teacherAssigned || false,
            openElectiveRestrictions: course.openElectiveRestrictions || []
          }))
          setCourses(transformedCourses)
        }
      } else {
        alert('Failed to assign teacher: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error assigning teacher:', error)
      alert('Error assigning teacher')
    } finally {
      setTeacherModalLoading(false)
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
          <div className="flex-1 min-w-[200px] max-w-[700px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-black"
              />
            </div>
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Filter by course type"
          >
            <option value="all">All Types</option>
            <option value="core">Core</option>
            <option value="department_elective">Department Elective</option>
            <option value="open_elective">Open Elective</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Filter by year"
          >
            <option value="all">All Years</option>
            {allYears.map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
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
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">College</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Teacher</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Components</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Restrictions</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-medium text-gray-900">{course.code}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-medium text-gray-900">{course.name}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800 font-medium">
                        {getCourseYear(course)}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        <div>{course.department.name}</div>
                        <div className="text-gray-700">{course.department.code}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        <div>{course.department.college.name}</div>
                        <div className="text-gray-700">{course.department.college.code}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.type === 'core' ? 'bg-blue-100 text-blue-800' :
                        course.type === 'department_elective' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                        {course.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        {course.offerings && course.offerings.length > 0 ? (
                          <div className="space-y-1">
                            {(() => {
                              // Group offerings by teacher-section combination
                              const teacherSections = course.offerings
                                .filter(o => o.teacher && o.section)
                                .reduce((acc, offering) => {
                                  const key = `${offering.teacher?.id}-${offering.section}`;
                                  if (!acc[key]) {
                                    acc[key] = {
                                      teacher: offering.teacher,
                                      sections: new Set(),
                                      semesters: new Set()
                                    };
                                  }
                                  acc[key].sections.add(offering.section);
                                  acc[key].semesters.add(offering.semester);
                                  return acc;
                                }, {} as Record<string, any>);

                              const entries = Object.values(teacherSections);

                              if (entries.length === 0) {
                                return (
                                  <div>
                                    <div className="font-medium text-red-600">No Teachers</div>
                                    <div className="text-xs text-gray-600">Unassigned</div>
                                  </div>
                                );
                              }

                              return (
                                <>
                                  <div className="font-medium text-green-700">
                                    {entries.length} Assignment{entries.length > 1 ? 's' : ''}
                                  </div>
                                  <div className="max-h-24 overflow-y-auto space-y-1 mt-1">
                                    {entries.map((entry: any, idx: number) => (
                                      <div key={idx} className="text-xs border-l-2 border-blue-400 pl-2 py-1 bg-blue-50 rounded">
                                        <div className="font-medium text-gray-900">{entry.teacher.name}</div>
                                        <div className="text-gray-600">
                                          Section{Array.from(entry.sections).length > 1 ? 's' : ''}: {Array.from(entry.sections).join(', ')}
                                        </div>
                                        <div className="text-gray-500">
                                          Sem: {Array.from(entry.semesters).join(', ')}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-red-600">No Teachers</div>
                            <div className="text-xs text-gray-600">Unassigned</div>
                          </div>
                        )}
                      </div>
                    </td>


                    {/* testing  */}
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        {course.hasTheoryComponent && <span className="text-blue-600">Theory</span>}
                        {course.hasTheoryComponent && course.hasLabComponent && <span className="text-gray-600"> + </span>}
                        {course.hasLabComponent && <span className="text-green-600">Lab</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="text-sm text-gray-800">
                        {course.type === 'open_elective' ? (
                          course.openElectiveRestrictions && course.openElectiveRestrictions.length > 0 ? (
                            (() => {
                              const uniqueDepts = Array.from(new Set(course.openElectiveRestrictions.map(r => r.restrictedDepartment.code)));
                              return (
                                <div className="text-red-600">
                                  <span className="font-medium">{uniqueDepts.length} restricted</span>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {uniqueDepts.join(', ')}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-green-600">No restrictions</span>
                          )
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <Button size="sm" title='Edit' variant="outline" onClick={() => openEditForm(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEnrollmentModal(course)}
                          className="bg-blue-50 hover:bg-blue-100"
                          title="Manage Enrollments"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTeacherModal(course)}
                          className="bg-green-50 hover:bg-green-100"
                          title="Assign Teacher"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button title='Delete Course' size="sm" variant="outline" onClick={() => deleteCourse(course.id)}>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Course</h2>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Code</label>
                  <Input
                    placeholder="e.g., CS301"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Name</label>
                  <Input
                    placeholder="e.g., Data Structures"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                    className="text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">College</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select College"
                    value={newCourse.college}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, college: e.target.value, department: '' }))}
                    required
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
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select Department"
                    value={newCourse.department}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                    required
                    disabled={!newCourse.college}
                  >
                    <option value="">Select Department</option>
                    {(() => {
                      console.log('All departments with college_id:', departments.map(d => ({
                        name: d.name,
                        college_id: d.college_id,
                        college_name: d.college_name
                      })))
                      console.log('Selected college:', newCourse.college, typeof newCourse.college)
                      const filtered = departments.filter(dept => dept.college_id === newCourse.college)
                      console.log('Filtered departments:', filtered)
                      return filtered.map(dept => (
                        <option key={dept.id} value={dept.code}>
                          {dept.name} ({dept.code}) {dept.college_name && `- ${dept.college_name}`}
                        </option>
                      ))
                    })()}
                  </select>
                  {!newCourse.college && (
                    <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Year</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select Course Year"
                    value={newCourse.year}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, year: e.target.value }))}
                    required
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select Course Type"
                    value={newCourse.type}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, type: e.target.value as 'core' | 'department_elective' | 'open_elective' }))}
                  >
                    <option value="core">Core</option>
                    <option value="department_elective">Department Elective</option>
                    <option value="open_elective">Open Elective</option>
                  </select>
                </div>

                {/* Restricted Departments for Open Electives */}
                {newCourse.type === 'open_elective' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Restricted Departments
                      <span className="text-sm font-normal text-gray-600 ml-1">(departments that cannot take this course)</span>
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                      {departments.length === 0 ? (
                        <p className="text-gray-500 text-sm">Loading departments...</p>
                      ) : !newCourse.college ? (
                        <p className="text-gray-500 text-sm">Please select a college first</p>
                      ) : (
                        departments
                          .filter(dept => dept.college_id === newCourse.college)
                          .map(dept => (
                            <label key={dept.id} className="flex items-center text-gray-900 mb-2">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={newCourse.restrictedDepartments.includes(dept.code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewCourse(prev => ({
                                      ...prev,
                                      restrictedDepartments: [...prev.restrictedDepartments, dept.code]
                                    }))
                                  } else {
                                    setNewCourse(prev => ({
                                      ...prev,
                                      restrictedDepartments: prev.restrictedDepartments.filter(code => code !== dept.code)
                                    }))
                                  }
                                }}
                              />
                              <span className="text-sm">{dept.name} ({dept.code})</span>
                            </label>
                          ))
                      )}
                    </div>
                    {newCourse.restrictedDepartments.length === 0 ? (
                      <p className="text-sm text-gray-600 mt-1">No restrictions - all departments can take this course</p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {newCourse.restrictedDepartments.length} department(s) restricted
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center text-gray-900">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newCourse.hasTheoryComponent}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, hasTheoryComponent: e.target.checked }))}
                    />
                    Theory Component
                  </label>
                  <label className="flex items-center text-gray-900">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newCourse.hasLabComponent}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, hasLabComponent: e.target.checked }))}
                    />
                    Lab Component
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Course
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false)
                    setNewCourse({
                      code: '',
                      name: '',
                      college: '',
                      department: '',
                      year: '1',
                      type: 'core',
                      hasTheoryComponent: true,
                      hasLabComponent: false,
                      restrictedDepartments: []
                    })
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Form Modal */}
      {showEditForm && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">Edit Course</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Course Code</label>
                  <Input
                    placeholder="e.g., CS301"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Course Name</label>
                  <Input
                    placeholder="e.g., Data Structures"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    title="Select Department"
                  >
                    <option value="">Select Department</option>
                    {allDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Year</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                    title="Select Course Year"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Course Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'core' | 'department_elective' | 'open_elective' })}
                    title="Select Course Type"
                  >
                    <option value="core">Core</option>
                    <option value="department_elective">Department Elective</option>
                    <option value="open_elective">Open Elective</option>
                  </select>
                </div>

                {/* Restricted Departments for Open Electives */}
                {editFormData.type === 'open_elective' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Restricted Departments
                      <span className="text-sm font-normal text-gray-600 ml-1">(departments that cannot take this course)</span>
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                      {departments.length === 0 ? (
                        <p className="text-gray-500 text-sm">Loading departments...</p>
                      ) : !editingCourse?.department.college.name ? (
                        <p className="text-gray-500 text-sm">College information not available</p>
                      ) : (
                        departments
                          .filter(dept => dept.college_name === editingCourse.department.college.name)
                          .map(dept => (
                            <label key={dept.id} className="flex items-center text-gray-900 mb-2">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={editFormData.restrictedDepartments.includes(dept.code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      restrictedDepartments: [...prev.restrictedDepartments, dept.code]
                                    }))
                                  } else {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      restrictedDepartments: prev.restrictedDepartments.filter(code => code !== dept.code)
                                    }))
                                  }
                                }}
                              />
                              <span className="text-sm">{dept.name} ({dept.code})</span>
                            </label>
                          ))
                      )}
                    </div>
                    {editFormData.restrictedDepartments.length === 0 ? (
                      <p className="text-sm text-gray-600 mt-1">No restrictions - all departments can take this course</p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {editFormData.restrictedDepartments.length} department(s) restricted
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center text-gray-900">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={editFormData.hasTheoryComponent}
                      onChange={(e) => setEditFormData({ ...editFormData, hasTheoryComponent: e.target.checked })}
                    />
                    Theory Component
                  </label>
                  <label className="flex items-center text-gray-900">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={editFormData.hasLabComponent}
                      onChange={(e) => setEditFormData({ ...editFormData, hasLabComponent: e.target.checked })}
                    />
                    Lab Component
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Update Course
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Management Modal */}
      {showEnrollmentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Manage Enrollments for {selectedCourse.name}
              </h2>

              {/* Course Type Information */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Course Information</h3>
                <div className="text-sm text-blue-800">
                  <p><strong>Course Code:</strong> {selectedCourse.code}</p>
                  <p><strong>Course Type:</strong> {selectedCourse.type.replace('_', ' ').toUpperCase()}</p>
                  {selectedCourse.department && (
                    <p><strong>Department:</strong> {selectedCourse.department.name}</p>
                  )}
                  {enrollmentData && enrollmentData.course && (
                    <div className="mt-2">
                      <p><strong>Enrollment Rules:</strong></p>
                      {enrollmentData.course.type === 'open_elective' && (
                        <ul className="list-disc list-inside ml-2">
                          <li>Open to all students of the selected semester</li>
                          {enrollmentData.course.restrictions.length > 0 && (
                            <li>
                              Restricted departments: {enrollmentData.course.restrictions.map((r: { departmentCode: string }) => r.departmentCode).join(', ')}
                            </li>
                          )}
                        </ul>
                      )}
                      {enrollmentData.course.type === 'department_elective' && (
                        <ul className="list-disc list-inside ml-2">
                          <li>Only students from {enrollmentData.course.department?.name} department</li>
                          <li>Students of the selected semester</li>
                        </ul>
                      )}
                      {enrollmentData.course.type === 'core' && (
                        <ul className="list-disc list-inside ml-2">
                          <li><strong>Mandatory enrollment:</strong> All students from {enrollmentData.course.department?.name} department</li>
                          <li>Students of the selected semester will be automatically enrolled</li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Upload Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">Upload Students via CSV</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a CSV file with student data. Required column: <strong>usn</strong>. Optional columns: name, email, section.
                </p>

                {/* CSV Upload Form */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="flex-1 px-3 py-2 border rounded-md text-sm text-black"
                      disabled={csvUploadLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleCsvUpload}
                      disabled={!csvFile || csvUploadLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                    >
                      {csvUploadLoading ? 'Uploading...' : 'Upload CSV'}
                    </Button>
                  </div>

                  {/* Upload Results */}
                  {uploadResults && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">Upload Results</h4>
                      <div className="text-sm space-y-1 text-black">
                        <p><span className="font-medium">Total:</span> {uploadResults.total}</p>
                        <p><span className="font-medium text-green-600">Successful:</span> {uploadResults.successful}</p>
                        <p><span className="font-medium text-red-600">Failed:</span> {uploadResults.failed}</p>
                        {uploadResults.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-red-600">Errors:</p>
                            <ul className="list-disc list-inside text-red-600 text-xs max-h-24 overflow-y-auto">
                              {uploadResults.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p><strong>CSV Format Example:</strong></p>
                  <code className="bg-white px-2 py-1 rounded text-xs">
                    usn,name,email,section<br />
                    1BG22CS001,John Doe,john@example.com,A<br />
                    1BG22CS002,Jane Smith,jane@example.com,B
                  </code>
                </div>
              </div>

              {/* Toggle Manual Selection */}
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualSelection(!showManualSelection)}
                  className="text-sm"
                >
                  {showManualSelection ? 'Hide Manual Selection' : 'Show Manual Selection'}
                </Button>
              </div>

              {/* Enrollment Form */}
              {showManualSelection && (
                <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Semester</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={enrollmentSemester}
                      onChange={(e) => setEnrollmentSemester(e.target.value)}
                      title="Select Semester"
                    >
                      <option value="1">1st Semester (Year 1)</option>
                      <option value="2">2nd Semester (Year 1)</option>
                      <option value="3">3rd Semester (Year 2)</option>
                      <option value="4">4th Semester (Year 2)</option>
                      <option value="5">5th Semester (Year 3)</option>
                      <option value="6">6th Semester (Year 3)</option>
                      <option value="7">7th Semester (Year 4)</option>
                      <option value="8">8th Semester (Year 4)</option>
                    </select>
                  </div>

                  {/* Student Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {selectedCourse.type === 'core' ? 'Students to be enrolled' : 'Select Students'} {eligibleStudents.length > 0 && `(${eligibleStudents.length} eligible)`}
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
                      {enrollmentLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading eligible students...</p>
                        </div>
                      ) : eligibleStudents.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center">
                          No eligible students found for this course and semester combination.
                        </p>
                      ) : selectedCourse.type === 'core' ? (
                        /* For core courses, show all students as automatically selected */
                        <div className="space-y-2">
                          <div className="mb-3 pb-2 border-b">
                            <span className="text-sm font-medium text-green-900">
                              ✓ All students will be automatically enrolled ({eligibleStudents.length} students)
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              Core courses are mandatory for all students in the department
                            </p>
                          </div>
                          {eligibleStudents.map(student => (
                            <div key={student.id} className="flex items-center text-gray-900 bg-green-50 p-1 rounded">
                              <div className="mr-2 text-green-600">✓</div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{student.name}</div>
                                <div className="text-xs text-gray-500">
                                  USN: {student.usn} |
                                  {student.department && ` ${student.department.code} |`}
                                  {student.section && ` Section: ${student.section.name}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* For electives, allow manual selection */
                        <div className="space-y-2">
                          <div className="flex items-center mb-3 pb-2 border-b">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={selectedStudents.length === eligibleStudents.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(eligibleStudents.map(s => s.id))
                                  setSelectedSection('') // Clear section when students are selected
                                } else {
                                  setSelectedStudents([])
                                }
                              }}
                              aria-label="Select all students"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              Select All ({eligibleStudents.length} students)
                            </span>
                          </div>
                          {eligibleStudents.map(student => (
                            <label key={student.id} className="flex items-center text-gray-900 hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={selectedStudents.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudents(prev => [...prev, student.id])
                                    setSelectedSection('') // Clear section when students are selected
                                  } else {
                                    setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{student.name}</div>
                                <div className="text-xs text-gray-500">
                                  USN: {student.usn} |
                                  {student.department && ` ${student.department.code} |`}
                                  {student.section && ` Section: ${student.section.name}`}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Teacher Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Assign Teacher <span className="text-red-500">*</span></label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                      title="Select Teacher"
                      required
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Assign Section (Optional)</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      title="Select Section"
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section.section_id} value={section.section_id}>
                          {section.section_name} - {section.departmentName} ({section.departmentCode})
                        </option>
                      ))}
                    </select>
                    {sections.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No sections available</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Select a section to enroll all students from that section, or manually select individual students
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={enrollmentLoading || !selectedTeacher || (selectedStudents.length === 0 && !selectedSection)}
                    >
                      {enrollmentLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEnrollmentModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Assignment Modal */}
      {showTeacherModal && teacherModalCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Teacher</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTeacherModal(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Course Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{teacherModalCourse.code}</div>
                <div className="text-sm text-gray-600">{teacherModalCourse.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {teacherModalCourse.department.name} - {teacherModalCourse.department.college.name}
                </div>
              </div>

              <form onSubmit={handleTeacherAssignment} className="space-y-4">
                {teacherModalDataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-blue-600" />
                    <span className="text-gray-600">Loading teachers and sections...</span>
                  </div>
                ) : (
                  <>
                    {/* Teacher Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Select Teacher <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={teacherModalTeacher}
                        onChange={(e) => setTeacherModalTeacher(e.target.value)}
                        required
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.username})
                          </option>
                        ))}
                      </select>
                      {teachers.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No teachers available</p>
                      )}
                    </div>

                    {/* Section Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Select Section <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={teacherModalSection}
                        onChange={(e) => setTeacherModalSection(e.target.value)}
                        required
                      >
                        <option value="">Select Section</option>
                        {teacherModalSections.map(section => (
                          <option key={section.section_id} value={section.section_id}>
                            Section {section.section_name}
                          </option>
                        ))}
                      </select>
                      {teacherModalSections.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No sections available for this department</p>
                      )}
                    </div>

                    {/* Semester Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={teacherModalSemester}
                        onChange={(e) => setTeacherModalSemester(e.target.value)}
                        required
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={teacherModalLoading || teacherModalDataLoading || !teacherModalTeacher || !teacherModalSection}
                  >
                    {teacherModalLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Assign Teacher
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTeacherModal(false)}
                    disabled={teacherModalLoading}
                  >
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
