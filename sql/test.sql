-- Enhanced Test Data Population Script
-- This script generates comprehensive test data for the College ERP system
-- It includes multiple colleges, departments, years, sections, students, teachers,
-- courses, enrollments, attendance, and marks data with realistic scenarios

-- Use a transaction to ensure all or nothing is committed
BEGIN;

-- =============================================================================
-- STEP 1: COLLEGES AND ACADEMIC YEARS
-- =============================================================================
INSERT INTO colleges (college_name, college_code, logo_url) VALUES
  ('Nitte Institute of Technology', 'NIT', 'https://example.com/logos/nit.png'),
  ('NMAM Institute of Technology', 'NMAMIT', 'https://example.com/logos/nmamit.png');

-- Get college IDs for reference
WITH college_ids AS (
  SELECT college_id, college_code FROM colleges
)
INSERT INTO academic_years (college_id, year_name, start_date, end_date, is_active)
SELECT 
  college_id, 
  '2024-25', 
  '2024-07-01'::date, 
  '2025-06-30'::date, 
  true
FROM college_ids;

-- =============================================================================
-- STEP 2: DEPARTMENTS AND SECTIONS
-- =============================================================================
WITH college_ids AS (
  SELECT college_id, college_code FROM colleges
)
INSERT INTO departments (college_id, department_name, department_code)
SELECT 
  c.college_id,
  d.dept_name,
  d.dept_code
FROM college_ids c
CROSS JOIN (VALUES
  ('Computer Science & Engineering', 'CSE'),
  ('Electronics & Communication Engineering', 'ECE'),
  ('Mechanical Engineering', 'MECH'),
  ('Information Science & Engineering', 'ISE'),
  ('Artificial Intelligence & Machine Learning', 'AIML')
) AS d(dept_name, dept_code);

-- Create sections for each department
WITH dept_ids AS (
  SELECT department_id, department_code FROM departments
)
INSERT INTO sections (department_id, section_name)
SELECT 
  department_id,
  section_name
FROM dept_ids
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS s(section_name);

-- =============================================================================
-- STEP 3: USERS (Teachers, Students, Admins, Report Viewers)
-- =============================================================================

-- Global admin and report viewer users
INSERT INTO users (username, password_hash, name, phone) VALUES
  ('admin', '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d', 'System Administrator', '9999999999'),
  ('report_viewer', '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d', 'Report Viewer', '8888888888');

-- Teacher users (5 per department) - Optimized batch insert
INSERT INTO users (username, password_hash, name, phone)
SELECT 
  LOWER(college_code || '_' || department_code || '_teacher_' || teacher_num),
  '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d',
  'Prof. ' || college_code || ' ' || department_code || ' ' || teacher_num,
  '555' || LPAD((dept_id * 5 + teacher_num)::text, 7, '0')
FROM (
  SELECT 
    d.department_id as dept_id,
    d.department_code,
    c.college_code,
    c.college_id,
    t.teacher_num
  FROM departments d
  JOIN colleges c ON d.college_id = c.college_id
  CROSS JOIN (SELECT generate_series(1, 5) AS teacher_num) t
) teacher_data;

-- Student users (25 per section, 4 years each) - Optimized batch insert
INSERT INTO users (username, password_hash, name, phone)
SELECT 
  LOWER(college_code || '_' || department_code || '_' || section_name || '_' || batch_year || '_student_' || student_num),
  '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d',
  'Student ' || college_code || ' ' || department_code || ' ' || section_name || ' ' || batch_year || ' #' || student_num,
  '777' || LPAD(((section_id * 100 + (batch_year - 2020) * 25 + student_num)::text), 7, '0')
FROM (
  SELECT 
    s.section_id,
    s.section_name,
    d.department_code,
    c.college_code,
    b.batch_year,
    st.student_num
  FROM sections s
  JOIN departments d ON s.department_id = d.department_id
  JOIN colleges c ON d.college_id = c.college_id
  CROSS JOIN (SELECT generate_series(2021, 2024) AS batch_year) b
  CROSS JOIN (SELECT generate_series(1, 25) AS student_num) st
) student_data;

