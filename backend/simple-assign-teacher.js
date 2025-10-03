// Assign CS Teacher 1 (NMAMIT) to CS301 (Data Structures) course offerings
const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function assignCS301ToTeacher1() {
  try {
    console.log("\n🔧 ASSIGNING CS301 TO CS TEACHER 1 (NMAMIT)\n");
    console.log("=".repeat(80) + "\n");

    // Get CS Teacher 1 from NMAMIT
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: { name: "CS Teacher 1" },
        department: {
          code: "CS",
          colleges: { code: "NMAMIT" },
        },
      },
      include: {
        user: true,
        department: {
          include: {
            colleges: true,
          },
        },
      },
    });

    if (!teacher) {
      console.log("❌ CS Teacher 1 (NMAMIT) not found!");
      return;
    }

    console.log(`✅ Found: ${teacher.user.name}`);
    console.log(`   Department: ${teacher.department?.name}`);
    console.log(`   College: ${teacher.department?.colleges.name}`);
    console.log(`   Teacher ID: ${teacher.id.substring(0, 12)}...\n`);

    // Get unassigned CS301 offerings for NMAMIT
    const offerings = await prisma.courseOffering.findMany({
      where: {
        course: {
          code: "CS301",
          department: {
            code: "CS",
            college_id: teacher.department?.college_id,
          },
        },
        teacherId: null,
        semester: 5,
      },
      include: {
        course: true,
        sections: true,
        enrollments: {
          include: {
            student: true,
          },
        },
      },
    });

    if (offerings.length === 0) {
      console.log("⚠️  No unassigned CS301 offerings found for NMAMIT");
      console.log("    All sections may already have teachers assigned.\n");

      // Show current assignments
      const allOfferings = await prisma.courseOffering.findMany({
        where: {
          course: {
            code: "CS301",
            department: {
              code: "CS",
              college_id: teacher.department?.college_id,
            },
          },
          semester: 5,
        },
        include: {
          course: true,
          sections: true,
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      console.log("Current CS301 offerings for NMAMIT:");
      allOfferings.forEach((o) => {
        console.log(
          `   Section ${o.sections?.section_name}: ${
            o.teacher ? o.teacher.user.name : "No teacher"
          }`
        );
      });
      console.log("");
      return;
    }

    console.log(`Found ${offerings.length} unassigned CS301 section(s):\n`);

    let assignedCount = 0;

    for (const offering of offerings) {
      const section = offering.sections?.section_name || "Unknown";
      console.log(`📚 Section ${section}:`);
      console.log(`   Students enrolled: ${offering.enrollments.length}`);

      // Assign teacher to this offering
      await prisma.courseOffering.update({
        where: { id: offering.id },
        data: { teacherId: teacher.id },
      });

      console.log(
        `   ✅ Assigned ${teacher.user.name} to Section ${section}\n`
      );
      assignedCount++;
    }

    console.log("=".repeat(80));
    console.log(
      `\n✅ SUCCESS! Assigned ${assignedCount} section(s) to ${teacher.user.name}\n`
    );

    // Show final summary
    const finalOfferings = await prisma.courseOffering.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        course: true,
        sections: true,
        enrollments: true,
      },
    });

    console.log(`📊 ${teacher.user.name}'s Courses:`);
    finalOfferings.forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.course.code} - Section ${o.sections?.section_name} (${
          o.enrollments.length
        } students)`
      );
    });

    console.log("\n" + "=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCS301ToTeacher1();
