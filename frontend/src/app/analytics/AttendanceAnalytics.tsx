'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AttendanceAnalyticsProps {
  academicYear: string;
}

export default function AttendanceAnalytics({ academicYear }: AttendanceAnalyticsProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  
  // Mock data for department-wise attendance with section details
  const departmentWiseData = [
    { 
      name: 'Computer Science Engineering', 
      code: 'CSE', 
      attendance: 89.2, 
      students: 120,
      sections: [
        { section: 'CSE-A', attendance: 91.2, students: 30, courses: 6, 
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', attendance: 93.5 },
            { name: 'DBMS', code: 'CSE302', attendance: 89.1 },
            { name: 'Networks', code: 'CSE303', attendance: 91.8 }
          ]
        },
        { section: 'CSE-B', attendance: 87.2, students: 30, courses: 6,
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', attendance: 88.9 },
            { name: 'DBMS', code: 'CSE302', attendance: 85.3 },
            { name: 'Networks', code: 'CSE303', attendance: 87.4 }
          ]
        },
        { section: 'CSE-C', attendance: 89.0, students: 30, courses: 6,
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', attendance: 90.2 },
            { name: 'DBMS', code: 'CSE302', attendance: 87.8 },
            { name: 'Networks', code: 'CSE303', attendance: 89.0 }
          ]
        }
      ]
    },
    { 
      name: 'AI & Data Science', 
      code: 'AIDS', 
      attendance: 85.7, 
      students: 80,
      sections: [
        { section: 'AIDS-A', attendance: 87.1, students: 40, courses: 5,
          courseStats: [
            { name: 'Machine Learning', code: 'AIDS301', attendance: 89.5 },
            { name: 'Data Mining', code: 'AIDS302', attendance: 84.7 }
          ]
        },
        { section: 'AIDS-B', attendance: 84.3, students: 40, courses: 5,
          courseStats: [
            { name: 'Machine Learning', code: 'AIDS301', attendance: 86.2 },
            { name: 'Data Mining', code: 'AIDS302', attendance: 82.4 }
          ]
        }
      ]
    },
    { 
      name: 'Information Science Engineering', 
      code: 'ISE', 
      attendance: 87.4, 
      students: 100,
      sections: [
        { section: 'ISE-A', attendance: 89.1, students: 35, courses: 6,
          courseStats: [
            { name: 'Software Engineering', code: 'ISE301', attendance: 91.2 },
            { name: 'Web Technology', code: 'ISE302', attendance: 87.0 }
          ]
        },
        { section: 'ISE-B', attendance: 85.7, students: 35, courses: 6,
          courseStats: [
            { name: 'Software Engineering', code: 'ISE301', attendance: 87.8 },
            { name: 'Web Technology', code: 'ISE302', attendance: 83.6 }
          ]
        }
      ]
    },
    { 
      name: 'Electronics & Communication', 
      code: 'ECE', 
      attendance: 91.3, 
      students: 90,
      sections: [
        { section: 'ECE-A', attendance: 93.5, students: 30, courses: 7,
          courseStats: [
            { name: 'Digital Circuits', code: 'ECE301', attendance: 95.1 },
            { name: 'Microprocessors', code: 'ECE302', attendance: 91.9 }
          ]
        },
        { section: 'ECE-B', attendance: 89.1, students: 30, courses: 7,
          courseStats: [
            { name: 'Digital Circuits', code: 'ECE301', attendance: 91.3 },
            { name: 'Microprocessors', code: 'ECE302', attendance: 86.9 }
          ]
        }
      ]
    }
  ];

  const toggleDepartment = (deptCode: string) => {
    setExpandedDepts(prev => 
      prev.includes(deptCode) 
        ? prev.filter(code => code !== deptCode)
        : [...prev, deptCode]
    );
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Department-wise Attendance Performance</CardTitle>
          <CardDescription className="text-sm">
            Click on departments to view section-wise and course-wise attendance details for {academicYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {departmentWiseData.map((dept, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                {/* Department Header - Clickable */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors space-y-3 sm:space-y-0"
                  onClick={() => toggleDepartment(dept.code)}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      {expandedDepts.includes(dept.code) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${dept.code === 'CSE' ? 'bg-blue-500' : dept.code === 'AIDS' ? 'bg-green-500' : dept.code === 'ISE' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">{dept.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{dept.code} • {dept.students} students • {dept.sections.length} sections</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:text-right">
                    <div className="sm:hidden text-xs text-gray-500">Attendance:</div>
                    <div>
                      <div className={`text-lg sm:text-xl font-semibold ${getAttendanceColor(dept.attendance)}`}>
                        {dept.attendance}%
                      </div>
                      <div className="hidden sm:block text-xs text-gray-500">Attendance</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Section Details */}
                {expandedDepts.includes(dept.code) && (
                  <div className="border-t bg-gray-50">
                    {/* Section-wise Performance */}
                    <div className="p-4">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-3">Section-wise Attendance</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dept.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{section.section}</div>
                              <div className="text-xs text-gray-500">{section.students} students</div>
                            </div>
                            <div className="text-right ml-2">
                              <div className={`text-sm font-semibold ${getAttendanceColor(section.attendance)}`}>
                                {section.attendance}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Course-wise Performance per Section */}
                    <div className="p-4 border-t">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-3">Course-wise Attendance by Section</h4>
                      <div className="space-y-3">
                        {dept.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="bg-white rounded-lg border overflow-hidden">
                            <div className="p-3 border-b bg-gray-50">
                              <h5 className="font-medium text-sm text-gray-800">{section.section}</h5>
                            </div>
                            <div className="p-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {section.courseStats.map((course, courseIndex) => (
                                  <div key={courseIndex} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 space-y-1 sm:space-y-0">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">{course.code}</div>
                                      <div className="text-xs text-gray-500 truncate">{course.name}</div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <div className={`text-sm font-semibold ${getAttendanceColor(course.attendance)}`}>
                                        {course.attendance}%
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
