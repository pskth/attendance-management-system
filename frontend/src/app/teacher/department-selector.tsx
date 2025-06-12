'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, BookOpen, Clock } from 'lucide-react'

interface DepartmentSelectorProps {
  teacherId: string
  selectedYear: string
  onDepartmentSelect: (department: string) => void
}

// Mock data for departments - replace with actual API call
const mockDepartmentData = [
  {
    department: 'Computer Science Engineering',
    short_name: 'CSE',
    total_students: 120,
    total_courses: 8,
    active_classes_today: 6,
    color: 'bg-blue-500',
    icon_bg: 'bg-blue-100',
    icon_color: 'text-blue-600'
  },
  {
    department: 'Artificial Intelligence and Data Science',
    short_name: 'AIDS',
    total_students: 80,
    total_courses: 6,
    active_classes_today: 4,
    color: 'bg-purple-500',
    icon_bg: 'bg-purple-100',
    icon_color: 'text-purple-600'
  },
  {
    department: 'Information Science Engineering',
    short_name: 'ISE',
    total_students: 100,
    total_courses: 7,
    active_classes_today: 5,
    color: 'bg-green-500',
    icon_bg: 'bg-green-100',
    icon_color: 'text-green-600'
  },
  {
    department: 'Electronics and Communication',
    short_name: 'ECE',
    total_students: 90,
    total_courses: 6,
    active_classes_today: 4,
    color: 'bg-orange-500',
    icon_bg: 'bg-orange-100',
    icon_color: 'text-orange-600'
  },
  {
    department: 'Mechanical Engineering',
    short_name: 'ME',
    total_students: 85,
    total_courses: 5,
    active_classes_today: 3,
    color: 'bg-red-500',
    icon_bg: 'bg-red-100',
    icon_color: 'text-red-600'
  },
  {
    department: 'Civil Engineering',
    short_name: 'CE',
    total_students: 75,
    total_courses: 5,
    active_classes_today: 3,
    color: 'bg-yellow-500',
    icon_bg: 'bg-yellow-100',
    icon_color: 'text-yellow-600'
  }
]

export function DepartmentSelector({ teacherId, selectedYear, onDepartmentSelect }: DepartmentSelectorProps) {
  const [departmentData] = useState(mockDepartmentData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDepartmentData()
  }, [teacherId, selectedYear])

  const loadDepartmentData = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const data = await fetchTeacherDepartments(teacherId, selectedYear)
      // setDepartmentData(data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error loading department data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Department</h2>
        <p className="text-gray-600">Choose the department for {selectedYear} students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentData.map((dept) => (
          <Card 
            key={dept.department}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-300"
            onClick={() => onDepartmentSelect(dept.department)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900 line-clamp-2">
                    {dept.department}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-600">
                    {dept.short_name} • {selectedYear}
                  </CardDescription>
                </div>
                <div className={`w-12 h-12 ${dept.icon_bg} rounded-full flex items-center justify-center ml-3`}>
                  <Building2 className={`w-6 h-6 ${dept.icon_color}`} />
                </div>
              </div>
            </CardHeader>            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4 text-blue-500 mb-1" />
                    <p className="text-sm font-medium text-gray-900">{dept.total_students}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-4 h-4 text-purple-500 mb-1" />
                    <p className="text-sm font-medium text-gray-900">{dept.total_courses}</p>
                    <p className="text-xs text-gray-500">Courses</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Clock className="w-4 h-4 text-green-500 mb-1" />
                    <p className="text-sm font-medium text-gray-900">{dept.active_classes_today}</p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button className="w-full py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    Select {dept.short_name}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
