const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("🔐 Creating Admin User...\n");

    // Admin user details - MODIFY THESE AS NEEDED
    const adminData = {
      username: "admin",
      name: "System Administrator",
      email: "admin@example.com",
      phone: "9876543210",
      password: "admin123", // Change this to your desired password
    };

    // Hash the password
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Create or update the user
    const user = await prisma.user.upsert({
      where: { username: adminData.username },
      update: {
        email: adminData.email,
        name: adminData.name,
        phone: adminData.phone,
        passwordHash: passwordHash,
      },
      create: {
        username: adminData.username,
        email: adminData.email,
        passwordHash: passwordHash,
        name: adminData.name,
        phone: adminData.phone,
      },
    });

    console.log(`✅ User created: ${user.username}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);

    // Assign admin role
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: "admin",
        },
      },
      update: {},
      create: {
        userId: user.id,
        role: "admin",
      },
    });

    console.log(`✅ Admin role assigned\n`);

    // Create Admin record
    await prisma.admin.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    console.log(`✅ Admin profile created\n`);

    console.log("🎉 Admin user created successfully!");
    console.log("\n📝 Login Credentials:");
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: ${adminData.password}`);
    console.log("\n⚠️  Please change the password after first login!\n");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
