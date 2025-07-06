-- =============================================================================
-- OPTIMIZED COLLEGE ERP TEST DATA SCRIPT
-- =============================================================================

BEGIN;

-- Progress tracking
DO $$
BEGIN
  RAISE NOTICE 'Starting College ERP test data generation...';
END $$;

-- Clear existing data
TRUNCATE TABLE 
  attendance_records,
  lab_marks,
  theory_marks,
  student_enrollments,
  course_offerings,
  courses,
  academic_years,
  students,
  teachers,
  admins,
  report_viewers,
  user_roles,
  users,
  sections,
  departments,
  colleges
  CASCADE;

-- =============================================================================
-- STEP 1: COLLEGES AND ACADEMIC YEARS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting colleges and academic years...';
END $$;

INSERT INTO colleges (college_name, college_code, logo_url) VALUES
  ('Nitte Institute of Technology', 'NIT', 'https://example.com/logos/nit.png'),
  ('NMAM Institute of Technology', 'NMAMIT', 'https://example.com/logos/nmamit.png');

INSERT INTO academic_years (college_id, year_name, start_date, end_date, is_active)
SELECT 
  college_id, 
  '2024-25', 
  '2024-07-01'::date, 
  '2025-06-30'::date, 
  true
FROM colleges;

-- =============================================================================
-- STEP 2: DEPARTMENTS AND SECTIONS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting departments and sections...';
END $$;

INSERT INTO departments (college_id, department_name, department_code) 
SELECT 
  college_id,
  dept_name,
  dept_code
FROM colleges,
  (VALUES 
    ('Computer Science Engineering', 'CSE'),
    ('Information Science Engineering', 'ISE'),
    ('Electronics Communication Engineering', 'ECE'),
    ('Mechanical Engineering', 'ME'),
    ('Civil Engineering', 'CE')
  ) AS dept_data(dept_name, dept_code);

INSERT INTO sections (department_id, section_name) 
SELECT 
  department_id,
  section_name
FROM departments,
  (VALUES ('A'), ('B'), ('C')) AS section_data(section_name);

-- =============================================================================
-- STEP 4: USERS (Efficient Single Pass)
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting users...';
END $$;

-- Admin users
INSERT INTO users (username, password_hash, name, phone) VALUES
  ('admin', '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d', 'System Admin', '9999999999'),
  ('nit_admin', '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d', 'NIT Admin', '9999999998'),
  ('nmamit_admin', '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d', 'NMAMIT Admin', '9999999997');

-- Teacher users (3 per department)
INSERT INTO users (username, password_hash, name, phone)
SELECT 
  LOWER(c.college_code || '_' || d.department_code || '_teacher_' || t.teacher_num),
  '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d',
  'Prof. ' || c.college_code || ' ' || d.department_code || ' ' || t.teacher_num,
  '555' || LPAD((ABS(HASHTEXT(d.department_id::text)) % 1000 + t.teacher_num)::text, 7, '0')
FROM colleges c
JOIN departments d ON c.college_id = d.college_id
CROSS JOIN generate_series(1, 3) AS t(teacher_num);

-- Student users (20 per section per year)
INSERT INTO users (username, password_hash, name, phone)
SELECT 
  LOWER(c.college_code || '_' || d.department_code || '_' || s.section_name || '_' || batch_year || '_student_' || student_num),
  '$2b$10$K7L/8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8dL8Y4rSgVVtg8d',
  'Student ' || c.college_code || ' ' || d.department_code || ' ' || s.section_name || ' ' || batch_year || ' #' || student_num,
  '777' || LPAD((ABS(HASHTEXT(s.section_id::text)) % 1000 + batch_year - 2020 + student_num)::text, 7, '0')
FROM colleges c
JOIN departments d ON c.college_id = d.college_id
JOIN sections s ON d.department_id = s.department_id
CROSS JOIN (VALUES (2021), (2022), (2023), (2024)) AS batch_years(batch_year)
CROSS JOIN generate_series(1, 20) AS student_nums(student_num);

