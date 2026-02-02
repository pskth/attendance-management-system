'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronDown,
  GraduationCap,
  Building2,
  BookOpen,
  Users
} from 'lucide-react'
import { adminApi } from '@/lib/api'

// Helper function to convert semester to year string
function semesterToYear(semester: number): string {
  if (semester <= 0) return 'Unknown'
  if (semester <= 2) return '1st Year'
  if (semester <= 4) return '2nd Year'
  if (semester <= 6) return '3rd Year'
  return '4th Year'
}

// Types for the navigation data
interface Year {
  year: string
  academic_year: string
  semester: number
  total_students: number
  total_courses: number
}

interface Department {
  department_id: string
  department_code?: string
  department_name: string
  short_name: string
  college_name?: string
  college_code?: string
  total_students: number
  total_courses: number
  active_classes_today: number
}

export interface Course {
  course_id: string
  course_code: string
  course_name: string
  department_id: string
  total_students: number
  classes_completed: number
  total_classes: number
  attendance_percentage: number
  course_type?: 'regular' | 'open_elective'
  is_open_elective?: boolean
  has_theory_component?: boolean
  has_lab_component?: boolean
  offering_id?: string
  academic_year?: string
  semester?: number
  yearOfStudy?: string
}

export interface Section {
  section_id: string
  section_name: string
  department_id: string
  total_students: number
  present_today: number
  attendance_percentage: number
}

interface DropdownNavigationProps {
  selectedYear: string | null
  selectedDepartment: string | null
  selectedCourse: Course | null
  selectedSection: Section | null
  onYearSelect: (year: string) => void
  onDepartmentSelect: (department: string) => void
  onCourseSelect: (course: Course) => void
  onSectionSelect: (section: Section) => void
  courses?: any[] // Teacher courses from API
  teacherCollege?: string // Teacher's college code to filter departments
}

