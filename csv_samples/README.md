# College ERP Database Setup - CSV Import Guide

## 📋 Overview
This folder contains sample CSV files to set up a complete College ERP database from scratch. These files demonstrate the proper format and import order required for the system.

## 🚀 Quick Setup Instructions

### Prerequisites
1. Backend server running on `http://localhost:4000`
2. Frontend accessible (typically `http://localhost:3000`)
3. PostgreSQL database connected
4. Access to admin panel at `/admin/database-setup`

### 📁 Import Order (CRITICAL - Follow Exactly!)

Import these CSV files in the exact order shown below:

#### Phase 1: Foundation Data (Required)
1. **01_colleges.csv** - Institution information
2. **02_users.csv** - All system users
3. **03_departments.csv** - Academic departments
4. **04_sections.csv** - Class sections
5. **05_academic_years.csv** - Academic year definitions

#### Phase 2: User-Specific Data
6. **06_students.csv** - Student records
7. **07_teachers.csv** - Faculty records
8. **08_courses.csv** - Course catalog
9. **09_user_roles.csv** - User role assignments

#### Phase 3: Academic Structure
10. **10_course_offerings.csv** - Course instances per semester
11. **11_student_enrollments.csv** - Student course registrations

#### Phase 4: Academic Records
12. **12_attendance.csv** - Attendance session definitions
13. **13_attendance_records.csv** - Individual attendance records
14. **14_theory_marks.csv** - Theory component marks
15. **15_lab_marks.csv** - Lab component marks

## 📊 Sample Data Overview

### Colleges (3 institutions)
- Nitte Institute of Technology (NIT)
- NMAM Institute of Technology (NMAMIT)
- Mangalore Institute of Technology & Engineering (MITE)

### Users (10 total)
- 1 Admin: admin_user
- 3 Teachers: prof_smith, prof_jones, prof_wilson
- 5 Students: student1-student5

### Academic Structure
- 7 Departments across 3 colleges
- 11 Sections
- 8 Courses with both theory and lab components
- 8 Course offerings for current academic year
- 10 Student enrollments

### Sample Academic Records
- 7 Attendance sessions
- 10 Attendance records
- 9 Theory marks entries
- 6 Lab marks entries

## 🔧 Import Process

### Step 1: Access Admin Panel
Navigate to `/admin/database-setup` in your frontend application.

### Step 2: Import Files in Order
For each CSV file (in the numbered order):
1. Click "Sample" to see the expected format
2. Click "Choose File" and select the CSV
3. Click "Import"
4. Wait for success confirmation (green checkmark)
5. Verify record count increases in status panel

### Step 3: Monitor Progress
- Use "Refresh Status" to update counts
- Check for error messages
- Ensure each import completes successfully

## ⚠️ Important Notes

### Data Constraints
- **USNs must be unique** across all students
- **Course codes must be unique** within each college
- **Username must be unique** across all users
- **Dates should be in YYYY-MM-DD format**
- **Boolean values: true/false or TRUE/FALSE**

### Marks Constraints
- **MSE Marks**: 0-20 (Mid-Semester Exams)
- **Task1/Task2 Marks**: 0-4 (Assignments/Projects)
- **Task3 Marks**: 0-2 (Quiz/Viva)
- **Lab Record Marks**: 0-10 (Lab Record Book)
- **Continuous Evaluation**: 0-20 (Lab Performance)
- **Lab MSE Marks**: 0-20 (Lab Mid-Semester)

### Dependencies
- Students require existing users, colleges, departments, sections
- Teachers require existing users, colleges, departments
- Course offerings require existing courses, academic years, sections, teachers
- Enrollments require existing students and course offerings
- Marks require existing student enrollments
- Attendance records require existing attendance sessions and students

### Password Hash
All users use the same sample hash: `$2b$10$N9qo8uLOickgx2ZMRZoMy.ZT.8hKH.YAmZ5PQ0qQH9M5ZVf4nCKoS`
This represents the password "password123" - **Change in production!**

## 🔍 Expected Final Counts

After successful import:
- ✅ Colleges: 3
- ✅ Users: 10
- ✅ Departments: 7
- ✅ Sections: 11
- ✅ Students: 5
- ✅ Teachers: 3
- ✅ Courses: 8
- ✅ User Roles: 9
- ✅ Academic Years: 6
- ✅ Course Offerings: 8
- ✅ Enrollments: 10
- ✅ Attendance: 7
- ✅ Attendance Records: 10
- ✅ Theory Marks: 9
- ✅ Lab Marks: 6

## 🛠️ Troubleshooting

### Common Errors
1. **"Course offering not found"** - Import course offerings before enrollments
2. **"College not found"** - Check college codes match exactly
3. **"User not found"** - Ensure users are imported before students/teachers
4. **"Enrollment not found"** - Import enrollments before marks

### Recovery Steps
1. Check error messages in the red error boxes
2. Fix data format issues
3. Use "Clear Database" if needed to start over
4. Re-import from step 1 in correct order

### File Format Tips
- Ensure CSV files have proper headers
- No extra spaces in codes/IDs
- Dates in ISO format (YYYY-MM-DD)
- Text fields with commas should be quoted
- Save as UTF-8 encoding

## 📝 Customization

To create your own data:
1. Use these files as templates
2. Maintain the same column headers
3. Ensure referential integrity (foreign keys exist)
4. Test with small datasets first
5. Keep the import order

## 🔐 Security Note

**IMPORTANT**: The password hashes in these sample files are for demonstration only. In production:
- Use proper password hashing
- Implement password policies
- Change default admin credentials
- Use environment-specific data

---

**Need Help?** Check the frontend error messages for specific issues or consult the application logs.
