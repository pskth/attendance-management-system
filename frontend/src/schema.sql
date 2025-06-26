// Enable UUID extension - Note: This is a PostgreSQL command and not part of DBML.
// DBML does not have a direct equivalent for extensions.

//// ---------------- ENUMS ----------------

enum user_role {
  student
  teacher
  admin
  report_viewer
}

enum attendance_status {
  present
  absent
}

enum course_type {
  core
  department_elective
  open_elective
}

//// ---------------- TABLES ----------------

Table colleges {
  college_id uuid [pk, default: `uuid_generate_v4()`]
  college_name varchar(150) [unique, not null]
  college_code varchar(20) [unique, not null]
  logo_url text
  note: 'Stores master details for the college.'
}

Table departments {
  department_id uuid [pk, default: `uuid_generate_v4()`]
  department_name varchar(100) [unique, not null]
  department_code varchar(10) [unique]
  note: 'Single source of truth for all academic departments.'
}

Table users {
  user_id uuid [pk, default: `uuid_generate_v4()`]
  username varchar(100) [unique, not null]
  password_hash text [not null]
  name varchar(100) [not null]
  phone varchar(15)
  photo_url text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table user_roles {
  user_id uuid [pk, not null]
  role user_role [pk, not null]
}

Table students {
  student_id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [unique, not null]
  usn varchar(20) [unique, not null]
  batch_year int [not null] // The year the student was admitted
  semester int

  indexes {
    (user_id)
  }
}

Table teachers {
  teacher_id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [unique, not null]
  department_id uuid

  indexes {
    (user_id)
    (department_id)
  }
}

Table courses {
  course_id uuid [pk, default: `uuid_generate_v4()`]
  course_code varchar(20) [unique, not null]
  course_name varchar(100) [not null]
  department_id uuid [note: 'Dept offering the course']
  course_type course_type
  has_theory_component boolean [not null, default: true]
  has_lab_component boolean [not null, default: false]

  indexes {
    (department_id)
  }
}

Table department_elective_groups {
  group_id uuid [pk, default: `uuid_generate_v4()`]
  group_name varchar(150) [not null]
  department_id uuid [not null, note: 'Dept this group is for']
  semester int [not null]
  batch_year int [not null]

  indexes {
    (group_name, department_id, semester, batch_year) [unique]
  }
}

Table course_elective_group_members {
  group_id uuid [pk, not null]
  course_id uuid [pk, not null]
}

Table open_elective_restrictions {
  restriction_id uuid [pk, default: `uuid_generate_v4()`]
  course_id uuid [not null]
  restricted_department_id uuid [not null]

  indexes {
    (course_id, restricted_department_id) [unique]
    (course_id)
  }
}

Table course_offerings {
  offering_id uuid [pk, default: `uuid_generate_v4()`]
  course_id uuid
  teacher_id uuid
  class_section varchar(10)
  batch_year int
  semester int
  department_id uuid [note: 'Dept this offering is for']

  indexes {
    (department_id)
  }
}

Table student_enrollments {
  enrollment_id uuid [pk, default: `uuid_generate_v4()`]
  student_id uuid
  offering_id uuid
  attempt_number int [default: 1]
  batch_year int
}

Table attendance {
  attendance_id uuid [pk, default: `uuid_generate_v4()`]
  offering_id uuid
  teacher_id uuid
  class_date date [not null]
  period_number int
  syllabus_covered text
}

Table attendance_records {
  record_id uuid [pk, default: `uuid_generate_v4()`]
  attendance_id uuid
  student_id uuid
  status attendance_status
}

Table theory_marks {
  marks_id uuid [pk, default: `uuid_generate_v4()`]
  enrollment_id uuid [unique, not null]
  mse1_marks smallint
  mse2_marks smallint
  mse3_marks smallint
  task1_marks smallint
  task2_marks smallint
  task3_marks smallint
  last_updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  // Note: DBML doesn't support CHECK constraints directly. Added as notes.
  note: 'CHECKs: mse1(0-20), mse2(0-20), mse3(0-20), task1(0-4), task2(0-4), task3(0-2). mse3 only if mse1+mse2<20'
}

Table lab_marks {
  marks_id uuid [pk, default: `uuid_generate_v4()`]
  enrollment_id uuid [unique, not null]
  record_marks smallint
  continuous_evaluation_marks smallint
  lab_mse_marks smallint
  last_updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  // Note: DBML doesn't support CHECK constraints directly. Added as notes.
  note: 'CHECKs: record(0-10), continuous_eval(0-20), lab_mse(0-20)'
}

Table admins {
  admin_id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [unique, not null]
}

Table report_viewers {
  viewer_id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [unique, not null]
}

//// ---------------- RELATIONSHIPS ----------------

Ref: user_roles.user_id > users.user_id [delete: cascade]
Ref: students.user_id > users.user_id [delete: cascade]
Ref: teachers.user_id > users.user_id [delete: cascade]
Ref: admins.user_id > users.user_id [delete: cascade]
Ref: report_viewers.user_id > users.user_id [delete: cascade]

Ref: teachers.department_id > departments.department_id [delete: 'set null']
Ref: courses.department_id > departments.department_id [delete: 'set null']

Ref: department_elective_groups.department_id > departments.department_id [delete: cascade]
Ref: open_elective_restrictions.restricted_department_id > departments.department_id [delete: cascade]

Ref: course_elective_group_members.group_id > department_elective_groups.group_id [delete: cascade]
Ref: course_elective_group_members.course_id > courses.course_id [delete: cascade]

Ref: open_elective_restrictions.course_id > courses.course_id [delete: cascade]

Ref: course_offerings.course_id > courses.course_id [delete: cascade]
Ref: course_offerings.teacher_id > teachers.teacher_id [delete: cascade]
Ref: course_offerings.department_id > departments.department_id [delete: 'set null']

Ref: student_enrollments.student_id > students.student_id [delete: cascade]
Ref: student_enrollments.offering_id > course_offerings.offering_id [delete: cascade]

Ref: theory_marks.enrollment_id > student_enrollments.enrollment_id [delete: cascade]
Ref: lab_marks.enrollment_id > student_enrollments.enrollment_id [delete: cascade]

Ref: attendance.offering_id > course_offerings.offering_id [delete: cascade]
Ref: attendance.teacher_id > teachers.teacher_id [delete: cascade]

Ref: attendance_records.attendance_id > attendance.attendance_id [delete: cascade]
Ref: attendance_records.student_id > students.student_id [delete: cascade]
