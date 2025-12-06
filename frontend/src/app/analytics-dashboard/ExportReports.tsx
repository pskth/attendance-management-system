'use client';

interface ExportReportsProps {
  filters: {
    academicYear: string;
  };
}

export default function ExportReports({ filters }: ExportReportsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Export Reports</h2>
      <p className="text-gray-600">Academic Year: {filters.academicYear}</p>
      {/* TODO: Add export reports implementation */}
    </div>
  );
}
