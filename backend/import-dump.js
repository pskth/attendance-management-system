// import-dump.js - Import PostgreSQL database dump
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

/**
 * Parse DATABASE_URL to extract connection parameters
 */
function parseDatabaseUrl(databaseUrl) {
  // Format: postgresql://user:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = databaseUrl.match(regex);

  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function importDatabaseDump(dumpFile) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("❌ DATABASE_URL not found in environment variables");
      process.exit(1);
    }

    console.log("📥 Starting database import...\n");

    const dbParams = parseDatabaseUrl(databaseUrl);

    // Check if dump file exists
    if (!fs.existsSync(dumpFile)) {
      console.error(`❌ Dump file not found: ${dumpFile}`);
      console.error("\n💡 Usage: node import-dump.js <path-to-dump.sql>");
      process.exit(1);
    }

    const stats = fs.statSync(dumpFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log("Database Details:");
    console.log(`  Host: ${dbParams.host}`);
    console.log(`  Port: ${dbParams.port}`);
    console.log(`  Database: ${dbParams.database}`);
    console.log(`  User: ${dbParams.user}`);
    console.log(`\n📝 Import file: ${path.basename(dumpFile)}`);
    console.log(`   Size: ${sizeMB} MB\n`);

    console.log("⚠️  WARNING: This will ADD data to your existing database!");
    console.log(
      "   This may cause duplicate key errors if data already exists."
    );
    console.log(
      "   Consider clearing the database first if doing a clean restore.\n"
    );

    // Execute psql command
    const command = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -f "${dumpFile}"`;

    const env = { ...process.env, PGPASSWORD: dbParams.password };

    console.log(
      "🔄 Importing... (this may take a while for large databases)\n"
    );

    exec(
      command,
      { env, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Import failed:", error.message);
          if (stderr) {
            console.error("\nError details:", stderr);
          }
          process.exit(1);
        }

        if (stderr && !stderr.includes("NOTICE")) {
          console.log("⚠️  Warnings:", stderr);
        }

        if (stdout) {
          console.log("Import output:", stdout);
        }

        console.log("\n✅ Database import completed successfully!");
        console.log("\n💡 Next steps:");
        console.log("   1. Verify data integrity");
        console.log("   2. Test application functionality");
        console.log("   3. Check for any import warnings above");
      }
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("📥 PostgreSQL Database Import Tool\n");
  console.log("Usage: node import-dump.js <path-to-dump.sql>\n");
  console.log("Examples:");
  console.log("  node import-dump.js dumps/attendance-db-dump-2025-10-12.sql");
  console.log("  node import-dump.js backup.sql\n");
  console.log(
    "⚠️  WARNING: This will import data into your existing database!"
  );
  console.log("   Make sure to backup your current database first.\n");
  process.exit(0);
}

const dumpFile = args[0];

// Check if psql is available
exec("psql --version", (error) => {
  if (error) {
    console.error("❌ psql not found in PATH");
    console.error("   Please install PostgreSQL client tools");
    console.error("   Windows: Install PostgreSQL or add psql to PATH");
    console.error("   Linux: sudo apt-get install postgresql-client");
    console.error("   Mac: brew install postgresql");
    process.exit(1);
  }
  importDatabaseDump(dumpFile);
});
