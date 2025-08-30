'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Award } from "lucide-react";
import AttendanceAnalytics from './AttendanceAnalytics';
import MarksAnalytics from './MarksAnalytics';
import ExportReports from './ExportReports';
import OverviewStats from './OverviewStats';
import analyticsService from '@/lib/analytics-service';

export default function AnalyticsPage() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-25');
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const years = await analyticsService.getAcademicYears();
        if (years.length > 0) {
          // Remove duplicates and sort years in descending order
          const uniqueYears = Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
          setAcademicYears(uniqueYears);
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
        // Keep default years if API fails, but ensure they're unique
        const defaultYears = ['2024-25', '2023-24', '2022-23', '2021-22'];
        setAcademicYears(Array.from(new Set(defaultYears)));
      }
    };

    fetchAcademicYears();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Analytics Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive attendance and academic performance reports</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Filters and Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Report Filters - Left Side */}
            <div>
              <Card className="h-full">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Report Filters</CardTitle>
                  <CardDescription className="text-sm">Select criteria to generate reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Academic Year</label>
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                      <SelectTrigger className="h-10 sm:h-11">
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
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Export Reports</label>
                    <ExportReports
                      filters={{
                        academicYear: selectedAcademicYear
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overview Statistics - Right Side */}
            <div>
              <Card className="h-full">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Overview Statistics</CardTitle>
                  <CardDescription className="text-sm">Key metrics for Academic Year {selectedAcademicYear}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <OverviewStats academicYear={selectedAcademicYear} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="attendance" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
            <TabsTrigger value="attendance" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Attendance Analytics</span>
              <span className="sm:hidden truncate">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2">
              <Award className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Marks & Performance</span>
              <span className="sm:hidden truncate">Marks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4 sm:space-y-6">
            <AttendanceAnalytics
              academicYear={selectedAcademicYear}
            />
          </TabsContent>

          <TabsContent value="marks" className="space-y-4 sm:space-y-6">
            <MarksAnalytics
              academicYear={selectedAcademicYear}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