-- =============================================================================
-- STEP 4: ROLE ASSIGNMENTS
-- =============================================================================

-- Admin roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::user_role FROM users WHERE username = 'admin';

INSERT INTO admins (user_id)
SELECT user_id FROM users WHERE username = 'admin';

-- Report viewer roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'report_viewer'::user_role FROM users WHERE username = 'report_viewer';

INSERT INTO report_viewers (user_id)
SELECT user_id FROM users WHERE username = 'report_viewer';

-- Teacher roles and records
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT u.user_id, 'teacher'::user_role
FROM users u
JOIN departments d ON u.username LIKE LOWER('%_' || d.department_code || '_teacher_%')
JOIN colleges c ON d.college_id = c.college_id 
  AND u.username LIKE LOWER(c.college_code || '_%');

INSERT INTO teachers (user_id, college_id, department_id)
SELECT DISTINCT u.user_id, d.college_id, d.department_id
FROM users u
JOIN departments d ON u.username LIKE LOWER('%_' || d.department_code || '_teacher_%')
JOIN colleges c ON d.college_id = c.college_id 
  AND u.username LIKE LOWER(c.college_code || '_%');

-- Student roles and records - Optimized
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT u.user_id, 'student'::user_role
FROM users u
WHERE u.username LIKE '%student%';

-- Students table - Optimized batch insert
INSERT INTO students (user_id, college_id, department_id, section_id, usn, semester, batch_year)
SELECT 
  u.user_id,
  c.college_id,
  d.department_id,
  s.section_id,
  UPPER(c.college_code || batch_year || d.department_code || s.section_name || LPAD(student_num::text, 3, '0')) AS usn,
  CASE 
    WHEN batch_year = 2021 THEN 8  -- Final year (8th semester)
    WHEN batch_year = 2022 THEN 6  -- Third year (6th semester)
    WHEN batch_year = 2023 THEN 4  -- Second year (4th semester)
    WHEN batch_year = 2024 THEN 2  -- First year (2nd semester)
  END AS semester,
  batch_year
FROM (
  SELECT 
    u.user_id,
    s.section_id,
    d.department_id,
    c.college_id,
    CASE 
      WHEN u.username LIKE '%_2021_%' THEN 2021
      WHEN u.username LIKE '%_2022_%' THEN 2022
      WHEN u.username LIKE '%_2023_%' THEN 2023
      WHEN u.username LIKE '%_2024_%' THEN 2024
    END AS batch_year,
    CAST(SPLIT_PART(REVERSE(SPLIT_PART(REVERSE(u.username), '_', 1)), '_', 1) AS INTEGER) AS student_num
  FROM users u
  JOIN sections s ON u.username LIKE '%_' || s.section_name || '_%'
  JOIN departments d ON s.department_id = d.department_id AND u.username LIKE '%_' || d.department_code || '_%'
  JOIN colleges c ON d.college_id = c.college_id AND u.username LIKE c.college_code || '_%'
  WHERE u.username LIKE '%student%'
) student_mapping
JOIN colleges c ON student_mapping.college_id = c.college_id
JOIN departments d ON student_mapping.department_id = d.department_id
JOIN sections s ON student_mapping.section_id = s.section_id;

-- =============================================================================
-- STEP 5: COURSES
-- =============================================================================

