'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AttendanceMarking } from './attendance-marking'
import { AttendanceAnalytics } from './attendance-analytics'
import { TheoryMarksManagement } from './theory-marks'
import { LabMarksManagement } from './lab-marks'
import TeacherMarksAttendanceManagement from './marks-attendance-management'
import {
  Users,
  BarChart3,
  Calculator,
  FlaskConical,
  BookOpenCheck
} from 'lucide-react'

import { Course, Section } from './dropdown-navigation'

interface CourseManagementProps {
  courseOffering: Course
  selectedYear: string
  selectedDepartment: string
  selectedSection: Section
  courses?: any[] // Add courses prop to pass to marks-attendance management
}

export function CourseManagement({
  courseOffering,
  selectedYear,
  selectedDepartment,
  selectedSection,
  courses = []
}: CourseManagementProps) {
  // Use course component flags from the data, with fallbacks
  const hasTheoryComponent = courseOffering.has_theory_component !== false // Default to true if undefined
  const hasLabComponent = courseOffering.has_lab_component === true

  // Set default tab based on what's available
  const getDefaultTab = () => {
    // Start with analytics if it's a theory course, otherwise lab-marks or manage-all
    if (hasTheoryComponent) return "analytics"
    if (hasLabComponent) return "lab-marks"
    return "manage-all" // fallback to view/edit all
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue={getDefaultTab()}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-1 h-auto">
          {hasTheoryComponent && (
            <>
              {/* Mark Attendance tab hidden - functionality available in View/Edit All */}
              {/* <TabsTrigger value="attendance" className="flex items-center justify-center px-2 py-2 min-h-[40px]">
                <Users className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-base truncate">Mark Attendance</span>
              </TabsTrigger> */}
              <TabsTrigger value="analytics" className="flex items-center justify-center px-2 py-2 min-h-[40px]">
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-base truncate">Analytics</span>
              </TabsTrigger>
              {/* Theory Marks tab hidden - functionality available in View/Edit All */}
              {/* <TabsTrigger value="theory-marks" className="flex items-center justify-center px-2 py-2 min-h-[40px]">
                <Calculator className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-base truncate">Theory Marks</span>
              </TabsTrigger> */}
            </>
          )}
          {hasLabComponent && (
            <TabsTrigger value="lab-marks" className="flex items-center justify-center px-2 py-2 min-h-[40px]">
              <FlaskConical className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-base truncate">Lab Marks</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="manage-all" className="flex items-center justify-center px-2 py-2 min-h-[40px]">
            <BookOpenCheck className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-base truncate">View/Edit All</span>
          </TabsTrigger>
        </TabsList>

        {hasTheoryComponent && (
          <>
            {/* Mark Attendance content hidden - functionality available in View/Edit All */}
            {/* <TabsContent value="attendance">
              <AttendanceMarking
                courseOffering={courseOffering}
                selectedYear={selectedYear}
                selectedDepartment={selectedDepartment}
                selectedSection={selectedSection}
              />
            </TabsContent> */}

            <TabsContent value="analytics">
              <AttendanceAnalytics
                courseOffering={courseOffering}
                selectedYear={selectedYear}
                selectedDepartment={selectedDepartment}
                selectedSection={selectedSection}
              />
            </TabsContent>

            {/* Theory Marks content hidden - functionality available in View/Edit All */}
            {/* <TabsContent value="theory-marks">
              <TheoryMarksManagement
                courseOffering={courseOffering}
                selectedYear={selectedYear}
                selectedDepartment={selectedDepartment}
                selectedSection={selectedSection}
              />
            </TabsContent> */}
          </>
        )}

        {hasLabComponent && (
          <TabsContent value="lab-marks">
            <LabMarksManagement
              courseOffering={courseOffering}
              selectedDepartment={selectedDepartment}
              selectedSection={selectedSection}
            />
          </TabsContent>
        )}

        <TabsContent value="manage-all">
          <TeacherMarksAttendanceManagement
            courses={courses}
            selectedCourseId={courseOffering.offering_id}
            initialMode="marks"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
