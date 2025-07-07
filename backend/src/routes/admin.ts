// src/routes/admin.ts
import { Router } from 'express';
import * as multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import DatabaseService from '../lib/database';

const router = Router();
const upload = multer.default({ storage: multer.default.memoryStorage() });

console.log('=== ADMIN ROUTES LOADED ===');

interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}

// CSV Import endpoint
router.post('/import/:table', upload.single('file'), async (req, res) => {
  try {
    console.log('=== IMPORT ENDPOINT HIT VERSION 2.0 ===');
    const { table } = req.params;
    const file = req.file;

    console.log('Table:', table);
    console.log('File:', file ? 'Present' : 'Missing');

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const prisma = DatabaseService.getInstance();
    const result = await importCSVData(table, file.buffer, prisma);

    res.json(result);
  } catch (error) {
    console.error('=== IMPORT ENDPOINT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Clear all data endpoint
router.post('/clear-database', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    // Clear in reverse dependency order
    await prisma.labMarks.deleteMany();
    await prisma.theoryMarks.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.studentEnrollment.deleteMany();
    await prisma.courseOffering.deleteMany();
    await prisma.courseElectiveGroupMember.deleteMany();
    await prisma.departmentElectiveGroup.deleteMany();
    await prisma.openElectiveRestriction.deleteMany();
    await prisma.course.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.student.deleteMany();
    await prisma.userRoleAssignment.deleteMany();
    await prisma.sections.deleteMany();
    await prisma.department.deleteMany();
    await prisma.academic_years.deleteMany();
    await prisma.user.deleteMany();
    await prisma.college.deleteMany();

    res.json({ 
      success: true, 
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get import status endpoint
router.get('/import-status', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    
    const counts = {
      colleges: await prisma.college.count(),
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      sections: await prisma.sections.count(),
      students: await prisma.student.count(),
      teachers: await prisma.teacher.count(),
      courses: await prisma.course.count(),
      userRoles: await prisma.userRoleAssignment.count(),
      academicYears: await prisma.academic_years.count(),
      courseOfferings: await prisma.courseOffering.count(),
      attendance: await prisma.attendance.count(),
      attendanceRecords: await prisma.attendanceRecord.count(),
      enrollments: await prisma.studentEnrollment.count(),
      theoryMarks: await prisma.theoryMarks.count(),
      labMarks: await prisma.labMarks.count()
    };

    res.json({
      success: true,
      data: counts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

async function importCSVData(table: string, buffer: Buffer, prisma: any): Promise<ImportResult> {
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
              recordsProcessed = await importColleges(records, prisma, errors);
              break;
            case 'users':
              recordsProcessed = await importUsers(records, prisma, errors);
              break;
            case 'departments':
              recordsProcessed = await importDepartments(records, prisma, errors);
              break;
            case 'sections':
              recordsProcessed = await importSections(records, prisma, errors);
              break;
            case 'students':
              recordsProcessed = await importStudents(records, prisma, errors);
              break;
            case 'teachers':
              recordsProcessed = await importTeachers(records, prisma, errors);
              break;
            case 'courses':
              recordsProcessed = await importCourses(records, prisma, errors);
              break;
            case 'user_roles':
              recordsProcessed = await importUserRoles(records, prisma, errors);
              break;
            case 'academic_years':
              recordsProcessed = await importAcademicYears(records, prisma, errors);
              break;
            case 'course_offerings':
              recordsProcessed = await importCourseOfferings(records, prisma, errors);
              break;
            case 'attendance':
              recordsProcessed = await importAttendance(records, prisma, errors);
              break;
            case 'attendance_records':
              recordsProcessed = await importAttendanceRecords(records, prisma, errors);
              break;
            case 'student_enrollments':
              recordsProcessed = await importStudentEnrollments(records, prisma, errors);
              break;
            case 'theory_marks':
              recordsProcessed = await importTheoryMarks(records, prisma, errors);
              break;
            case 'lab_marks':
              recordsProcessed = await importLabMarks(records, prisma, errors);
              break;
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

async function importColleges(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importUsers(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importDepartments(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importSections(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importStudents(records: any[], prisma: any, errors: string[]): Promise<number> {
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
      
      await prisma.student.create({
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
      
      count++;
    } catch (error) {
      errors.push(`Student ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return count;
}

async function importTeachers(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importCourses(records: any[], prisma: any, errors: string[]): Promise<number> {
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
          type: record.course_type || 'core',
          hasTheoryComponent: record.has_theory_component === 'true' || record.has_theory_component === true,
          hasLabComponent: record.has_lab_component === 'true' || record.has_lab_component === true
        }
      });
      count++;
    } catch (error) {
      errors.push(`Course ${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return count;
}

async function importCourseOfferings(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importStudentEnrollments(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importUserRoles(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importAcademicYears(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importAttendance(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importAttendanceRecords(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importTheoryMarks(records: any[], prisma: any, errors: string[]): Promise<number> {
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

async function importLabMarks(records: any[], prisma: any, errors: string[]): Promise<number> {
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

// Get all marks (theory and lab) for students
router.get('/marks', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId, departmentId, year, studentId, studentUsn } = req.query;
    
    let whereClause: any = {};
    
    // Handle student filtering by either UUID or USN
    if (studentId || studentUsn) {
      if (studentUsn) {
        // Filter by USN
        whereClause.student = {
          usn: studentUsn as string
        };
      } else if (studentId) {
        // Filter by UUID
        whereClause.studentId = studentId as string;
      }
    }
    
    if (courseId) {
      whereClause.offering = {
        courseId: courseId as string
      };
    }
    
    if (departmentId || year) {
      if (!whereClause.student) {
        whereClause.student = {};
      }
      if (departmentId) {
        whereClause.student.departmentId = departmentId as string;
      }
      if (year) {
        whereClause.student.batchYear = parseInt(year as string);
      }
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        theoryMarks: true,
        labMarks: true
      }
    }) as any[];

    const marksData = enrollments.map(enrollment => ({
      id: enrollment.id,
      enrollmentId: enrollment.id,
      student: enrollment.student ? {
        id: enrollment.student.id,
        usn: enrollment.student.usn,
        user: {
          name: enrollment.student.user.name
        }
      } : null,
      course: enrollment.offering?.course ? {
        id: enrollment.offering.course.id,
        code: enrollment.offering.course.code,
        name: enrollment.offering.course.name
      } : null,
      theoryMarks: enrollment.theoryMarks ? {
        id: enrollment.theoryMarks.id,
        mse1_marks: enrollment.theoryMarks.mse1Marks,
        mse2_marks: enrollment.theoryMarks.mse2Marks,
        mse3_marks: enrollment.theoryMarks.mse3Marks,
        task1_marks: enrollment.theoryMarks.task1Marks,
        task2_marks: enrollment.theoryMarks.task2Marks,
        task3_marks: enrollment.theoryMarks.task3Marks,
        last_updated_at: enrollment.theoryMarks.lastUpdatedAt
      } : null,
      labMarks: enrollment.labMarks ? {
        id: enrollment.labMarks.id,
        record_marks: enrollment.labMarks.recordMarks,
        continuous_evaluation_marks: enrollment.labMarks.continuousEvaluationMarks,
        lab_mse_marks: enrollment.labMarks.labMseMarks,
        last_updated_at: enrollment.labMarks.lastUpdatedAt
      } : null,
      updatedAt: enrollment.theoryMarks?.lastUpdatedAt || enrollment.labMarks?.lastUpdatedAt || new Date()
    }));

    res.json({
      status: 'success',
      data: marksData
    });
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get marks for a specific enrollment
router.get('/marks/:enrollmentId', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { enrollmentId } = req.params;

    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        theoryMarks: true,
        labMarks: true
      }
    }) as any;

    if (!enrollment) {
      res.status(404).json({
        status: 'error',
        error: 'Enrollment not found'
      });
      return;
    }

    const marksData = {
      id: enrollment.id,
      enrollmentId: enrollment.id,
      student: enrollment.student ? {
        id: enrollment.student.id,
        usn: enrollment.student.usn,
        user: {
          name: enrollment.student.user.name
        }
      } : null,
      course: enrollment.offering?.course ? {
        id: enrollment.offering.course.id,
        code: enrollment.offering.course.code,
        name: enrollment.offering.course.name
      } : null,
      theoryMarks: enrollment.theoryMarks ? {
        id: enrollment.theoryMarks.id,
        mse1_marks: enrollment.theoryMarks.mse1Marks,
        mse2_marks: enrollment.theoryMarks.mse2Marks,
        mse3_marks: enrollment.theoryMarks.mse3Marks,
        task1_marks: enrollment.theoryMarks.task1Marks,
        task2_marks: enrollment.theoryMarks.task2Marks,
        task3_marks: enrollment.theoryMarks.task3Marks,
        last_updated_at: enrollment.theoryMarks.lastUpdatedAt
      } : null,
      labMarks: enrollment.labMarks ? {
        id: enrollment.labMarks.id,
        record_marks: enrollment.labMarks.recordMarks,
        continuous_evaluation_marks: enrollment.labMarks.continuousEvaluationMarks,
        lab_mse_marks: enrollment.labMarks.labMseMarks,
        last_updated_at: enrollment.labMarks.lastUpdatedAt
      } : null,
      updatedAt: enrollment.theoryMarks?.lastUpdatedAt || enrollment.labMarks?.lastUpdatedAt || new Date()
    };

    res.json({
      status: 'success',
      data: marksData
    });
  } catch (error) {
    console.error('Error fetching enrollment marks:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update marks for a specific enrollment
router.put('/marks/:enrollmentId', async (req, res) => {
  const { enrollmentId } = req.params;
  const markData = req.body;
  
  try {
    const prisma = DatabaseService.getInstance();

    // Check if enrollment exists
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      res.status(404).json({
        status: 'error',
        error: 'Enrollment not found'
      });
      return;
    }

    // Determine if this is theory or lab marks update
    const isTheoryUpdate = ['mse1_marks', 'mse2_marks', 'mse3_marks', 'task1_marks', 'task2_marks', 'task3_marks'].some(field => field in markData);
    const isLabUpdate = ['record_marks', 'continuous_evaluation_marks', 'lab_mse_marks'].some(field => field in markData);

    if (isTheoryUpdate) {
      // Update theory marks
      const theoryMarkData: any = {};
      if ('mse1_marks' in markData) theoryMarkData.mse1Marks = markData.mse1_marks;
      if ('mse2_marks' in markData) theoryMarkData.mse2Marks = markData.mse2_marks;
      if ('mse3_marks' in markData) theoryMarkData.mse3Marks = markData.mse3_marks;
      if ('task1_marks' in markData) theoryMarkData.task1Marks = markData.task1_marks;
      if ('task2_marks' in markData) theoryMarkData.task2Marks = markData.task2_marks;
      if ('task3_marks' in markData) theoryMarkData.task3Marks = markData.task3_marks;
      
      theoryMarkData.lastUpdatedAt = new Date();

      await prisma.theoryMarks.upsert({
        where: { enrollmentId },
        update: theoryMarkData,
        create: {
          enrollmentId,
          ...theoryMarkData
        }
      });
    }

    if (isLabUpdate) {
      // Update lab marks
      const labMarkData: any = {};
      if ('record_marks' in markData) labMarkData.recordMarks = markData.record_marks;
      if ('continuous_evaluation_marks' in markData) labMarkData.continuousEvaluationMarks = markData.continuous_evaluation_marks;
      if ('lab_mse_marks' in markData) labMarkData.labMseMarks = markData.lab_mse_marks;
      
      labMarkData.lastUpdatedAt = new Date();

      await prisma.labMarks.upsert({
        where: { enrollmentId },
        update: labMarkData,
        create: {
          enrollmentId,
          ...labMarkData
        }
      });
    }

    res.json({
      status: 'success',
      message: 'Marks updated successfully'
    });
  } catch (error) {
    console.error('Error updating marks:', error);
    console.error('EnrollmentId:', enrollmentId);
    console.error('Mark data:', markData);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        enrollmentId,
        markData,
        errorDetails: error instanceof Error ? error.stack : 'Unknown error'
      }
    });
  }
});

// Get eligible students for course enrollment
router.get('/courses/:courseId/eligible-students', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId } = req.params;
    const { year, semester } = req.query;

    if (!year || !semester) {
      res.status(400).json({
        status: 'error',
        error: 'Year and semester are required'
      });
      return;
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        department: true,
        colleges: true,
        openElectiveRestrictions: {
          include: {
            restrictedDepartment: true
          }
        }
      }
    });

    if (!course) {
      res.status(404).json({
        status: 'error',
        error: 'Course not found'
      });
      return;
    }

    let whereClause: any = {
      batchYear: parseInt(year as string),
      college_id: course.college_id
    };

    if (course.type === 'open_elective') {
      // For open electives, include all students except those from restricted departments
      const restrictedDepartmentIds = course.openElectiveRestrictions.map(r => r.restrictedDepartmentId);
      if (restrictedDepartmentIds.length > 0) {
        whereClause.departmentId = {
          notIn: restrictedDepartmentIds
        };
      }
    } else if (course.type === 'department_elective' || course.type === 'core') {
      // For department electives and core courses, only include students from the same department
      if (course.departmentId) {
        whereClause.departmentId = course.departmentId;
      }
    }

    // Get students who are NOT already enrolled in this course
    const eligibleStudents = await prisma.student.findMany({
      where: {
        ...whereClause,
        enrollments: {
          none: {
            offering: {
              courseId: courseId,
              semester: parseInt(semester as string)
            }
          }
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        sections: {
          select: {
            section_id: true,
            section_name: true
          }
        }
      }
    });

    const studentsData = eligibleStudents.map(student => ({
      id: student.id,
      usn: student.usn,
      name: student.user.name,
      semester: student.semester,
      batchYear: student.batchYear,
      department: student.departments ? {
        id: student.departments.id,
        name: student.departments.name,
        code: student.departments.code
      } : null,
      section: student.sections ? {
        id: student.sections.section_id,
        name: student.sections.section_name
      } : null
    }));

    res.json({
      status: 'success',
      data: {
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          type: course.type,
          department: course.department ? {
            id: course.department.id,
            name: course.department.name,
            code: course.department.code
          } : null,
          restrictions: course.openElectiveRestrictions.map(r => ({
            departmentId: r.restrictedDepartmentId,
            departmentName: r.restrictedDepartment.name,
            departmentCode: r.restrictedDepartment.code
          }))
        },
        eligibleStudents: studentsData,
        count: studentsData.length
      }
    });
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enroll students in a course
router.post('/courses/:courseId/enroll-students', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId } = req.params;
    const { studentIds, year, semester, teacherId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({
        status: 'error',
        error: 'Student IDs are required and must be an array'
      });
      return;
    }

    if (!year || !semester) {
      res.status(400).json({
        status: 'error',
        error: 'Year and semester are required'
      });
      return;
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        colleges: true
      }
    });

    if (!course) {
      res.status(404).json({
        status: 'error',
        error: 'Course not found'
      });
      return;
    }

    // Get or create academic year
    const academicYear = await prisma.academic_years.findFirst({
      where: {
        year_name: year as string,
        college_id: course.college_id
      }
    });

    if (!academicYear) {
      res.status(404).json({
        status: 'error',
        error: `Academic year ${year} not found for this college`
      });
      return;
    }

    // Get or create course offering
    let courseOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: courseId,
        year_id: academicYear.year_id,
        semester: parseInt(semester as string)
      }
    });

    if (!courseOffering) {
      // Create new course offering
      courseOffering = await prisma.courseOffering.create({
        data: {
          courseId: courseId,
          year_id: academicYear.year_id,
          semester: parseInt(semester as string),
          teacherId: teacherId || null
        }
      });
    } else if (teacherId && courseOffering.teacherId !== teacherId) {
      // Update teacher if provided and different
      courseOffering = await prisma.courseOffering.update({
        where: { id: courseOffering.id },
        data: { teacherId: teacherId }
      });
    }

    // Enroll students
    const enrollments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Check if student is already enrolled
        const existingEnrollment = await prisma.studentEnrollment.findFirst({
          where: {
            studentId: studentId,
            offeringId: courseOffering.id
          }
        });

        if (existingEnrollment) {
          errors.push(`Student ${studentId} is already enrolled in this course`);
          continue;
        }

        // Create enrollment
        const enrollment = await prisma.studentEnrollment.create({
          data: {
            studentId: studentId,
            offeringId: courseOffering.id,
            year_id: academicYear.year_id,
            attemptNumber: 1
          }
        });

        enrollments.push(enrollment);
      } catch (error) {
        errors.push(`Error enrolling student ${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      status: enrollments.length > 0 ? 'success' : 'error',
      data: {
        courseOffering: {
          id: courseOffering.id,
          courseId: courseOffering.courseId,
          year: year,
          semester: semester,
          teacherId: courseOffering.teacherId
        },
        enrollmentsCreated: enrollments.length,
        totalRequested: studentIds.length,
        errors: errors
      },
      message: `Successfully enrolled ${enrollments.length} out of ${studentIds.length} students`
    });
  } catch (error) {
    console.error('Error enrolling students:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get course enrollments
router.get('/courses/:courseId/enrollments', async (req, res) => {
  try {
    const prisma = DatabaseService.getInstance();
    const { courseId } = req.params;
    const { year, semester } = req.query;

    let whereClause: any = {
      offering: {
        courseId: courseId
      }
    };

    if (year) {
      whereClause.academic_years = {
        year_name: year as string
      };
    }

    if (semester) {
      whereClause.offering.semester = parseInt(semester as string);
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            departments: {
              select: {
                name: true,
                code: true
              }
            },
            sections: {
              select: {
                section_name: true
              }
            }
          }
        },
        offering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true
              }
            },
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        academic_years: {
          select: {
            year_name: true
          }
        }
      }
    });

    const enrollmentData = enrollments.map(enrollment => ({
      id: enrollment.id,
      attemptNumber: enrollment.attemptNumber,
      student: enrollment.student ? {
        id: enrollment.student.id,
        usn: enrollment.student.usn,
        name: enrollment.student.user.name,
        semester: enrollment.student.semester,
        batchYear: enrollment.student.batchYear,
        department: enrollment.student.departments ? {
          name: enrollment.student.departments.name,
          code: enrollment.student.departments.code
        } : null,
        section: enrollment.student.sections ? {
          name: enrollment.student.sections.section_name
        } : null
      } : null,
      course: enrollment.offering?.course || null,
      teacher: enrollment.offering?.teacher ? {
        id: enrollment.offering.teacher.id,
        name: enrollment.offering.teacher.user.name
      } : null,
      academicYear: enrollment.academic_years?.year_name || null,
      semester: enrollment.offering?.semester || null
    }));

    res.json({
      status: 'success',
      data: enrollmentData,
      count: enrollmentData.length
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