export function DropdownNavigation({
  selectedYear,
  selectedDepartment,
  selectedCourse,
  selectedSection,
  onYearSelect,
  onDepartmentSelect,
  onCourseSelect,
  onSectionSelect,
  courses: teacherCourses = [],
  teacherCollege
}: DropdownNavigationProps) {
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)

  const [years, setYears] = useState<Year[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const hasInitializedRef = useRef(false)
  const lastCollegeRef = useRef<string | undefined>(undefined)
  const [loading, setLoading] = useState({
    years: false,
    departments: false,
    courses: false,
    sections: false
  })

  const yearRef = useRef<HTMLDivElement>(null)
  const deptRef = useRef<HTMLDivElement>(null)
  const courseRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearDropdownOpen(false)
      }
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setDeptDropdownOpen(false)
      }
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false)
      }
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        setSectionDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load initial data
  useEffect(() => {
    if (hasInitializedRef.current && lastCollegeRef.current === teacherCollege) return
    hasInitializedRef.current = true
    lastCollegeRef.current = teacherCollege
    loadYears()
    loadDepartments()
  }, [teacherCollege]) // Reload departments when teacher college changes

  const loadYears = async () => {
    setLoading(prev => ({ ...prev, years: true }))
    try {
      // Mock years data for now - backend doesn't have this endpoint yet
      const mockYears = [
        { year: '1st Year', academic_year: '2024-25', semester: 1, total_students: 240, total_courses: 8 },
        { year: '2nd Year', academic_year: '2024-25', semester: 3, total_students: 235, total_courses: 7 },
        { year: '3rd Year', academic_year: '2024-25', semester: 5, total_students: 230, total_courses: 6 },
        { year: '4th Year', academic_year: '2024-25', semester: 7, total_students: 225, total_courses: 5 }
      ]
      setYears(mockYears)
    } catch (error) {
      console.error('Error loading years:', error)
    } finally {
      setLoading(prev => ({ ...prev, years: false }))
    }
  }

  const loadDepartments = async () => {
    setLoading(prev => ({ ...prev, departments: true }))
    try {
      const response = await adminApi.getAllDepartments()
      // Handle the wrapped API response format
      const departmentData = response.status === 'success' ? response.data : []

      // Ensure departmentData is an array
      if (!Array.isArray(departmentData)) {
        console.warn('Department data is not an array:', departmentData)
        setDepartments([])
        return
      }

      // Transform department data to match expected format
      const transformedDepts = departmentData.map((dept: any) => ({
        department_id: dept.id,  // Use unique ID instead of code
        department_code: dept.code,
        department_name: dept.name,
        short_name: dept.code,
        college_name: dept.colleges?.name || '',
        college_code: dept.colleges?.code || '',
        total_students: dept.students?.length || 0,
        total_courses: dept.courses?.length || 0,
        active_classes_today: 0 // This would need to be calculated
      }))

      // Filter by teacher's college if specified
      const filteredDepts = teacherCollege
        ? transformedDepts.filter((dept: any) => dept.college_code === teacherCollege)
        : transformedDepts

      setDepartments(filteredDepts)
    } catch (error) {
      console.error('Error loading departments:', error)
      setDepartments([]) // Set empty array as fallback
    } finally {
      setLoading(prev => ({ ...prev, departments: false }))
    }
  }

  const loadCourses = useCallback(async () => {
    if (!selectedDepartment && !teacherCourses.length) return

    setLoading(prev => ({ ...prev, courses: true }))
    try {
      // Use teacher's courses if available
      if (teacherCourses.length > 0) {
        const transformedCourses = teacherCourses.map((courseOffering: any) => ({
          course_id: courseOffering.course.id,
          course_code: courseOffering.course.code,
          course_name: courseOffering.course.name,
          department_id: courseOffering.course.department, // This is department code from backend
          total_students: courseOffering.enrolledStudents,
          classes_completed: 25, // Mock - TODO: Get from attendance history
          total_classes: 40, // Mock - TODO: Get from academic calendar
          attendance_percentage: 85.0, // Mock - TODO: Calculate from actual data
          course_type: courseOffering.course.type,
          is_open_elective: courseOffering.course.type === 'open_elective',
          has_theory_component: courseOffering.course.hasTheoryComponent,
          has_lab_component: courseOffering.course.hasLabComponent,
          offering_id: courseOffering.offeringId,
          academic_year: courseOffering.academicYear,
          semester: courseOffering.semester || 0,
          yearOfStudy: semesterToYear(courseOffering.semester || 0)
        }))

        // Filter by year and department
        let filteredCourses = transformedCourses

        // Filter by selected year if one is chosen
        if (selectedYear) {
          filteredCourses = filteredCourses.filter((course: Course) =>
            course.yearOfStudy === selectedYear
          )
        }

        // Filter by department if one is selected
        // selectedDepartment is the UUID, need to match against department code
        if (selectedDepartment) {
          const selectedDept = departments.find(d => d.department_id === selectedDepartment)
          if (selectedDept) {
            filteredCourses = filteredCourses.filter((course: Course) =>
              course.department_id === selectedDept.department_code
            )
          }
        }

        setCourses(filteredCourses)
      } else {
        // Fallback to admin API if no teacher courses available
        const response = await adminApi.getAllCourses()
        
        // Handle different response formats
        const allCoursesData = Array.isArray(response) ? response : response?.data || response?.courses || []

        // Filter courses by department
        const departmentCourses = allCoursesData.filter((course: any) =>
          course.department.code === selectedDepartment
        )

        // Transform course data to match expected format
        const transformedCourses = departmentCourses.map((course: any) => ({
          course_id: course.id,
          course_code: course.code,
          course_name: course.name,
          department_id: course.department.code,
          total_students: course.courseOfferings?.[0]?.total_students || 0,
          classes_completed: course.courseOfferings?.[0]?.classes_completed || 0,
          total_classes: course.courseOfferings?.[0]?.total_classes || 0,
          attendance_percentage: course.courseOfferings?.[0]?.attendance_percentage || 0,
          course_type: course.type,
          is_open_elective: course.type === 'open_elective',
          has_theory_component: course.has_theory_component,
          has_lab_component: course.has_lab_component
        }))

        setCourses(transformedCourses)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(prev => ({ ...prev, courses: false }))
    }
  }, [selectedDepartment, selectedYear, teacherCourses])

  const loadSections = useCallback(async () => {
    if (!selectedCourse) return

    setLoading(prev => ({ ...prev, sections: true }))
    try {
      // For teacher portal, sections are typically derived from the course offering
      if (selectedCourse.is_open_elective) {
        // For open electives, create a mixed section
        setSections([{
          section_id: 'MIXED',
          section_name: 'Mixed',
          department_id: 'OPEN_ELECTIVE',
          total_students: selectedCourse.total_students,
          present_today: Math.floor(selectedCourse.total_students * selectedCourse.attendance_percentage / 100),
          attendance_percentage: selectedCourse.attendance_percentage
        }])
      } else {
        // For regular courses, find the course offering in teacher's courses
        const courseOffering = teacherCourses.find((offering: any) =>
          offering.course.id === selectedCourse.course_id
        )

        if (courseOffering?.section) {
          setSections([{
            section_id: courseOffering.section.id,
            section_name: courseOffering.section.name,
            department_id: selectedCourse.department_id,
            total_students: selectedCourse.total_students,
            present_today: Math.floor(selectedCourse.total_students * selectedCourse.attendance_percentage / 100),
            attendance_percentage: selectedCourse.attendance_percentage
          }])
        } else {
          // Fallback to mock sections
          const mockSections = [
            {
              section_id: 'A',
              section_name: 'A',
              department_id: selectedCourse.department_id,
              total_students: selectedCourse.total_students,
              present_today: Math.floor(selectedCourse.total_students * 0.85),
              attendance_percentage: 85.0
            }
          ]
          setSections(mockSections)
        }
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    } finally {
      setLoading(prev => ({ ...prev, sections: false }))
    }
  }, [selectedCourse, teacherCourses])

  // Load courses when year, department changes or when we have teacher courses
  useEffect(() => {
    if ((selectedYear || selectedDepartment) || teacherCourses.length > 0) {
      loadCourses()
    } else {
      setCourses([])
    }
  }, [selectedDepartment, selectedYear, teacherCourses.length, loadCourses])

  // Load sections when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadSections()
    } else {
      setSections([])
    }
  }, [selectedCourse, loadSections])

  const handleYearSelect = (year: string) => {
    onYearSelect(year)
    setYearDropdownOpen(false)
  }

  const handleDepartmentSelect = (department: string) => {
    onDepartmentSelect(department)
    setDeptDropdownOpen(false)
  }

  const handleCourseSelect = (course: Course) => {
    onCourseSelect(course)
    setCourseDropdownOpen(false)
  }

  const handleSectionSelect = (section: Section) => {
    onSectionSelect(section)
    setSectionDropdownOpen(false)
  }

  return (
    <Card className="w-full relative z-50">
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Year of Study Dropdown - First */}
          <div ref={yearRef} className="relative flex-1">
            <Button
              variant={selectedYear ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${selectedYear ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }`}
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedYear || 'Year of Study'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${yearDropdownOpen ? 'rotate-180' : ''
                }`} />
            </Button>

            {yearDropdownOpen && (
              <div className="absolute top-full mt-2 w-full min-w-[200px] max-w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {years.map((year) => (
                    <button
                      key={year.year}
                      className="w-full text-left p-2 sm:p-3 rounded-md hover:bg-gray-50 transition-colors"
                      onClick={() => handleYearSelect(year.year)}
                    >
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{year.year}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Department Dropdown - Second */}
          <div ref={deptRef} className="relative flex-1">
            <Button
              variant={selectedDepartment ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${selectedDepartment ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                } ${!selectedYear ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedYear && setDeptDropdownOpen(!deptDropdownOpen)}
              disabled={!selectedYear}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedDepartment ?
                      `${departments.find(d => d.department_id === selectedDepartment)?.short_name || selectedDepartment}`
                      : 'Department'
                    }
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${deptDropdownOpen ? 'rotate-180' : ''
                }`} />
            </Button>

            {deptDropdownOpen && selectedYear && (
              <div className="absolute top-full mt-2 w-full min-w-[300px] max-w-[400px] bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {departments.length > 0 ? departments.map((dept) => (
                    <button
                      key={dept.department_id}
                      className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => handleDepartmentSelect(dept.department_id)}
                    >
                      <div className="font-medium text-gray-900">{dept.short_name}: {dept.department_name}</div>
                      {dept.college_name && (
                        <div className="text-xs text-gray-500 mt-1">{dept.college_code} - {dept.college_name}</div>
                      )}
                    </button>
                  )) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">
                      No departments available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Course Dropdown - Third */}
          <div ref={courseRef} className="relative flex-1">
            <Button
              variant={selectedCourse ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${selectedCourse ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                } ${!selectedDepartment ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedDepartment && setCourseDropdownOpen(!courseDropdownOpen)}
              disabled={!selectedDepartment}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedCourse ? `${selectedCourse.course_code}: ${selectedCourse.course_name}` : 'Select Course'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${courseDropdownOpen ? 'rotate-180' : ''
                }`} />
            </Button>

            {courseDropdownOpen && selectedDepartment && (
              <div className="absolute top-full mt-2 w-full min-w-[300px] max-w-[500px] bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {courses.length > 0 ? (
                    <>
                      {/* Regular Department Courses */}
                      {courses.filter(course => !course.is_open_elective).length > 0 && (
                        <>
                          {courses.filter(course => !course.is_open_elective).map((course) => (
                            <button
                              key={course.course_id}
                              className="w-full text-left p-2 sm:p-3 rounded-md hover:bg-gray-50 transition-colors"
                              onClick={() => handleCourseSelect(course)}
                            >
                              <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{course.course_code}: {course.course_name}</div>
                              <div className="text-xs text-gray-500">{course.yearOfStudy} • Sem {course.semester} • {course.total_students} students</div>
                            </button>
                          ))}
                          {courses.filter(course => course.is_open_elective).length > 0 && (
                            <div className="border-t border-gray-200 my-2"></div>
                          )}
                        </>
                      )}

                      {/* Open Electives */}
                      {courses.filter(course => course.is_open_elective).length > 0 && (
                        <>
                          <div className="px-2 sm:px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Open Electives
                          </div>
                          {courses.filter(course => course.is_open_elective).map((course) => (
                            <button
                              key={course.course_id}
                              className="w-full text-left p-2 sm:p-3 rounded-md hover:bg-gray-50 transition-colors"
                              onClick={() => handleCourseSelect(course)}
                            >
                              <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{course.course_code}: {course.course_name}</div>
                              <div className="text-xs text-gray-500">{course.yearOfStudy} • Sem {course.semester} • {course.total_students} students</div>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">
                      {selectedYear ? 'No courses assigned for this year' : 'Select a year first'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section Dropdown - Fourth */}
          <div ref={sectionRef} className="relative flex-1">
            <Button
              variant={selectedSection ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${selectedSection ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                } ${!selectedCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedCourse && setSectionDropdownOpen(!sectionDropdownOpen)}
              disabled={!selectedCourse}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedSection ? `Section ${selectedSection.section_name}` : 'Select Section'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${sectionDropdownOpen ? 'rotate-180' : ''
                }`} />
            </Button>

            {sectionDropdownOpen && selectedCourse && (
              <div className="absolute top-full mt-2 w-full min-w-[250px] max-w-[400px] bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {sections.length > 0 ? sections.map((section) => (
                    <button
                      key={section.section_id}
                      className="w-full text-left p-2 sm:p-3 rounded-md hover:bg-gray-50 transition-colors"
                      onClick={() => handleSectionSelect(section)}
                    >
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Section {section.section_name}</div>
                      <div className="text-xs text-gray-500">
                        {section.total_students} students • {section.attendance_percentage.toFixed(1)}% attendance
                      </div>
                      {section.section_id === 'MIXED' && (
                        <div className="text-xs sm:text-sm text-emerald-600">Open Elective Section</div>
                      )}
                    </button>
                  )) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">
                      No sections available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
