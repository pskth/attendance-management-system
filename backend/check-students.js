import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    // Get any student
    const anyStudent = await prisma.student.findFirst({
      select: {
        usn: true,
        semester: true,
        batchYear: true,
        department_id: true,
        college_id: true,
        departments: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    console.log("Sample student:", JSON.stringify(anyStudent, null, 2));

    // Count all students
    const totalCount = await prisma.student.count();
    console.log("\nTotal students in database:", totalCount);

    // Get a sample student with NNM prefix (NMAMIT)
    const student = await prisma.student.findFirst({
      where: {
        usn: {
          startsWith: "NNM",
        },
      },
      select: {
        usn: true,
        semester: true,
        batchYear: true,
        department_id: true,
        college_id: true,
        departments: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    console.log(
      "\nSample NMAMIT (NNM) student:",
      JSON.stringify(student, null, 2)
    );

    // Count all NMAMIT students
    const count = await prisma.student.count({
      where: {
        usn: {
          startsWith: "NNM",
        },
      },
    });

    console.log("\nTotal NMAMIT students:", count);

    // Count eligible CS students in semester 5
    const csStudents = await prisma.student.count({
      where: {
        semester: 5,
        college_id: "2bbecea9-6e11-4583-a64d-283be67f3f74",
        department_id: "746cabec-ccc7-469a-ba4d-f64cb0cb03e5",
      },
    });

    console.log("\nCS students in semester 5 at NMAMIT:", csStudents);

    // Get course CS302
    const course = await prisma.course.findFirst({
      where: {
        code: "CS302",
      },
      select: {
        id: true,
        code: true,
        name: true,
        year: true,
        departmentId: true,
        type: true,
        department: {
          select: {
            code: true,
            college_id: true,
          },
        },
      },
    });

    console.log("\nCS302 Course:", JSON.stringify(course, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();
