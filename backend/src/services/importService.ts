// src/services/importService.ts
import csv from 'csv-parser';
import { Readable } from 'stream';
import { autoEnrollStudentBySemester, autoEnrollFirstYearStudent, autoEnrollStudentForSemester } from './autoEnrollmentService';

export interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}

export class ImportService {
  static async importCSVData(table: string, buffer: Buffer, prisma: any): Promise<ImportResult> {
    const records: any[] = [];
    const errors: string[] = [];

    console.log(`=== IMPORT CSV DATA CALLED ===`);
    console.log(`Starting import for table: ${table}`);
    console.log(`Buffer size: ${buffer.length}`);

    return new Promise((resolve) => {
      const stream = Readable.from(buffer);

      stream
        .pipe(csv())
        .on('data', (data: any) => {
          console.log('CSV row parsed:', data);
          records.push(data);
        })
        .on('end', async () => {
          console.log(`Parsed ${records.length} records from CSV`);
          try {
            let recordsProcessed = 0;

            console.log(`Processing table: ${table.toLowerCase()}`);
            console.log(`Available records: ${records.length}`);

            switch (table.toLowerCase()) {
              case 'colleges':
                recordsProcessed = await ImportService.importColleges(records, prisma, errors);
                break;
              case 'users':
                recordsProcessed = await ImportService.importUsers(records, prisma, errors);
                break;
              case 'departments':
                recordsProcessed = await ImportService.importDepartments(records, prisma, errors);
                break;
              case 'sections':
                recordsProcessed = await ImportService.importSections(records, prisma, errors);
                break;
              case 'students':
                recordsProcessed = await ImportService.importStudents(records, prisma, errors);
                break;
              case 'teachers':
                recordsProcessed = await ImportService.importTeachers(records, prisma, errors);
                break;
              case 'courses':
                recordsProcessed = await ImportService.importCourses(records, prisma, errors);
                break;
              case 'user_roles':
                recordsProcessed = await ImportService.importUserRoles(records, prisma, errors);
                break;
              case 'academic_years':
                recordsProcessed = await ImportService.importAcademicYears(records, prisma, errors);
                break;
              case 'course_offerings':
                recordsProcessed = await ImportService.importCourseOfferings(records, prisma, errors);
                break;
              case 'attendance':
                recordsProcessed = await ImportService.importAttendance(records, prisma, errors);
                break;
              case 'attendance_records':
                recordsProcessed = await ImportService.importAttendanceRecords(records, prisma, errors);
                break;
              case 'student_enrollments':
                recordsProcessed = await ImportService.importStudentEnrollments(records, prisma, errors);
                break;
              case 'theory_marks':
                // TODO: MIGRATE TO NEW MARKS SCHEMA
                // The theory_marks import needs to be rewritten to use TestComponent + StudentMark
                errors.push('Theory marks import not yet migrated to new schema. Use admin marks API instead.');
                recordsProcessed = 0;
                break;
              // recordsProcessed = await ImportService.importTheoryMarks(records, prisma, errors);
              case 'lab_marks':
                // TODO: MIGRATE TO NEW MARKS SCHEMA  
                // The lab_marks import needs to be rewritten to use TestComponent + StudentMark
                errors.push('Lab marks import not yet migrated to new schema. Use admin marks API instead.');
                recordsProcessed = 0;
                break;
              // recordsProcessed = await ImportService.importLabMarks(records, prisma, errors);
              default:
                errors.push(`Unknown table: ${table}`);
            }

            resolve({
              success: errors.length === 0,
              message: errors.length === 0 ? 'Import completed successfully' : 'Import completed with errors',
              recordsProcessed,
              errors
            });
          } catch (error) {
            resolve({
              success: false,
              message: error instanceof Error ? error.message : 'Import failed',
              recordsProcessed: 0,
              errors: [error instanceof Error ? error.message : 'Unknown error']
            });
          }
        });
    });
  }

