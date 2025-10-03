/**
 * Script to create student enrollments for Academic Year 2025-26
 * This enrolls students in their department's core courses based on their current semester
 */

const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createEnrollments() {
  try {
    console.log(
      "🚀 Starting student enrollment for Academic Year 2025-26...\n"
    );

    // Get active academic year records
    const academicYears = await prisma.academic_years.findMany({
      where: {
        year_name: "2025-26",
        is_active: true,
      },
      include: {
        colleges: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (academicYears.length === 0) {
      console.error("❌ No active academic year 2025-26 found!");
      return;
    }

    console.log(`Found ${academicYears.length} active academic year records\n`);

    let totalEnrollments = 0;
    let totalStudents = 0;

    for (const academicYear of academicYears) {
      console.log(`\n📚 Processing ${academicYear.colleges.name}...`);

      // Get all students from this college
      const students = await prisma.student.findMany({
        where: {
          college_id: academicYear.college_id,
        },
        include: {
          departments: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      console.log(`   Found ${students.length} students`);
      totalStudents += students.length;

      // Group students by semester
      const studentsBySemester = students.reduce((acc, student) => {
        const sem = student.semester || 1;
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(student);
        return acc;
      }, {});

      console.log(
        `   Semesters: ${Object.keys(studentsBySemester).join(", ")}`
      );

      // For each semester group
      for (const [semester, semesterStudents] of Object.entries(
        studentsBySemester
      )) {
        const semNum = parseInt(semester);
        console.log(
          `\n   📖 Semester ${semNum} (${semesterStudents.length} students):`
        );

        // Get courses for each department in this semester
        const departments = [
          ...new Set(
            semesterStudents.map((s) => s.department_id).filter(Boolean)
          ),
        ];

        for (const deptId of departments) {
          const deptStudents = semesterStudents.filter(
            (s) => s.department_id === deptId
          );
          if (deptStudents.length === 0) continue;

          const deptInfo = deptStudents[0].departments;
          console.log(
            `      Department: ${deptInfo?.name} (${deptStudents.length} students)`
          );

          // Get core courses for this department
          const courses = await prisma.course.findMany({
            where: {
              departmentId: deptId,
              type: "core",
              // Match courses to semester (year calculated from semester)
              year: Math.ceil(semNum / 2),
            },
          });

          console.log(
            `      Found ${courses.length} core courses for year ${Math.ceil(
              semNum / 2
            )}`
          );

          // Create or get course offerings for each course
          for (const course of courses) {
            // Check if course offering exists
            let courseOffering = await prisma.courseOffering.findFirst({
              where: {
                courseId: course.id,
                semester: semNum,
                year_id: academicYear.year_id,
              },
            });

            // Create offering if it doesn't exist
            if (!courseOffering) {
              courseOffering = await prisma.courseOffering.create({
                data: {
                  courseId: course.id,
                  semester: semNum,
                  year_id: academicYear.year_id,
                },
              });
            }

            // Enroll all students in this course
            let enrolledCount = 0;
            let skippedCount = 0;

            for (const student of deptStudents) {
              // Check if already enrolled
              const existingEnrollment =
                await prisma.studentEnrollment.findFirst({
                  where: {
                    studentId: student.id,
                    offeringId: courseOffering.id,
                  },
                });

              if (existingEnrollment) {
                skippedCount++;
                continue;
              }

              // Create enrollment
              await prisma.studentEnrollment.create({
                data: {
                  studentId: student.id,
                  offeringId: courseOffering.id,
                  year_id: academicYear.year_id,
                  attemptNumber: 1,
                },
              });

              enrolledCount++;
              totalEnrollments++;
            }

            if (enrolledCount > 0) {
              console.log(
                `         ✓ ${course.code}: Enrolled ${enrolledCount} students${
                  skippedCount > 0 ? ` (${skippedCount} already enrolled)` : ""
                }`
              );
            }
          }
        }
      }
    }

    console.log("\n✅ Enrollment creation completed!\n");
    console.log("Summary:");
    console.log(`- Total students processed: ${totalStudents}`);
    console.log(`- Total enrollments created: ${totalEnrollments}`);
    console.log(`- Academic Year: 2025-26`);
  } catch (error) {
    console.error("❌ Error creating enrollments:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createEnrollments()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed:", error);
    process.exit(1);
  });
