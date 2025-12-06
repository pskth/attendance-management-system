'use client';

interface OverviewStatsProps {
  academicYear: string;
}

export default function OverviewStats({ academicYear }: OverviewStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Overview Statistics</h2>
      <p className="text-gray-600">Academic Year: {academicYear}</p>
      {/* TODO: Add overview stats implementation */}
    </div>
  );
}
