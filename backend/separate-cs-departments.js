const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function separateCSdepartments() {
  try {
    console.log('🏗️  Separating CS Departments by College\n');

    // Get colleges
    const nmit = await prisma.college.findFirst({
      where: { code: 'NMIT' }
    });

    const nmamit = await prisma.college.findFirst({
      where: { code: 'NMAMIT' }
    });

    console.log('Colleges:');
    console.log(`  NMIT: ${nmit.id}`);
    console.log(`  NMAMIT: ${nmamit.id}\n`);

    // Get current CS department
    const currentCSDept = await prisma.department.findFirst({
      where: { code: 'CS' }
    });

    console.log('Current CS Department:');
    console.log(`  ID: ${currentCSDept.id}`);
    console.log(`  Name: ${currentCSDept.name}`);
    console.log(`  College: ${currentCSDept.college_id}\n`);

    // Check if NMIT already has a CS department
    const nmitCS = await prisma.department.findFirst({
      where: {
        code: 'CS',
        college_id: nmit.id
      }
    });

    let nmitCSDept;

    if (nmitCS) {
      console.log('✓ NMIT already has a CS department\n');
      nmitCSDept = nmitCS;
    } else {
      console.log('📝 Creating CS department for NMIT...\n');
      
      nmitCSDept = await prisma.department.create({
        data: {
          name: 'Computer Science and Engineering',
          code: 'CS',
          college_id: nmit.id
        }
      });
      
      console.log(`✅ Created CS department for NMIT: ${nmitCSDept.id}\n`);
    }

    // Ensure NMAMIT CS department is correct
    if (currentCSDept.college_id !== nmamit.id) {
      console.log('📝 Updating existing CS department to belong to NMAMIT...\n');
      await prisma.department.update({
        where: { id: currentCSDept.id },
        data: { college_id: nmamit.id }
      });
      console.log('✅ Updated CS department for NMAMIT\n');
    }

    // Get sections for both colleges
    console.log('🔍 Checking sections...\n');
    
    const allSections = await prisma.sections.findMany({
      where: {
        departments: { code: 'CS' }
      },
      include: {
        departments: {
          include: {
            colleges: true
          }
        }
      }
    });

    console.log(`Found ${allSections.length} CS sections\n`);

    // Group sections by college
    const nmamitSections = allSections.filter(s => s.departments.college_id === nmamit.id);
    const nmitSections = allSections.filter(s => s.departments.college_id === nmit.id);

    console.log(`NMAMIT sections: ${nmamitSections.length}`);
    console.log(`NMIT sections: ${nmitSections.length}\n`);

    // Create sections for NMIT CS if they don't exist
    if (nmitSections.length === 0) {
      console.log('📝 Creating sections for NMIT CS department...\n');
      
      const sectionNames = ['A', 'B', 'C'];
      for (const name of sectionNames) {
        await prisma.sections.create({
          data: {
            section_name: name,
            department_id: nmitCSDept.id
          }
        });
        console.log(`  ✓ Created Section ${name}`);
      }
      console.log('');
    }

    // Move NMIT students to NMIT CS department
    console.log('📝 Moving NMIT students to NMIT CS department...\n');
    
    const nmitStudents = await prisma.student.findMany({
      where: {
        college_id: nmit.id,
        departments: { code: 'CS' }
      }
    });

    console.log(`Found ${nmitStudents.length} NMIT CS students\n`);

    // Get NMIT sections for mapping
    const nmitSectionsAfter = await prisma.sections.findMany({
      where: {
        department_id: nmitCSDept.id
      }
    });

    const sectionMap = {};
    nmitSectionsAfter.forEach(s => {
      sectionMap[s.section_name] = s.section_id;
    });

    let movedCount = 0;
    for (const student of nmitStudents) {
      // Get current section name
      const currentSection = await prisma.sections.findUnique({
        where: { section_id: student.section_id }
      });

      const newSectionId = sectionMap[currentSection?.section_name];

      if (newSectionId) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            department_id: nmitCSDept.id,
            section_id: newSectionId
          }
        });
        movedCount++;
      }
    }

    console.log(`✅ Moved ${movedCount} students to NMIT CS department\n`);

    // Summary
    console.log('📊 Final State:\n');
    
    const depts = await prisma.department.findMany({
      where: { code: 'CS' },
      include: {
        colleges: true,
        students: true,
        sections: true
      }
    });

    depts.forEach(dept => {
      console.log(`${dept.colleges.name} (${dept.colleges.code}):`);
      console.log(`  Department ID: ${dept.id}`);
      console.log(`  Students: ${dept.students.length}`);
      console.log(`  Sections: ${dept.sections.length}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

separateCSdepartments();
