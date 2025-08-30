'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Building2, Calendar, Users } from "lucide-react";
import analyticsService, { AttendanceAnalyticsData } from '@/lib/analytics-service';

interface AttendanceAnalyticsProps {
    academicYear: string;
}

export default function AttendanceAnalytics({ academicYear }: AttendanceAnalyticsProps) {
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
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-green-600 mb-2" />
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
                            className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                            Go to Login
                        </button>
                    )}
                </div>
            </Card>
        );
    }

    // Check if data exists and has content
    const hasColleges = data && data.colleges && data.colleges.length > 0;
    const hasDepartments = data && data.departments && data.departments.length > 0;

    if (!hasColleges && !hasDepartments) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-600">
                    <p className="font-medium">No attendance data available</p>
                    <p className="text-sm text-gray-500 mt-1">For academic year {academicYear}</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Statistics */}
            {data.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <div className="text-2xl font-bold text-blue-600">
                                    {data.summary.totalStudents || 0}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Total Students</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                <div className="text-2xl font-bold text-green-600">
                                    {data.summary.overallAvgAttendance?.toFixed(1) || '0.0'}%
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Overall Average Attendance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Calendar className="h-5 w-5 text-purple-600" />
                                <div className="text-2xl font-bold text-purple-600">
                                    {data.summary.totalClasses || 0}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Total Classes Conducted</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* College-wise Data */}
            <div className="space-y-6">
                {hasColleges && data.colleges!.map((college, collegeIndex) => (
                    <Card key={`college-${collegeIndex}`} className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Building2 className="h-6 w-6 text-green-600" />
                                    <div>
                                        <CardTitle className="text-xl text-green-900">{college.name}</CardTitle>
                                        <CardDescription>
                                            Code: {college.code} | Departments: {college.departments?.length || 0}
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}

                {!hasColleges && hasDepartments && (
                    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardHeader>
                            <CardTitle className="text-xl text-blue-900">Departments</CardTitle>
                            <CardDescription>
                                Total departments: {data.departments!.length}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.departments!.map((dept, deptIndex) => (
                                    <Card key={`dept-${deptIndex}`} className="border-l-4 border-green-400">
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-lg">{dept.name}</h3>
                                            <p className="text-sm text-gray-600">Code: {dept.code}</p>
                                            <p className="text-sm text-gray-600">Students: {dept.students || 0}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
