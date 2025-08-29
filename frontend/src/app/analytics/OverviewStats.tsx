'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import analyticsService, { OverviewStats as OverviewStatsType } from "@/lib/analytics-service";

interface OverviewStatsProps {
  academicYear: string;
}

export default function OverviewStats({ academicYear }: OverviewStatsProps) {
  const [stats, setStats] = useState<OverviewStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsService.getOverviewStats(academicYear);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch overview stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch overview statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [academicYear]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Authentication failed') || error.includes('No authentication token');
    
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Failed to load overview statistics</p>
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

  if (!stats) {
    return null;
  }

  // Use real low attendance student count from backend
  const lowAttendanceStudents = stats.lowAttendanceStudents;

  // Dynamic color thresholds based on data
  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 85) return "bg-green-500";
    if (attendance >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMarksColor = (marks: number) => {
    if (marks >= 80) return "bg-green-500";
    if (marks >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 90) return "bg-green-500";
    if (passRate >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      description: `All departments • Academic Year ${academicYear}`
    },
    {
      title: "Total Courses",
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      color: "bg-green-500", 
      description: `Active courses in ${academicYear}`
    },
    {
      title: "Average Attendance",
      value: `${stats.averageAttendance}%`,
      icon: CheckCircle2,
      color: getAttendanceColor(stats.averageAttendance),
      description: "Overall attendance rate"
    },
    {
      title: "Average Marks",
      value: `${stats.averageMarks}%`,
      icon: GraduationCap,
      color: getMarksColor(stats.averageMarks),
      description: "Combined theory & lab marks"
    },
    {
      title: "Pass Rate",
      value: `${stats.passRate}%`,
      icon: TrendingUp,
      color: getPassRateColor(stats.passRate),
      description: "Students with passing marks"
    },
    {
      title: "Low Attendance Alert",
      value: lowAttendanceStudents.toString(),
      icon: AlertTriangle,
      color: "bg-red-500",
      description: "Students with <75% attendance"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
      <div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
        <div className="text-xs sm:text-sm text-gray-700">Students</div>
      </div>
      <div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.totalCourses}</div>
        <div className="text-xs sm:text-sm text-gray-700">Courses</div>
      </div>
      <div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">{stats.averageAttendance}%</div>
        <div className="text-xs sm:text-sm text-gray-700">Attendance</div>
      </div>
      <div className="col-span-3 grid grid-cols-2 gap-3 sm:gap-4 text-center mt-2">
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.averageMarks}%</div>
          <div className="text-xs sm:text-sm text-gray-700">Avg Marks</div>
        </div>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">{stats.passRate}%</div>
          <div className="text-xs sm:text-sm text-gray-700">Pass Rate</div>
        </div>
      </div>
    </div>
  );
}
