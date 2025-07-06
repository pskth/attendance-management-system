-- #############################################################################
-- # Complete, Corrected Database Schema for Multi-Tenant SIS
-- #############################################################################

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- #############################################################################
-- # ENUM Types - Define controlled vocabularies for specific columns
-- #############################################################################

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'report_viewer');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');
CREATE TYPE course_type AS ENUM ('core', 'department_elective', 'open_elective');

-- #############################################################################
-- # Core Tables - The foundational entities of the system
-- #############################################################################

-- The root table for the multi-tenant system. Each row is a separate college.
CREATE TABLE colleges (
  college_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name VARCHAR(150) UNIQUE NOT NULL,
  college_code VARCHAR(20) UNIQUE NOT NULL,
  logo_url TEXT
);

-- Global user accounts. A single user can have roles in multiple colleges.
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- == CORRECTED ROLES TABLE ==
-- This new table correctly scopes user roles to a specific college,
-- which is essential for security and data isolation in a multi-tenant system.
-- It replaces the old global user_roles table.
-- =============================================================================
CREATE TABLE user_college_roles (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
  role user_role NOT NULL,
  -- A user can have a specific role only once per college.
  PRIMARY KEY (user_id, college_id, role)
);
-- Note: The `admins` and `report_viewers` tables are now removed as they are
--       redundant. An admin is simply a user with the 'admin' role in this table
--       for a specific college.

-- #############################################################################
-- # College-Scoped Structural Tables
-- #############################################################################

-- Authoritative table for academic years, linked to a college.
CREATE TABLE academic_years (
    year_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    year_name VARCHAR(10) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    UNIQUE(college_id, year_name)
);

-- Departments are scoped to a college.
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10),
    UNIQUE(college_id, department_name),
    UNIQUE(college_id, department_code)
);

-- Sections are scoped to a department, which is scoped to a college.
CREATE TABLE sections (
    section_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    section_name VARCHAR(10) NOT NULL,
    UNIQUE(department_id, section_name)
);

-- #############################################################################
-- # People and Role-Specific Tables
-- #############################################################################

-- Students are explicitly linked to a college.
CREATE TABLE students (
  student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(section_id) ON DELETE SET NULL,
  usn VARCHAR(20) UNIQUE NOT NULL,
  semester INT,
  academic_year INT NOT NULL
);

-- Teachers are employed by a specific college.
CREATE TABLE teachers (
  teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL
);

-- #############################################################################
-- # Course and Enrollment Tables
-- #############################################################################

-- Courses are defined by a college.
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
  course_type course_type,
  has_theory_component BOOLEAN NOT NULL DEFAULT TRUE,
  has_lab_component BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(college_id, course_code)
);

-- Elective groups are specific to a college's department and academic year.
CREATE TABLE department_elective_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    group_name VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    semester INT NOT NULL,
    batch_year INT NOT NULL,
    UNIQUE(college_id, group_name, department_id, semester, batch_year)
);

CREATE TABLE course_elective_group_members (
    group_id UUID REFERENCES department_elective_groups(group_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, course_id)
);

CREATE TABLE open_elective_restrictions (
    restriction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    restricted_department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (course_id, restricted_department_id)
);

-- Course offerings are instances of a college's course being taught in a specific semester.
CREATE TABLE course_offerings (
  offering_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(section_id) ON DELETE CASCADE,
  year_id UUID REFERENCES academic_years(year_id) ON DELETE CASCADE,
  semester INT
);

CREATE TABLE student_enrollments (
  enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  offering_id UUID REFERENCES course_offerings(offering_id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  year_id UUID REFERENCES academic_years(year_id) ON DELETE CASCADE,
  UNIQUE(student_id, offering_id) -- A student can only enroll in the same offering once.
);

-- #############################################################################
-- # Academic Record Tables (Attendance and Marks)
-- #############################################################################

-- A record of a single class session being held.
CREATE TABLE attendance (
  attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID REFERENCES course_offerings(offering_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  class_date DATE NOT NULL,
  period_number INT,
  syllabus_covered TEXT
);

-- A record of a single student's attendance for a specific class session.
CREATE TABLE attendance_records (
  record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(attendance_id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  status attendance_status,
  UNIQUE(attendance_id, student_id) -- A student's attendance can only be marked once per class.
);

CREATE TABLE theory_marks (
  marks_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID UNIQUE NOT NULL REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
  mse1_marks SMALLINT CHECK (mse1_marks >= 0 AND mse1_marks <= 20),
  mse2_marks SMALLINT CHECK (mse2_marks >= 0 AND mse2_marks <= 20),
  mse3_marks SMALLINT CHECK (mse3_marks IS NULL OR (mse3_marks >= 0 AND mse3_marks <= 20)),
  task1_marks SMALLINT CHECK (task1_marks >= 0 AND task1_marks <= 4),
  task2_marks SMALLINT CHECK (task2_marks >= 0 AND task2_marks <= 4),
  task3_marks SMALLINT CHECK (task3_marks >= 0 AND task3_marks <= 2),
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mse3_eligibility_check CHECK ( (mse1_marks + mse2_marks < 20) OR (mse3_marks IS NULL) )
);

CREATE TABLE lab_marks (
  marks_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID UNIQUE NOT NULL REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
  record_marks SMALLINT CHECK (record_marks >= 0 AND record_marks <= 10),
  continuous_evaluation_marks SMALLINT CHECK (continuous_evaluation_marks >= 0 AND continuous_evaluation_marks <= 20),
  lab_mse_marks SMALLINT CHECK (lab_mse_marks >= 0 AND lab_mse_marks <= 20),
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- #############################################################################
-- # End of Schema
-- #############################################################################