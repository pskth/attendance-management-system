'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Award } from "lucide-react";
import AttendanceAnalytics from './AttendanceAnalytics';
import MarksAnalytics from '@/app/analytics/MarksAnalytics';
import ExportReports from '@/app/analytics/ExportReports';
//import { AttendanceStats } from '@/app/student/attendance-stats'

export default function AnalyticsPage() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-25');

  const academicYears = ['2024-25', '2023-24', '2022-23', '2021-22'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive attendance and academic performance reports</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Filters and Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Filters - Left Side (1/2 width) */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Report Filters</CardTitle>
                <CardDescription>Select criteria to generate reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Academic Year</label>
                  <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Actions</label>
                  <ExportReports 
                    filters={{
                      academicYear: selectedAcademicYear
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overview Statistics - Right Side (1/2 width) */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Overview Statistics</CardTitle>
                <CardDescription>Key metrics for Academic Year {selectedAcademicYear}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">490</div>
                    <div className="text-sm text-gray-700">Students</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">42</div>
                    <div className="text-sm text-gray-700">Courses</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-600">87.3%</div>
                    <div className="text-sm text-gray-700">Attendance</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-purple-600">76.8%</div>
                    <div className="text-sm text-gray-700">Avg Marks</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-600">92.1%</div>
                    <div className="text-sm text-gray-700">Pass Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Attendance Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="marks" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Marks & Performance Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceAnalytics 
            academicYear={selectedAcademicYear}
          />
        </TabsContent>

        <TabsContent value="marks" className="space-y-6">
          <MarksAnalytics 
            academicYear={selectedAcademicYear}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
