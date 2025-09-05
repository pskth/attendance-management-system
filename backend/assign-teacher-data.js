const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function assignCoursesToTeacher() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Find teacher user
    const teacherUser = await prisma.user.findUnique({
      where: { username: 'teacher' },
      include: { teacher: true }
    });

    if (!teacherUser?.teacher) {
      console.log('❌ Teacher not found');
      return;
    }

    console.log(`📚 Found teacher: ${teacherUser.name}`);

    // Check existing data
    const existingCourses = await prisma.course.count();
    const existingOfferings = await prisma.courseOffering.count();
    
    console.log(`📊 Database status: ${existingCourses} courses, ${existingOfferings} offerings`);

    if (existingCourses === 0) {
      // Create sample data if none exists
      console.log('🔧 Creating sample data...');
      
      // Create college if not exists
      let college = await prisma.college.findFirst();
      if (!college) {
        college = await prisma.college.create({
          data: {
            code: 'NMAMIT',
            name: 'NMAM Institute of Technology',
            address: 'Nitte, Karnataka'
          }
        });
      }

      // Create department if not exists
      let department = await prisma.department.findFirst();
      if (!department) {
        department = await prisma.department.create({
          data: {
            code: 'CSE',
            name: 'Computer Science Engineering',
            college_id: college.id
          }
        });
      }

      // Create academic year if not exists
      let academicYear = await prisma.academicYear.findFirst();
      if (!academicYear) {
        academicYear = await prisma.academicYear.create({
          data: {
            year_name: '2024-25',
            start_date: new Date('2024-07-01'),
            end_date: new Date('2025-06-30')
          }
        });
      }

      // Create section if not exists
      let section = await prisma.section.findFirst();
      if (!section) {
        section = await prisma.section.create({
          data: {
            section_id: 'CSE_A',
            section_name: 'A',
            departmentId: department.id,
            year: 3,
            semester: 5
          }
        });
      }

      // Create sample courses
      const sampleCourses = [
        {
          code: 'CS501',
          name: 'Software Engineering',
          type: 'core',
          hasTheoryComponent: true,
          hasLabComponent: false,
          departmentId: department.id,
          college_id: college.id
        },
        {
          code: 'CS502',
          name: 'Database Management Systems',
          type: 'core', 
          hasTheoryComponent: true,
          hasLabComponent: true,
          departmentId: department.id,
          college_id: college.id
        },
        {
          code: 'CS503',
          name: 'Computer Networks',
          type: 'core',
          hasTheoryComponent: true,
          hasLabComponent: true,
          departmentId: department.id,
          college_id: college.id
        }
      ];

      const createdCourses = [];
      for (const courseData of sampleCourses) {
        const course = await prisma.course.create({ data: courseData });
        createdCourses.push(course);
        console.log(`✅ Created course: ${course.code} - ${course.name}`);
      }

      // Create course offerings for teacher
      for (const course of createdCourses) {
        const offering = await prisma.courseOffering.create({
          data: {
            courseId: course.id,
            teacherId: teacherUser.teacher.id,
            academicYearId: academicYear.id,
            sectionId: section.section_id
          }
        });
        console.log(`✅ Created offering: ${course.code} for teacher`);

        // Create sample students and enrollments
        const studentCount = 25 + Math.floor(Math.random() * 10); // 25-34 students
        console.log(`   Creating ${studentCount} students...`);

        for (let i = 1; i <= studentCount; i++) {
          try {
            // Create user for student
            const studentUser = await prisma.user.create({
              data: {
                username: `${course.code.toLowerCase()}_student_${i}`,
                passwordHash: '$2a$12$dummy.hash.for.demo.purposes',
                name: `Student ${i} (${course.code})`,
                email: `student${i}.${course.code.toLowerCase()}@college.edu`,
                phone: `${9000000000 + i}`
              }
            });

            // Create student profile
            const student = await prisma.student.create({
              data: {
                userId: studentUser.id,
                usn: `${course.code}${String(i).padStart(3, '0')}`,
                semester: 5,
                departmentId: department.id,
                sectionId: section.section_id,
                college_id: college.id
              }
            });

            // Add student role
            await prisma.userRoleAssignment.create({
              data: {
                userId: studentUser.id,
                role: 'student'
              }
            });

            // Enroll in course
            await prisma.studentEnrollment.create({
              data: {
                studentId: student.id,
                offeringId: offering.id
              }
            });

          } catch (error) {
            console.log(`   ⚠️ Error creating student ${i}: ${error.message}`);
          }
        }

        // Create sample attendance records
        const sessionCount = 12;
        console.log(`   Creating ${sessionCount} attendance sessions...`);

        const enrollments = await prisma.studentEnrollment.findMany({
          where: { offeringId: offering.id },
          include: { student: true }
        });

        for (let session = 1; session <= sessionCount; session++) {
          try {
            const classDate = new Date();
            classDate.setDate(classDate.getDate() - (session * 3)); // Every 3 days

            const attendance = await prisma.attendance.create({
              data: {
                offeringId: offering.id,
                teacherId: teacherUser.teacher.id,
                classDate: classDate,
                periodNumber: (session % 6) + 1,
                syllabusCovered: `${course.name} - Topic ${session}`,
                status: 'held'
              }
            });

            // Create attendance records for students
            for (const enrollment of enrollments) {
              const isPresent = Math.random() > 0.15; // 85% attendance rate
              
              await prisma.attendanceRecord.create({
                data: {
                  attendanceId: attendance.id,
                  studentId: enrollment.student.id,
                  status: isPresent ? 'present' : 'absent'
                }
              });
            }

          } catch (error) {
            console.log(`   ⚠️ Error creating session ${session}: ${error.message}`);
          }
        }

        console.log(`   ✅ Created ${sessionCount} sessions with attendance records`);
      }

    } else {
      console.log('📊 Data already exists, checking teacher assignments...');
      
      // Check if teacher has any course offerings
      const teacherOfferings = await prisma.courseOffering.findMany({
        where: { teacherId: teacherUser.teacher.id },
        include: {
          course: true,
          academic_years: true,
          sections: true
        }
      });

      if (teacherOfferings.length === 0) {
        console.log('🔧 No courses assigned to teacher, assigning some...');
        
        // Get first 3 courses and assign to teacher
        const courses = await prisma.course.findMany({ take: 3 });
        const academicYear = await prisma.academicYear.findFirst();
        const section = await prisma.section.findFirst();

        for (const course of courses) {
          try {
            const offering = await prisma.courseOffering.create({
              data: {
                courseId: course.id,
                teacherId: teacherUser.teacher.id,
                academicYearId: academicYear?.id || '',
                sectionId: section?.section_id || ''
              }
            });
            console.log(`✅ Assigned ${course.code} - ${course.name} to teacher`);
          } catch (error) {
            console.log(`⚠️ Could not assign ${course.code}: ${error.message}`);
          }
        }
      } else {
        console.log(`✅ Teacher already has ${teacherOfferings.length} course assignments`);
        teacherOfferings.forEach(offering => {
          console.log(`   - ${offering.course.code}: ${offering.course.name}`);
        });
      }
    }

    // Final summary
    console.log('\n📊 Final Summary:');
    const teacherCourses = await prisma.courseOffering.findMany({
      where: { teacherId: teacherUser.teacher.id },
      include: {
        course: true,
        enrollments: {
          include: { student: true }
        },
        attendances: true
      }
    });

    for (const offering of teacherCourses) {
      const totalSessions = offering.attendances.length;
      const totalStudents = offering.enrollments.length;
      
      console.log(`📚 ${offering.course.code} - ${offering.course.name}`);
      console.log(`   Students: ${totalStudents}`);
      console.log(`   Sessions: ${totalSessions}`);
    }

    console.log('\n🎉 Teacher data setup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCoursesToTeacher();
