'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import analyticsService, { AttendanceAnalyticsData, DepartmentStats } from '@/lib/analytics-service';

interface AttendanceAnalyticsProps {
  academicYear: string;
}

export default function AttendanceAnalytics({ academicYear }: AttendanceAnalyticsProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [data, setData] = useState<AttendanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await analyticsService.getAttendanceAnalytics(academicYear);
        setData(analyticsData);
      } catch (err) {
        console.error('Failed to fetch attendance analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [academicYear]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-2" />
          <p className="text-gray-600">Loading attendance analytics...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    const isAuthError = error.includes('Authentication failed') || error.includes('No authentication token');
    
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Failed to load attendance analytics</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          {isAuthError && (
            <button 
              onClick={() => window.location.href = '/login/admin'}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Login
            </button>
          )}
        </div>
      </Card>
    );
  }

  if (!data || !data.departments.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p className="font-medium">No attendance data available</p>
          <p className="text-sm text-gray-500 mt-1">For academic year {academicYear}</p>
        </div>
      </Card>
    );
  }

  const departmentWiseData = data.departments;

  const toggleDepartment = (deptKey: string) => {
    setExpandedDepts(prev => 
      prev.includes(deptKey) 
        ? prev.filter(key => key !== deptKey)
        : [...prev, deptKey]
    );
  };

  const toggleCourse = (courseKey: string) => {
    setExpandedCourses(prev => 
      prev.includes(courseKey) 
        ? prev.filter(key => key !== courseKey)
        : [...prev, courseKey]
    );
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-600 bg-green-50';
    if (attendance >= 80) return 'text-yellow-600 bg-yellow-50';
    if (attendance >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {departmentWiseData.map((dept, index) => (
          <Card key={`${dept.code}-${index}`} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors pb-4"
              onClick={() => toggleDepartment(`${dept.code}-${index}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{dept.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-1">
                    <span>Code: {dept.code}</span>
                    <span>Students: {dept.students}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getAttendanceColor(dept.attendance || 0)}`}>
                    {dept.attendance?.toFixed(1)}%
                  </div>
                  {expandedDepts.includes(`${dept.code}-${index}`) ? 
                    <ChevronDown className="h-5 w-5" /> : 
                    <ChevronRight className="h-5 w-5" />
                  }
                </div>
              </div>
            </CardHeader>

            {expandedDepts.includes(`${dept.code}-${index}`) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {dept.sections.map((section) => (
                    <div key={section.section} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{section.section}</h4>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`px-2 py-1 rounded ${getAttendanceColor(section.attendance || 0)}`}>
                            {section.attendance?.toFixed(1)}%
                          </span>
                          <span className="text-gray-500">({section.students} students)</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {section.courseStats.map((course) => {
                          const courseKey = `${dept.code}-${section.section}-${course.code}`;
                          const isExpanded = expandedCourses.includes(courseKey);
                          
                          return (
                            <div key={course.code} className="bg-gray-50 p-3 rounded">
                              <div 
                                className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => toggleCourse(courseKey)}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate block">{course.name}</span>
                                  <span className="text-gray-500 text-xs">{course.code}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs ${getAttendanceColor(course.attendance || 0)}`}>
                                    {course.attendance?.toFixed(1)}%
                                  </span>
                                  {isExpanded ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                </div>
                              </div>
                              
                              {isExpanded && course.students && course.students.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-blue-200">
                                  <p className="text-xs font-medium text-gray-600 mb-1">
                                    Enrolled Students ({course.students.length}):
                                  </p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {course.students.map((student, studentIndex) => (
                                      <div key={student.id || studentIndex} className="text-xs bg-white p-2 rounded border">
                                        <div className="font-medium">{student.name || 'Unknown Student'}</div>
                                        <div className="text-gray-500">
                                          USN: {student.usn || 'N/A'} • Sem: {student.semester || 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {isExpanded && (!course.students || course.students.length === 0) && (
                                <div className="mt-2 pl-2 border-l-2 border-gray-200">
                                  <p className="text-xs text-gray-500">No students enrolled in this course</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