-- =============================================================================
-- STEP 5: USER ROLES
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting user roles...';
END $$;

-- Admin roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::user_role
FROM users 
WHERE username IN ('admin', 'nit_admin', 'nmamit_admin');

-- Admin table entries
INSERT INTO admins (user_id)
SELECT user_id
FROM users 
WHERE username IN ('admin', 'nit_admin', 'nmamit_admin');

-- Teacher roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'teacher'::user_role
FROM users 
WHERE username LIKE '%teacher%';

-- Student roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'student'::user_role
FROM users 
WHERE username LIKE '%student%';

-- =============================================================================
-- STEP 6: TEACHERS AND STUDENTS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting teachers and students...';
END $$;

-- Teachers
INSERT INTO teachers (user_id, college_id, department_id)
SELECT 
  u.user_id,
  CASE 
    WHEN u.username LIKE 'nit_%' THEN (SELECT college_id FROM colleges WHERE college_code = 'NIT')
    WHEN u.username LIKE 'nmamit_%' THEN (SELECT college_id FROM colleges WHERE college_code = 'NMAMIT')
  END AS college_id,
  CASE 
    WHEN u.username LIKE '%_cse_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'CSE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ise_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ISE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ece_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ECE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_me_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ME' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ce_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'CE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
  END AS department_id
FROM users u
WHERE u.username LIKE '%teacher%'
  AND (u.username LIKE 'nit_%' OR u.username LIKE 'nmamit_%');

