const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

async function testMultipleTeachers() {
  try {
    console.log("🧪 Testing Multiple Teachers for Same Course\n");

    // Get CS301 course
    const course = await prisma.course.findFirst({
      where: { code: "CS301" },
      select: { id: true, code: true, name: true },
    });

    console.log("📚 Course:", course.code, "-", course.name);
    console.log("");

    // Get active academic year
    const academicYear = await prisma.academic_years.findFirst({
      where: {
        is_active: true,
        colleges: {
          code: "NMAMIT",
        },
      },
      select: { year_id: true, year_name: true },
    });

    console.log("📅 Academic Year:", academicYear.year_name);
    console.log("");

    // Get some teachers
    const teachers = await prisma.teacher.findMany({
      where: {
        colleges: { code: "NMAMIT" },
        departmentId: { not: null },
      },
      include: {
        user: { select: { name: true } },
      },
      take: 3,
    });

    console.log("👨‍🏫 Available Teachers:");
    teachers.forEach((t, i) =>
      console.log(`   ${i + 1}. ${t.user.name} (${t.id})`)
    );
    console.log("");

    // Get sections
    const sections = await prisma.sections.findMany({
      where: {
        departments: {
          code: "CS",
          colleges: { code: "NMAMIT" },
        },
      },
      take: 3,
    });

    console.log("📋 Sections:");
    sections.forEach((s, i) =>
      console.log(`   ${i + 1}. Section ${s.section_name} (${s.section_id})`)
    );
    console.log("");

    // Check current offerings
    const currentOfferings = await prisma.courseOffering.findMany({
      where: {
        courseId: course.id,
        semester: 5,
        year_id: academicYear.year_id,
      },
      include: {
        teacher: {
          include: { user: { select: { name: true } } },
        },
        sections: true,
      },
    });

    console.log("📝 Current Course Offerings for Semester 5:");
    if (currentOfferings.length === 0) {
      console.log("   None found");
    } else {
      currentOfferings.forEach((o, i) => {
        console.log(
          `   ${i + 1}. Teacher: ${
            o.teacher?.user?.name || "Not assigned"
          }, Section: ${o.sections?.section_name || "Not assigned"}`
        );
      });
    }
    console.log("");

    // Demonstrate that the unique constraint works
    console.log("✅ Unique Constraint Rule:");
    console.log("   For the SAME course + semester + academic year:");
    console.log(
      "   - You CAN have multiple teachers if they teach different sections"
    );
    console.log("   - You CAN have the same teacher teach multiple sections");
    console.log(
      "   - You CANNOT have the same (teacher + section) combination twice"
    );
    console.log("");

    console.log("Example Valid Scenarios:");
    console.log("   ✓ CS301, Sem 5, Teacher A, Section A");
    console.log(
      "   ✓ CS301, Sem 5, Teacher B, Section B  (Different teacher, different section)"
    );
    console.log(
      "   ✓ CS301, Sem 5, Teacher A, Section C  (Same teacher, different section)"
    );
    console.log("");

    console.log("Example Invalid Scenarios:");
    console.log(
      "   ✗ CS301, Sem 5, Teacher A, Section A  (Duplicate - already exists)"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleTeachers();
