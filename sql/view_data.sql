-- =============================================================================
-- DATA VIEWING QUERIES FOR COLLEGE ERP DATABASE
-- =============================================================================

-- Basic summary of all tables
SELECT 
  'colleges' as table_name, COUNT(*) as record_count FROM colleges
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'sections', COUNT(*) FROM sections
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'course_offerings', COUNT(*) FROM course_offerings
UNION ALL
SELECT 'student_enrollments', COUNT(*) FROM student_enrollments
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'theory_marks', COUNT(*) FROM theory_marks
UNION ALL
SELECT 'lab_marks', COUNT(*) FROM lab_marks
ORDER BY table_name;

-- =============================================================================
-- COLLEGE OVERVIEW
-- =============================================================================

-- View colleges with their departments
SELECT 
  c.college_name,
  c.college_code,
  d.department_name,
  d.department_code,
  COUNT(s.section_id) as sections_count
FROM colleges c
JOIN departments d ON c.college_id = d.college_id
LEFT JOIN sections s ON d.department_id = s.department_id
GROUP BY c.college_id, c.college_name, c.college_code, d.department_id, d.department_name, d.department_code
ORDER BY c.college_code, d.department_code;

-- =============================================================================
-- USER AND ROLE OVERVIEW
-- =============================================================================

-- View users by role
SELECT 
  ur.role,
  COUNT(*) as user_count
FROM user_roles ur
GROUP BY ur.role
ORDER BY ur.role;

-- Sample users from each role
SELECT 
  u.username,
  u.name,
  ur.role,
  CASE 
    WHEN ur.role = 'teacher' THEN CONCAT(c.college_code, ' - ', d.department_code)
    WHEN ur.role = 'student' THEN CONCAT(c.college_code, ' - ', d.department_code, ' - ', s.section_name)
    ELSE 'Admin'
  END as affiliation
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN teachers t ON u.user_id = t.user_id
LEFT JOIN students st ON u.user_id = st.user_id
LEFT JOIN colleges c ON COALESCE(t.college_id, st.college_id) = c.college_id
LEFT JOIN departments d ON COALESCE(t.department_id, st.department_id) = d.department_id
LEFT JOIN sections s ON st.section_id = s.section_id
ORDER BY ur.role, u.username
LIMIT 20;

-- =============================================================================
-- STUDENT DATA OVERVIEW
-- =============================================================================

-- Students by college, department, and batch
SELECT 
  c.college_code,
  d.department_code,
  s.section_name,
  st.batch_year,
  st.semester,
  COUNT(*) as student_count
FROM students st
JOIN colleges c ON st.college_id = c.college_id
JOIN departments d ON st.department_id = d.department_id
JOIN sections s ON st.section_id = s.section_id
GROUP BY c.college_code, d.department_code, s.section_name, st.batch_year, st.semester
ORDER BY c.college_code, d.department_code, s.section_name, st.batch_year;

-- Sample student records with USN format
SELECT 
  u.name,
  st.usn,
  c.college_code,
  d.department_code,
  s.section_name,
  st.batch_year,
  st.semester
FROM students st
JOIN users u ON st.user_id = u.user_id
JOIN colleges c ON st.college_id = c.college_id
JOIN departments d ON st.department_id = d.department_id
JOIN sections s ON st.section_id = s.section_id
ORDER BY st.usn
LIMIT 10;

-- =============================================================================
-- COURSE AND ENROLLMENT DATA
-- =============================================================================

-- Courses by type and components
SELECT 
  c.course_type,
  c.has_theory_component,
  c.has_lab_component,
  COUNT(*) as course_count
FROM courses c
GROUP BY c.course_type, c.has_theory_component, c.has_lab_component
ORDER BY c.course_type;

-- Course offerings with teacher assignments
SELECT 
  c.college_code,
  d.department_code,
  s.section_name,
  co.semester,
  cr.course_code,
  cr.course_name,
  u.name as teacher_name,
  COUNT(se.enrollment_id) as enrolled_students
FROM course_offerings co
JOIN courses cr ON co.course_id = cr.course_id
JOIN teachers t ON co.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.user_id
JOIN sections s ON co.section_id = s.section_id
JOIN departments d ON s.department_id = d.department_id
JOIN colleges c ON d.college_id = c.college_id
LEFT JOIN student_enrollments se ON co.offering_id = se.offering_id
GROUP BY c.college_code, d.department_code, s.section_name, co.semester, 
         cr.course_code, cr.course_name, u.name, co.offering_id
