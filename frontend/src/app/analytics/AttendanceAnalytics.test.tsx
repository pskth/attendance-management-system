'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceAnalyticsProps {
    academicYear: string;
}

export default function AttendanceAnalyticsTest({ academicYear }: AttendanceAnalyticsProps) {
    return (
        <Card className="p-6">
            <CardHeader>
                <CardTitle>Test Attendance Analytics</CardTitle>
                <CardDescription>Academic Year: {academicYear}</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This is a minimal test component to verify the import/export works correctly.</p>
            </CardContent>
        </Card>
    );
}
