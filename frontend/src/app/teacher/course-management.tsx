'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AttendanceMarking } from './attendance-marking'
import { AttendanceAnalytics } from './attendance-analytics'
import { 
  Users, 
  BarChart3
} from 'lucide-react'

interface CourseManagementProps {
  courseOffering: {
    offering_id: string
    course_code: string
    course_name: string
    class_section: string
  }
  selectedYear: string
  selectedDepartment: string
}

export function CourseManagement({
  courseOffering,
  selectedYear,
  selectedDepartment
}: CourseManagementProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">
            <Users className="w-4 h-4 mr-2" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendanceMarking
            courseOffering={courseOffering}
            selectedYear={selectedYear}
            selectedDepartment={selectedDepartment}
          />
        </TabsContent>        <TabsContent value="analytics">
          <AttendanceAnalytics
            courseOffering={courseOffering}
            selectedYear={selectedYear}
            selectedDepartment={selectedDepartment}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
