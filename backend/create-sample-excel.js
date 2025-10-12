const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "excel-seed-data");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create an Excel file from JSON data
 */
function createExcelFile(filename, data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const filePath = path.join(OUTPUT_DIR, filename);
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Created: ${filename}`);
}

// Sample Colleges
const colleges = [
  { code: "NMAMIT", name: "NMAM Institute of Technology" },
  { code: "NMIT", name: "Nitte Meenakshi Institute of Technology" },
];

// Sample Departments
const departments = [
  {
    college_code: "NMAMIT",
    code: "CS",
    name: "Computer Science and Engineering",
  },
  {
    college_code: "NMAMIT",
    code: "IS",
    name: "Information Science and Engineering",
  },
  { college_code: "NMAMIT", code: "ME", name: "Mechanical Engineering" },
  {
    college_code: "NMAMIT",
    code: "EC",
    name: "Electronics and Communication Engineering",
  },
  { college_code: "NMAMIT", code: "CE", name: "Civil Engineering" },
  {
    college_code: "NMIT",
    code: "CS",
    name: "Computer Science and Engineering",
  },
  {
    college_code: "NMIT",
    code: "IS",
    name: "Information Science and Engineering",
  },
  { college_code: "NMIT", code: "ME", name: "Mechanical Engineering" },
  {
    college_code: "NMIT",
    code: "EC",
    name: "Electronics and Communication Engineering",
  },
];

// Sample Sections
const sections = [
  { college_code: "NMAMIT", department_code: "CS", section_name: "A" },
  { college_code: "NMAMIT", department_code: "CS", section_name: "B" },
  { college_code: "NMAMIT", department_code: "CS", section_name: "C" },
  { college_code: "NMAMIT", department_code: "IS", section_name: "D" },
  { college_code: "NMAMIT", department_code: "IS", section_name: "E" },
  { college_code: "NMAMIT", department_code: "ME", section_name: "F" },
  { college_code: "NMAMIT", department_code: "EC", section_name: "G" },
  { college_code: "NMAMIT", department_code: "CE", section_name: "H" },
  { college_code: "NMIT", department_code: "CS", section_name: "A" },
  { college_code: "NMIT", department_code: "CS", section_name: "B" },
  { college_code: "NMIT", department_code: "IS", section_name: "C" },
  { college_code: "NMIT", department_code: "ME", section_name: "D" },
  { college_code: "NMIT", department_code: "EC", section_name: "E" },
];

// Sample Users (mix of students, teachers, and admin)
const users = [
  // Admin
  {
    username: "admin",
    name: "System Administrator",
    email: "admin@example.com",
    phone: "9999999999",
    role: "admin",
  },

  // Teachers
  {
    username: "teacher1",
    name: "Dr. Rajesh Kumar",
    email: "rajesh@example.com",
    phone: "9876543211",
    role: "teacher",
  },
  {
    username: "teacher2",
    name: "Prof. Priya Sharma",
    email: "priya@example.com",
    phone: "9876543212",
    role: "teacher",
  },
  {
    username: "teacher3",
    name: "Dr. Anita Desai",
    email: "anita@example.com",
    phone: "9876543213",
    role: "teacher",
  },

  // Students - NMAMIT CS
  {
    username: "NNM23CSA01",
    name: "Aarav Kumar",
    email: "aarav@example.com",
    phone: "9876543301",
    role: "student",
  },
  {
    username: "NNM23CSA02",
    name: "Priya Singh",
    email: "priya.s@example.com",
    phone: "9876543302",
    role: "student",
  },
  {
    username: "NNM23CSA03",
    name: "Rahul Verma",
    email: "rahul@example.com",
    phone: "9876543303",
    role: "student",
  },
  {
    username: "NNM23CSA04",
    name: "Ananya Patel",
    email: "ananya@example.com",
    phone: "9876543304",
    role: "student",
  },
  {
    username: "NNM23CSA05",
    name: "Rohan Sharma",
    email: "rohan@example.com",
    phone: "9876543305",
    role: "student",
  },

  // Students - NMIT CS
  {
    username: "NMI23CSA01",
    name: "Kavya Reddy",
    email: "kavya@example.com",
    phone: "9876543401",
    role: "student",
  },
  {
    username: "NMI23CSA02",
    name: "Arjun Nair",
    email: "arjun@example.com",
    phone: "9876543402",
    role: "student",
  },
  {
    username: "NMI23CSA03",
    name: "Diya Joshi",
    email: "diya@example.com",
    phone: "9876543403",
    role: "student",
  },
  {
    username: "NMI23CSA04",
    name: "Aditya Gupta",
    email: "aditya@example.com",
    phone: "9876543404",
    role: "student",
  },
  {
    username: "NMI23CSA05",
    name: "Ishita Malhotra",
    email: "ishita@example.com",
    phone: "9876543405",
    role: "student",
  },
];

// Sample Students
const students = [
  // NMAMIT CS Section A
  {
    usn: "NNM23CSA01",
    college_code: "NMAMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NNM23CSA02",
    college_code: "NMAMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NNM23CSA03",
    college_code: "NMAMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NNM23CSA04",
    college_code: "NMAMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NNM23CSA05",
    college_code: "NMAMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },

  // NMIT CS Section A
  {
    usn: "NMI23CSA01",
    college_code: "NMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NMI23CSA02",
    college_code: "NMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NMI23CSA03",
    college_code: "NMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NMI23CSA04",
    college_code: "NMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
  {
    usn: "NMI23CSA05",
    college_code: "NMIT",
    department_code: "CS",
    section: "A",
    semester: 5,
    batch_year: 2023,
  },
];

// Sample Teachers
const teachers = [
  { username: "teacher1", college_code: "NMAMIT", department_code: "CS" },
  { username: "teacher2", college_code: "NMAMIT", department_code: "IS" },
  { username: "teacher3", college_code: "NMIT", department_code: "CS" },
];

// Sample Courses
const courses = [
  // NMAMIT CS Courses
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS301",
    name: "Data Structures and Algorithms",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS302",
    name: "Operating Systems",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS303",
    name: "Database Management Systems",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS401",
    name: "Machine Learning",
    type: "department_elective",
    year: 4,
    has_theory: true,
    has_lab: false,
  },
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS402",
    name: "Cloud Computing",
    type: "department_elective",
    year: 4,
    has_theory: true,
    has_lab: false,
  },
  {
    college_code: "NMAMIT",
    department_code: "CS",
    code: "CS501",
    name: "Web Development",
    type: "open_elective",
    year: 3,
    has_theory: true,
    has_lab: true,
  },

  // NMAMIT IS Courses
  {
    college_code: "NMAMIT",
    department_code: "IS",
    code: "IS301",
    name: "Software Engineering",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: false,
  },
  {
    college_code: "NMAMIT",
    department_code: "IS",
    code: "IS302",
    name: "Computer Networks",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },

  // NMIT CS Courses
  {
    college_code: "NMIT",
    department_code: "CS",
    code: "CS301",
    name: "Data Structures and Algorithms",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },
  {
    college_code: "NMIT",
    department_code: "CS",
    code: "CS302",
    name: "Operating Systems",
    type: "core",
    year: 3,
    has_theory: true,
    has_lab: true,
  },
];

// Sample Academic Years
const academicYears = [
  { year_name: "2023-2024", start_date: "2023-08-01", end_date: "2024-07-31" },
  { year_name: "2024-2025", start_date: "2024-08-01", end_date: "2025-07-31" },
  { year_name: "2025-2026", start_date: "2025-08-01", end_date: "2026-07-31" },
];

// Create all Excel files
console.log("📊 Creating sample Excel files...\n");

createExcelFile("colleges.xlsx", colleges);
createExcelFile("departments.xlsx", departments);
createExcelFile("sections.xlsx", sections);
createExcelFile("users.xlsx", users);
createExcelFile("students.xlsx", students);
createExcelFile("teachers.xlsx", teachers);
createExcelFile("courses.xlsx", courses);
createExcelFile("academic_years.xlsx", academicYears);

console.log("\n✅ All sample Excel files created successfully!");
console.log(`📁 Files location: ${OUTPUT_DIR}`);
console.log(
  "\n📝 You can now edit these files and run: node seed-from-excel.js"
);
