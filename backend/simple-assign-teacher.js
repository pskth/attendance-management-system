// Simple script to assign courses to teacher
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function assignTeacherCourses() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Get teacher
    const teacher = await prisma.user.findUnique({
      where: { username: 'teacher' },
      include: { teacher: true }
    });

    if (!teacher?.teacher) {
      console.log('❌ Teacher not found');
      return;
    }

    console.log(`Found teacher: ${teacher.name}`);

    // Get first 3 courses that exist
    const courses = await prisma.course.findMany({
      take: 3,
      include: { department: true }
    });

    console.log(`Found ${courses.length} courses`);

    if (courses.length === 0) {
      console.log('No courses found in database');
      return;
    }

    // Get academic year and section
    const academicYear = await prisma.academic_years.findFirst();
    const section = await prisma.sections.findFirst();

    console.log('Academic year:', academicYear?.year_name || 'None');
    console.log('Section:', section?.section_name || 'None');

    // Assign courses to teacher
    for (const course of courses) {
      try {
        // Check if already assigned
        const existing = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            teacherId: teacher.teacher.id
          }
        });

        let offering;
        if (existing) {
          console.log(`⚠️ Course ${course.code} already assigned to teacher, adding students...`);
          offering = existing;
        } else {
          // Create course offering
          offering = await prisma.courseOffering.create({
            data: {
              courseId: course.id,
              teacherId: teacher.teacher.id,
              year_id: academicYear?.id || null,
              section_id: section?.section_id || null
            }
          });
          console.log(`✅ Assigned ${course.code} - ${course.name} to teacher`);
        }

        // Add some students to this course if there are any
        const students = await prisma.student.findMany({
          take: 20,
          where: {
            department_id: course.department_id
          }
        });

        console.log(`   Found ${students.length} students in department`);

        // Enroll students in course
        for (let i = 0; i < Math.min(students.length, 20); i++) {
          try {
            await prisma.studentEnrollment.create({
              data: {
                studentId: students[i].id,
                offeringId: offering.id
              }
            });
          } catch (err) {
            // Student might already be enrolled
          }
        }

        console.log(`   Enrolled ${Math.min(students.length, 20)} students`);

        // Create some attendance sessions
        const today = new Date();
        for (let session = 1; session <= 8; session++) {
          try {
            const classDate = new Date(today);
            classDate.setDate(today.getDate() - (session * 3));

            const attendance = await prisma.attendance.create({
              data: {
                offeringId: offering.id,
                teacherId: teacher.teacher.id,
                classDate: classDate,
                periodNumber: session % 6 + 1,
                syllabusCovered: `${course.name} - Topic ${session}`,
                status: 'held'
              }
            });

            // Add attendance records for enrolled students
            const enrolledStudents = await prisma.studentEnrollment.findMany({
              where: { offeringId: offering.id },
              include: { student: true }
            });

            for (const enrollment of enrolledStudents) {
              const isPresent = Math.random() > 0.2; // 80% attendance rate
              await prisma.attendanceRecord.create({
                data: {
                  attendanceId: attendance.id,
                  studentId: enrollment.student.id,
                  status: isPresent ? 'present' : 'absent'
                }
              });
            }

          } catch (err) {
            console.log(`   ⚠️ Error creating session ${session}:`, err.message);
          }
        }

        console.log(`   Created 8 attendance sessions`);

      } catch (error) {
        console.log(`❌ Error assigning ${course.code}:`, error.message);
      }
    }

    // Show final summary
    console.log('\n📊 Teacher Summary:');
    const teacherOfferings = await prisma.courseOffering.findMany({
      where: { teacherId: teacher.teacher.id },
      include: {
        course: true,
        enrollments: true,
        attendances: true
      }
    });

    for (const offering of teacherOfferings) {
      console.log(`📚 ${offering.course.code} - ${offering.course.name}`);
      console.log(`   Students: ${offering.enrollments.length}`);
      console.log(`   Sessions: ${offering.attendances.length}`);
    }

    console.log('\n🎉 Teacher assignment complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTeacherCourses();