-- Core courses for each department and semester
WITH dept_semester_courses AS (
  SELECT 
    d.college_id,
    d.department_id,
    d.department_code,
    sem.semester,
    course_data.course_suffix,
    course_data.course_name,
    course_data.has_theory,
    course_data.has_lab
  FROM departments d
  CROSS JOIN generate_series(1, 8) AS sem(semester)
  CROSS JOIN (VALUES
    ('01', 'Mathematics', true, false),
    ('02', 'Physics', true, true),
    ('03', 'Programming Fundamentals', true, true),
    ('04', 'Technical Communication', true, false),
    ('05', 'Environmental Science', true, false),
    ('06', 'Data Structures', true, true),
    ('07', 'Database Systems', true, true),
    ('08', 'Operating Systems', true, false)
  ) AS course_data(course_suffix, course_name, has_theory, has_lab)
)
INSERT INTO courses (college_id, department_id, course_code, course_name, course_type, has_theory_component, has_lab_component)
SELECT 
  college_id,
  department_id,
  department_code || semester || course_suffix,
  course_name || ' ' || semester,
  'core',
  has_theory,
  has_lab
FROM dept_semester_courses
WHERE (semester + course_suffix::int) % 8 = 1; -- Distribute courses across semesters

-- Department electives
WITH dept_electives AS (
  SELECT 
    d.college_id,
    d.department_id,
    d.department_code,
    elective_data.course_suffix,
    elective_data.course_name
  FROM departments d
  CROSS JOIN (VALUES
    ('E01', 'Advanced Algorithms'),
    ('E02', 'Machine Learning'),
    ('E03', 'Web Development'),
    ('E04', 'Mobile Computing'),
    ('E05', 'Cloud Computing')
  ) AS elective_data(course_suffix, course_name)
)
INSERT INTO courses (college_id, department_id, course_code, course_name, course_type, has_theory_component, has_lab_component)
SELECT 
  college_id,
  department_id,
  department_code || course_suffix,
  course_name,
  'department_elective',
  true,
  true
FROM dept_electives;

-- Open electives
WITH open_electives AS (
  SELECT 
    c.college_id,
    elective_data.course_code,
    elective_data.course_name
  FROM colleges c
  CROSS JOIN (VALUES
    ('OE01', 'Innovation and Entrepreneurship'),
    ('OE02', 'Digital Marketing'),
    ('OE03', 'Foreign Language'),
    ('OE04', 'Ethics and Values'),
    ('OE05', 'Research Methodology')
  ) AS elective_data(course_code, course_name)
)
INSERT INTO courses (college_id, course_code, course_name, course_type, has_theory_component, has_lab_component)
SELECT 
  college_id,
  course_code,
  course_name,
  'open_elective',
  true,
  false
FROM open_electives;

-- =============================================================================
-- STEP 6: COURSE OFFERINGS
-- =============================================================================

-- Create course offerings for current academic year
WITH current_year AS (
  SELECT year_id, college_id FROM academic_years WHERE is_active = true
),
course_section_combinations AS (
  SELECT 
    c.course_id,
    s.section_id,
    ay.year_id,
    c.department_id,
    ROW_NUMBER() OVER (PARTITION BY c.department_id ORDER BY c.course_id, s.section_id) AS assignment_order,
    -- Determine semester based on course type and current student year
    CASE 
      WHEN c.course_type = 'core' THEN 
        CASE 
          WHEN c.course_code LIKE '%1%' OR c.course_code LIKE '%2%' THEN 2  -- 2nd sem
          WHEN c.course_code LIKE '%3%' OR c.course_code LIKE '%4%' THEN 4  -- 4th sem
          WHEN c.course_code LIKE '%5%' OR c.course_code LIKE '%6%' THEN 6  -- 6th sem
          ELSE 8  -- 8th sem
        END
      WHEN c.course_type = 'department_elective' THEN 6  -- Usually 6th sem
      WHEN c.course_type = 'open_elective' THEN 4  -- Usually 4th sem
    END AS semester
  FROM courses c
  JOIN current_year ay ON c.college_id = ay.college_id
  JOIN sections s ON (c.department_id = s.department_id OR c.department_id IS NULL)
  WHERE c.department_id = s.department_id OR c.course_type = 'open_elective'
),
teachers_with_order AS (
  SELECT 
    teacher_id,
    department_id,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY teacher_id) AS teacher_order
  FROM teachers
),
course_section_teacher AS (
  SELECT 
    csc.course_id,
    csc.section_id,
    csc.year_id,
    csc.semester,
    t.teacher_id
  FROM course_section_combinations csc
  JOIN teachers_with_order t ON csc.department_id = t.department_id 
    AND t.teacher_order = ((csc.assignment_order - 1) % 5 + 1)
)
INSERT INTO course_offerings (course_id, teacher_id, section_id, year_id, semester)
SELECT course_id, teacher_id, section_id, year_id, semester
FROM course_section_teacher;

