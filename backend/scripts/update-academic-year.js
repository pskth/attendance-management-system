/**
 * Script to update academic year to 2025-26 and promote students
 * This will:
 * 1. Create new academic year 2025-26
 * 2. Set it as active
 * 3. Deactivate old academic years
 * 4. Update student batch years (promote them to next year)
 */

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function updateAcademicYear() {
  try {
    console.log('🚀 Starting academic year update to 2025-26...\n');

    // Get all colleges
    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    console.log(`Found ${colleges.length} colleges\n`);

    for (const college of colleges) {
      console.log(`\n📚 Processing ${college.name} (${college.code})...`);

      // 1. Deactivate all existing academic years for this college
      const deactivated = await prisma.academic_years.updateMany({
        where: {
          college_id: college.id,
          is_active: true
        },
        data: {
          is_active: false
        }
      });
      console.log(`   ✓ Deactivated ${deactivated.count} old academic year(s)`);

      // 2. Create or update 2025-26 academic year
      const academicYear = await prisma.academic_years.upsert({
        where: {
          college_id_year_name: {
            college_id: college.id,
            year_name: '2025-26'
          }
        },
        create: {
          college_id: college.id,
          year_name: '2025-26',
          start_date: new Date('2025-07-01'),
          end_date: new Date('2026-06-30'),
          is_active: true
        },
        update: {
          is_active: true,
          start_date: new Date('2025-07-01'),
          end_date: new Date('2026-06-30')
        }
      });
      console.log(`   ✓ Created/activated academic year 2025-26`);

      // 3. Get all students from this college
      const students = await prisma.student.findMany({
        where: {
          college_id: college.id
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`   📊 Found ${students.length} students to update`);

      // 4. Update students: promote them to next semester
      let promoted = 0;
      let graduated = 0;
      let unchanged = 0;

      for (const student of students) {
        const currentSemester = student.semester || 1;

        // If they're in semester 8 or higher, they've graduated (don't promote)
        if (currentSemester >= 8) {
          graduated++;
          continue;
        }

        // Promote: increase semester by 2 (move to next year)
        // Semester 1,2 → 3,4 (1st to 2nd year)
        // Semester 3,4 → 5,6 (2nd to 3rd year)
        // Semester 5,6 → 7,8 (3rd to 4th year)
        const newSemester = currentSemester + 2;

        if (newSemester <= 8) {
          await prisma.student.update({
            where: { id: student.id },
            data: {
              semester: newSemester
            }
          });
          promoted++;
        } else {
          graduated++;
        }
      }

      console.log(`   ✓ Promoted ${promoted} students to next year`);
      console.log(`   ℹ  ${graduated} students already in final year/graduated`);
      if (unchanged > 0) {
        console.log(`   ℹ  ${unchanged} students unchanged`);
      }
    }

    console.log('\n✅ Academic year update completed successfully!\n');
    console.log('Summary:');
    console.log('- New academic year: 2025-26');
    console.log('- Students promoted to next year');
    console.log('- Batch 2023 → Now in 3rd year');
    console.log('- Batch 2024 → Now in 2nd year');
    console.log('- Batch 2025 → Now in 1st year');

  } catch (error) {
    console.error('❌ Error updating academic year:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateAcademicYear()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
