-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'parent', 'report_viewer');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');
CREATE TYPE course_type AS ENUM ('core', 'department_elective', 'open_elective');

-- USERS
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER ROLES (multi-role support)
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  role user_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- STUDENTS
CREATE TABLE students (
  student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  usn VARCHAR(20) UNIQUE NOT NULL,
  college_name VARCHAR(100),
  semester INT
);
CREATE INDEX idx_students_user_id ON students(user_id);

-- TEACHERS
CREATE TABLE teachers (
  teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  department VARCHAR(50)
);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- COURSES
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  department VARCHAR(50), -- Department offering the course
  course_type course_type
);

-- NEW TABLE: To define a group or "slot" for department electives.
CREATE TABLE department_elective_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(150) NOT NULL, -- e.g., "Professional Elective 1"
    department VARCHAR(50) NOT NULL,    -- The department this group is for (e.g., 'AI & ML')
    semester INT NOT NULL,              -- The semester this group applies to
    academic_year VARCHAR(10) NOT NULL,
    UNIQUE(group_name, department, semester, academic_year)
);

-- NEW TABLE: To link courses as options within a specific elective group.
CREATE TABLE course_elective_group_members (
    group_id UUID REFERENCES department_elective_groups(group_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, course_id)
);

-- NEW TABLE: To list which departments are restricted from taking a specific open elective course.
CREATE TABLE open_elective_restrictions (
    restriction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    restricted_department VARCHAR(50) NOT NULL,
    UNIQUE (course_id, restricted_department)
);
CREATE INDEX idx_oer_course_id ON open_elective_restrictions(course_id);


-- COURSE OFFERINGS (replaces course_assignments)
CREATE TABLE course_offerings (
  offering_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  class_section VARCHAR(10),
  academic_year VARCHAR(10),
  semester INT,
  department VARCHAR(50)
);

-- STUDENT ENROLLMENTS (linked to offerings)
CREATE TABLE student_enrollments (
  enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  offering_id UUID REFERENCES course_offerings(offering_id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  academic_year VARCHAR(10)
);
CREATE INDEX idx_enrollments_offering_id ON student_enrollments(offering_id);
CREATE INDEX idx_enrollments_student_id ON student_enrollments(student_id);

-- ATTENDANCE (no timetable dependency)
-- MODIFIED: Removed created_at
CREATE TABLE attendance (
  attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID REFERENCES course_offerings(offering_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  period_number INT,
  syllabus_covered TEXT,
  status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'canceled', 'rescheduled'))
);
CREATE INDEX idx_attendance_offering_date ON attendance(offering_id, class_date);

-- ATTENDANCE RECORDS
CREATE TABLE attendance_records (
  record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(attendance_id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  status attendance_status
);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_attendance_id ON attendance_records(attendance_id);

-- ADMINS
CREATE TABLE admins (
  admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

-- PARENT-STUDENT LINKS
CREATE TABLE parent_student_links (
  link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  email VARCHAR(100),
  UNIQUE(parent_user_id, student_id)
);
CREATE INDEX idx_parent_links_student_id ON parent_student_links(student_id);
CREATE INDEX idx_parent_links_parent_user_id ON parent_student_links(parent_user_id);

-- REPORT VIEWERS (access to full data; no restrictions)
-- MODIFIED: Removed department
CREATE TABLE report_viewers (
  viewer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);