-- =============================================================================
-- STEP 7: STUDENT ENROLLMENTS
-- =============================================================================

-- Enroll students in courses based on their current semester
WITH student_course_matches AS (
  SELECT 
    s.student_id,
    co.offering_id,
    co.year_id
  FROM students s
  JOIN course_offerings co ON s.section_id = co.section_id
  JOIN courses c ON co.course_id = c.course_id
  WHERE 
    (s.semester = co.semester OR ABS(s.semester - co.semester) <= 2)  -- Allow some flexibility
    AND (c.department_id = s.department_id OR c.course_type = 'open_elective')
)
INSERT INTO student_enrollments (student_id, offering_id, year_id)
SELECT student_id, offering_id, year_id
FROM student_course_matches;

-- =============================================================================
-- STEP 8: ATTENDANCE DATA
-- =============================================================================

-- Generate attendance records for the past 30 days
WITH date_range AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date AS class_date
),
attendance_sessions AS (
  SELECT 
    co.offering_id,
    co.teacher_id,
    dr.class_date,
    period.period_number,
    'Module ' || ((ROW_NUMBER() OVER (PARTITION BY co.offering_id ORDER BY dr.class_date, period.period_number) - 1) / 5 + 1) AS syllabus_covered
  FROM course_offerings co
  CROSS JOIN date_range dr
  CROSS JOIN (VALUES (1), (2), (3)) AS period(period_number)
  WHERE EXTRACT(dow FROM dr.class_date) BETWEEN 1 AND 5  -- Monday to Friday
  AND random() > 0.3  -- 70% chance of class being held
)
INSERT INTO attendance (offering_id, teacher_id, class_date, period_number, syllabus_covered, status)
SELECT offering_id, teacher_id, class_date, period_number, syllabus_covered, 'held'
FROM attendance_sessions;

-- Generate attendance records for students
WITH student_attendance AS (
  SELECT 
    a.attendance_id,
    se.student_id,
    CASE 
      WHEN random() > 0.15 THEN 'present'::attendance_status
      ELSE 'absent'::attendance_status
    END AS status
  FROM attendance a
  JOIN student_enrollments se ON a.offering_id = se.offering_id
)
INSERT INTO attendance_records (attendance_id, student_id, status)
SELECT attendance_id, student_id, status
FROM student_attendance;

-- =============================================================================
-- STEP 9: MARKS DATA
-- =============================================================================

-- Theory marks for eligible enrollments
WITH theory_enrollments AS (
  SELECT 
    se.enrollment_id,
    c.has_theory_component
  FROM student_enrollments se
  JOIN course_offerings co ON se.offering_id = co.offering_id
  JOIN courses c ON co.course_id = c.course_id
  WHERE c.has_theory_component = true
)
INSERT INTO theory_marks (enrollment_id, mse1_marks, mse2_marks, mse3_marks, task1_marks, task2_marks, task3_marks)
SELECT 
  enrollment_id,
  (8 + random() * 12)::int AS mse1_marks,  -- 8-20 marks
  (6 + random() * 14)::int AS mse2_marks,  -- 6-20 marks
  CASE 
    WHEN random() > 0.7 THEN (10 + random() * 10)::int  -- 30% get MSE3
    ELSE NULL
  END AS mse3_marks,
  (1 + random() * 3)::int AS task1_marks,   -- 1-4 marks
  (1 + random() * 3)::int AS task2_marks,   -- 1-4 marks
  (0 + random() * 2)::int AS task3_marks    -- 0-2 marks
