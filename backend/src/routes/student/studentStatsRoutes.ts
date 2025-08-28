// routes/studentAttendance.ts
import express from "express";
import DatabaseService from "../../lib/database"; // Adjust path

const router = express.Router();

router.get("/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const prisma = DatabaseService.getInstance();

    // 1. Get student
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 2. Get course enrollments
   const enrollments = await prisma.studentEnrollment.findMany({
  where: { studentId: student.id },
  include: {
    offering: {
      include: {
        course: true,
        attendances: {
          include: {
            attendanceRecords: {
              where: { studentId: student.id }
            }
          }
        }
      }
    }
  }
});


    const courseAttendance = enrollments.map((enrollment) => {
      const  attendances  = enrollment.offering?.attendances;
        const course = enrollment.offering?.course;
      // Flatten all attendance records for this course
      const records = attendances.flatMap((a) => a.attendanceRecords);

      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const total = present + absent;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      // Status logic
      const required_percentage = 75;
      let status: "good" | "warning" | "critical" = "good";
      if (percentage < required_percentage && percentage >= required_percentage - 5) {
        status = "warning";
      } else if (percentage < required_percentage - 5) {
        status = "critical";
      }

      return {
        course_name: course.name,
        course_code: course.code,
        present,
        absent,
        total,
        percentage: parseFloat(percentage.toFixed(2)),
        required_percentage,
        status,
      };
    });

    // 3. Overall stats
    const total_present = courseAttendance.reduce((sum, c) => sum + c.present, 0);
    const total_absent = courseAttendance.reduce((sum, c) => sum + c.absent, 0);
    const total_classes = total_present + total_absent;
    const overall_percentage = total_classes
      ? parseFloat(((total_present / total_classes) * 100).toFixed(2))
      : 0;

    // 4. Monthly trend (optional: group by month/year)
    const monthly_trend = []; // You can implement grouping with date-fns

    res.json({
      courseAttendance,
      overallStats: {
        total_present,
        total_absent,
        total_classes,
        overall_percentage,
        trend: "up", // Could calculate based on last vs current month
        monthly_trend,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
