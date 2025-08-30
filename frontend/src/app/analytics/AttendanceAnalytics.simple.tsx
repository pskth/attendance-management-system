'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
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
        return (
            <Card className="p-6">
                <div className="text-center text-red-600">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Failed to load attendance analytics</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <CardHeader>
                <CardTitle className="text-xl text-green-900">Attendance Analytics</CardTitle>
                <CardDescription>Academic Year: {academicYear}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600">
                    Simplified component loaded successfully. Data available: {data ? 'Yes' : 'No'}
                </p>
                {data && (
                    <div className="mt-4 space-y-2">
                        <p>Departments: {data.departments?.length || 0}</p>
                        <p>Colleges: {data.colleges?.length || 0}</p>
                        <p>Summary available: {data.summary ? 'Yes' : 'No'}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
