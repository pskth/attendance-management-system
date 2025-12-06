'use client';

interface MarksAnalyticsProps {
  academicYear: string;
}

export default function MarksAnalytics({ academicYear }: MarksAnalyticsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Marks Analytics</h2>
      <p className="text-gray-600">Academic Year: {academicYear}</p>
      {/* TODO: Add marks analytics implementation */}
    </div>
  );
}
