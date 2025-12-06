'use client';

interface AttendanceAnalyticsProps {
  academicYear: string;
}

export default function AttendanceAnalytics({ academicYear }: AttendanceAnalyticsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Analytics</h2>
      <p className="text-gray-600">Academic Year: {academicYear}</p>
      {/* TODO: Add attendance analytics implementation */}
    </div>
  );
}
