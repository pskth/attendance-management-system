'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

interface OverviewStatsProps {
  academicYear: string;
}

export default function OverviewStats({ academicYear }: OverviewStatsProps) {
  // Mock data - would be fetched based on filters in real implementation
  const stats = {
    totalStudents: 490,
    totalCourses: 42,
    avgAttendance: 87.3,
    avgMarks: 76.8,
    passRate: 92.1,
    lowAttendanceStudents: 23
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
      value: `${stats.avgAttendance}%`,
      icon: CheckCircle2,
      color: stats.avgAttendance >= 85 ? "bg-green-500" : stats.avgAttendance >= 75 ? "bg-yellow-500" : "bg-red-500",
      description: "Overall attendance rate"
    },
    {
      title: "Average Marks",
      value: `${stats.avgMarks}%`,
      icon: GraduationCap,
      color: stats.avgMarks >= 80 ? "bg-green-500" : stats.avgMarks >= 70 ? "bg-yellow-500" : "bg-red-500",
      description: "Combined theory & lab marks"
    },
    {
      title: "Pass Rate",
      value: `${stats.passRate}%`,
      icon: TrendingUp,
      color: stats.passRate >= 90 ? "bg-green-500" : stats.passRate >= 80 ? "bg-yellow-500" : "bg-red-500",
      description: "Students with >40% marks"
    },
    {
      title: "Low Attendance Alert",
      value: stats.lowAttendanceStudents.toString(),
      icon: AlertTriangle,
      color: "bg-red-500",
      description: "Students with <75% attendance"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
