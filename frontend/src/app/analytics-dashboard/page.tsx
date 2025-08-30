'use client';

import { useState } from 'react';
import OverviewStats from './OverviewStats';
import AttendanceAnalytics from './AttendanceAnalytics';
import MarksAnalytics from './MarksAnalytics';
import ExportReports from './ExportReports';

export default function AnalyticsPage() {
    const [academicYear] = useState('2024-25');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-600 mt-1">Academic Year {academicYear}</p>
                    </div>
                </div>

                {/* Overview Stats */}
                <OverviewStats academicYear={academicYear} />

                {/* Attendance Analytics */}
                <AttendanceAnalytics academicYear={academicYear} />

                {/* Marks Analytics */}
                <MarksAnalytics academicYear={academicYear} />

                {/* Export Reports */}
                <ExportReports filters={{ academicYear }} />
            </div>
        </div>
    );
}
