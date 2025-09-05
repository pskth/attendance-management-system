// scripts/assign-teacher-courses.js
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function assignTeacherCourses() {
  try {
    await prisma.$connect();
    console.log('🔗 Connected to database');

    // Find the teacher user
    const teacherUser = await prisma.user.findUnique({
      where: { username: 'teacher' },
      include: { teacher: true }
    });

    if (!teacherUser || !teacherUser.teacher) {
      console.log('❌ Teacher user or profile not found');
      return;
    }

    const teacherId = teacherUser.teacher.id;
    console.log(`✅ Found teacher: ${teacherUser.name} (ID: ${teacherId})`);

    // Get available courses and academic years
    const courses = await prisma.course.findMany({
      include: { department: true },
      take: 3 // Assign 3 courses to the teacher
    });

    const academicYears = await prisma.academicYear.findMany();
    const sections = await prisma.section.findMany();

    if (courses.length === 0) {
      console.log('❌ No courses found in database');
      return;
    }

    if (academicYears.length === 0) {
      console.log('❌ No academic years found in database');
      return;
    }

    console.log(`📚 Found ${courses.length} courses, ${academicYears.length} academic years, ${sections.length} sections`);

    // Create course offerings for the teacher
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const academicYear = academicYears[0]; // Use first academic year
      const section = sections[i % sections.length] || sections[0]; // Rotate through sections

      try {
        // Check if offering already exists
        const existingOffering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            teacherId: teacherId,
            academicYearId: academicYear.id
          }
        });

        if (existingOffering) {
          console.log(`⚠️  Course offering already exists for: ${course.name}`);
          continue;
        }

        // Create course offering
        const offering = await prisma.courseOffering.create({
          data: {
            courseId: course.id,
            teacherId: teacherId,
            academicYearId: academicYear.id,
            sectionId: section?.section_id || null
          }
        });

        console.log(`✅ Created offering: ${course.code} - ${course.name} (${offering.id})`);

        // Create some sample students for this course
        await createSampleStudentsForCourse(offering.id, course, section, 25 + (i * 5)); // 25, 30, 35 students per course

        // Create some sample attendance records
        await createSampleAttendanceForCourse(offering.id, teacherId, 10 + (i * 2)); // 10, 12, 14 sessions

      } catch (error) {
        console.log(`❌ Error creating offering for ${course.name}:`, error.message);
      }
    }

    console.log('\n🎉 Teacher course assignment completed!');

    // Show summary
    const teacherCourses = await prisma.courseOffering.findMany({
      where: { teacherId },
      include: {
        course: true,
        academic_years: true,
        sections: true,
        enrollments: true
      }
    });

    console.log('\n📊 Teacher Course Summary:');
    for (const offering of teacherCourses) {
      console.log(`📚 ${offering.course.code} - ${offering.course.name}`);
      console.log(`   Academic Year: ${offering.academic_years?.year_name || 'N/A'}`);
      console.log(`   Section: ${offering.sections?.section_name || 'N/A'}`);
      console.log(`   Students: ${offering.enrollments.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleStudentsForCourse(offeringId, course, section, studentCount) {
  try {
    // Get existing students or create sample ones
    const existingStudents = await prisma.student.findMany({
      include: { user: true },
      take: studentCount
    });

    if (existingStudents.length === 0) {
      console.log(`   Creating ${studentCount} sample students...`);
      
      // Create sample students
      for (let i = 1; i <= studentCount; i++) {
        try {
          const user = await prisma.user.create({
            data: {
              username: `student_${course.code.toLowerCase()}_${i}`,
              passwordHash: '$2a$12$dummy.hash.for.demo.purposes.only',
              name: `Student ${i} (${course.code})`,
              email: `student${i}.${course.code.toLowerCase()}@college.edu`,
              phone: `${9000000000 + i}`
            }
          });

          const student = await prisma.student.create({
            data: {
              userId: user.id,
              usn: `${course.code}${String(i).padStart(3, '0')}`,
              semester: Math.floor(Math.random() * 8) + 1,
              departmentId: course.departmentId,
              sectionId: section?.section_id || null,
              college_id: course.college_id
            }
          });

          // Add user role
          await prisma.userRoleAssignment.create({
            data: {
              userId: user.id,
              role: 'student'
            }
          });

          // Enroll in course
          await prisma.studentEnrollment.create({
            data: {
              studentId: student.id,
              offeringId: offeringId
            }
          });

        } catch (error) {
          console.log(`   ⚠️  Error creating student ${i}: ${error.message}`);
        }
      }
    } else {
      console.log(`   Enrolling ${Math.min(existingStudents.length, studentCount)} existing students...`);
      
      // Enroll existing students
      for (let i = 0; i < Math.min(existingStudents.length, studentCount); i++) {
        try {
          const existing = await prisma.studentEnrollment.findFirst({
            where: {
              studentId: existingStudents[i].id,
              offeringId: offeringId
            }
          });

          if (!existing) {
            await prisma.studentEnrollment.create({
              data: {
                studentId: existingStudents[i].id,
                offeringId: offeringId
              }
            });
          }
        } catch (error) {
          console.log(`   ⚠️  Error enrolling student: ${error.message}`);
        }
      }
    }

    console.log(`   ✅ ${studentCount} students enrolled in ${course.name}`);
  } catch (error) {
    console.log(`   ❌ Error creating students: ${error.message}`);
  }
}

async function createSampleAttendanceForCourse(offeringId, teacherId, sessionCount) {
  try {
    console.log(`   Creating ${sessionCount} attendance sessions...`);

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { offeringId },
      include: { student: true }
    });

    if (enrollments.length === 0) {
      console.log('   ⚠️  No students enrolled, skipping attendance creation');
      return;
    }

    // Create attendance sessions for the past few weeks
    const today = new Date();
    for (let i = 0; i < sessionCount; i++) {
      try {
        const classDate = new Date(today);
        classDate.setDate(today.getDate() - (i * 3)); // Classes every 3 days

        const attendance = await prisma.attendance.create({
          data: {
            offeringId: offeringId,
            teacherId: teacherId,
            classDate: classDate,
            periodNumber: (i % 6) + 1, // Periods 1-6
            syllabusCovered: `Topic ${i + 1}: Sample lecture content`,
            status: 'held'
          }
        });

        // Create attendance records for each student
        for (const enrollment of enrollments) {
          const isPresent = Math.random() > 0.15; // 85% attendance rate on average
          
          await prisma.attendanceRecord.create({
            data: {
              attendanceId: attendance.id,
              studentId: enrollment.student.id,
              status: isPresent ? 'present' : 'absent'
            }
          });
        }

      } catch (error) {
        console.log(`   ⚠️  Error creating session ${i}: ${error.message}`);
      }
    }

    console.log(`   ✅ ${sessionCount} attendance sessions created`);
  } catch (error) {
    console.log(`   ❌ Error creating attendance: ${error.message}`);
  }
}

assignTeacherCourses();
