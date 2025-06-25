'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronDown, 
  GraduationCap, 
  Building2, 
  BookOpen,
  Users
} from 'lucide-react'
import mockYearDataImport from '@/data/mockYearData.json'
import mockDepartmentDataImport from '@/data/mockDepartmentData.json'
import mockCourseDataImport from '@/data/mockCourseData.json'
import mockOpenElectivesImport from '@/data/mockOpenElectives.json'
import mockSectionDataImport from '@/data/mockSectionData.json'

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
  department_name: string
  short_name: string
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
}

// Type the imported data  
const mockYearData: Year[] = mockYearDataImport as Year[]
const mockDepartmentData: Department[] = mockDepartmentDataImport as Department[]
const mockCourseData: Record<string, Course[]> = mockCourseDataImport as Record<string, Course[]>
const mockOpenElectives: Course[] = mockOpenElectivesImport as Course[]
const mockSectionData: Record<string, Section[]> = mockSectionDataImport as Record<string, Section[]>

export function DropdownNavigation({
  selectedYear,
  selectedDepartment,
  selectedCourse,
  selectedSection,
  onYearSelect,
  onDepartmentSelect,
  onCourseSelect,
  onSectionSelect
}: DropdownNavigationProps) {
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  
  const [years] = useState<Year[]>(mockYearData)
  const [departments] = useState<Department[]>(mockDepartmentData)
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])

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

  // Load courses when department changes or when year is selected (for open electives)
  useEffect(() => {
    let allCourses: Course[] = []
    
    if (selectedDepartment) {
      // Load department-specific courses
      const deptCourses = mockCourseData[selectedDepartment] || []
      allCourses = [...deptCourses]
    }
    
    // Add open electives when year is selected (regardless of department)
    if (selectedYear) {
      allCourses = [...allCourses, ...mockOpenElectives]
    }
    
    setCourses(allCourses)
  }, [selectedDepartment, selectedYear])

  // Load sections when department OR year changes (sections depend on department, but unlock with year)
  useEffect(() => {
    if (selectedDepartment) {
      const deptSections = mockSectionData[selectedDepartment] || []
      setSections(deptSections)
    } else if (selectedYear && selectedCourse?.is_open_elective) {
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
      setSections([])
    }
  }, [selectedDepartment, selectedYear, selectedCourse])

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
          {/* Year Dropdown */}
          <div ref={yearRef} className="relative flex-1">
            <Button
              variant={selectedYear ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${
                selectedYear ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              }`}
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedYear || 'Select Year'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${
                yearDropdownOpen ? 'rotate-180' : ''
              }`} />
            </Button>

            {yearDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2">
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

          {/* Department Dropdown */}
          <div ref={deptRef} className="relative flex-1">
            <Button
              variant={selectedDepartment ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${
                selectedDepartment ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              } ${!selectedYear ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedYear && setDeptDropdownOpen(!deptDropdownOpen)}
              disabled={!selectedYear}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedDepartment ? 
                      `${departments.find(d => d.department_id === selectedDepartment)?.short_name}: ${departments.find(d => d.department_id === selectedDepartment)?.department_name}` || selectedDepartment
                      : 'Select Department'
                    }
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${
                deptDropdownOpen ? 'rotate-180' : ''
              }`} />
            </Button>

            {deptDropdownOpen && selectedYear && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.department_id}
                      className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors"
                      onClick={() => handleDepartmentSelect(dept.department_id)}
                    >
                      <div className="font-medium text-gray-900">{dept.short_name}: {dept.department_name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Dropdown */}
          <div ref={sectionRef} className="relative flex-1">
            <Button
              variant={selectedSection ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${
                selectedSection ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              } ${!selectedYear ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedYear && setSectionDropdownOpen(!sectionDropdownOpen)}
              disabled={!selectedYear}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedSection ? `Section ${selectedSection.section_name}` : 'Select Section'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${
                sectionDropdownOpen ? 'rotate-180' : ''
              }`} />
            </Button>

            {sectionDropdownOpen && selectedYear && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {sections.length > 0 ? sections.map((section) => (
                    <button
                      key={section.section_id}
                      className="w-full text-left p-2 sm:p-3 rounded-md hover:bg-gray-50 transition-colors"
                      onClick={() => handleSectionSelect(section)}
                    >
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Section {section.section_name}</div>
                      {section.section_id === 'MIXED' && (
                        <div className="text-xs sm:text-sm text-emerald-600">Open Elective Section</div>
                      )}
                    </button>
                  )) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">
                      {selectedCourse ? 'Select a course first' : 'No sections available'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Course Dropdown */}
          <div ref={courseRef} className="relative flex-1">
            <Button
              variant={selectedCourse ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 sm:p-4 ${
                selectedCourse ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              } ${!selectedYear ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedYear && setCourseDropdownOpen(!courseDropdownOpen)}
              disabled={!selectedYear}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {selectedCourse ? `${selectedCourse.course_code}: ${selectedCourse.course_name}` : 'Select Course'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${
                courseDropdownOpen ? 'rotate-180' : ''
              }`} />
            </Button>

            {courseDropdownOpen && selectedYear && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
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
                              <div className="text-xs sm:text-sm text-gray-500">{course.department_id}</div>
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
                              <div className="text-xs sm:text-sm text-emerald-600">Open Elective • Mixed Sections</div>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">
                      No courses available
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
