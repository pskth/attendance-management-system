// // // routes/studentMarks.ts
// // import express from "express";
// // import DatabaseService from '../../lib/database';

// // const router = express.Router();

// // router.get("/students/:userId/marks", async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     if (!userId) return res.status(400).json({ error: "userId is required" });

// //     const prisma = DatabaseService.getInstance();

// //     // Fetch student and user
// //     const student = await prisma.student.findUnique({ where: { userId:userId } });


// //     const user = await prisma.user.findUnique({ where: { id: userId } });
// //     if (!student || !user) return res.status(404).json({ error: "Student not found" });
// //     console.log("student id : ", student.id)
// //     // Fetch enrollments and include courses, theory_marks, lab_marks
// //     const enrollments = await prisma.studentEnrollment.findMany({
// //       where: { studentId: student.id },
// //       include: {
// //         course: true,
// //         theoryMarks: true,
// //         labMarks: true
// //       }
// //     });

// //     const marksData = enrollments.map(enroll => {
// //       const theory = enroll.theoryMarks || null;
// //       const lab = enroll.labMarks || null;

// //       const total_theory_marks = theory
// //         ? (theory.mse1Marks || 0) + (theory.mse2Marks || 0) + (theory.mse3Marks || 0) +
// //           (theory.task1Marks || 0) + (theory.task2Marks || 0) + (theory.task3Marks || 0)
// //         : 0;

// //       const total_lab_marks = lab
// //         ? (lab.recordMarks || 0) + (lab.continuousEvaluationMarks || 0) + (lab.labMseMarks || 0)
// //         : 0;

// //       const total_marks = total_theory_marks + total_lab_marks;

// //       // Simple grading (adjust as per your rules)
// //       let grade = "F";
// //       if (total_marks >= 90) grade = "O";
// //       else if (total_marks >= 80) grade = "A+";
// //       else if (total_marks >= 70) grade = "A";
// //       else if (total_marks >= 60) grade = "B+";
// //       else if (total_marks >= 50) grade = "B";

// //       return {
// //         course_code: enroll.courses.code,
// //         course_name: enroll.courses.name,
// //         course_type: enroll.courses.type,
// //         theory_marks: theory,
// //         lab_marks: lab,
// //         total_theory_marks,
// //         total_lab_marks: lab ? total_lab_marks : undefined,
// //         total_marks,
// //         grade
// //       };
// //     });

// //     res.json({
// //       student: {
// //         id: student.id,
// //         name: user.name,
// //         usn: student.usn,
// //         email: user.email,
// //         phone: user.phone,
// //         college_id: student.college_id,
// //         department_id: student.department_id,
// //         semester: student.semester,
// //         batchYear: student.batchYear
// //       },
// //       marksData
// //     });

// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // });

// // export default router;
// // routes/studentMarks.ts
// import express from "express";
// import DatabaseService from "../../lib/database";

// const router = express.Router();

// router.get("/:userId/marks", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) {
//       return res.status(400).json({ error: "userId is required" });
//     }

//     const prisma = DatabaseService.getInstance();

//     // Fetch student and user
//     const student = await prisma.student.findUnique({
//       where: { userId },
//     });

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!student || !user) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     // Fetch enrollments with course data (via offering)
//     const enrollments = await prisma.studentEnrollment.findMany({
//       where: { studentId: student.id },
//       include: {
//         offering: {
//           include: {
//             course: true,
//           },
//         },
//         theoryMarks: true,
//         labMarks: true,
//       },
//     });

//     const marksData = enrollments.map((enroll) => {
//       const course = enroll.offering?.course;
//       const theory = enroll.theoryMarks || null;
//       const lab = enroll.labMarks || null;

//       const total_theory_marks = theory
//         ? (theory.mse1Marks || 0) +
//           (theory.mse2Marks || 0) +
//           (theory.mse3Marks || 0) +
//           (theory.task1Marks || 0) +
//           (theory.task2Marks || 0) +
//           (theory.task3Marks || 0)
//         : 0;

//       const total_lab_marks = lab
//         ? (lab.recordMarks || 0) +
//           (lab.continuousEvaluationMarks || 0) +
//           (lab.labMseMarks || 0)
//         : 0;

//       const total_marks = total_theory_marks + total_lab_marks;

//       // Simple grading
//       let grade = "F";
//       if (total_marks >= 90) grade = "O";
//       else if (total_marks >= 80) grade = "A+";
//       else if (total_marks >= 70) grade = "A";
//       else if (total_marks >= 60) grade = "B+";
//       else if (total_marks >= 50) grade = "B";

//       return {
//         course_code: course?.code || null,
//         course_name: course?.name || null,
//         course_type: course?.type || null,
//         theory_marks: theory,
//         lab_marks: lab,
//         total_theory_marks,
//         total_lab_marks: lab ? total_lab_marks : undefined,
//         total_marks,
//         grade,
//       };
//     });

//     res.json({
//       student: {
//         id: student.id,
//         name: user.name,
//         usn: student.usn,
//         email: user.email,
//         phone: user.phone,
//         college_id: student.college_id,
//         department_id: student.department_id,
//         semester: student.semester,
//         batchYear: student.batchYear,
//       },
//       marksData,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;
// routes/studentMarks.ts
import express from "express";
import DatabaseService from "../../lib/database";

const router = express.Router();

// Get marks for a student
router.get("/:userId/marks", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const prisma = DatabaseService.getInstance();

    // Fetch student and user
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!student || !user) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch enrollments with marks
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        offering: {
          include: {
            course: true,
            testComponents: true
          }
        },
        studentMarks: {
          include: {
            testComponent: true
          }
        }
      },
    });

    const marksData = enrollments.map((enrollment) => {
      const course = enrollment.offering?.course || null;

      // Group marks by test type
      const theoryMarks: any[] = [];
      const labMarks: any[] = [];
      let theoryTotal = 0;
      let labTotal = 0;
      let theoryMaxTotal = 0;
      let labMaxTotal = 0;

      enrollment.studentMarks.forEach(mark => {
        const markData = {
          testName: mark.testComponent.name,
          marksObtained: mark.marksObtained || 0,
          maxMarks: mark.testComponent.maxMarks,
          weightage: mark.testComponent.weightage
        };

        if (mark.testComponent.type === 'theory') {
          theoryMarks.push(markData);
          theoryTotal += mark.marksObtained || 0;
          theoryMaxTotal += mark.testComponent.maxMarks;
        } else if (mark.testComponent.type === 'lab') {
          labMarks.push(markData);
          labTotal += mark.marksObtained || 0;
          labMaxTotal += mark.testComponent.maxMarks;
        }
      });

      const totalMarks = theoryTotal + labTotal;
      const maxTotalMarks = theoryMaxTotal + labMaxTotal;
      const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;

      // Simple grading
      let grade = "F";
      if (percentage >= 90) grade = "O";
      else if (percentage >= 80) grade = "A+";
      else if (percentage >= 70) grade = "A";
      else if (percentage >= 60) grade = "B+";
      else if (percentage >= 50) grade = "B";
      else if (percentage >= 40) grade = "C";

      return {
        course_code: course?.code || "N/A",
        course_name: course?.name || "N/A",
        course_type: course?.type || "core",
        theoryMarks,
        labMarks,
        theoryTotal,
        labTotal,
        totalMarks,
        maxTotalMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        grade,
      };
    });

    res.json({
      student: {
        name: user.name,
        usn: student.usn,
        semester: student.semester,
        batchYear: student.batchYear,
      },
      marksData,
    });
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
