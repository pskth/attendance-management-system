const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

async function viewEnrollments() {
  try {
    const course = await prisma.course.findFirst({
      where: { code: "CS301" },
      include: {
        department: {
          include: { colleges: true },
        },
      },
    });

    console.log("📚 Course:", course.code, "-", course.name);
    console.log("   Type:", course.type);
    console.log("   Department:", course.department.name);
    console.log("   College:", course.department.colleges.name);
    console.log("");

    const offering = await prisma.courseOffering.findFirst({
      where: {
        courseId: course.id,
        semester: 5,
      },
      include: {
        academic_years: true,
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
                departments: {
                  select: { code: true, name: true },
                },
                sections: {
                  select: { section_name: true },
                },
              },
            },
          },
          orderBy: {
            student: { usn: "asc" },
          },
        },
      },
    });

    if (!offering) {
      console.log("❌ No course offering found for semester 5");
      await prisma.$disconnect();
      return;
    }

    console.log("📝 Course Offering Details:");
    console.log("   Semester:", offering.semester);
    console.log(
      "   Academic Year:",
      offering.academic_years?.year_name || "N/A"
    );
    console.log("   Total Enrollments:", offering.enrollments.length);
    console.log("");
    console.log("👥 Enrolled Students:\n");

    offering.enrollments.forEach((enrollment, index) => {
      const s = enrollment.student;
      console.log(
        (index + 1).toString().padStart(2) + ".",
        s.usn.padEnd(15),
        (s.user?.name || "No name").padEnd(30),
        "- Dept:",
        (s.departments?.code || "N/A").padEnd(4),
        "- Section:",
        s.sections?.section_name || "N/A"
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

viewEnrollments();
