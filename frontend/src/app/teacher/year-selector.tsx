'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, BookOpen } from 'lucide-react'

interface YearSelectorProps {
  teacherId: string
  onYearSelect: (year: string) => void
}

// Mock data for years - replace with actual API call
const mockYearData = [
  {
    year: '2nd Year',
    academic_year: '2024-25',
    semester: 4,
    total_students: 580,
    total_courses: 12
  },
  {
    year: '3rd Year', 
    academic_year: '2024-25',
    semester: 6,
    total_students: 550,
    total_courses: 15
  },
  {
    year: '4th Year',
    academic_year: '2024-25', 
    semester: 8,
    total_students: 520,
    total_courses: 8
  }
]

export function YearSelector({ teacherId, onYearSelect }: YearSelectorProps) {
  const [yearData] = useState(mockYearData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadYearData()
  }, [teacherId])

  const loadYearData = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      // const data = await fetchTeacherYears(teacherId)
      // setYearData(data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error loading year data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Academic Year</h2>
        <p className="text-gray-600">Choose the year level to manage attendance for</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {yearData.map((year) => (
          <Card 
            key={year.year}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-300"
            onClick={() => onYearSelect(year.year)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">{year.year}</CardTitle>
                  <CardDescription className="text-sm">
                    Semester {year.semester} • {year.academic_year}
                  </CardDescription>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardHeader>            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{year.total_students}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{year.total_courses}</p>
                      <p className="text-xs text-gray-500">Courses</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button className="w-full py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    Select {year.year}
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
