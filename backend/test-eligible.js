const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

async function testEligibility() {
  try {
    // Get CS202 course
    const course = await prisma.course.findFirst({
      where: { code: "CS202" },
      include: {
        department: {
          include: { colleges: true },
        },
        openElectiveRestrictions: {
          include: { restrictedDepartment: true },
        },
      },
    });

    if (!course) {
      console.log("❌ CS202 not found");
      return;
    }

    console.log("📚 Testing Eligibility for:", course.code, "-", course.name);
    console.log("   Type:", course.type);
    console.log("   Department:", course.department.name);
    console.log("   College:", course.department.colleges.name);
    console.log("");

    const semesterNumber = 5;

    // Build where conditions (same as backend)
    let studentWhereConditions = {
      college_id: course.department.college_id,
      semester: semesterNumber,
    };

    // Apply course-specific filters
    if (course.type === "core" || course.type === "department_elective") {
      if (course.departmentId) {
        studentWhereConditions.department_id = course.departmentId;
      }
    }

    console.log(
      "🔍 Query conditions:",
      JSON.stringify(studentWhereConditions, null, 2)
    );
    console.log("");

    // Get students matching conditions (without enrollment check)
    const allMatchingStudents = await prisma.student.findMany({
      where: studentWhereConditions,
      select: { id: true, usn: true },
    });

    console.log(
      "✅ Students matching base criteria:",
      allMatchingStudents.length
    );
    allMatchingStudents.slice(0, 3).forEach((s) => console.log("   -", s.usn));
    console.log("");

    // Check for existing course offering
    const offering = await prisma.courseOffering.findFirst({
      where: {
        courseId: course.id,
        semester: semesterNumber,
      },
    });

    console.log(
      "📝 Course offering for semester 5:",
      offering ? "EXISTS" : "DOES NOT EXIST"
    );

    if (offering) {
      const enrolledCount = await prisma.studentEnrollment.count({
        where: { offeringId: offering.id },
      });
      console.log("   Already enrolled:", enrolledCount, "students");
    }
    console.log("");

    // Get eligible students (NOT already enrolled)
    const eligibleStudents = await prisma.student.findMany({
      where: {
        ...studentWhereConditions,
        enrollments: {
          none: {
            offering: {
              courseId: course.id,
              semester: semesterNumber,
            },
          },
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log(
      "🎯 ELIGIBLE students (not yet enrolled):",
      eligibleStudents.length
    );
    eligibleStudents
      .slice(0, 5)
      .forEach((s) => console.log("   -", s.usn, "-", s.user.name));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEligibility();
