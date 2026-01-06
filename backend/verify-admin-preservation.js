const { PrismaClient } = require("./generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function verifyAdminPreservation() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICATION: Admin Preservation During Database Clear");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: Check if admin exists
    console.log("Step 1: Checking for existing admin users...");
    const adminsBefore = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (adminsBefore.length === 0) {
      console.log("❌ No admin users found!");
      console.log("   Please run: node create-admin.js\n");
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Found ${adminsBefore.length} admin user(s):`);
    adminsBefore.forEach((admin, i) => {
      console.log(`   ${i + 1}. ${admin.user.username} (${admin.user.name})`);
      console.log(`      User ID: ${admin.userId}`);
      console.log(`      Admin ID: ${admin.id}`);
    });

    // Step 2: Check admin's roles
    console.log("\nStep 2: Checking admin role assignments...");
    const adminUserIds = adminsBefore.map((a) => a.userId);
    const adminRoles = await prisma.userRoleAssignment.findMany({
      where: {
        userId: { in: adminUserIds },
      },
    });
    console.log(
      `✅ Found ${adminRoles.length} role assignment(s) for admin users:`
    );
    adminRoles.forEach((role) => {
      const admin = adminsBefore.find((a) => a.userId === role.userId);
      console.log(`   - ${admin?.user.username}: ${role.role}`);
    });

    // Step 3: Create test data
    console.log("\nStep 3: Creating test data to be deleted...");

    // Create test college
    const testCollege = await prisma.college.create({
      data: {
        name: "Test College for Deletion",
        code: "TESTDEL",
      },
    });
    console.log(`✅ Created test college: ${testCollege.name}`);

    // Create test department
    const testDept = await prisma.department.create({
      data: {
        name: "Test Department",
        code: "TDEPT",
        college_id: testCollege.id,
      },
    });
    console.log(`✅ Created test department: ${testDept.name}`);

    // Create multiple test users
    const testUsers = [];
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.create({
        data: {
          username: `testuser${i}`,
          email: `testuser${i}@example.com`,
          passwordHash: await bcrypt.hash("password123", 10),
          name: `Test User ${i}`,
          phone: `12345678${i}0`,
        },
      });

      // Assign student role
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: "student",
        },
      });

      // Create student profile
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          college_id: testCollege.id,
          department_id: testDept.id,
          usn: `USN${i}${Date.now().toString().slice(-5)}`,
          batchYear: 2024,
        },
      });

      testUsers.push({ user, student });
      console.log(
        `✅ Created test student ${i}: ${user.username} (${student.usn})`
      );
    }

    // Step 4: Show current database state
    console.log("\nStep 4: Current database state:");
    const counts = {
      colleges: await prisma.college.count(),
      departments: await prisma.department.count(),
      users: await prisma.user.count(),
      students: await prisma.student.count(),
      admins: await prisma.admin.count(),
      roles: await prisma.userRoleAssignment.count(),
    };
    console.log(`   Colleges: ${counts.colleges}`);
    console.log(`   Departments: ${counts.departments}`);
    console.log(
      `   Users: ${counts.users} (${adminsBefore.length} admins + ${testUsers.length} test users)`
    );
    console.log(`   Students: ${counts.students}`);
    console.log(`   Admins: ${counts.admins}`);
    console.log(`   Role Assignments: ${counts.roles}`);

    // Step 5: Ask for confirmation
    console.log("\n" + "=".repeat(70));
    console.log("⚠️  READY TO TEST CLEAR DATABASE");
    console.log("=".repeat(70));
    console.log("\nThe clear database endpoint will now be tested.");
    console.log("It should:");
    console.log("  ✓ Delete all test colleges, departments, and students");
    console.log("  ✓ Delete all non-admin users and their roles");
    console.log(
      "  ✓ PRESERVE admin users, their roles, and admin table entries"
    );
    console.log("\nTo proceed, make the following API call:");
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    console.log(`\n  POST ${apiUrl}/api/admin/clear-database`);
    console.log('  Headers: { Authorization: "Bearer <your-token>" }');
    console.log('  Body: { "confirmation": "DELETE_ALL_DATA" }');
    console.log(
      "\nAfter running the API call, run this script again to verify results."
    );
    console.log("OR check the backend logs to see the deletion counts.");
    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminPreservation();
