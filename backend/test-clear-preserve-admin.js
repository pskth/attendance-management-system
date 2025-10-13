const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

async function testClearPreserveAdmin() {
  console.log("\n🧪 Testing Clear Database with Admin Preservation\n");

  try {
    // Step 1: Check initial admin count
    console.log("Step 1: Checking initial state...");
    const adminsBefore = await prisma.admin.findMany({
      include: { user: true },
    });
    console.log(`✓ Found ${adminsBefore.length} admin(s) before clear:`);
    adminsBefore.forEach((a) =>
      console.log(`  - ${a.user.username} (${a.user.name})`)
    );

    if (adminsBefore.length === 0) {
      console.log(
        "\n❌ No admins found! Please run: node create-admin.js first\n"
      );
      await prisma.$disconnect();
      return;
    }

    // Step 2: Create some test data
    console.log("\nStep 2: Creating test data...");

    // Create a test college
    const testCollege = await prisma.college.create({
      data: {
        name: "Test College",
        code: "TEST001",
      },
    });
    console.log(`✓ Created test college: ${testCollege.name}`);

    // Create a test user (non-admin)
    const bcrypt = require("bcryptjs");
    const testUser = await prisma.user.create({
      data: {
        username: "testuser",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("password123", 10),
        name: "Test User",
        phone: "1234567890",
      },
    });
    console.log(`✓ Created test user: ${testUser.username}`);

    // Create a test student
    const testStudent = await prisma.student.create({
      data: {
        userId: testUser.id,
        college_id: testCollege.id,
        usn: "TEST001",
        batchYear: 2024,
      },
    });
    console.log(`✓ Created test student: ${testStudent.usn}`);

    // Step 3: Verify data exists
    console.log("\nStep 3: Verifying test data...");
    const collegeCount = await prisma.college.count();
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const adminCount = await prisma.admin.count();

    console.log(`  - Colleges: ${collegeCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Students: ${studentCount}`);
    console.log(`  - Admins: ${adminCount}`);

    // Step 4: Simulate the clear database logic
    console.log(
      "\nStep 4: Simulating clear database (with admin preservation)..."
    );

    // Get admin user IDs
    const adminUserIds = adminsBefore.map((a) => a.userId);
    console.log(`Preserving admin userIds: ${adminUserIds.join(", ")}`);

    // Delete in order (same as the endpoint)
    await prisma.theoryMarks.deleteMany({});
    await prisma.labMarks.deleteMany({});
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.studentEnrollment.deleteMany({});
    await prisma.courseOffering.deleteMany({});
    await prisma.courseElectiveGroupMember.deleteMany({});
    await prisma.openElectiveRestriction.deleteMany({});
    await prisma.departmentElectiveGroup.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.academic_years.deleteMany({});

    // Delete non-admin students
    const delStudents = await prisma.student.deleteMany({
      where: { userId: { notIn: adminUserIds } },
    });
    console.log(`✓ Deleted ${delStudents.count} non-admin students`);

    // Delete non-admin teachers
    const delTeachers = await prisma.teacher.deleteMany({
      where: { userId: { notIn: adminUserIds } },
    });
    console.log(`✓ Deleted ${delTeachers.count} non-admin teachers`);

    // Delete non-admin report viewers
    await prisma.reportViewer.deleteMany({
      where: { userId: { notIn: adminUserIds } },
    });

    await prisma.sections.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.college.deleteMany({});

    // Delete non-admin user roles
    const delRoles = await prisma.userRoleAssignment.deleteMany({
      where: { userId: { notIn: adminUserIds } },
    });
    console.log(`✓ Deleted ${delRoles.count} non-admin role assignments`);

    // Delete non-admin users
    const delUsers = await prisma.user.deleteMany({
      where: { id: { notIn: adminUserIds } },
    });
    console.log(`✓ Deleted ${delUsers.count} non-admin users`);

    // Step 5: Verify admins still exist
    console.log("\nStep 5: Verifying admin preservation...");
    const adminsAfter = await prisma.admin.findMany({
      include: { user: true },
    });

    console.log(`✓ Admin count after clear: ${adminsAfter.length}`);
    adminsAfter.forEach((a) =>
      console.log(`  - ${a.user.username} (${a.user.name})`)
    );

    // Step 6: Verify test data was deleted
    console.log("\nStep 6: Verifying test data deletion...");
    const collegeCountAfter = await prisma.college.count();
    const userCountAfter = await prisma.user.count();
    const studentCountAfter = await prisma.student.count();
    const adminCountAfter = await prisma.admin.count();

    console.log(`  - Colleges: ${collegeCountAfter} (should be 0)`);
    console.log(
      `  - Users: ${userCountAfter} (should be ${adminsBefore.length})`
    );
    console.log(`  - Students: ${studentCountAfter} (should be 0)`);
    console.log(
      `  - Admins: ${adminCountAfter} (should be ${adminsBefore.length})`
    );

    // Final result
    console.log("\n" + "=".repeat(60));
    if (
      adminCountAfter === adminsBefore.length &&
      collegeCountAfter === 0 &&
      studentCountAfter === 0 &&
      userCountAfter === adminsBefore.length
    ) {
      console.log("✅ TEST PASSED: Admin preservation works correctly!");
      console.log(`   - Admins preserved: ${adminCountAfter}`);
      console.log(`   - Test data cleared: ✓`);
    } else {
      console.log("❌ TEST FAILED: Something went wrong!");
      console.log(
        `   - Expected admins: ${adminsBefore.length}, Got: ${adminCountAfter}`
      );
      console.log(`   - Expected colleges: 0, Got: ${collegeCountAfter}`);
      console.log(`   - Expected students: 0, Got: ${studentCountAfter}`);
    }
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error during test:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testClearPreserveAdmin();