  static async importColleges(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        await prisma.college.create({
          data: {
            name: record.college_name || record.name,
            code: record.college_code || record.code,
            logoUrl: record.logo_url || record.logoUrl || null
          }
        });
        count++;
      } catch (error) {
        errors.push(`College ${record.college_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importUsers(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    console.log(`Importing ${records.length} user records...`);
    console.log('First record:', records[0]);

    for (const record of records) {
      try {
        console.log('Processing user record:', record);
        const userData = {
          username: record.username,
          passwordHash: record.password_hash || record.passwordHash,
          name: record.name,
          phone: record.phone || null
        };
        console.log('User data to create:', userData);

        const result = await prisma.user.create({
          data: userData
        });
        console.log('Created user:', result);
        count++;
      } catch (error) {
        console.error('Error creating user:', error);
        errors.push(`User ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Imported ${count} users`);
    return count;
  }

  static async importDepartments(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find college by code
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Department ${record.department_name}: College ${record.college_code} not found`);
          continue;
        }

        await prisma.department.create({
          data: {
            college_id: college.id,
            name: record.department_name || record.name,
            code: record.department_code || record.code
          }
        });
        count++;
      } catch (error) {
        errors.push(`Department ${record.department_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importSections(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find college first
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Section ${record.section_name}: College ${record.college_code} not found`);
          continue;
        }

        // Find department by college_id and department_code
        const department = await prisma.department.findFirst({
          where: {
            code: record.department_code,
            college_id: college.id
          }
        });

        if (!department) {
          errors.push(`Section ${record.section_name}: Department ${record.department_code} in college ${record.college_code} not found`);
          continue;
        }

        await prisma.sections.create({
          data: {
            department_id: department.id,
            section_name: record.section_name
          }
        });
        count++;
      } catch (error) {
        errors.push(`Section ${record.section_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importStudents(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { username: record.username }
        });

        if (!user) {
          errors.push(`Student ${record.username}: User not found`);
          continue;
        }

        // Find college
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Student ${record.username}: College ${record.college_code} not found`);
          continue;
        }

        // Find department
        const department = await prisma.department.findFirst({
          where: {
            code: record.department_code,
            college_id: college.id
          }
        });

        if (!department) {
          errors.push(`Student ${record.username}: Department ${record.department_code} not found`);
          continue;
        }

        // Find section
        const section = await prisma.sections.findFirst({
          where: {
            section_name: record.section_name,
            department_id: department.id
          }
        });

        if (!section) {
          errors.push(`Student ${record.username}: Section ${record.section_name} not found`);
          continue;
        }

        const createdStudent = await prisma.student.create({
          data: {
            userId: user.id,
            college_id: college.id,
            department_id: department.id,
            section_id: section.section_id,
            usn: record.usn,
            semester: parseInt(record.semester) || 1,
            batchYear: parseInt(record.batch_year)
          }
        });

        // Auto-enroll student in core courses for their department and semester
        try {
          const semester = parseInt(record.semester) || 1;
          const enrollmentResult = await autoEnrollStudentForSemester(createdStudent.id, semester);
          console.log(`Auto-enrollment for imported student ${createdStudent.id} (semester ${semester}):`, enrollmentResult);
        } catch (enrollmentError) {
          console.warn(`Failed to auto-enroll imported student ${createdStudent.id}:`, enrollmentError);
          // Don't fail the import if auto-enrollment fails
        }

        count++;
      } catch (error) {
        errors.push(`Student ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importTeachers(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { username: record.username }
        });

        if (!user) {
          errors.push(`Teacher ${record.username}: User not found`);
          continue;
        }

        // Find college
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Teacher ${record.username}: College ${record.college_code} not found`);
          continue;
        }

        // Find department
        const department = await prisma.department.findFirst({
          where: {
            code: record.department_code,
            college_id: college.id
          }
        });

        if (!department) {
          errors.push(`Teacher ${record.username}: Department ${record.department_code} not found`);
          continue;
        }

        await prisma.teacher.create({
          data: {
            userId: user.id,
            college_id: college.id,
            departmentId: department.id
          }
        });

        count++;
      } catch (error) {
        errors.push(`Teacher ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importCourses(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find college
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Course ${record.course_code}: College ${record.college_code} not found`);
          continue;
        }

        // Find department (optional)
        let department = null;
        if (record.department_code) {
          department = await prisma.department.findFirst({
            where: {
              code: record.department_code,
              college_id: college.id
            }
          });
        }

        await prisma.course.create({
          data: {
            college_id: college.id,
            code: record.course_code,
            name: record.course_name,
            departmentId: department?.id,
            type: record.course_type || 'core'
          }
        });
        count++;
      } catch (error) {
        errors.push(`Course ${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importCourseOfferings(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find course
        const course = await prisma.course.findFirst({
          where: { code: record.course_code }
        });

        if (!course) {
          errors.push(`Course offering ${record.course_code}: Course not found`);
          continue;
        }

        // Find academic year
        const academicYear = await prisma.academic_years.findFirst({
          where: {
            year_name: record.academic_year,
            college_id: course.college_id
          }
        });

        // Find section
        const section = await prisma.sections.findFirst({
          where: {
            section_name: record.section_name,
            departments: {
              code: record.section_dept_code,
              college_id: course.college_id
            }
          }
        });

        // Find teacher
        const teacher = await prisma.teacher.findFirst({
          where: {
            user: {
              username: record.teacher_username
            },
            college_id: course.college_id
          }
        });

        await prisma.courseOffering.create({
          data: {
            courseId: course.id,
            year_id: academicYear?.year_id,
            semester: parseInt(record.semester) || 1,
            section_id: section?.section_id,
            teacherId: teacher?.id
          }
        });
        count++;
      } catch (error) {
        errors.push(`Course offering ${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importStudentEnrollments(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find student
        const student = await prisma.student.findFirst({
          where: { usn: record.student_usn }
        });

        // Find course
        const course = await prisma.course.findFirst({
          where: { code: record.course_code }
        });

        // Find academic year
        const academicYear = await prisma.academic_years.findFirst({
          where: {
            year_name: record.academic_year,
            college_id: course.college_id
          }
        });

        if (!student || !course) {
          errors.push(`Enrollment ${record.student_usn}-${record.course_code}: Student or course not found`);
          continue;
        }

        // Find course offering
        const courseOffering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            year_id: academicYear?.year_id,
            semester: parseInt(record.semester) || 1
          }
        });

        if (!courseOffering) {
          errors.push(`Enrollment ${record.student_usn}-${record.course_code}: Course offering not found`);
          continue;
        }

        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            offeringId: courseOffering.id,
            year_id: academicYear?.year_id
          }
        });
        count++;
      } catch (error) {
        errors.push(`Enrollment ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importUserRoles(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { username: record.username }
        });

        if (!user) {
          errors.push(`User role ${record.username}: User not found`);
          continue;
        }

        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            role: record.role
          }
        });
        count++;
      } catch (error) {
        errors.push(`User role ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importAcademicYears(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find college
        const college = await prisma.college.findUnique({
          where: { code: record.college_code }
        });

        if (!college) {
          errors.push(`Academic year ${record.year_name}: College ${record.college_code} not found`);
          continue;
        }

        await prisma.academic_years.create({
          data: {
            college_id: college.id,
            year_name: record.year_name,
            start_date: new Date(record.start_date),
            end_date: new Date(record.end_date),
            is_active: record.is_active === 'TRUE' || record.is_active === true
          }
        });
        count++;
      } catch (error) {
        errors.push(`Academic year ${record.year_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importAttendance(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find course
        const course = await prisma.course.findFirst({
          where: { code: record.course_code }
        });

        // Find section
        const section = await prisma.sections.findFirst({
          where: {
            section_name: record.section_name,
            departments: {
              code: record.section_dept_code,
              college_id: course.college_id
            }
          }
        });

        // Find teacher
        const teacher = await prisma.teacher.findFirst({
          where: {
            user: {
              username: record.teacher_username
            },
            college_id: course.college_id
          }
        });

        if (!course || !section || !teacher) {
          errors.push(`Attendance ${record.course_code}-${record.class_date}: Missing course, section, or teacher`);
          continue;
        }

        // Find course offering
        const courseOffering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            section_id: section?.section_id,
            teacherId: teacher?.id
          }
        });

        if (!courseOffering) {
          errors.push(`Attendance ${record.course_code}-${record.class_date}: Course offering not found`);
          continue;
        }

        await prisma.attendance.create({
          data: {
            offeringId: courseOffering.id,
            teacherId: teacher.id,
            classDate: new Date(record.class_date),
            periodNumber: parseInt(record.period_number) || 1,
            syllabusCovered: record.syllabus_covered || null
          }
        });
        count++;
      } catch (error) {
        errors.push(`Attendance ${record.course_code}-${record.class_date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  static async importAttendanceRecords(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;

    for (const record of records) {
      try {
        // Find student
        const student = await prisma.student.findFirst({
          where: { usn: record.student_usn }
        });

        // Find attendance session
        const attendance = await prisma.attendance.findFirst({
          where: {
            offering: {
              course: { code: record.course_code }
            },
            classDate: new Date(record.class_date),
            periodNumber: parseInt(record.period_number) || 1
          }
        });

        if (!student || !attendance) {
          errors.push(`Attendance record ${record.student_usn}-${record.class_date}: Missing references`);
          continue;
        }

        await prisma.attendanceRecord.create({
          data: {
            attendanceId: attendance.id,
            studentId: student.id,
            status: record.status || 'present'
          }
        });
        count++;
      } catch (error) {
        errors.push(`Attendance record ${record.student_usn}-${record.class_date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return count;
  }

  // DEPRECATED: Old marks schema - kept for reference
  // TODO: Rewrite using TestComponent + StudentMark schema
  /*
  static async importTheoryMarks(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;
    
    for (const record of records) {
      try {
        // Find student
        const student = await prisma.student.findFirst({
          where: { usn: record.student_usn }
        });
        
        // Find course
        const course = await prisma.course.findFirst({
          where: { code: record.course_code }
        });
        
        if (!student || !course) {
          errors.push(`Theory marks ${record.student_usn}-${record.course_code}: Student or course not found`);
          continue;
        }
        
        // Find enrollment first
        const enrollment = await prisma.studentEnrollment.findFirst({
          where: {
            studentId: student.id,
            offering: {
              courseId: course.id
            }
          }
        });
        
        if (!enrollment) {
          errors.push(`Theory marks ${record.student_usn}-${record.course_code}: Enrollment not found`);
          continue;
        }

        await prisma.theoryMarks.create({
          data: {
            enrollmentId: enrollment.id,
            mse1Marks: record.mse1_marks ? parseInt(record.mse1_marks) : null,
            mse2Marks: record.mse2_marks ? parseInt(record.mse2_marks) : null,
            mse3Marks: record.mse3_marks ? parseInt(record.mse3_marks) : null,
            task1Marks: record.task1_marks ? parseInt(record.task1_marks) : null,
            task2Marks: record.task2_marks ? parseInt(record.task2_marks) : null,
            task3Marks: record.task3_marks ? parseInt(record.task3_marks) : null
          }
        });
        count++;
      } catch (error) {
        errors.push(`Theory marks ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return count;
  }
  */

  // DEPRECATED: Old marks schema - kept for reference
  // TODO: Rewrite using TestComponent + StudentMark schema
  /*
  static async importLabMarks(records: any[], prisma: any, errors: string[]): Promise<number> {
    let count = 0;
    
    for (const record of records) {
      try {
        // Find student
        const student = await prisma.student.findFirst({
          where: { usn: record.student_usn }
        });
        
        // Find course
        const course = await prisma.course.findFirst({
          where: { code: record.course_code }
        });
        
        if (!student || !course) {
          errors.push(`Lab marks ${record.student_usn}-${record.course_code}: Student or course not found`);
          continue;
        }
        
        // Find enrollment first
        const enrollment = await prisma.studentEnrollment.findFirst({
          where: {
            studentId: student.id,
            offering: {
              courseId: course.id
            }
          }
        });
        
        if (!enrollment) {
          errors.push(`Lab marks ${record.student_usn}-${record.course_code}: Enrollment not found`);
          continue;
        }

        await prisma.labMarks.create({
          data: {
            enrollmentId: enrollment.id,
            recordMarks: record.record_marks ? parseInt(record.record_marks) : null,
            continuousEvaluationMarks: record.continuous_evaluation_marks ? parseInt(record.continuous_evaluation_marks) : null,
            labMseMarks: record.lab_mse_marks ? parseInt(record.lab_mse_marks) : null
          }
        });
        count++;
      } catch (error) {
        errors.push(`Lab marks ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return count;
  }
  */
}
