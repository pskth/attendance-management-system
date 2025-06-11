'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, BookOpen, ChevronRight } from 'lucide-react'

interface OpenElectivesProps {
  teacherId: string
  selectedYear: string
  onElectiveSelect: (elective: {
    offering_id: string
    course_code: string
    course_name: string
    class_section: string
  }) => void
}

// Mock data for open electives - replace with actual API call
const mockOpenElectives = [
  {
    offering_id: 'oe_001',
    course_code: 'OE401',
    course_name: 'Introduction to Artificial Intelligence',
    class_section: 'Mixed',
    instructor_id: '456e7890-e12b-34c5-d678-901234567890', // Matches current teacher
    enrolled_students: 45,
    max_capacity: 60,
    elective_type: 'Open Elective',
    description: 'Fundamentals of AI including machine learning, neural networks, and expert systems'
  },
  {
    offering_id: 'oe_002',
    course_code: 'OE402',
    course_name: 'Digital Marketing and E-Commerce',
    class_section: 'Mixed',
    instructor_id: 'other_teacher_id_1',
    enrolled_students: 38,
    max_capacity: 50,
    elective_type: 'Open Elective',
    description: 'Modern digital marketing strategies and e-commerce platforms'
  },
  {
    offering_id: 'oe_003',
    course_code: 'OE403',
    course_name: 'Environmental Science and Sustainability',
    class_section: 'Mixed',
    instructor_id: 'other_teacher_id_2',
    enrolled_students: 42,
    max_capacity: 55,
    elective_type: 'Open Elective',
    description: 'Environmental challenges and sustainable development practices'
  },
  {
    offering_id: 'oe_004',
    course_code: 'OE404',
    course_name: 'Advanced Web Development',
    class_section: 'Mixed',
    instructor_id: '456e7890-e12b-34c5-d678-901234567890', // Matches current teacher
    enrolled_students: 35,
    max_capacity: 45,
    elective_type: 'Open Elective',
    description: 'Building modern responsive web applications with latest technologies'
  }
]

export function OpenElectives({ teacherId, selectedYear, onElectiveSelect }: OpenElectivesProps) {
  // Filter electives assigned to the current teacher
  const teacherElectives = mockOpenElectives.filter(elective => 
    elective.instructor_id === teacherId
  )
  const handleElectiveClick = (elective: typeof mockOpenElectives[0]) => {
    onElectiveSelect({
      offering_id: elective.offering_id,
      course_code: elective.course_code,
      course_name: elective.course_name,
      class_section: elective.class_section
    })
  }

  return (
    <div className="space-y-6">
      <Card>        <CardHeader>
          <div className="flex items-center space-x-2">
           
            <div>
              <CardTitle className="text-emerald-800">Open Electives</CardTitle>
              <CardDescription>
                Open elective courses assigned to you for {selectedYear} students ({teacherElectives.length} course{teacherElectives.length !== 1 ? 's' : ''})
              </CardDescription>
            </div>
          </div>
        </CardHeader><CardContent>
          <div className="grid gap-4">
            {teacherElectives.map((elective) => (
              <Card 
                key={elective.offering_id}
                className="border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => handleElectiveClick(elective)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-semibold text-gray-900">
                            {elective.course_code} - {elective.course_name}
                          </h3>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {elective.elective_type}
                        </span>
                      </div>
                        <p className="text-sm text-gray-600 mb-3">
                        {elective.description}
                      </p>
                        <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-emerald-600">
                          <span className="text-sm font-medium">Mark Attendance</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>            {teacherElectives.length === 0 && (
            <div className="text-center py-8">
              
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Open Electives Assigned</h3>
              <p className="text-gray-500">
                You don&apos;t have any open elective courses assigned for {selectedYear} students.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
