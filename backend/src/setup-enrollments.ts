import fs from 'fs';
import path from 'path';
import Database from './lib/database';

interface CourseOfferingRow {
  course_code: string;
  academic_year: string;
  semester: number;
  section_name: string;
  section_dept_code: string;
  teacher_username: string;
}

interface AttendanceRow {
  student_usn: string;
  course_code: string;
  class_date: string;
  period_number: number;
  status: string;
}

async function setupEnrollments() {
  console.log('🚀 Starting course enrollment setup...');
  
  try {
    const prisma = Database.getInstance();
    console.log('✅ Database connected');

    // Read course offerings and attendance data
    const courseOfferingsPath = path.join(__dirname, '../../sample_data_simplified/course_offerings.csv');
    const attendancePath = path.join(__dirname, '../../sample_data_simplified/attendance_records.csv');
    
    console.log('📁 Reading CSV files...');
    const courseOfferingsData = fs.readFileSync(courseOfferingsPath, 'utf-8');
    const attendanceData = fs.readFileSync(attendancePath, 'utf-8');
    
    // Parse course offerings
    const courseOfferingsLines = courseOfferingsData.trim().split('\n');
    const courseOfferingsHeaders = courseOfferingsLines[0].split(',');
    const courseOfferings: CourseOfferingRow[] = courseOfferingsLines.slice(1).map(line => {
      const values = line.split(',');
      return {
        course_code: values[0],
        academic_year: values[1],
        semester: parseInt(values[2]),
        section_name: values[3],
        section_dept_code: values[4],
        teacher_username: values[5]
      };
    });

    // Parse attendance records to find which students should be enrolled in which courses
    const attendanceLines = attendanceData.trim().split('\n');
    const attendanceHeaders = attendanceLines[0].split(',');
    const attendanceRecords: AttendanceRow[] = attendanceLines.slice(1).map(line => {
      const values = line.split(',');
      return {
        student_usn: values[0],
        course_code: values[1],
        class_date: values[2],
        period_number: parseInt(values[3]),
        status: values[4]
      };
    });

    console.log(`📄 Found ${courseOfferings.length} course offerings`);
    console.log(`📄 Found ${attendanceRecords.length} attendance records`);

    // Get unique student-course combinations from attendance
    const studentCourses = new Set();
    attendanceRecords.forEach(record => {
      studentCourses.add(`${record.student_usn}:${record.course_code}`);
    });

    console.log(`👥 Found ${studentCourses.size} unique student-course combinations`);

    // Process enrollments
    let enrollmentsCreated = 0;
    let enrollmentsSkipped = 0;

    for (const studentCourse of studentCourses) {
      const [studentUsn, courseCode] = (studentCourse as string).split(':');
      
      try {
        // Find the student
        const student = await prisma.student.findFirst({
          where: { usn: studentUsn },
          include: { user: true }
        });

        if (!student) {
          console.log(`⚠️  Student with USN ${studentUsn} not found`);
          continue;
        }

        // Find the course
        const course = await prisma.course.findFirst({
          where: { code: courseCode }
        });

        if (!course) {
          console.log(`⚠️  Course with code ${courseCode} not found`);
          continue;
        }

        // Find a course offering for this course
        const courseOffering = await prisma.courseOffering.findFirst({
          where: { 
            courseId: course.id,
            semester: student.semester // Match student's semester
          },
          include: { sections: true }
        });

        if (!courseOffering) {
          console.log(`⚠️  No course offering found for ${courseCode} in semester ${student.semester}`);
          continue;
        }

        // Check if enrollment already exists
        const existingEnrollment = await prisma.studentEnrollment.findFirst({
          where: {
            studentId: student.id,
            offeringId: courseOffering.id
          }
        });

        if (existingEnrollment) {
          enrollmentsSkipped++;
          continue;
        }

        // Get the current academic year
        const currentYear = await prisma.academic_years.findFirst({
          where: { year_name: '2024-25' }
        });

        if (!currentYear) {
          console.log('⚠️  Academic year 2024-25 not found, creating it...');
          // Get the college ID from student
          const newYear = await prisma.academic_years.create({
            data: {
              year_name: '2024-25',
              start_date: new Date('2024-06-01'),
              end_date: new Date('2025-05-31'),
              college_id: student.college_id,
              is_active: true
            }
          });
          console.log(`✅ Created academic year: ${newYear.year_name}`);
        }

        const academicYear = currentYear || await prisma.academic_years.findFirst({
          where: { year_name: '2024-25' }
        });

        // Create the enrollment
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            offeringId: courseOffering.id,
            attemptNumber: 1,
            year_id: academicYear?.year_id || null
          }
        });

        enrollmentsCreated++;
        console.log(`✅ Enrolled ${student.user.name} (${studentUsn}) in ${courseCode}`);

      } catch (error) {
        console.error(`❌ Error enrolling ${studentUsn} in ${courseCode}:`, error);
      }
    }

    console.log(`\n🎉 Enrollment setup completed!`);
    console.log(`📊 Created ${enrollmentsCreated} enrollments`);
    console.log(`⏭️  Skipped ${enrollmentsSkipped} existing enrollments`);

    // Verify enrollments
    const totalEnrollments = await prisma.studentEnrollment.count();
    console.log(`📋 Total enrollments in database: ${totalEnrollments}`);

  } catch (error) {
    console.error('❌ Error setting up enrollments:', error);
  } finally {
    await Database.getInstance().$disconnect();
  }
}

// Run the script
setupEnrollments();
