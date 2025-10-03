const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixNMITsectionA() {
  try {
    console.log('📝 Creating CS301 Section A Offering for NMIT\n');

    // Get NMIT
    const nmit = await prisma.college.findFirst({
      where: { code: 'NMIT' }
    });

    // Get NMIT CS department
    const nmitCS = await prisma.department.findFirst({
      where: {
        code: 'CS',
        college_id: nmit.id
      }
    });

    // Get CS301 course for NMIT
    const cs301 = await prisma.course.findFirst({
      where: {
        code: 'CS301',
        departmentId: nmitCS.id
      }
    });

    // Get Section A
    const sectionA = await prisma.sections.findFirst({
      where: {
        section_name: 'A',
        department_id: nmitCS.id
      }
    });

    // Get active academic year
    const academicYear = await prisma.academic_years.findFirst({
      where: { 
        is_active: true,
        college_id: nmit.id
      }
    });

    console.log(`CS301 Course: ${cs301.id}`);
    console.log(`Section A: ${sectionA.section_id}`);
    console.log(`Academic Year: ${academicYear.year_name}\n`);

    // Check if offering exists
    const existingOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id,
        section_id: sectionA.section_id
      }
    });

    let offeringId;

    if (existingOffering) {
      console.log('✓ Section A offering already exists\n');
      offeringId = existingOffering.id;
    } else {
      console.log('📝 Creating Section A offering...\n');
      const newOffering = await prisma.courseOffering.create({
        data: {
          courseId: cs301.id,
          semester: 5,
          year_id: academicYear.year_id,
          section_id: sectionA.section_id,
          teacherId: null
        }
      });
      offeringId = newOffering.id;
      console.log('✅ Created Section A offering\n');
    }

    // Get Section A students
    const studentsA = await prisma.student.findMany({
      where: {
        college_id: nmit.id,
        department_id: nmitCS.id,
        semester: 5,
        section_id: sectionA.section_id
      }
    });

    console.log(`Found ${studentsA.length} students in Section A\n`);

    // Enroll them
    let enrolledCount = 0;
    for (const student of studentsA) {
      const exists = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: student.id,
          offeringId: offeringId
        }
      });

      if (!exists) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            offeringId: offeringId,
            year_id: academicYear.year_id
          }
        });
        enrolledCount++;
      }
    }

    console.log(`✅ Enrolled ${enrolledCount} students in Section A\n`);

    // Verification
    const totalEnrolled = await prisma.studentEnrollment.count({
      where: {
        offeringId: offeringId
      }
    });

    console.log(`📊 CS301 Section A: ${totalEnrolled} students enrolled`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixNMITsectionA();
