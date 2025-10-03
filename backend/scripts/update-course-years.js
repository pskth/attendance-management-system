/**
 * Script to set year field for all courses based on their course code
 * Pattern: CS301 → Year 3, IS201 → Year 2, etc.
 */

const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function updateCourseYears() {
  try {
    console.log("🚀 Updating course year fields...\n");

    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        year: true,
      },
    });

    console.log(`Found ${courses.length} courses\n`);

    let updated = 0;
    let skipped = 0;

    for (const course of courses) {
      // Extract year from course code pattern: CS301, IS201, etc.
      // Pattern: 2-4 letters + 1 digit (year) + 2-3 digits
      const match = course.code.match(/^[A-Z]{2,4}([1-4])\d{2,3}$/);

      if (match) {
        const yearFromCode = parseInt(match[1]);

        if (course.year !== yearFromCode) {
          await prisma.course.update({
            where: { id: course.id },
            data: { year: yearFromCode },
          });

          console.log(
            `✓ ${course.code} (${course.name}) → Year ${yearFromCode}`
          );
          updated++;
        } else {
          skipped++;
        }
      } else {
        console.log(`⚠ ${course.code} - Cannot extract year from code`);
        skipped++;
      }
    }

    console.log("\n✅ Course year update completed!\n");
    console.log("Summary:");
    console.log(`- Updated: ${updated} courses`);
    console.log(`- Skipped: ${skipped} courses`);
  } catch (error) {
    console.error("❌ Error updating course years:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCourseYears()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed:", error);
    process.exit(1);
  });
