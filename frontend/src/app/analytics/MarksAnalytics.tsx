'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MarksAnalyticsProps {
  academicYear: string;
}

export default function MarksAnalytics({ academicYear }: MarksAnalyticsProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  
  // Mock data for department-wise marks with section details
  const departmentWiseData = [
    { 
      name: 'Computer Science Engineering', 
      code: 'CSE', 
      avgMarks: 78.5, 
      passRate: 95.2, 
      students: 120,
      sections: [
        { 
          section: 'CSE-A', 
          avgMarks: 81.2, 
          passRate: 96.7, 
          students: 30, 
          courses: 6, 
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', avgMarks: 84.5, passRate: 93.3, failRate: 6.7 },
            { name: 'DBMS', code: 'CSE302', avgMarks: 79.1, passRate: 90.0, failRate: 10.0 },
            { name: 'Networks', code: 'CSE303', avgMarks: 82.8, passRate: 96.7, failRate: 3.3 }
          ]
        },
        { 
          section: 'CSE-B', 
          avgMarks: 76.2, 
          passRate: 93.3, 
          students: 30, 
          courses: 6,
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', avgMarks: 78.9, passRate: 86.7, failRate: 13.3 },
            { name: 'DBMS', code: 'CSE302', avgMarks: 74.3, passRate: 90.0, failRate: 10.0 },
            { name: 'Networks', code: 'CSE303', avgMarks: 75.4, passRate: 93.3, failRate: 6.7 }
          ]
        },
        { 
          section: 'CSE-C', 
          avgMarks: 78.0, 
          passRate: 96.7, 
          students: 30, 
          courses: 6,
          courseStats: [
            { name: 'Data Structures', code: 'CSE301', avgMarks: 80.2, passRate: 96.7, failRate: 3.3 },
            { name: 'DBMS', code: 'CSE302', avgMarks: 76.8, passRate: 93.3, failRate: 6.7 },
            { name: 'Networks', code: 'CSE303', avgMarks: 77.0, passRate: 100.0, failRate: 0.0 }
          ]
        }
      ]
    },
    { 
      name: 'AI & Data Science', 
      code: 'AIDS', 
      avgMarks: 81.3, 
      passRate: 96.8, 
      students: 80,
      sections: [
        { 
          section: 'AIDS-A', 
          avgMarks: 83.1, 
          passRate: 97.5, 
          students: 40, 
          courses: 5,
          courseStats: [
            { name: 'Machine Learning', code: 'AIDS301', avgMarks: 86.5, passRate: 97.5, failRate: 2.5 },
            { name: 'Data Mining', code: 'AIDS302', avgMarks: 79.7, passRate: 95.0, failRate: 5.0 }
          ]
        },
        { 
          section: 'AIDS-B', 
          avgMarks: 79.3, 
          passRate: 95.0, 
          students: 40, 
          courses: 5,
          courseStats: [
            { name: 'Machine Learning', code: 'AIDS301', avgMarks: 82.2, passRate: 92.5, failRate: 7.5 },
            { name: 'Data Mining', code: 'AIDS302', avgMarks: 76.4, passRate: 90.0, failRate: 10.0 }
          ]
        }
      ]
    },
    { 
      name: 'Information Science Engineering', 
      code: 'ISE', 
      avgMarks: 75.2, 
      passRate: 92.1, 
      students: 100,
      sections: [
        { 
          section: 'ISE-A', 
          avgMarks: 77.1, 
          passRate: 94.3, 
          students: 35, 
          courses: 6,
          courseStats: [
            { name: 'Software Engineering', code: 'ISE301', avgMarks: 81.2, passRate: 94.3, failRate: 5.7 },
            { name: 'Web Technology', code: 'ISE302', avgMarks: 73.0, passRate: 88.6, failRate: 11.4 }
          ]
        },
        { 
          section: 'ISE-B', 
          avgMarks: 73.7, 
          passRate: 90.0, 
          students: 35, 
          courses: 6,
          courseStats: [
            { name: 'Software Engineering', code: 'ISE301', avgMarks: 77.8, passRate: 91.4, failRate: 8.6 },
            { name: 'Web Technology', code: 'ISE302', avgMarks: 69.6, passRate: 85.7, failRate: 14.3 }
          ]
        }
      ]
    },
    { 
      name: 'Electronics & Communication', 
      code: 'ECE', 
      avgMarks: 79.8, 
      passRate: 94.6, 
      students: 90,
      sections: [
        { 
          section: 'ECE-A', 
          avgMarks: 82.5, 
          passRate: 96.7, 
          students: 30, 
          courses: 7,
          courseStats: [
            { name: 'Digital Circuits', code: 'ECE301', avgMarks: 85.1, passRate: 96.7, failRate: 3.3 },
            { name: 'Microprocessors', code: 'ECE302', avgMarks: 79.9, passRate: 93.3, failRate: 6.7 }
          ]
        },
        { 
          section: 'ECE-B', 
          avgMarks: 77.1, 
          passRate: 92.5, 
          students: 30, 
          courses: 7,
          courseStats: [
            { name: 'Digital Circuits', code: 'ECE301', avgMarks: 80.3, passRate: 90.0, failRate: 10.0 },
            { name: 'Microprocessors', code: 'ECE302', avgMarks: 73.9, passRate: 86.7, failRate: 13.3 }
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

  const getMarksColor = (marks: number) => {
    if (marks >= 85) return 'text-green-600';
    if (marks >= 75) return 'text-blue-600';
    if (marks >= 65) return 'text-yellow-600';
    if (marks >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-blue-600';
    if (rate >= 85) return 'text-yellow-600';
    if (rate >= 80) return 'text-orange-600';
    return 'text-red-600';
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Academic Performance</CardTitle>
          <CardDescription>
            Click on departments to view section-wise and course-wise marks details for {academicYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {departmentWiseData.map((dept, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                {/* Department Header - Clickable */}
                <div 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleDepartment(dept.code)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {expandedDepts.includes(dept.code) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div className={`w-4 h-4 rounded-full ${dept.code === 'CSE' ? 'bg-blue-500' : dept.code === 'AIDS' ? 'bg-green-500' : dept.code === 'ISE' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">{dept.code} • {dept.students} students • {dept.sections.length} sections</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getMarksColor(dept.avgMarks)}`}>
                          {dept.avgMarks}%
                        </div>
                        <div className="text-xs text-gray-500">Average</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getPassRateColor(dept.passRate)}`}>
                          {dept.passRate}%
                        </div>
                        <div className="text-xs text-gray-500">Pass Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">
                          {(100 - dept.passRate).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Fail Rate</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Section Details */}
                {expandedDepts.includes(dept.code) && (
                  <div className="border-t bg-gray-50">
                    {/* Section-wise Performance */}
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Section-wise Academic Performance</h4>
                      <div className="space-y-3">
                        {dept.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <div className="font-medium text-sm">{section.section}</div>
                              <div className="text-xs text-gray-500">{section.students} students</div>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className={`text-sm font-semibold ${getMarksColor(section.avgMarks)}`}>
                                  {section.avgMarks}%
                                </div>
                                <div className="text-xs text-gray-500">Avg</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-sm font-semibold ${getPassRateColor(section.passRate)}`}>
                                  {section.passRate}%
                                </div>
                                <div className="text-xs text-gray-500">Pass</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-red-600">
                                  {(100 - section.passRate).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">Fail</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Course-wise Performance per Section */}
                    <div className="p-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Course-wise Academic Performance by Section</h4>
                      <div className="space-y-3">
                        {dept.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="bg-white rounded border">
                            <div className="p-3 border-b bg-gray-50">
                              <h5 className="font-medium text-sm text-gray-800">{section.section}</h5>
                            </div>
                            <div className="p-3">
                              <div className="space-y-2">
                                {section.courseStats.map((course, courseIndex) => (
                                  <div key={courseIndex} className="flex items-center justify-between py-2">
                                    <div>
                                      <div className="text-sm font-medium">{course.code}</div>
                                      <div className="text-xs text-gray-500">{course.name}</div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <div className="text-center">
                                        <div className={`text-sm font-semibold ${getMarksColor(course.avgMarks)}`}>
                                          {course.avgMarks}%
                                        </div>
                                        <div className="text-xs text-gray-500">Avg</div>
                                      </div>
                                      <div className="text-center">
                                        <div className={`text-sm font-semibold ${getPassRateColor(course.passRate)}`}>
                                          {course.passRate}%
                                        </div>
                                        <div className="text-xs text-gray-500">Pass</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm font-semibold text-red-600">
                                          {course.failRate}%
                                        </div>
                                        <div className="text-xs text-gray-500">Fail</div>
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
