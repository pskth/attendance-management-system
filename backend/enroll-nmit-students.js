const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

async function enrollNMITstudents() {
  try {
    console.log("📝 Enrolling NMIT Students in Course Offerings\n");

    // Get NMIT
    const nmit = await prisma.college.findFirst({
      where: { code: "NMIT" },
    });

    // Get NMIT CS department
    const nmitCS = await prisma.department.findFirst({
      where: {
        code: "CS",
        college_id: nmit.id,
      },
    });

    console.log(`NMIT CS Department: ${nmitCS.id}\n`);

    // Get NMIT students in semester 5
    const nmitStudents = await prisma.student.findMany({
      where: {
        college_id: nmit.id,
        department_id: nmitCS.id,
        semester: 5,
      },
      include: {
        sections: true,
      },
    });

    console.log(
      `Found ${nmitStudents.length} NMIT CS students in Semester 5\n`
    );

    // Group by section
    const bySection = nmitStudents.reduce((acc, s) => {
      const section = s.sections?.section_name || "Unknown";
      if (!acc[section]) acc[section] = [];
      acc[section].push(s);
      return acc;
    }, {});

    console.log("Students by section:");
    Object.keys(bySection).forEach((section) => {
      console.log(
        `  Section ${section}: ${bySection[section].length} students`
      );
    });
    console.log("");

    // Get NMIT course offerings for semester 5
    const academicYear = await prisma.academic_years.findFirst({
      where: {
        is_active: true,
        college_id: nmit.id,
      },
    });

    const nmitOfferings = await prisma.courseOffering.findMany({
      where: {
        course: {
          departmentId: nmitCS.id,
        },
        semester: 5,
        year_id: academicYear.year_id,
      },
      include: {
        course: true,
        sections: true,
      },
    });

    console.log(
      `Found ${nmitOfferings.length} NMIT course offerings for Semester 5\n`
    );

    nmitOfferings.forEach((o) => {
      console.log(
        `  ${o.course.code} - Section ${o.sections?.section_name || "None"}`
      );
    });
    console.log("");

    // Enroll students
    let enrolledCount = 0;
    let skippedCount = 0;

    for (const offering of nmitOfferings) {
      const sectionName = offering.sections?.section_name;
      const studentsInSection = bySection[sectionName] || [];

      console.log(
        `\nEnrolling students in ${offering.course.code} - Section ${sectionName}:`
      );

      for (const student of studentsInSection) {
        // Check if already enrolled
        const existingEnrollment = await prisma.studentEnrollment.findFirst({
          where: {
            studentId: student.id,
            offeringId: offering.id,
          },
        });

        if (existingEnrollment) {
          skippedCount++;
          continue;
        }

        // Enroll student
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            offeringId: offering.id,
            year_id: academicYear.year_id,
          },
        });

        enrolledCount++;
      }

      console.log(`  ✓ Enrolled ${studentsInSection.length} students`);
    }

    console.log(`\n✅ Enrollment complete:`);
    console.log(`  New enrollments: ${enrolledCount}`);
    console.log(`  Already enrolled: ${skippedCount}\n`);

    // Verification
    console.log("📊 Verification:\n");

    for (const offering of nmitOfferings) {
      const enrollmentCount = await prisma.studentEnrollment.count({
        where: {
          offeringId: offering.id,
        },
      });

      console.log(
        `${offering.course.code} - Section ${offering.sections?.section_name}: ${enrollmentCount} students`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

enrollNMITstudents();
