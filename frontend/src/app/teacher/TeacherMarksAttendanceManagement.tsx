"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Save,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
} from "lucide-react";
import { TeacherAPI, type CourseOffering } from "@/lib/teacher-api";

// Client-side only ID generator to avoid hydration issues
let tempIdCounter = 0;
const generateTempId = () => `temp-${Date.now()}-${++tempIdCounter}`;

//interface for test components
interface StudentMarkComponent {
  componentId: string;
  componentName: string;
  type: "theory" | "lab" | string; // restrict if you know all possible types
  obtainedMarks: number | null;
  maxMarks: number;
  weightage: number;
}
// Types for marks and attendance
interface StudentMark {
  id: string;
  enrollmentId: string;
  usn: string;
  student_name: string;
  course_code: string;
  course_name: string;
  marks: StudentMarkComponent[]; // Combined marks for all components
  last_updated_at: string;
}

interface StudentMarksContainer {

  id: string;
  maxMarks: number;
  weightage: number;
  obtainedMarks: number | null;
  name: string;

}

interface StudentMark1 {
  componentId: string;
  obtainedMarks?: number | null;
}

interface Student {
  studentId: string;
  studentName: string;
  marks: StudentMark1[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  usn: string;
  student_name: string;
  status: "present" | "absent" | "unmarked";
  courseId?: string;
  courseName?: string;
}

interface MarksAttendanceProps {
  courses: CourseOffering[];
  selectedCourseId: string;
  initialMode?: "marks" | "attendance";
  teacherId: string;
}
interface TestComponent {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  weightage: number;
  obtainedMarks: number;
}


export default function TeacherMarksAttendanceManagement({
  courses,
  teacherId,
  selectedCourseId,
  initialMode = "marks",
}: MarksAttendanceProps) {
  // State management
  const [activeTab, setActiveTab] = useState<"marks" | "attendance">(
    initialMode
  );
  //stores array of StudentMark objects fetched from the database
  const [marks, setMarks] = useState<StudentMark[]>([]);

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [editingMarkField, setEditingMarkField] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    selectedCourseId || "all"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsError, setComponentsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [componentsTest, setComponentsTest] = useState<TestComponent[]>([]); // to store test components structure
  const [componentsR, setComponentsR] = useState<true | false>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (selectedCourseId && (selectedCourse === "all" || !selectedCourse)) {
      setSelectedCourse(selectedCourseId);
    }
  }, [selectedCourseId, selectedCourse]);



  // Load data from database
  // useEffect(() => {
  //   console.log("Fetching compoennts pls be the first time")
  //   const fetchComponents = async () => {
  //     try {
  //       const structureResponse = await TeacherAPI.getCourseTestComponents(
  //         selectedCourseId || "",
  //         teacherId
  //       );

  //       const components: TestComponent[] = structureResponse.components || [];
  //       console.log("Fetched components for course (initial load):", selectedCourseId, components);
  //       console.log("structureResponse:", structureResponse.status);
  //       if (structureResponse.status == 'success') { // check response status, not components.status
  //         console.log("True it is")
  //         setComponentsTest(prev => [...prev, ...components]);

  //         console.log("componentsTest state after setting:", componentsTest);
  //         setComponentsR(true);
  //         loadMarksData();
  //       }
  //       console.log("After fetching components, componentsTest state:", componentsTest);
  //     } catch (err) {
  //       console.error("Failed to fetch components", err);
  //     }
  //   };

  //   fetchComponents();
  // }, [componentsTest]);

  //   useEffect(() => {
  //     if (activeTab === "marks") {
  //       loadMarksData();
  //     } else {
  //       loadAttendanceData();
  //     }
  //   }, [ componentsR]);

  useEffect(() => {
    const fetchComponentsAndMarks = async () => {
      if (!selectedCourse || !teacherId) {
        console.log("Waiting for course and teacher selection...");
        setComponentsLoading(false);
        return;
      }

      if (selectedCourse === "all") {
        setComponentsTest([]);
        setComponentsR(false);
        setComponentsError(null);
        setMarks([]);
        setComponentsLoading(false);
        return;
      }

      setComponentsLoading(true);
      setComponentsError(null);

      try {
        const structureResponse = await TeacherAPI.getCourseTestComponents(
          selectedCourse,
          teacherId
        );

        const fetchedComponents: TestComponent[] = structureResponse.components || [];
        console.log("Fetched components:", fetchedComponents);
        setComponentsR(true);
        // 1️⃣ Update state
        setComponentsTest(fetchedComponents);

        // 2️⃣ Fetch marks AFTER components are ready
        await loadMarksData(fetchedComponents); // pass components directly
      } catch (err) {
        console.error("Failed to fetch components or marks:", err);
        setComponentsR(false);
        setComponentsError("Failed to load components. Please try again.");
      } finally {
        setComponentsLoading(false);
      }
    };

    fetchComponentsAndMarks();
  }, [selectedCourse, teacherId]); // run when course or teacher changes

  // Load attendance whenever tab, course, or date changes
  useEffect(() => {
    if (activeTab === "attendance") {
      if (selectedCourse && selectedCourse !== "all") {
        loadAttendanceData();
      } else {
        // Clear list when "All My Courses" is selected
        setAttendanceRecords([]);
      }
    }
  }, [activeTab, selectedCourse, selectedDate]);

  // const loadMarksData = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const allMarks: StudentMark[] = [];
  //     console.log("load marks data is run:", teacherId);
  //     if (selectedCourse === "all") {
  //       // Loop through all courses
  //       console.log("Loading marks for all courses:", courses);
  //       for (const course of courses) {
  //         try {
  //           // 1️⃣ Fetch the table structure (components)

  //           // 2️⃣ Fetch students + their marks
  //           const marksResponse = await TeacherAPI.getCourseStudentMarks(
  //             course.offeringId,
  //             teacherId
  //           );

  //           if (marksResponse.status === "success" && marksResponse.students) {
  //             for (const student of marksResponse.students) {
  //               // 3️⃣ Initialize student marks with all components
  //               console.log("Fetched components for course:", course.course.code, marksResponse.students);
  //               const studentMarks: StudentMarkComponent[] = student.marks.map(
  //                 (c) => ({
  //                   componentId: c.componentId,
  //                   componentName: c.name,  
  //                   type: c.type,
  //                   maxMarks: c.maxMarks,
  //                   weightage: c.weightage,
  //                   obtainedMarks: null,
  //                 })
  //               );

  //               // 4️⃣ Overlay actual marks from API
  //               student.marks.forEach((m: StudentMarkComponent) => {
  //                 const comp = studentMarks.find(
  //                   (c) => c.componentId === m.componentId
  //                 );
  //                 if (comp) comp.obtainedMarks = m.obtainedMarks;
  //               });

  //               // 5️⃣ Build student row
  //               const studentMark: StudentMark = {
  //                 id: student.studentId,
  //                 enrollmentId: student.studentId, // replace with real enrollmentId if available
  //                 usn: student.usn,
  //                 student_name: student.studentName,
  //                 course_code: course.course.code,
  //                 course_name: course.course.name,
  //                 marks: studentMarks,
  //                 last_updated_at: new Date().toISOString(),
  //               };

  //               allMarks.push(studentMark);
  //             }
  //           }
  //         } catch (err) {
  //           console.error(`Error loading course ${course.course.code}:`, err);
  //         }
  //       }

  //       setMarks(allMarks);
  //     } else {
  //       // Specific course
  //       console.log("Loading marks for specific course :", selectedCourse   );
  //       // const course = courses.find((c) => c.offeringId === selectedCourse);
  //       // console.log("Found course for marks loading:", course);
  //       // if (!course) return;
  //       const course = selectedCourse
  //       console.log("Found courseid and teacher id at TMA page:", course,teacherId);
  //       // 2️⃣ Fetch students + marks
  //       const marksResponse = await TeacherAPI.getCourseStudentMarks(
  //         course,
  //         teacherId
  //       );
  //       console.log("Fetched marks response:", marksResponse);
  //       const courseMarks: StudentMark[] = [];

  //       if (marksResponse.status === "success" && marksResponse.students) {
  //         for (const student of marksResponse.students) {
  //           // 3️⃣ Initialize all components (imagine one students dont have marks to that column then what to do ?)
  //           const studentMarks: StudentMarkComponent[] = componentsTest.map(
  //             (c) => ({
  //               componentId: c.id,
  //               componentName: c.name,
  //               type: c.type,
  //               maxMarks: c.maxMarks,
  //               weightage: c.weightage,
  //               obtainedMarks: null,
  //             })
  //           );  
  //           console.log("Initialized student :", student," marks ",studentMarks," componentsTest ",componentsTest);  
  //           // 4️⃣ Overlay actual marks
  //           student.marks.forEach((m) => {
  //             const comp = studentMarks.find(
  //               (c) => c.componentId === m.componentId
  //             );
  //             if (comp) comp.obtainedMarks = m.obtainedMarks;
  //           });
  //           const cnc = await TeacherAPI.getCourseNameAndCode(course);
  //           let course_code = "";
  //           let course_name = "";
  //           if (cnc.status === "success") {
  //             course_code = cnc.data.code;
  //             course_name = cnc.data.name;
  //           }

  //           // 5️⃣ Build student row
  //           const studentMark: StudentMark = {
  //             id: student.studentId,
  //             enrollmentId: student.studentId,
  //             usn: student.usn,
  //             student_name: student.studentName,
  //             course_code: course_code || "",
  //             course_name: course_name || "",
  //             marks: studentMarks,
  //             last_updated_at: new Date().toISOString(),
  //           };

  //           courseMarks.push(studentMark);
  //         }
  //       }
  //       console.log("course marks after filtering i guess:", courseMarks);
  //       setMarks(courseMarks);

  //     }
  //   } catch (err) {
  //     setError("Failed to load marks data");
  //     console.error("Error loading marks:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadMarksData = async (currentComponents: TestComponent[]) => {
    setLoading(true);
    setError(null);
    console.log("loadMarksData called with components:", currentComponents);
    try {
      const courseMarks: StudentMark[] = [];
      
      // Find the course object to get the actual courseId (not offeringId)
      const courseObj = courses.find(c => c.offeringId === selectedCourse);
      const actualCourseId = courseObj?.course?.id || selectedCourse;
      
      const cnc = await TeacherAPI.getCourseNameAndCode(actualCourseId);
      let course_code = "";
      let course_name = "";
      if (cnc.status === "success") {
        course_code = cnc.data.code;
        course_name = cnc.data.name;
      }
      const marksResponse = await TeacherAPI.getCourseStudentMarks(
        selectedCourse,
        teacherId
      );

      if (marksResponse.status === "success" && marksResponse.students) {
        for (const student of marksResponse.students) {
          // Initialize marks using the fetched components
          const studentMarks: StudentMarkComponent[] = currentComponents.map(c => ({
            componentId: c.id,
            componentName: c.name,
            type: c.type,
            maxMarks: c.maxMarks,
            weightage: c.weightage,
            obtainedMarks: null,
          }));

          // Overlay actual marks
          student.marks.forEach(m => {
            const comp = studentMarks.find(c => c.componentId === m.componentId);
            if (comp) comp.obtainedMarks = m.obtainedMarks;
          });

          // Build student row
          courseMarks.push({
            id: student.studentId,
            enrollmentId: student.studentId,
            usn: student.usn,
            student_name: student.studentName,
            course_code: course_code,
            course_name: course_name,
            marks: studentMarks,
            last_updated_at: new Date().toISOString(),
          });
        }
      }

      setMarks(courseMarks);
    } catch (err) {
      setError("Failed to load marks data");
      console.error("Error loading marks:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (selectedCourse === "all") {
      setAttendanceRecords([]);
      return;
    }

    // Check if selected date is in the future
    const dateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj > today) {
      setError("Cannot mark attendance for future dates");
      setAttendanceRecords([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load student attendance for the selected date and course
      const response = await TeacherAPI.getStudentAttendance(
        selectedCourse,
        selectedDate
      );

      if (response.status === "success") {
        const transformedAttendance: AttendanceRecord[] = response.data.map(
          (item: any) => ({
            id: item.attendanceRecordId || `temp-${item.studentId}`, // Use temp ID if no record exists yet
            date: selectedDate,
            studentId: item.studentId,
            usn: item.usn || "",
            student_name: item.student_name || "",
            status: item.status as "present" | "absent" | "unmarked",
            courseId: item.courseId,
            courseName: item.courseName,
          })
        );

        setAttendanceRecords(transformedAttendance);
      }
    } catch (err) {
      setError("Failed to load attendance data");
      console.error("Error loading attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle marks editing (DEPRECATED - using dynamic marks structure now)
  // const handleMarkEdit = async (
  //   enrollmentId: string,
  //   field: string,
  //   value: string
  // ) => {
  //   const numValue = value === "" ? null : parseInt(value);
  //   try {
  //     const response = await TeacherAPI.updateStudentMark(
  //       enrollmentId,
  //       field,
  //       numValue
  //     );
  //     if (response.status === "success") {
  //       // Update local state
  //       setMarks((prev) =>
  //         prev.map((mark) => {
  //           if (mark.enrollmentId === enrollmentId) {
  //             const updatedMark = { ...mark, [field]: numValue };

  //             // Handle MSE3 eligibility constraint
  //             if (field === "mse1_marks" || field === "mse2_marks") {
  //               const mse1 =
  //                 field === "mse1_marks" ? numValue : updatedMark.mse1_marks;
  //               const mse2 =
  //                 field === "mse2_marks" ? numValue : updatedMark.mse2_marks;

  //               // If MSE1 + MSE2 >= 20, clear MSE3
  //               if ((mse1 || 0) + (mse2 || 0) >= 20) {
  //                 updatedMark.mse3_marks = null;
  //               }
  //             }

  //             // Recalculate totals
  //             const theoryTotal = [
  //               updatedMark.mse1_marks,
  //               updatedMark.mse2_marks,
  //               updatedMark.mse3_marks,
  //               updatedMark.task1_marks,
  //               updatedMark.task2_marks,
  //               updatedMark.task3_marks,
  //             ].reduce((sum, val) => (sum || 0) + (val || 0), 0);

  //             const labTotal = [
  //               updatedMark.record_marks,
  //               updatedMark.continuous_evaluation_marks,
  //               updatedMark.lab_mse_marks,
  //             ].reduce((sum, val) => (sum || 0) + (val || 0), 0);

  //             updatedMark.theory_total = theoryTotal || 0;
  //             updatedMark.lab_total = labTotal || 0;
  //             updatedMark.last_updated_at = new Date().toISOString();
  //             return updatedMark;
  //           }
  //           return mark;
  //         })
  //       );
  //     }
  //   } catch (err) {
  //     console.error("Error updating mark:", err);
  //     const errorMessage =
  //       err instanceof Error ? err.message : "Failed to update mark";
  //     setError(`Failed to update mark: ${errorMessage}`);
  //   }
  //   setEditingMarkId(null);
  //   setEditingMarkField(null);
  // };

  // Handle attendance toggle
  const toggleAttendance = async (recordId: string) => {
    const record = attendanceRecords.find((r) => r.id === recordId);
    if (!record) return;

    if (selectedCourse === "all") {
      setError("Please select a specific course to mark attendance");
      return;
    }

    try {
      // Cycle through the three states: unmarked -> present -> absent -> unmarked
      let newStatus: "present" | "absent" | "unmarked";
      if (record.status === "unmarked") {
        newStatus = "present";
      } else if (record.status === "present") {
        newStatus = "absent";
      } else {
        newStatus = "unmarked";
      }

      const response = await TeacherAPI.updateStudentAttendance({
        studentId: record.studentId,
        courseId: selectedCourse,
        date: selectedDate,
        status: newStatus,
      });

      if (response.status === "success") {
        setAttendanceRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      setError("Failed to update attendance");
    }
  };

  // Create attendance session for selected date and course
  // Export marks functionality
  // const exportMarks = () => {
  //     const csvContent = [
  //         ['USN', 'Name', 'Course', 'MSE1', 'MSE2', 'MSE3', 'Task1', 'Task2', 'Task3', 'Theory Total', 'Record', 'Continuous', 'Lab MSE', 'Lab Total'].join(','),
  //         ...marks.map(mark => [
  //             mark.usn,
  //             mark.student_name,
  //             `${mark.course_code} - ${mark.course_name}`,
  //             mark.mse1_marks || '',
  //             mark.mse2_marks || '',
  //             mark.mse3_marks || '',
  //             mark.task1_marks || '',
  //             mark.task2_marks || '',
  //             mark.task3_marks || '',
  //             mark.theory_total,
  //             mark.record_marks || '',
  //             mark.continuous_evaluation_marks || '',
  //             mark.lab_mse_marks || '',
  //             mark.lab_total
  //         ].join(','))
  //     ].join('\n')

  //     const blob = new Blob([csvContent], { type: 'text/csv' })
  //     const url = window.URL.createObjectURL(blob)
  //     const a = document.createElement('a')
  //     a.href = url
  //     a.download = `teacher_marks_${selectedCourse === 'all' ? 'all_courses' : selectedCourse}_${new Date().toISOString().split('T')[0]}.csv`
  //     a.click()
  //     window.URL.revokeObjectURL(url)
  // }
  const exportMarks = () => {
    if (!marks.length) return;

    // 1️⃣ Generate dynamic headers
    const headers = ["USN", "Name", "Course"];
    // Add component names dynamically (the first student's marks are used to get the headers)
    const componentNames = marks[0].marks.map((m) => m.componentName);
    headers.push(...componentNames);
    headers.push("Last Updated");

    // 2️⃣ Generate CSV rows
    const rows = marks.map((mark) => {
      const row = [
        mark.usn,
        mark.student_name,
        `${mark.course_code} - ${mark.course_name}`,
        ...mark.marks.map((m) => m.obtainedMarks ?? ""), // overlay actual marks
        mark.last_updated_at,
      ];
      return row.join(",");
    });

    // 3️⃣ Combine headers + rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4️⃣ Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher_marks_${selectedCourse === "all" ? "all_courses" : selectedCourse
      }_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter data based on search term
  const filteredMarks = marks.filter((mark) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      mark.usn.toLowerCase().includes(search) ||
      mark.student_name.toLowerCase().includes(search) ||
      mark.course_code.toLowerCase().includes(search) ||
      mark.course_name.toLowerCase().includes(search)
    );
  });

  const filteredAttendanceRecords = attendanceRecords.filter((record) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.usn.toLowerCase().includes(search) ||
      record.student_name.toLowerCase().includes(search) ||
      (record.courseName && record.courseName.toLowerCase().includes(search))
    );
  });

  // Calculate attendance summary for selected date (using filtered data)
  const attendanceSummary = {
    present: filteredAttendanceRecords.filter((r) => r.status === "present")
      .length,
    absent: filteredAttendanceRecords.filter((r) => r.status === "absent")
      .length,
    unmarked: filteredAttendanceRecords.filter((r) => r.status === "unmarked")
      .length,
    total: filteredAttendanceRecords.length,
  };

  // Generate calendar for current month
  const generateCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const hasData = false; // We'll load this from API later
      const isSelected = date === selectedDate;
      
      // Disable future dates
      const dateObj = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      const isFutureDate = dateObj > today;

      days.push(
        <button
          key={day}
          onClick={() => !isFutureDate && setSelectedDate(date)}
          disabled={isFutureDate}
          className={`h-8 w-8 text-sm rounded ${isFutureDate
            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
            : isSelected
            ? "bg-emerald-600 text-white"
            : hasData
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "hover:bg-gray-100"
            }`}
          title={isFutureDate ? "Cannot mark attendance for future dates" : ""}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[currentMonth];
  };
  const handleSaveComponents = async () => {
    try {
      if (!selectedCourse || selectedCourse === 'all') {
        alert('Please select a specific course before saving columns.');
        return;
      }
      if (!componentsTest || componentsTest.length === 0) return;

      console.log('Saving components:', componentsTest);
      console.log('Course ID:', selectedCourse);
      console.log('Teacher ID:', teacherId);

      const response = await TeacherAPI.saveComponents(selectedCourse, teacherId, componentsTest);

      if (response.status == 'success') {
        alert('Components saved successfully!');
      } else {
        alert('Failed to save components: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Full error:', err);
      alert('Error saving components: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  // const saveMarks = async (studentsToSave: Student[]) => {
  //   try {
  //     console.log("Students to save:", studentsToSave);
  //     if (!studentsToSave.length) return;

  //     // 🔧 Map your frontend Student → backend API shape
  //     const payload = studentsToSave.map((student) => ({
  //       studentId: student.studentId ,
  //       marks: student.marks.map((m) => ({
  //         componentId: m.componentId,
  //         marksObtained: m.obtainedMarks ?? 0,
  //       })),
  //     }));
  //     console.log("Payload for saving marks:", payload);

  //     const updatedStudents = await TeacherAPI.saveStudentMarks(
  //       selectedCourse,
  //       teacherId,
  //       payload
  //     );

  //     if (studentsToSave.length === 1) {
  //       console.log("Single student marks saved:", updatedStudents);
  //       alert(`Marks for ${updatedStudents[0].studentName} saved!`);
  //     } else {
  //       alert("All selected student marks saved!");
  //     }

  //     return updatedStudents;
  //   } catch (error: any) {
  //     console.error("Error saving marks:", error);
  //     alert(error.message || "Failed to save marks");
  //   }
  // };

  // Frontend shape
  interface FrontendStudent {
    id: string;
    enrollmentId: string;
    usn: string;
    student_name: string;
    course_code: string;
    course_name: string;
    marks: {
      componentId: string;
      componentName?: string;
      type?: string;
      maxMarks?: number;
      weightage?: number;
      obtainedMarks: number | null;
    }[];
    last_updated_at?: string;
  }

  // saveMarks function
  const saveMarks = async (studentsToSave: FrontendStudent[]) => {
    try {
      if (!selectedCourse || selectedCourse === 'all') {
        alert('Please select a specific course before saving marks.');
        return;
      }
      console.log("Students to save:", studentsToSave);
      if (!studentsToSave.length) return;

      // Transform frontend object → backend payload
      const payload = studentsToSave.map((student) => ({
        studentId: student.id, // backend expects this
        marks: student.marks.map((m) => ({
          componentId: m.componentId,
          marksObtained: m.obtainedMarks ?? 0, // null → 0
        })),
      }));

      // Call backend API
      const updatedStudents = await TeacherAPI.saveStudentMarks(
        selectedCourse,
        teacherId,
        payload
      );

      if (studentsToSave.length === 1) {
        alert(`Marks for ${studentsToSave[0].student_name} saved!`);
      } else {
        alert("All selected student marks saved!");
      }

      return updatedStudents;
    } catch (error: any) {
      console.error("Error saving marks:", error);
      alert(error.message || "Failed to save marks");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Marks & Attendance Management
              </CardTitle>
              <CardDescription className="text-gray-800">
                View and edit student marks and attendance for your assigned
                courses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "marks" ? "default" : "outline"}
                onClick={() => setActiveTab("marks")}
                className={
                  activeTab === "marks"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Marks
              </Button>
              <Button
                variant={activeTab === "attendance" ? "default" : "outline"}
                onClick={() => setActiveTab("attendance")}
                className={
                  activeTab === "attendance"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                Attendance
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-4 items-center">
              <label htmlFor="course-select" className="text-sm font-medium">
                Select Course:
              </label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[300px]"
              >
                <option value="all">All My Courses</option>
                {courses.map((course) => (
                  <option key={course.offeringId} value={course.offeringId}>
                    {course.course.code} - {course.course.name}
                    {course.section && ` (Section ${course.section.name})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 items-center">
              <label htmlFor="student-search" className="text-sm font-medium">
                Search Student:
              </label>
              <Input
                id="student-search"
                type="text"
                placeholder="Search by USN, name, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-[250px]"
              />
            </div>
            {activeTab === "marks" && (
              <Button onClick={exportMarks} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Marks
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {activeTab === "marks" && (
        loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            </CardContent>
          </Card>
        ) : componentsLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2 text-gray-600">Loading components...</span>
              </div>
            </CardContent>
          </Card>
        ) : componentsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{componentsError}</p>
            </CardContent>
          </Card>
        ) : selectedCourse === "all" ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Select a specific course to load marks components.</p>
            </CardContent>
          </Card>
        ) : componentsR ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Student Marks</CardTitle>
            <CardDescription className="text-sm">
              Click on any mark to edit. Shows theory marks and lab marks for
              each course. Totals are automatically calculated. Add or remove columns using the + Add and × buttons.
            </CardDescription>
            {hasUnsavedChanges && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  You have unsaved changes. Click "Save All Changes" to save your edits.
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Course
                    </th>
                    <th
                      className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      colSpan={componentsTest.filter((c) => c.type === "theory").length + 2}
                    >
                      Theory Marks
                    </th>
                    <th
                      className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      colSpan={componentsTest.filter((c) => c.type === "lab").length + 2}
                    >
                      Lab Marks
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      USN & Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code & Name
                    </th>

                    {/* Dynamic Theory Columns */}
                    {componentsTest.filter(c => c.type === 'theory').map((comp, index) => (
                      <th key={comp.id} className="border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={comp.name}
                            className="border rounded px-1 py-0.5 text-xs w-20"
                            onChange={(e) => {
                              const newName = e.target.value;
                              setComponentsTest(prev =>
                                prev.map(c => c.id === comp.id ? { ...c, name: newName } : c)
                              );
                            }}
                          />
                          <button
                            className="text-red-500 text-xs font-bold hover:bg-red-100 px-1 rounded"
                            onClick={() => {
                              if (confirm(`Delete column "${comp.name}"? This will remove marks for all students.`)) {
                                setComponentsTest((prev) => prev.filter((c) => c.id !== comp.id));
                                // Remove marks for this component from all students
                                setMarks((prev) => prev.map(student => ({
                                  ...student,
                                  marks: student.marks.filter(m => m.componentId !== comp.id)
                                })));
                              }
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* Add new theory column */}
                    <th className="border px-3 py-2">
                      <button
                        className="text-green-600 text-xs font-semibold hover:bg-green-100 px-2 py-1 rounded"
                        onClick={() => {
                          const newComp = {
                            id: generateTempId(),
                            name: "New Column",
                            type: "theory",
                            maxMarks: 20,
                            weightage: 100,
                            obtainedMarks: 0,
                          };
                          setComponentsTest((prev) => [...prev, newComp]);

                          // Add empty marks entry for all students
                          setMarks((prev) => prev.map(student => ({
                            ...student,
                            marks: [...student.marks, {
                              componentId: newComp.id,
                              componentName: newComp.name,
                              type: newComp.type,
                              maxMarks: newComp.maxMarks,
                              weightage: newComp.weightage,
                              obtainedMarks: null
                            }]
                          })));
                        }}
                      >
                        + Add
                      </button>
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Theory Total
                    </th>

                    {/* Dynamic Lab Columns */}
                    {componentsTest.filter(c => c.type === 'lab').map((comp, index) => (
                      <th key={comp.id} className="border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={comp.name}
                            className="border rounded px-1 py-0.5 text-xs w-20"
                            onChange={(e) => {
                              const newName = e.target.value;
                              setComponentsTest(prev =>
                                prev.map(c => c.id === comp.id ? { ...c, name: newName } : c)
                              );
                            }}
                          />
                          <button
                            className="text-red-500 text-xs font-bold hover:bg-red-100 px-1 rounded"
                            onClick={() => {
                              if (confirm(`Delete column "${comp.name}"? This will remove marks for all students.`)) {
                                setComponentsTest((prev) => prev.filter((c) => c.id !== comp.id));
                                // Remove marks for this component from all students
                                setMarks((prev) => prev.map(student => ({
                                  ...student,
                                  marks: student.marks.filter(m => m.componentId !== comp.id)
                                })));
                              }
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* Add new lab column */}
                    <th className="border px-3 py-2">
                      <button
                        className="text-green-600 text-xs font-semibold hover:bg-green-100 px-2 py-1 rounded"
                        onClick={() => {
                          const newComp = {
                            id: generateTempId(),
                            name: "New Column",
                            type: "lab",
                            maxMarks: 20,
                            weightage: 100,
                            obtainedMarks: 0,
                          };
                          setComponentsTest((prev) => [...prev, newComp]);

                          // Add empty marks entry for all students
                          setMarks((prev) => prev.map(student => ({
                            ...student,
                            marks: [...student.marks, {
                              componentId: newComp.id,
                              componentName: newComp.name,
                              type: newComp.type,
                              maxMarks: newComp.maxMarks,
                              weightage: newComp.weightage,
                              obtainedMarks: null
                            }]
                          })));
                        }}
                      >
                        + Add
                      </button>
                    </th>

                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lab Total
                    </th>
                    <th></th>
                    {/* Save Components Button */}
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        className={`text-xs px-2 py-1 rounded font-medium shadow-sm ${selectedCourse === 'all' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'}`}
                        title={selectedCourse === 'all' ? 'Select a specific course to save its columns' : ''}
                        disabled={selectedCourse === 'all'}
                        onClick={async () => {
                          try {
                            await handleSaveComponents();
                          } catch (error) {
                            console.error('Error saving components:', error);
                          }
                        }}
                      >
                        Save Columns
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {marks.length === 0 ? (
                    <tr>
                      <td colSpan={componentsTest.length + 6} className="border border-gray-300 px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium">No marks data available</p>
                          <p className="text-sm">Select a course to view and edit student marks</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    marks.map((mark) => {
                      const round1 = (num: number) => Math.round(num * 10) / 10;


                      // Show raw sum of marks for theory and lab
                      const theoryTotal = mark.marks
                        .filter((m) => m.type === "theory")
                        .reduce((sum, m) => sum + (m.obtainedMarks ?? 0), 0);
                      const labTotal = mark.marks
                        .filter((m) => m.type === "lab")
                        .reduce((sum, m) => sum + (m.obtainedMarks ?? 0), 0);

                      return (
                        <tr key={mark.enrollmentId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="font-mono text-sm font-bold">{mark.usn}</div>
                            <div className="text-sm text-gray-600">{mark.student_name}</div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="font-mono text-sm font-bold">{mark.course_code}</div>
                            <div className="text-sm text-gray-600">{mark.course_name}</div>
                          </td>

                          {/* Editable Theory Marks */}
                          {componentsTest.filter((c) => c.type === "theory").map((comp) => {
                            const studentMark = mark.marks.find((m) => m.componentId === comp.id);
                            return (
                              <td key={comp.id} className="border border-gray-300 px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxMarks}
                                  value={studentMark?.obtainedMarks ?? ""}
                                  placeholder="-"
                                  className="w-16 border px-1 py-1 text-sm rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = value === "" ? null : Number(value);

                                    // Validate against max marks
                                    if (numValue !== null && (numValue < 0 || numValue > comp.maxMarks)) {
                                      return; // Don't update if invalid
                                    }

                                    const updatedMarks = marks.map((m) => {
                                      if (m.enrollmentId === mark.enrollmentId) {
                                        return {
                                          ...m,
                                          marks: m.marks.map((sm) => {
                                            if (sm.componentId === comp.id) {
                                              return { ...sm, obtainedMarks: numValue };
                                            }
                                            return sm;
                                          }),
                                        };
                                      }
                                      return m;
                                    });
                                    setMarks(updatedMarks);
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td></td>
                          <td className="border border-gray-300 px-3 py-2 font-bold text-emerald-600">{theoryTotal}</td>

                          {/* Editable Lab Marks */}
                          {componentsTest.filter((c) => c.type === "lab").map((comp) => {
                            const studentMark = mark.marks.find((m) => m.componentId === comp.id);
                            return (
                              <td key={comp.id} className="border border-gray-300 px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxMarks}
                                  value={studentMark?.obtainedMarks ?? ""}
                                  placeholder="-"
                                  className="w-16 border px-1 py-1 text-sm rounded text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = value === "" ? null : Number(value);

                                    // Validate against max marks
                                    if (numValue !== null && (numValue < 0 || numValue > comp.maxMarks)) {
                                      return; // Don't update if invalid
                                    }

                                    const updatedMarks = marks.map((m) => {
                                      if (m.enrollmentId === mark.enrollmentId) {
                                        return {
                                          ...m,
                                          marks: m.marks.map((sm) => {
                                            if (sm.componentId === comp.id) {
                                              return { ...sm, obtainedMarks: numValue };
                                            }
                                            return sm;
                                          }),
                                        };
                                      }
                                      return m;
                                    });
                                    setMarks(updatedMarks);
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td></td>
                          <td className="border border-gray-300 px-3 py-2 font-bold text-green-600">{labTotal}</td>

                          <td className="border border-gray-300 px-3 py-2 text-xs text-gray-500">
                            {new Date(mark.last_updated_at).toLocaleDateString()}
                          </td>

                          {/* Save Student Marks */}
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button
                              className={`px-3 py-1.5 text-xs rounded font-medium shadow-sm ${selectedCourse === 'all' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 transition-colors'}`}
                              disabled={selectedCourse === 'all'}
                              title={selectedCourse === 'all' ? 'Select a specific course to save marks' : ''}
                              onClick={async () => {
                                try {
                                  await saveMarks([mark]);
                                  setHasUnsavedChanges(false);
                                  alert(`Marks saved successfully for ${mark.student_name}!`);
                                } catch (error) {
                                  alert(`Failed to save marks for ${mark.student_name}`);
                                }
                              }}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Bulk Save All Marks Button */}
              <div className="mt-4 flex justify-end px-4">
                <button
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm ${hasUnsavedChanges && selectedCourse !== 'all'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  disabled={!hasUnsavedChanges || selectedCourse === 'all'}
                  title={selectedCourse === 'all' ? 'Select a specific course to save marks' : ''}
                  onClick={async () => {
                    try {
                      await saveMarks(marks);
                      setHasUnsavedChanges(false);
                      alert('All marks saved successfully!');
                    } catch (error) {
                      alert('Failed to save marks. Please try again.');
                    }
                  }}
                >
                  {hasUnsavedChanges ? 'Save All Changes' : 'No Unsaved Changes'}
                </button>
              </div>

            </div>
          </CardContent>
        </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">No components found for this course.</p>
            </CardContent>
          </Card>
        )
      )}















      {!loading && activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Attendance Calendar</CardTitle>
              <CardDescription>
                Click on a date to view/edit attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-medium text-lg">
                  {getMonthName()} {currentYear}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 p-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>
              <div className="mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Has attendance data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                  <span>Selected date</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Attendance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Attendance for {new Date(selectedDate).toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.length > 0 ? (
                      <>
                        {attendanceSummary.present} present,{" "}
                        {attendanceSummary.absent} absent
                        {attendanceSummary.unmarked > 0 &&
                          `, ${attendanceSummary.unmarked} unmarked`}
                      </>
                    ) : selectedCourse === "all" ? (
                      "Select a specific course to view attendance"
                    ) : (
                      "All students are unmarked for this date - click to mark attendance"
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        USN
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status (Click to Toggle)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredAttendanceRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-gray-300 px-6 py-8 text-center"
                        >
                          <div className="text-gray-500">
                            {searchTerm.trim() ? (
                              <div>
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="font-medium">No students found</p>
                                <p className="text-sm">
                                  No students match "{searchTerm}". Try a
                                  different search term.
                                </p>
                              </div>
                            ) : selectedCourse === "all" ? (
                              <div>
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="font-medium">
                                  Select a specific course to mark attendance
                                </p>
                                <p className="text-sm">
                                  Choose a course from the dropdown above to
                                  view and mark student attendance
                                </p>
                              </div>
                            ) : (
                              <div>
                                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="font-medium">
                                  Loading attendance data...
                                </p>
                                <p className="text-sm">
                                  Attendance data will appear automatically when
                                  loaded
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAttendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 font-mono text-sm">
                            {record.usn}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 font-medium">
                            {record.student_name}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="text-sm">
                              <div className="font-medium">
                                {record.courseName || "No Course"}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <button
                              onClick={() => toggleAttendance(record.id)}
                              className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition-colors duration-200 ${record.status === "present"
                                ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                                : record.status === "absent"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                                } hover:scale-105`}
                              title={
                                record.status === "unmarked"
                                  ? "Click to mark as Present"
                                  : record.status === "present"
                                    ? "Click to mark as Absent"
                                    : "Click to mark as Unmarked"
                              }
                            >
                              {record.status === "present" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : record.status === "absent" ? (
                                <XCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {record.status === "unmarked"
                                ? "Unmarked"
                                : record.status === "present"
                                  ? "Present"
                                  : "Absent"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
