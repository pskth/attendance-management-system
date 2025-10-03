const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function redistributeNMAMITstudents() {
  try {
    console.log('📝 Redistributing NMAMIT Students to Correct Sections\n');

    const nmamit = await prisma.college.findFirst({ where: { code: 'NMAMIT' } });
    const nmamitCS = await prisma.department.findFirst({
      where: { code: 'CS', college_id: nmamit.id }
    });

    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301', departmentId: nmamitCS.id }
    });

    const academicYear = await prisma.academic_years.findFirst({
      where: { is_active: true, college_id: nmamit.id }
    });

    // Get Section A offering with all enrollments
    const sectionAOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id,
        sections: { section_name: 'A' }
      },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                sections: true
              }
            }
          }
        }
      }
    });

    console.log(`Section A offering has ${sectionAOffering.enrollments.length} enrollments\n`);

    // Get offerings for B and C
    const sectionBOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id,
        sections: { section_name: 'B' }
      }
    });

    const sectionCOffering = await prisma.courseOffering.findFirst({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id,
        sections: { section_name: 'C' }
      }
    });

    console.log('Offerings found:');
    console.log(`  Section A: ${sectionAOffering?.id}`);
    console.log(`  Section B: ${sectionBOffering?.id}`);
    console.log(`  Section C: ${sectionCOffering?.id}\n`);

    // Group students by their actual section
    const studentsBySection = {
      A: [],
      B: [],
      C: []
    };

    sectionAOffering.enrollments.forEach(enrollment => {
      const studentSection = enrollment.student?.sections?.section_name;
      if (studentsBySection[studentSection]) {
        studentsBySection[studentSection].push(enrollment);
      }
    });

    console.log('Students currently in Section A offering:');
    console.log(`  Should be in A: ${studentsBySection.A.length}`);
    console.log(`  Should be in B: ${studentsBySection.B.length}`);
    console.log(`  Should be in C: ${studentsBySection.C.length}\n`);

    let movedCount = 0;

    // Move Section B students
    for (const enrollment of studentsBySection.B) {
      await prisma.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { offeringId: sectionBOffering.id }
      });
      movedCount++;
    }
    console.log(`✅ Moved ${studentsBySection.B.length} students to Section B offering`);

    // Move Section C students
    for (const enrollment of studentsBySection.C) {
      await prisma.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { offeringId: sectionCOffering.id }
      });
      movedCount++;
    }
    console.log(`✅ Moved ${studentsBySection.C.length} students to Section C offering\n`);

    // Verification
    console.log('📊 Final Distribution:\n');
    
    const offerings = await prisma.courseOffering.findMany({
      where: {
        courseId: cs301.id,
        semester: 5,
        year_id: academicYear.year_id
      },
      include: {
        sections: true,
        enrollments: true
      }
    });

    offerings.forEach(o => {
      console.log(`  Section ${o.sections?.section_name}: ${o.enrollments.length} students`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

redistributeNMAMITstudents();