ORDER BY c.college_code, d.department_code, s.section_name, co.semester, cr.course_code
LIMIT 20;

-- =============================================================================
-- ATTENDANCE OVERVIEW
-- =============================================================================

-- Attendance statistics by course
SELECT 
  c.college_code,
  d.department_code,
  cr.course_code,
  cr.course_name,
  COUNT(DISTINCT a.attendance_id) as total_classes,
  COUNT(ar.record_id) as total_attendance_records,
  ROUND(
    (COUNT(CASE WHEN ar.status = 'present' THEN 1 END) * 100.0 / 
     NULLIF(COUNT(ar.record_id), 0)), 2
  ) as attendance_percentage
FROM attendance a
JOIN course_offerings co ON a.offering_id = co.offering_id
JOIN courses cr ON co.course_id = cr.course_id
JOIN sections s ON co.section_id = s.section_id
JOIN departments d ON s.department_id = d.department_id
JOIN colleges c ON d.college_id = c.college_id
LEFT JOIN attendance_records ar ON a.attendance_id = ar.attendance_id
GROUP BY c.college_code, d.department_code, cr.course_code, cr.course_name
ORDER BY c.college_code, d.department_code, cr.course_code
LIMIT 15;

-- =============================================================================
-- MARKS OVERVIEW
-- =============================================================================

-- Theory marks statistics
SELECT 
  c.college_code,
  d.department_code,
  cr.course_code,
  COUNT(*) as students_with_theory_marks,
  ROUND(AVG(tm.mse1_marks), 2) as avg_mse1,
  ROUND(AVG(tm.mse2_marks), 2) as avg_mse2,
  COUNT(tm.mse3_marks) as students_with_mse3,
  ROUND(AVG(tm.mse3_marks), 2) as avg_mse3
FROM theory_marks tm
JOIN student_enrollments se ON tm.enrollment_id = se.enrollment_id
JOIN course_offerings co ON se.offering_id = co.offering_id
JOIN courses cr ON co.course_id = cr.course_id
JOIN sections s ON co.section_id = s.section_id
JOIN departments d ON s.department_id = d.department_id
JOIN colleges c ON d.college_id = c.college_id
GROUP BY c.college_code, d.department_code, cr.course_code
ORDER BY c.college_code, d.department_code, cr.course_code
LIMIT 15;

-- Lab marks statistics
SELECT 
  c.college_code,
  d.department_code,
  cr.course_code,
  COUNT(*) as students_with_lab_marks,
  ROUND(AVG(lm.record_marks), 2) as avg_record_marks,
  ROUND(AVG(lm.continuous_evaluation_marks), 2) as avg_continuous_marks,
  ROUND(AVG(lm.lab_mse_marks), 2) as avg_lab_mse
FROM lab_marks lm
JOIN student_enrollments se ON lm.enrollment_id = se.enrollment_id
JOIN course_offerings co ON se.offering_id = co.offering_id
JOIN courses cr ON co.course_id = cr.course_id
JOIN sections s ON co.section_id = s.section_id
JOIN departments d ON s.department_id = d.department_id
JOIN colleges c ON d.college_id = c.college_id
GROUP BY c.college_code, d.department_code, cr.course_code
ORDER BY c.college_code, d.department_code, cr.course_code
LIMIT 15;

-- =============================================================================
-- SAMPLE DETAILED RECORDS
-- =============================================================================

-- Sample student with all their data
SELECT 
  u.name as student_name,
  st.usn,
  c.college_name,
  d.department_name,
  s.section_name,
  st.batch_year,
  st.semester
FROM students st
JOIN users u ON st.user_id = u.user_id
JOIN colleges c ON st.college_id = c.college_id
JOIN departments d ON st.department_id = d.department_id
JOIN sections s ON st.section_id = s.section_id
LIMIT 1;

-- Sample student's enrollments and marks
WITH sample_student AS (
  SELECT student_id FROM students LIMIT 1
)
SELECT 
  cr.course_code,
  cr.course_name,
  tm.mse1_marks,
  tm.mse2_marks,
  tm.mse3_marks,
  lm.record_marks,
  lm.continuous_evaluation_marks,
  lm.lab_mse_marks
FROM sample_student ss
JOIN student_enrollments se ON ss.student_id = se.student_id
JOIN course_offerings co ON se.offering_id = co.offering_id
JOIN courses cr ON co.course_id = cr.course_id
LEFT JOIN theory_marks tm ON se.enrollment_id = tm.enrollment_id
LEFT JOIN lab_marks lm ON se.enrollment_id = lm.enrollment_id
ORDER BY cr.course_code;
