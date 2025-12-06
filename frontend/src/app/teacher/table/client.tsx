"use client";
import { useState, useEffect } from "react";
import { TeacherAPI, Student } from "@/lib/teacher-api";

type SubColumn = { id: string; name: string; weight: number; maxMark: number };
type ColumnGroup = { id: string; name: string; subColumns: SubColumn[] };

interface MarksTableClientProps {
  courseId: string;
}

export function MarksTableClient({ courseId }: MarksTableClientProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  // Fetch columns and students on mount or when courseId changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch column structure
        const res = await TeacherAPI.getStudentMarks(courseId);
        const columnsData = res.data; // adapt if your API returns differently

        // Convert into ColumnGroup format
        const theoryCols: SubColumn[] = columnsData
          .filter((c: any) => c.type === "theory")
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            weight: c.weightage,
            maxMark: c.maxMarks,
          }));
        const labCols: SubColumn[] = columnsData
          .filter((c: any) => c.type === "lab")
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            weight: c.weightage,
            maxMark: c.maxMarks,
          }));

        const groups: ColumnGroup[] = [];
        if (theoryCols.length > 0) {
          groups.push({ id: "theory", name: "Theory", subColumns: theoryCols });
        }
        if (labCols.length > 0) {
          groups.push({ id: "lab", name: "Lab", subColumns: labCols });
        }

        setColumnGroups(groups);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch marks structure:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) return <div className="text-center py-6">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Student Marks Table</h1>
      {columnGroups.length === 0 ? (
        <p>No test components configured for this course.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Student Name</th>
                {columnGroups.map((group) => (
                  <th key={group.id} colSpan={group.subColumns.length} className="border p-2 text-center">
                    {group.name}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-2"></th>
                {columnGroups.map((group) =>
                  group.subColumns.map((col) => (
                    <th key={col.id} className="border p-2 text-center text-xs">
                      {col.name}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={1 + columnGroups.reduce((sum, g) => sum + g.subColumns.length, 0)} className="border p-2 text-center">
                    No students enrolled
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.student.id}>
                    <td className="border p-2">{student.student.name}</td>
                    {columnGroups.map((group) =>
                      group.subColumns.map((col) => (
                        <td key={col.id} className="border p-2 text-center">
                          <input
                            type="number"
                            max={col.maxMark}
                            min="0"
                            className="w-16 text-center border rounded px-1 py-1"
                            placeholder={`0-${col.maxMark}`}
                            value={marks[student.enrollmentId]?.[col.id] ?? ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setMarks((prev) => ({
                                ...prev,
                                [student.enrollmentId]: {
                                  ...(prev[student.enrollmentId] || {}),
                                  [col.id]: val,
                                },
                              }));
                            }}
                          />
                        </td>
                      ))
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
