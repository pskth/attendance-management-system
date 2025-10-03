const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixAllIssues() {
  try {
    console.log('Ì¥ß Fixing Course Offering Issues\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const csDept = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    // 1. Delete duplicate empty CS301 offerings
    console.log('1. Deleting empty duplicate CS301 offerings...\n');
    
    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301', departmentId: csDept.id }
    });

    const emptyOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        enrollments: { none: {} }
      },
      include: { sections: true }
    });

    for (const offering of emptyOfferings) {
      console.log(`   Deleting: Section ${offering.sections?.section_name} (${offering.id.substring(0,8)}...)`);
      await prisma.courseOffering.delete({ where: { id: offering.id } });
    }

    console.log(`\n‚úÖ Deleted ${emptyOfferings.length} empty offerings\n`);

    // 2. Assign sections to other courses
    console.log('2. Assigning sections to other courses...\n');

    const sections = await prisma.sections.findMany({
      where: { department_id: csDept.id },
      orderBy: { section_name: 'asc' }
    });

    const otherCourses = await prisma.course.findMany({
      where: {
        departmentId: csDept.id,
        code: { in: ['CS202', 'CS203', 'CS204'] }
      }
    });

    const academicYear = await prisma.academic_years.findFirst({
      where: { is_active: true, college_id: nmamit.id }
    });

    for (const course of otherCourses) {
      // Get existing offerings without sections
      const nullOfferings = await prisma.courseOffering.findMany({
        where: {
          courseId: course.id,
          semester: 5,
          section_id: null
        }
      });

      if (nullOfferings.length > 0) {
        console.log(`\n   ${course.code} - ${course.name}:`);
        
        // Delete the NULL section offerings
        for (const offering of nullOfferings) {
          await prisma.courseOffering.delete({ where: { id: offering.id } });
          console.log(`     Deleted NULL section offering`);
        }

        // Create proper offerings for each section
        for (const section of sections) {
          const existing = await prisma.courseOffering.findFirst({
            where: {
              courseId: course.id,
              semester: 5,
              year_id: academicYear.year_id,
              section_id: section.section_id
            }
          });

          if (!existing) {
            await prisma.courseOffering.create({
              data: {
                courseId: course.id,
                semester: 5,
                year_id: academicYear.year_id,
                section_id: section.section_id,
                teacherId: null
              }
            });
            console.log(`     Created Section ${section.section_name} offering`);
          }
        }
      }
    }

    // 3. Enroll students in section-specific offerings
    console.log('\n3. Enrolling students in section-specific offerings...\n');

    const students = await prisma.student.findMany({
      where: {
        college_id: nmamit.id,
        department_id: csDept.id,
        semester: 5
      },
      include: { sections: true }
    });

    for (const course of otherCourses) {
      console.log(`\n   ${course.code}:`);
      
      for (const section of sections) {
        const offering = await prisma.courseOffering.findFirst({
          where: {
            courseId: course.id,
            semester: 5,
            section_id: section.section_id
          }
        });

        if (!offering) continue;

        const sectionStudents = students.filter(s => s.section_id === section.section_id);

        let enrolledCount = 0;
        for (const student of sectionStudents) {
          const existing = await prisma.studentEnrollment.findFirst({
            where: {
              studentId: student.id,
              offeringId: offering.id
            }
          });

          if (!existing) {
            await prisma.studentEnrollment.create({
              data: {
                studentId: student.id,
                offeringId: offering.id,
                year_id: academicYear.year_id
              }
            });
            enrolledCount++;
          }
        }

        console.log(`     Section ${section.section_name}: ${enrolledCount} students enrolled`);
      }
    }

    console.log('\n‚úÖ All issues fixed!\n');

    // Verification
    console.log('Ì≥ä Final State:\n');
    
    const allCourses = await prisma.course.findMany({
      where: { departmentId: csDept.id }
    });

    for (const course of allCourses) {
      const offerings = await prisma.courseOffering.findMany({
        where: { courseId: course.id, semester: 5 },
        include: {
          sections: true,
          _count: { select: { enrollments: true } }
        }
      });

      if (offerings.length > 0) {
        console.log(`${course.code}:`);
        offerings.forEach(o => {
          console.log(`  Section ${o.sections?.section_name || 'NULL'}: ${o._count.enrollments} students`);
        });
        console.log('');
      }
    }

  } catch (error) {
    console.error('‚ùå Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllIssues();
