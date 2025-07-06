# Adding 3 New Students to CSE Section B - Step-by-Step Guide

## 📋 Overview
This guide shows how to add 3 new students to CSE Section B at NIT college.

## 🚨 Prerequisites
- CSE Section B must already exist in the database
- CSE courses (CSE501, CSE502, CSE503) and their offerings must exist
- Admin access to the database setup panel

## 📁 Files to Import (in exact order)

### Step 1: Import Users
**File:** `01_new_users.csv`
- Creates login credentials for the 3 new students
- Uses the same password hash as sample data ("password123")
- **Important:** Change passwords after import!

### Step 2: Import Students
**File:** `02_new_students.csv`
- Links users to NIT college, CSE department, Section B
- Assigns unique USNs: NIT2022CSE101, NIT2022CSE102, NIT2022CSE103
- Sets them in semester 5, batch year 2022

### Step 3: Import User Roles
**File:** `03_new_user_roles.csv`
- Assigns "student" role to all 3 users
- Required for proper system access permissions

### Step 4: Import Enrollments
**File:** `04_new_enrollments.csv`
- Enrolls each student in all 3 CSE courses for semester 5
- Links to existing course offerings
- Each student gets 3 enrollments (CSE501, CSE502, CSE503)

## 🎯 Import Process

1. **Navigate to Admin Panel**: `http://localhost:3000/admin/database-setup`

2. **Import in Order:**
   - Upload `01_new_users.csv` → Select "2. Users" → Click Upload
   - Upload `02_new_students.csv` → Select "6. Students" → Click Upload  
   - Upload `03_new_user_roles.csv` → Select "9. User Roles" → Click Upload
   - Upload `04_new_enrollments.csv` → Select "11. Student Enrollments" → Click Upload

3. **Verify Success:**
   - Check for green success messages after each import
   - Use "Refresh Status" to see updated counts
   - Students count should increase by 3
   - Enrollments count should increase by 9

## ✅ Expected Results

After successful import:
- **Users:** +3 (total users will increase)
- **Students:** +3 (total students will increase)  
- **User Roles:** +3 (role assignments increase)
- **Enrollments:** +9 (3 students × 3 courses each)

## 🔍 Testing New Students

### Test Login Access:
1. **Student 1:** Username: `student_cse_b1`, Password: `password123`
2. **Student 2:** Username: `student_cse_b2`, Password: `password123`  
3. **Student 3:** Username: `student_cse_b3`, Password: `password123`

### Verify in System:
- Navigate to student dashboard with any of the above credentials
- Check that they can see their enrolled courses (CSE501, CSE502, CSE503)
- Verify they appear in CSE Section B in admin views

## ⚠️ Important Notes

### Data Constraints:
- **USNs must be unique:** NIT2022CSE101-103 are new, won't conflict
- **Usernames must be unique:** student_cse_b1-3 are new
- **Section B must exist:** Ensure CSE Section B was created in initial setup

### Security:
- **Change default passwords immediately** after import
- Consider requiring password reset on first login
- Review user permissions and access levels

### Troubleshooting:
- **"Section not found"**: Verify CSE Section B exists in sections table
- **"Course offering not found"**: Ensure CSE501-503 offerings exist for semester 5
- **"Username already exists"**: Choose different usernames if conflicts occur

## 🔄 Adding More Students Later

To add additional students to CSE Section B:
1. Use the same CSV format
2. Increment USN numbers (NIT2022CSE104, NIT2022CSE105, etc.)
3. Choose unique usernames
4. Follow the same 4-step import process

## 📈 Next Steps

After adding students, you can:
- **Add Attendance:** Import attendance data for these students
- **Add Marks:** Import theory and lab marks once available
- **Semester Progression:** Move them to semester 6 when ready
- **New Course Enrollments:** Enroll in additional electives

---

**Success!** You've successfully added 3 new students to CSE Section B. They can now log in and access their student dashboard with their enrolled courses.
