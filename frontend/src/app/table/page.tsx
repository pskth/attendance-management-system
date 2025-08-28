"use client";
import { useState } from "react";

type SubColumn = { id: string; name: string; weight: number; maxMark: number };
type ColumnGroup = { id: string; name: string; subColumns: SubColumn[] };

export default function MarksTable() {
  const [students] = useState([
    { id: "s1", name: "Alice" },
    { id: "s2", name: "Bob" },
    { id: "s3", name: "Charlie" },
  ]);

  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([
    {
      id: "theory",
      name: "Theory Marks",
      subColumns: [
        { id: "mse1", name: "MSE 1", weight: 100, maxMark: 100 },
        { id: "mse2", name: "MSE 2", weight: 100, maxMark: 100 },
      ],
    },
    {
      id: "lab",
      name: "Lab Marks",
      subColumns: [
        { id: "record", name: "Record", weight: 100, maxMark: 100 },
        { id: "labmse", name: "Lab MSE", weight: 100, maxMark: 100 },
      ],
    },
  ]);

  // marks[studentId][colId] = mark
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});

  const handleMarkChange = (studentId: string, colId: string, value: number) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [colId]: value },
    }));
  };

  const addSubColumn = (groupId: string, afterId?: string) => {
    setColumnGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const newCol: SubColumn = {
          id: Date.now().toString(),
          name: "New Col",
          weight: 100,
          maxMark: 100,
        };
        if (!afterId) return { ...group, subColumns: [...group.subColumns, newCol] };

        const idx = group.subColumns.findIndex((c) => c.id === afterId);
        const updated = [...group.subColumns];
        updated.splice(idx + 1, 0, newCol);
        return { ...group, subColumns: updated };
      })
    );
  };

  const removeSubColumn = (groupId: string, colId: string) => {
    setColumnGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, subColumns: group.subColumns.filter((c) => c.id !== colId) }
          : group
      )
    );
    setMarks((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((sid) => {
        delete updated[sid]?.[colId];
      });
      return updated;
    });
  };

  const renameSubColumn = (groupId: string, colId: string, newName: string) => {
    setColumnGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map((c) =>
                c.id === colId ? { ...c, name: newName } : c
              ),
            }
          : group
      )
    );
  };

  const updateWeight = (groupId: string, colId: string, newWeight: number) => {
    setColumnGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map((c) =>
                c.id === colId ? { ...c, weight: newWeight } : c
              ),
            }
          : group
      )
    );
  };

  const updateMaxMark = (groupId: string, colId: string, newMax: number) => {
    setColumnGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              subColumns: group.subColumns.map((c) =>
                c.id === colId ? { ...c, maxMark: newMax } : c
              ),
            }
          : group
      )
    );
  };

  // Grand Total for a student
  const calculateGrandTotal = (studentId: string) => {
    let weightedSum = 0;
    let maxWeighted = 0;

    columnGroups.forEach((group) => {
      group.subColumns.forEach((col) => {
        const mark = marks[studentId]?.[col.id] || 0;
        const weight = col.weight;
        const maxMark = col.maxMark || 100;

        weightedSum += (mark / maxMark) * weight;
        maxWeighted += weight;
      });
    });

    if (maxWeighted === 0) return 0;
    return ((weightedSum / maxWeighted) * 50).toFixed(2);
  };

  return (
    <div className="p-4 text-black bg-white">
      <h2 className="text-xl font-semibold mb-2">Student Marks</h2>
      <p className="text-sm mb-4 text-gray-600">
        Hover a column to edit <b>Name</b>, <b>Weight %</b>, and <b>Max Marks</b>.  
        Grand Total is normalized to <b>50</b>.
      </p>

      <table className="border-collapse border w-full">
        <thead>
          <tr>
            <th rowSpan={2} className="border px-3 py-2 bg-gray-50">
              Student
            </th>
            {columnGroups.map((group) => (
              <th
                key={group.id}
                colSpan={group.subColumns.length}
                className="border px-3 py-2 bg-gray-50"
              >
                {group.name}
              </th>
            ))}
            <th rowSpan={2} className="border px-3 py-2 bg-gray-50">
              Grand Total (out of 50)
            </th>
          </tr>
          <tr>
            {columnGroups.flatMap((group) =>
              group.subColumns.map((col) => (
                <th
                  key={col.id}
                  className="border px-3 py-1 relative group bg-white"
                >
                  {/* Editable Name */}
                  <input
                    type="text"
                    defaultValue={col.name}
                    onBlur={(e) =>
                      renameSubColumn(group.id, col.id, e.target.value)
                    }
                    className="text-center w-20 border-b focus:outline-none"
                  />

                  {/* Hover Controls */}
                  <div className="absolute inset-x-0 top-6 hidden group-hover:block text-xs bg-gray-50 border rounded p-1 z-10">
                    {/* Weight Input */}
                    <div>
                      Wt:
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={col.weight}
                        onChange={(e) =>
                          updateWeight(group.id, col.id, Number(e.target.value))
                        }
                        className="w-14 border px-1 text-center ml-1"
                      />{" "}
                      %
                    </div>
                    {/* Max Marks Input */}
                    <div className="mt-1">
                      Max:
                      <input
                        type="number"
                        min={1}
                        value={col.maxMark}
                        onChange={(e) =>
                          updateMaxMark(group.id, col.id, Number(e.target.value))
                        }
                        className="w-14 border px-1 text-center ml-1"
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-1">
                      <button
                        onClick={() => addSubColumn(group.id, col.id)}
                        className="text-green-600"
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => removeSubColumn(group.id, col.id)}
                        className="text-red-600"
                      >
                        ➖
                      </button>
                    </div>
                  </div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {students.map((stu) => (
            <tr key={stu.id}>
              <td className="border px-3 py-1">{stu.name}</td>
              {columnGroups.flatMap((group) =>
                group.subColumns.map((col) => (
                  <td key={col.id} className="border px-3 py-1 text-center">
                    <input
                      type="number"
                      className="w-16 text-center"
                      placeholder="-"
                      value={marks[stu.id]?.[col.id] ?? ""}
                      onChange={(e) =>
                        handleMarkChange(stu.id, col.id, Number(e.target.value))
                      }
                    />
                  </td>
                ))
              )}
              <td className="border px-3 py-1 text-center font-semibold">
                {calculateGrandTotal(stu.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