-- Students  
INSERT INTO students (user_id, college_id, department_id, section_id, usn, semester, batch_year)
SELECT 
  u.user_id,
  CASE 
    WHEN u.username LIKE 'nit_%' THEN (SELECT college_id FROM colleges WHERE college_code = 'NIT')
    WHEN u.username LIKE 'nmamit_%' THEN (SELECT college_id FROM colleges WHERE college_code = 'NMAMIT')
  END AS college_id,
  CASE 
    WHEN u.username LIKE '%_cse_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'CSE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ise_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ISE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ece_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ECE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_me_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'ME' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_ce_%' THEN (SELECT department_id FROM departments d JOIN colleges c ON d.college_id = c.college_id WHERE d.department_code = 'CE' AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
  END AS department_id,
  CASE 
    WHEN u.username LIKE '%_a_%' THEN (SELECT section_id FROM sections s JOIN departments d ON s.department_id = d.department_id JOIN colleges c ON d.college_id = c.college_id WHERE s.section_name = 'A' AND d.department_code = UPPER(SPLIT_PART(u.username, '_', 2)) AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_b_%' THEN (SELECT section_id FROM sections s JOIN departments d ON s.department_id = d.department_id JOIN colleges c ON d.college_id = c.college_id WHERE s.section_name = 'B' AND d.department_code = UPPER(SPLIT_PART(u.username, '_', 2)) AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
    WHEN u.username LIKE '%_c_%' THEN (SELECT section_id FROM sections s JOIN departments d ON s.department_id = d.department_id JOIN colleges c ON d.college_id = c.college_id WHERE s.section_name = 'C' AND d.department_code = UPPER(SPLIT_PART(u.username, '_', 2)) AND c.college_code = UPPER(SPLIT_PART(u.username, '_', 1)))
  END AS section_id,
  UPPER(
    SPLIT_PART(u.username, '_', 1) || 
    SPLIT_PART(u.username, '_', 4) || 
    SPLIT_PART(u.username, '_', 2) || 
    SPLIT_PART(u.username, '_', 3) || 
    LPAD(SPLIT_PART(u.username, '_', 6)::text, 3, '0')
  ) AS usn,
  CASE 
    WHEN u.username LIKE '%_2021_%' THEN 8
    WHEN u.username LIKE '%_2022_%' THEN 6
    WHEN u.username LIKE '%_2023_%' THEN 4
    WHEN u.username LIKE '%_2024_%' THEN 2
  END AS semester,
  CASE 
    WHEN u.username LIKE '%_2021_%' THEN 2021
    WHEN u.username LIKE '%_2022_%' THEN 2022
    WHEN u.username LIKE '%_2023_%' THEN 2023
    WHEN u.username LIKE '%_2024_%' THEN 2024
  END AS batch_year
FROM users u
WHERE u.username LIKE '%student%'
  AND (u.username LIKE 'nit_%' OR u.username LIKE 'nmamit_%');

-- =============================================================================
-- STEP 6: COURSES
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting courses...';
END $$;

INSERT INTO courses (college_id, department_id, course_code, course_name, course_type, has_theory_component, has_lab_component)
SELECT 
  d.college_id,
  d.department_id,
  d.department_code || course_code,
  course_name,
  'core'::course_type,
  true,
  true
FROM departments d
CROSS JOIN (
  VALUES 
    ('DS', 'Data Structures'),
    ('ALGO', 'Algorithms'),
    ('DBMS', 'Database Systems'),
    ('OS', 'Operating Systems'),
    ('CN', 'Computer Networks'),
    ('SE', 'Software Engineering'),
    ('WT', 'Web Technology'),
    ('ML', 'Machine Learning')
) AS course_data(course_code, course_name);

-- Open electives
INSERT INTO courses (college_id, course_code, course_name, course_type, has_theory_component, has_lab_component)
SELECT 
  college_id,
  'OE' || oe_num,
  'Open Elective ' || oe_num,
  'open_elective'::course_type,
  true,
  false
FROM colleges
CROSS JOIN generate_series(1, 3) AS oe_nums(oe_num);

-- =============================================================================
-- STEP 7: COURSE OFFERINGS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting course offerings...';
END $$;

INSERT INTO course_offerings (course_id, teacher_id, section_id, year_id, semester)
SELECT 
  c.course_id,
  t.teacher_id,
  s.section_id,
  y.year_id,
  CASE 
    WHEN c.course_code LIKE '%DS%' THEN 3
    WHEN c.course_code LIKE '%ALGO%' THEN 4
    WHEN c.course_code LIKE '%DBMS%' THEN 5
    WHEN c.course_code LIKE '%OS%' THEN 5
    WHEN c.course_code LIKE '%CN%' THEN 6
    WHEN c.course_code LIKE '%SE%' THEN 6
    WHEN c.course_code LIKE '%WT%' THEN 7
    WHEN c.course_code LIKE '%ML%' THEN 7
    ELSE 4
  END
FROM courses c
JOIN sections s ON c.department_id = s.department_id
JOIN departments d ON s.department_id = d.department_id
JOIN academic_years y ON d.college_id = y.college_id
JOIN teachers t ON c.department_id = t.department_id
WHERE t.teacher_id = (
  SELECT teacher_id 
  FROM teachers t2 
  WHERE t2.department_id = c.department_id 
  LIMIT 1 OFFSET (ABS(HASHTEXT(c.course_id::text)) % 3)
);

-- =============================================================================
-- STEP 8: STUDENT ENROLLMENTS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting student enrollments...';
END $$;

INSERT INTO student_enrollments (student_id, offering_id, year_id)
SELECT 
  s.student_id,
  co.offering_id,
  co.year_id
FROM students s
JOIN course_offerings co ON s.section_id = co.section_id
JOIN courses c ON co.course_id = c.course_id
WHERE s.semester >= co.semester OR c.course_type = 'open_elective';

-- =============================================================================
-- STEP 9: ATTENDANCE DATA
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting attendance data...';
END $$;

-- Create attendance sessions
INSERT INTO attendance (offering_id, teacher_id, class_date, period_number, syllabus_covered, status)
SELECT 
  co.offering_id,
  co.teacher_id,
  CURRENT_DATE - (random() * 30)::integer,
  (random() * 3 + 1)::integer,
  'Module ' || (random() * 5 + 1)::integer,
  'held'::VARCHAR
FROM course_offerings co
CROSS JOIN generate_series(1, 5) AS attendance_days
WHERE random() < 0.8;

-- Create student attendance records
INSERT INTO attendance_records (attendance_id, student_id, status)
SELECT 
  a.attendance_id,
  se.student_id,
  CASE 
    WHEN random() < 0.85 THEN 'present'::attendance_status
    ELSE 'absent'::attendance_status
  END
FROM attendance a
JOIN student_enrollments se ON a.offering_id = se.offering_id
WHERE random() < 0.9;

-- =============================================================================
-- STEP 10: MARKS DATA
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inserting marks data...';
END $$;

-- Theory marks
INSERT INTO theory_marks (enrollment_id, mse1_marks, mse2_marks, mse3_marks, task1_marks, task2_marks, task3_marks)
SELECT 
  se.enrollment_id,
  mse1_marks,
  mse2_marks,
  CASE 
    WHEN (mse1_marks + mse2_marks < 20) AND random() < 0.5 THEN (random() * 20)::integer 
    ELSE NULL 
  END, -- Only set MSE3 if MSE1+MSE2 < 20 (as per constraint)
  (random() * 4)::integer, -- 0-4
  (random() * 4)::integer, -- 0-4
  (random() * 2)::integer  -- 0-2
FROM (
  SELECT 
    se.enrollment_id,
    (random() * 20)::integer as mse1_marks,
    (random() * 20)::integer as mse2_marks
  FROM student_enrollments se
  JOIN course_offerings co ON se.offering_id = co.offering_id
  JOIN courses c ON co.course_id = c.course_id
  WHERE c.has_theory_component = true
    AND random() < 0.8 -- 80% of students have theory marks
) se;

-- Lab marks
INSERT INTO lab_marks (enrollment_id, record_marks, continuous_evaluation_marks, lab_mse_marks)
SELECT 
  se.enrollment_id,
  FLOOR(random() * 8 + 3)::integer,  -- 3-10 for record_marks (within 0-10 constraint)
  FLOOR(random() * 16 + 5)::integer, -- 5-20 for continuous_evaluation_marks (within 0-20 constraint)
  FLOOR(random() * 11 + 10)::integer -- 10-20 for lab_mse_marks (within 0-20 constraint)
FROM student_enrollments se
JOIN course_offerings co ON se.offering_id = co.offering_id
JOIN courses c ON co.course_id = c.course_id
WHERE c.has_lab_component = true
  AND random() < 0.9; -- 90% of students have lab marks

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Data generation completed successfully!';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Colleges: %', (SELECT COUNT(*) FROM colleges);
  RAISE NOTICE '  Departments: %', (SELECT COUNT(*) FROM departments);
  RAISE NOTICE '  Sections: %', (SELECT COUNT(*) FROM sections);
  RAISE NOTICE '  Users: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '  Teachers: %', (SELECT COUNT(*) FROM teachers);
  RAISE NOTICE '  Students: %', (SELECT COUNT(*) FROM students);
  RAISE NOTICE '  Courses: %', (SELECT COUNT(*) FROM courses);
  RAISE NOTICE '  Course Offerings: %', (SELECT COUNT(*) FROM course_offerings);
  RAISE NOTICE '  Student Enrollments: %', (SELECT COUNT(*) FROM student_enrollments);
  RAISE NOTICE '  Attendance Sessions: %', (SELECT COUNT(*) FROM attendance);
  RAISE NOTICE '  Attendance Records: %', (SELECT COUNT(*) FROM attendance_records);
  RAISE NOTICE '  Theory Marks: %', (SELECT COUNT(*) FROM theory_marks);
  RAISE NOTICE '  Lab Marks: %', (SELECT COUNT(*) FROM lab_marks);
END $$;

COMMIT;
