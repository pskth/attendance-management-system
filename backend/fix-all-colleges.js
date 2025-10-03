const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixAllColleges() {
  try {
    console.log('Ì¥ß Fixing Course Offerings for All Colleges\n');
    console.log('='.repeat(80) + '\n');

    const colleges = await prisma.college.findMany();

    for (const college of colleges) {
      console.log(`\nÌøõÔ∏è  ${college.name} (${college.code})`);
      console.log('‚îÄ'.repeat(80));

      const csDept = await prisma.department.findFirst({
        where: { code: 'CS', college_id: college.id }
      });

      if (!csDept) {
        console.log('  ‚úì No CS department\n');
        continue;
      }

      const academicYear = await prisma.academic_years.findFirst({
        where: { is_active: true, college_id: college.id }
      });

      if (!academicYear) {
        console.log('  ‚ö†Ô∏è  No active academic year\n');
        continue;
      }

      const sections = await prisma.sections.findMany({
        where: { department_id: csDept.id },
        orderBy: { section_name: 'asc' }
      });

      console.log(`\n  Found ${sections.length} sections: ${sections.map(s => s.section_name).join(', ')}\n`);

      // Get all CS courses
      const allCourses = await prisma.course.findMany({
        where: { departmentId: csDept.id }
      });

      console.log(`  Found ${allCourses.length} CS courses\n`);

      // Step 1: Delete duplicate offerings (empty ones)
      console.log('  Step 1: Cleaning up duplicates...\n');

      for (const course of allCourses) {
        const offerings = await prisma.courseOffering.findMany({
          where: { courseId: course.id, semester: 5 },
          include: {
            sections: true,
            _count: { select: { enrollments: true } }
          }
        });

        // Group by section to find duplicates
        const sectionGroups = {};
        offerings.forEach(o => {
          const section = o.sections?.section_name || 'NULL';
          if (!sectionGroups[section]) sectionGroups[section] = [];
          sectionGroups[section].push(o);
        });

        // Delete empty duplicates
        for (const [section, groupOfferings] of Object.entries(sectionGroups)) {
          if (groupOfferings.length > 1) {
            const withEnrollments = groupOfferings.filter(o => o._count.enrollments > 0);
            const empty = groupOfferings.filter(o => o._count.enrollments === 0);

            for (const emptyOffering of empty) {
              console.log(`    Ì∑ëÔ∏è  ${course.code} Section ${section}: Deleting empty duplicate`);
              await prisma.courseOffering.delete({ where: { id: emptyOffering.id } });
            }
          }
        }
      }

      // Step 2: Fix NULL section offerings
      console.log('\n  Step 2: Fixing NULL section offerings...\n');

      for (const course of allCourses) {
        const nullOfferings = await prisma.courseOffering.findMany({
          where: {
            courseId: course.id,
            semester: 5,
            section_id: null
          },
          include: {
            _count: { select: { enrollments: true } }
          }
        });

        if (nullOfferings.length > 0) {
          console.log(`\n    ${course.code} - ${course.name}:`);

          // Get all enrollments from NULL offerings
          const allEnrollments = [];
          for (const offering of nullOfferings) {
            const enrollments = await prisma.studentEnrollment.findMany({
              where: { offeringId: offering.id },
              include: {
                student: {
                  include: { sections: true }
                }
              }
            });
            allEnrollments.push(...enrollments);
          }

          console.log(`      Found ${allEnrollments.length} enrollments in NULL offerings`);

          // Create section-specific offerings
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
              const newOffering = await prisma.courseOffering.create({
                data: {
                  courseId: course.id,
                  semester: 5,
                  year_id: academicYear.year_id,
                  section_id: section.section_id,
                  teacherId: null
                }
              });

              // Move students from this section to the new offering
              const sectionEnrollments = allEnrollments.filter(
                e => e.student?.section_id === section.section_id
              );

              for (const enrollment of sectionEnrollments) {
                await prisma.studentEnrollment.update({
                  where: { id: enrollment.id },
                  data: { offeringId: newOffering.id }
                });
              }

              console.log(`      ‚úÖ Created Section ${section.section_name}: ${sectionEnrollments.length} students`);
            }
          }

          // Delete NULL offerings
          for (const offering of nullOfferings) {
            await prisma.courseOffering.delete({ where: { id: offering.id } });
          }
          console.log(`      Ì∑ëÔ∏è  Deleted ${nullOfferings.length} NULL offerings`);
        }
      }

      // Step 3: Ensure all courses have section offerings
      console.log('\n  Step 3: Creating missing section offerings...\n');

      for (const course of allCourses) {
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
            console.log(`    ‚úÖ ${course.code} Section ${section.section_name}: Created offering`);
          }
        }
      }

      // Step 4: Enroll students if needed
      console.log('\n  Step 4: Enrolling students...\n');

      const students = await prisma.student.findMany({
        where: {
          college_id: college.id,
          department_id: csDept.id,
          semester: 5
        },
        include: { sections: true }
      });

      console.log(`    Found ${students.length} students in Semester 5\n`);

      for (const course of allCourses) {
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

          if (enrolledCount > 0) {
            console.log(`      ${course.code} Section ${section.section_name}: +${enrolledCount} students`);
          }
        }
      }

      // Verification
      console.log('\n  ÔøΩÔøΩ Final State:\n');

      for (const course of allCourses) {
        const offerings = await prisma.courseOffering.findMany({
          where: { courseId: course.id, semester: 5 },
          include: {
            sections: true,
            _count: { select: { enrollments: true } }
          },
          orderBy: {
            sections: { section_name: 'asc' }
          }
        });

        if (offerings.length > 0) {
          console.log(`    ${course.code}:`);
          offerings.forEach(o => {
            console.log(`      Section ${o.sections?.section_name || 'NULL'}: ${o._count.enrollments} students`);
          });
        }
      }

      console.log('');
    }

    console.log('\n' + '='.repeat(80));
    console.log('‚úÖ All colleges fixed!\n');

  } catch (error) {
    console.error('‚ùå Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllColleges();
