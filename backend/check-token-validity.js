const { PrismaClient } = require("./generated/prisma");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();

async function checkToken() {
  console.log("\n🔐 Token Validity Checker\n");

  // You need to pass the token as argument
  const token = process.argv[2];

  if (!token) {
    console.log("❌ No token provided!");
    console.log("\nUsage: node check-token-validity.js <your-token>");
    console.log("\nTo get your token from browser:");
    console.log("  1. Open browser DevTools (F12)");
    console.log("  2. Go to Application/Storage → Cookies");
    console.log('  3. Find "auth_token" cookie');
    console.log("  4. Copy its value");
    console.log("  5. Run: node check-token-validity.js <paste-token-here>\n");
    await prisma.$disconnect();
    return;
  }

  try {
    // Verify JWT
    console.log("Step 1: Verifying JWT signature...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
    );
    console.log("✅ JWT signature is valid");
    console.log("   Decoded payload:", JSON.stringify(decoded, null, 2));

    // Check if user exists
    console.log("\nStep 2: Checking if user exists in database...");
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        admin: true,
        student: true,
        teacher: true,
        userRoles: true,
      },
    });

    if (!user) {
      console.log("❌ User NOT FOUND in database!");
      console.log("   User ID from token:", decoded.userId);
      console.log("\n⚠️  This token is INVALID - the user has been deleted.");
      console.log("   Solution: Logout and login again.\n");
      await prisma.$disconnect();
      return;
    }

    console.log("✅ User exists in database");
    console.log("   Username:", user.username);
    console.log("   Name:", user.name);
    console.log("   User ID:", user.id);

    // Check roles
    console.log("\nStep 3: Checking user roles...");
    if (user.userRoles.length === 0) {
      console.log("⚠️  User has NO roles assigned!");
    } else {
      console.log(
        "✅ User roles:",
        user.userRoles.map((r) => r.role).join(", ")
      );
    }

    // Check if admin
    console.log("\nStep 4: Checking admin status...");
    if (user.admin) {
      console.log("✅ User IS an admin");
      console.log("   Admin ID:", user.admin.id);
    } else {
      console.log("⚠️  User is NOT an admin");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TOKEN IS VALID - Authentication should work");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.log("❌ JWT verification failed!");
      console.log("   Error:", error.message);
      console.log("\n⚠️  This token is INVALID or corrupted.");
      console.log("   Solution: Logout and login again.\n");
    } else if (error.name === "TokenExpiredError") {
      console.log("❌ Token has EXPIRED!");
      console.log("   Expired at:", error.expiredAt);
      console.log("\n⚠️  This token is EXPIRED.");
      console.log("   Solution: Logout and login again.\n");
    } else {
      console.error("❌ Error:", error.message);
      console.error(error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkToken();
