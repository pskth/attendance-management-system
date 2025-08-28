//for student dashboard necessary creds


export interface StudentInfo {
  user_id: string
  name: string
  usn: string
  phone: string
  email: string
  college_name: string
  semester: number
  department: string
  academic_year: string
  photo_url: string
}
export interface MarksDataItem {
  course_code: string | null;
  course_name: string | null;
  course_type: string | null;
  has_theory_component: boolean;
  has_lab_component: boolean;
  theory_marks: TheoryMarks | null;
  lab_marks: LabMarks | null;
  total_theory_marks: number;
  total_lab_marks?: number;
  total_marks: number;
  grade: string;
}

export interface StudentMarksResponse {
  student: {
    id: string;
    name: string;
    usn: string;
    email?: string;
    phone?: string;
    college_id: string;
    department_id?: string;
    semester?: number;
    batchYear: number;
  };
  marksData: MarksDataItem[];
}

export interface TheoryMarks {
  mse1Marks?: number;
  mse2Marks?: number;
  mse3Marks?: number;
  task1Marks?: number;
  task2Marks?: number;
  task3Marks?: number;
}

export interface LabMarks {
  recordMarks?: number;
  continuousEvaluationMarks?: number;
  labMseMarks?: number;
}


interface CourseAttendance {
  course_name: string;
  course_code: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  required_percentage: number;
  status: "good" | "warning" | "critical";
}

interface MonthlyTrend {
  month: string;
  percentage: number;
}

interface OverallStats {
  total_present: number;
  total_absent: number;
  total_classes: number;
  overall_percentage: number;
  trend: "up" | "down" | "steady";
  monthly_trend: MonthlyTrend[];
}

export interface AttendanceReport {
  courseAttendance: CourseAttendance[];
  overallStats: OverallStats;
}
