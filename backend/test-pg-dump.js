const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function testPgDump() {
  console.log("Testing pg_dump availability...\n");

  try {
    // Test 1: Check if pg_dump is in PATH
    console.log("Test 1: Checking pg_dump version...");
    const { stdout, stderr } = await execAsync("pg_dump --version");
    console.log("✅ pg_dump found!");
    console.log("   Version:", stdout.trim());

    // Test 2: Check psql
    console.log("\nTest 2: Checking psql version...");
    const psqlResult = await execAsync("psql --version");
    console.log("✅ psql found!");
    console.log("   Version:", psqlResult.stdout.trim());

    // Test 3: Check if DATABASE_URL is set
    console.log("\nTest 3: Checking DATABASE_URL...");
    if (process.env.DATABASE_URL) {
      console.log("✅ DATABASE_URL is set");

      // Parse DATABASE_URL
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
      const match = process.env.DATABASE_URL.match(regex);

      if (match) {
        console.log("   User:", match[1]);
        console.log("   Host:", match[3]);
        console.log("   Port:", match[4]);
        console.log("   Database:", match[5]);
      }
    } else {
      console.log("❌ DATABASE_URL not set in environment");
    }

    console.log("\n✅ All checks passed! Export should work.");
    console.log("\nIf export still fails, check:");
    console.log("  1. Database connection permissions");
    console.log("  2. Disk space in dumps/ directory");
    console.log("  3. Backend logs for specific error messages");
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log(
      "\nProblem: PostgreSQL client tools (pg_dump, psql) not found in PATH"
    );
    console.log("\nSolution:");
    console.log("  Windows:");
    console.log(
      "    1. Install PostgreSQL from https://www.postgresql.org/download/windows/"
    );
    console.log("    2. Add PostgreSQL bin folder to PATH:");
    console.log("       C:\\Program Files\\PostgreSQL\\<version>\\bin");
    console.log("    3. Restart terminal/IDE");
    console.log("\n  Linux:");
    console.log("    sudo apt-get install postgresql-client");
    console.log("\n  Mac:");
    console.log("    brew install postgresql");
  }
}

testPgDump();
