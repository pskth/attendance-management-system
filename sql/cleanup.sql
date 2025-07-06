-- =============================================================================
-- CLEANUP SCRIPT - DELETE ALL TEST DATA
-- =============================================================================

BEGIN;

-- Delete all test data in correct order (respecting foreign key constraints)
DELETE FROM attendance_records;
DELETE FROM lab_marks;
DELETE FROM theory_marks;
DELETE FROM student_enrollments;
DELETE FROM course_offerings;
DELETE FROM attendance;
DELETE FROM open_elective_restrictions;
DELETE FROM course_elective_group_members;
DELETE FROM department_elective_groups;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM teachers;
DELETE FROM admins;
DELETE FROM report_viewers;
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM sections;
DELETE FROM departments;
DELETE FROM academic_years;
DELETE FROM colleges;

-- Reset sequences (if you want to start IDs from 1 again)
-- Note: This is optional since you're using UUIDs

COMMIT;

-- Verify cleanup
SELECT 
  'Cleanup completed!' AS status,
  (SELECT COUNT(*) FROM colleges) AS colleges,
  (SELECT COUNT(*) FROM departments) AS departments,
  (SELECT COUNT(*) FROM sections) AS sections,
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM students) AS students,
  (SELECT COUNT(*) FROM teachers) AS teachers,
  (SELECT COUNT(*) FROM courses) AS courses,
  (SELECT COUNT(*) FROM course_offerings) AS course_offerings,
  (SELECT COUNT(*) FROM student_enrollments) AS enrollments,
  (SELECT COUNT(*) FROM attendance_records) AS attendance_records,
  (SELECT COUNT(*) FROM theory_marks) AS theory_marks,
  (SELECT COUNT(*) FROM lab_marks) AS lab_marks;