FROM theory_enrollments;

-- Lab marks for eligible enrollments
WITH lab_enrollments AS (
  SELECT 
    se.enrollment_id,
    c.has_lab_component
  FROM student_enrollments se
  JOIN course_offerings co ON se.offering_id = co.offering_id
  JOIN courses c ON co.course_id = c.course_id
  WHERE c.has_lab_component = true
)
INSERT INTO lab_marks (enrollment_id, record_marks, continuous_evaluation_marks, lab_mse_marks)
SELECT 
  enrollment_id,
  (6 + random() * 4)::int AS record_marks,              -- 6-10 marks
  (12 + random() * 8)::int AS continuous_evaluation_marks, -- 12-20 marks
  (10 + random() * 10)::int AS lab_mse_marks            -- 10-20 marks
FROM lab_enrollments;

-- =============================================================================
-- STEP 10: ELECTIVE GROUPS (Department Electives)
-- =============================================================================

-- Create elective groups for senior students
WITH dept_elective_groups AS (
  SELECT 
    d.college_id,
    d.department_id,
    'Group ' || group_num AS group_name,
    6 AS semester,  -- 6th semester
    2022 AS batch_year
  FROM departments d
  CROSS JOIN generate_series(1, 2) AS group_num
)
INSERT INTO department_elective_groups (college_id, department_id, group_name, semester, batch_year)
SELECT college_id, department_id, group_name, semester, batch_year
FROM dept_elective_groups;

-- Assign elective courses to groups
WITH elective_group_courses AS (
  SELECT 
    deg.group_id,
    c.course_id,
    ROW_NUMBER() OVER (PARTITION BY deg.group_id ORDER BY c.course_id) as rn
  FROM department_elective_groups deg
  JOIN courses c ON deg.college_id = c.college_id 
    AND deg.department_id = c.department_id 
    AND c.course_type = 'department_elective'
)
INSERT INTO course_elective_group_members (group_id, course_id)
SELECT group_id, course_id
FROM elective_group_courses
WHERE rn <= 3;  -- Max 3 electives per group

-- =============================================================================
-- STEP 11: OPEN ELECTIVE RESTRICTIONS
-- =============================================================================

-- Restrict open electives for certain departments
WITH oe_restrictions AS (
  SELECT 
    c.course_id,
    d.department_id
  FROM courses c
  JOIN departments d ON c.college_id = d.college_id
  WHERE c.course_type = 'open_elective'
  AND c.course_code IN ('OE01', 'OE02')  -- Restrict first 2 open electives
  AND d.department_code NOT IN ('CSE', 'ISE')  -- Not for CS-related departments
)
INSERT INTO open_elective_restrictions (course_id, restricted_department_id)
SELECT course_id, department_id
FROM oe_restrictions;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Summary of created data
SELECT 
  'Data Population Summary' AS summary,
  (SELECT COUNT(*) FROM colleges) AS colleges,
  (SELECT COUNT(*) FROM departments) AS departments,
  (SELECT COUNT(*) FROM sections) AS sections,
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM students) AS students,
  (SELECT COUNT(*) FROM teachers) AS teachers,
  (SELECT COUNT(*) FROM courses) AS courses,
  (SELECT COUNT(*) FROM course_offerings) AS course_offerings,
  (SELECT COUNT(*) FROM student_enrollments) AS enrollments,
  (SELECT COUNT(*) FROM attendance) AS attendance_sessions,
  (SELECT COUNT(*) FROM attendance_records) AS attendance_records,
  (SELECT COUNT(*) FROM theory_marks) AS theory_marks,
  (SELECT COUNT(*) FROM lab_marks) AS lab_marks;

COMMIT;

-- Final success message
SELECT 'Test data population completed successfully! 🎉' AS status;