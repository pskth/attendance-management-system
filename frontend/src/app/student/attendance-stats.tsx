"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  Target,
  RefreshCw,
  Award,
  AlertTriangle,
} from "lucide-react";
import { studentApi } from "@/lib/api"; // <-- make sure this path matches your project

interface AttendanceStatsProps {
  userId: string;
  compact?: boolean;
}

interface CourseAttendance {
  course_name: string;
  course_code: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  required_percentage: number;
  status: "good" | "warning" | "critical";
}

interface OverallStats {
  total_present: number;
  total_absent: number;
  total_classes: number;
  overall_percentage: number;
  trend: "up" | "down" | "stable";
  monthly_trend: Array<{
    month: string;
    percentage: number;
  }>;
}

export function AttendanceStats({
  userId,
  compact = false,
}: AttendanceStatsProps) {
  console.log("Loading attendance stats for user:", userId);
  const [courseData, setCourseData] = useState<CourseAttendance[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAttendanceStats = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getAllStats(userId); // <-- call your wrapper
      if (data) {
        setCourseData(data.courseAttendance as CourseAttendance[]);
        setOverallStats(data.overallStats as OverallStats);
      } else {
        setCourseData([]);
        setOverallStats(null);
      }
    } catch (error) {
      console.error("Error loading attendance stats:", error);
      setCourseData([]);
      setOverallStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceStats();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 sm:py-12">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600 text-sm sm:text-base">
            Loading attendance statistics...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!overallStats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Quick Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Percentage */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {overallStats.overall_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Overall Attendance</div>
              <div className="flex items-center justify-center mt-2">
                {overallStats.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : overallStats.trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                ) : null}
                <span className="text-xs text-gray-600">
                  {overallStats.total_present}/{overallStats.total_classes}{" "}
                  classes
                </span>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {overallStats.total_present}
                </div>
                <div className="text-xs text-green-700">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {overallStats.total_absent}
                </div>
                <div className="text-xs text-red-700">Absent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Present */}
        <Card>
          <CardContent className="flex items-center p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {overallStats.total_present}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Classes Attended
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card>
          <CardContent className="flex items-center p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {overallStats.total_absent}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Classes Missed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="flex items-center p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {overallStats.total_classes}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Classes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Percentage */}
        <Card>
          <CardContent className="flex items-center p-3 sm:p-4 lg:p-6">
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${
                overallStats.overall_percentage >= 75
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {overallStats.overall_percentage >= 75 ? (
                <Award className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              )}
            </div>
            <div>
              <p
                className={`text-lg sm:text-2xl font-bold ${
                  overallStats.overall_percentage >= 75
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {overallStats.overall_percentage.toFixed(1)}%
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Overall Percentage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Subject-wise Attendance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Attendance percentage for each subject
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 lg:hidden">
                      Course
                    </th>
                    <th className="hidden lg:table-cell text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      Course Code
                    </th>
                    <th className="hidden lg:table-cell text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      Course Name
                    </th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      Present
                    </th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      Absent
                    </th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      Total
                    </th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseData.map((course, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 sm:py-3 px-1 sm:px-2 lg:hidden">
                        <div className="min-w-[120px] sm:min-w-[140px]">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">
                            {course.course_code}
                          </div>
                          <div className="text-gray-600 text-xs truncate">
                            {course.course_name}
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell py-2 sm:py-3 px-1 sm:px-2">
                        <div className="font-medium text-gray-900 text-sm">
                          {course.course_code}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell py-2 sm:py-3 px-1 sm:px-2">
                        <div className="font-medium text-gray-900 text-sm min-w-[200px]">
                          {course.course_name}
                        </div>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="font-medium text-green-600">
                          {course.present}
                        </span>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="font-medium text-red-600">
                          {course.absent}
                        </span>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="font-medium">{course.total}</span>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="font-medium text-xs sm:text-sm">
                            {course.percentage.toFixed(1)}%
                          </span>
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1 sm:h-1.5">
                            <div
                              className={`h-1 sm:h-1.5 rounded-full transition-all duration-200 ${
                                course.status === "good"
                                  ? "bg-green-500"
                                  : course.status === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(course.percentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
