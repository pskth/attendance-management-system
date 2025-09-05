'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import analyticsService, { MarksAnalyticsData, DepartmentStats } from '@/lib/analytics-service';

interface MarksAnalyticsProps {
  academicYear: string;
}

export default function MarksAnalytics({ academicYear }: MarksAnalyticsProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [data, setData] = useState<MarksAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await analyticsService.getMarksAnalytics(academicYear);
        setData(analyticsData);
      } catch (err) {
        console.error('Failed to fetch marks analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch marks analytics');
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
          <p className="text-gray-600">Loading marks analytics...</p>
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
          <p className="font-medium">Failed to load marks analytics</p>
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
          <p className="font-medium">No marks data available</p>
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

  const getMarksColor = (marks: number) => {
    if (marks >= 85) return 'text-green-600 bg-green-50';
    if (marks >= 75) return 'text-blue-600 bg-blue-50';
    if (marks >= 65) return 'text-yellow-600 bg-yellow-50';
    if (marks >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 95) return 'text-green-600 bg-green-50';
    if (passRate >= 85) return 'text-blue-600 bg-blue-50';
    if (passRate >= 75) return 'text-yellow-600 bg-yellow-50';
    if (passRate >= 65) return 'text-orange-600 bg-orange-50';
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
                  <div className="flex flex-col items-end space-y-1">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getMarksColor(dept.avgMarks || 0)}`}>
                      {dept.avgMarks?.toFixed(1)}% Avg
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getPassRateColor(dept.passRate || 0)}`}>
                      {dept.passRate?.toFixed(1)}% Pass
                    </div>
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
                    <div key={section.section} className="border-l-4 border-purple-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{section.section}</h4>
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 py-1 rounded text-xs ${getMarksColor(section.avgMarks || 0)}`}>
                              {section.avgMarks?.toFixed(1)}% Avg
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getPassRateColor(section.passRate || 0)}`}>
                              {section.passRate?.toFixed(1)}% Pass
                            </span>
                          </div>
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
                                className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => toggleCourse(courseKey)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate block text-sm">{course.name}</span>
                                    <span className="text-gray-500 text-xs">{course.code}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex flex-col items-end space-y-1">
                                      <span className={`px-2 py-1 rounded text-xs ${getMarksColor(course.avgMarks || 0)}`}>
                                        {course.avgMarks?.toFixed(1)}%
                                      </span>
                                    </div>
                                    {isExpanded ?
                                      <ChevronDown className="h-4 w-4" /> :
                                      <ChevronRight className="h-4 w-4" />
                                    }
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className={`px-2 py-1 rounded ${getPassRateColor(course.passRate || 0)}`}>
                                    Pass: {course.passRate?.toFixed(1)}%
                                  </span>
                                  <span className="px-2 py-1 rounded bg-red-100 text-red-600">
                                    Fail: {course.failRate?.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              {isExpanded && course.students && course.students.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-purple-200">
                                  <p className="text-xs font-medium text-gray-600 mb-1">
                                    Enrolled Students ({course.students.length}):
                                  </p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {course.students.map((student, studentIndex) => (
                                      <div key={student.id || studentIndex} className="text-xs bg-white p-2 rounded border">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="font-medium">{student.name || 'Unknown Student'}</div>
                                            <div className="text-gray-500">
                                              USN: {student.usn || 'N/A'} • Sem: {student.semester || 'N/A'}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 ml-2">
                                            <div className="text-right space-y-1">
                                              {student.theoryMarks !== undefined && (
                                                <div className="text-xs">
                                                  <span className="text-gray-500">Theory: </span>
                                                  <span className={`font-medium ${(student.theoryMarks || 0) >= 30
                                                      ? 'text-green-600'
                                                      : 'text-red-600'
                                                    }`}>
                                                    {student.theoryMarks}
                                                  </span>
                                                </div>
                                              )}
                                              {student.labMarks !== undefined && (
                                                <div className="text-xs">
                                                  <span className="text-gray-500">Lab: </span>
                                                  <span className={`font-medium ${(student.labMarks || 0) >= 30
                                                      ? 'text-green-600'
                                                      : 'text-red-600'
                                                    }`}>
                                                    {student.labMarks}
                                                  </span>
                                                </div>
                                              )}
                                              {student.totalMarks !== undefined && (
                                                <div className="text-xs">
                                                  <span className={`px-2 py-1 rounded font-medium ${(student.totalMarks || 0) >= 60
                                                      ? 'bg-green-100 text-green-700'
                                                      : (student.totalMarks || 0) >= 30
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    Total: {student.totalMarks}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
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
