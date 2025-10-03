const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function createNMITcourseOfferings() {
  try {
    console.log('📚 Creating Course Offerings for NMIT CS Department\n');

    // Get colleges
    const nmit = await prisma.college.findFirst({
      where: { code: 'NMIT' }
    });

    const nmamit = await prisma.college.findFirst({
      where: { code: 'NMAMIT' }
    });

    // Get departments
    const nmitCS = await prisma.department.findFirst({
      where: {
        code: 'CS',
        college_id: nmit.id
      }
    });

    const nmamitCS = await prisma.department.findFirst({
      where: {
        code: 'CS',
        college_id: nmamit.id
      }
    });

    console.log('Departments:');
    console.log(`  NMIT CS: ${nmitCS.id}`);
    console.log(`  NMAMIT CS: ${nmamitCS.id}\n`);

    // Get courses that belong to NMAMIT CS department
    const nmamitCourses = await prisma.course.findMany({
      where: {
        departmentId: nmamitCS.id
      }
    });

    console.log(`Found ${nmamitCourses.length} courses in NMAMIT CS department\n`);

    // Create duplicate courses for NMIT CS department
    console.log('📝 Creating courses for NMIT CS department...\n');

    const courseMap = {};
    
    for (const course of nmamitCourses) {
      // Check if course already exists for NMIT
      const existingCourse = await prisma.course.findFirst({
        where: {
          code: course.code,
          departmentId: nmitCS.id
        }
      });

      if (existingCourse) {
        console.log(`  ✓ ${course.code} already exists for NMIT`);
        courseMap[course.id] = existingCourse.id;
      } else {
        const newCourse = await prisma.course.create({
          data: {
            code: course.code,
            name: course.name,
            type: course.type,
            year: course.year,
            departmentId: nmitCS.id,
            hasTheoryComponent: course.hasTheoryComponent,
            hasLabComponent: course.hasLabComponent
          }
        });
        console.log(`  ✓ Created ${course.code} - ${course.name}`);
        courseMap[course.id] = newCourse.id;
      }
    }

    console.log('\n📝 Creating course offerings for NMIT CS...\n');

    // Get active academic year
    const academicYear = await prisma.academic_years.findFirst({
      where: { 
        is_active: true,
        college_id: nmit.id
      }
    });

    if (!academicYear) {
      console.log('⚠️  No active academic year found for NMIT');
      return;
    }

    console.log(`Using academic year: ${academicYear.year_name}\n`);

    // Get NMIT sections
    const nmitSections = await prisma.sections.findMany({
      where: {
        department_id: nmitCS.id
      }
    });

    console.log(`Found ${nmitSections.length} NMIT sections\n`);

    // Get existing NMAMIT course offerings for semester 5
    const nmamitOfferings = await prisma.courseOffering.findMany({
      where: {
        course: {
          departmentId: nmamitCS.id
        },
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        course: true,
        sections: true
      }
    });

    console.log(`Found ${nmamitOfferings.length} NMAMIT offerings for Semester 5\n`);

    let createdCount = 0;

    // Create corresponding offerings for NMIT
    for (const offering of nmamitOfferings) {
      const nmitCourseId = courseMap[offering.courseId];
      
      if (!nmitCourseId) {
        console.log(`  ⚠️  No NMIT course found for ${offering.course.code}`);
        continue;
      }

      // Find corresponding NMIT section
      const sectionName = offering.sections?.section_name;
      const nmitSection = nmitSections.find(s => s.section_name === sectionName);

      if (!nmitSection) {
        console.log(`  ⚠️  No NMIT section ${sectionName} found`);
        continue;
      }

      // Check if offering already exists
      const existingOffering = await prisma.courseOffering.findFirst({
        where: {
          courseId: nmitCourseId,
          semester: offering.semester,
          year_id: academicYear.year_id,
          section_id: nmitSection.section_id
        }
      });

      if (existingOffering) {
        console.log(`  ✓ Offering already exists: ${offering.course.code} - Section ${sectionName}`);
        continue;
      }

      // Create offering
      await prisma.courseOffering.create({
        data: {
          courseId: nmitCourseId,
          semester: offering.semester,
          year_id: academicYear.year_id,
          section_id: nmitSection.section_id,
          teacherId: null // No teacher assigned yet
        }
      });

      console.log(`  ✅ Created offering: ${offering.course.code} - Section ${sectionName}`);
      createdCount++;
    }

    console.log(`\n✅ Created ${createdCount} course offerings for NMIT CS\n`);

    // Summary
    console.log('📊 Summary:\n');
    
    for (const college of [nmit, nmamit]) {
      const dept = await prisma.department.findFirst({
        where: {
          code: 'CS',
          college_id: college.id
        },
        include: {
          courses: true
        }
      });

      const offerings = await prisma.courseOffering.count({
        where: {
          course: {
            departmentId: dept.id
          },
          semester: 5
        }
      });

      console.log(`${college.name}:`);
      console.log(`  Courses: ${dept.courses.length}`);
      console.log(`  Semester 5 Offerings: ${offerings}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createNMITcourseOfferings();
