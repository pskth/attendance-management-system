// export-dump.js - Export PostgreSQL database dump
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

async function exportDatabaseDump() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("❌ DATABASE_URL not found in environment variables");
      process.exit(1);
    }

    console.log("📦 Starting database export...\n");

    const dbParams = parseDatabaseUrl(databaseUrl);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const dumpFileName = `attendance-db-dump-${timestamp}-${timeStr}.sql`;
    const dumpDir = path.join(__dirname, "dumps");
    const dumpPath = path.join(dumpDir, dumpFileName);

    // Create dumps directory if it doesn't exist
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir, { recursive: true });
      console.log("📁 Created dumps directory\n");
    }

    console.log("Database Details:");
    console.log(`  Host: ${dbParams.host}`);
    console.log(`  Port: ${dbParams.port}`);
    console.log(`  Database: ${dbParams.database}`);
    console.log(`  User: ${dbParams.user}`);
    console.log(`\n📝 Output file: ${dumpFileName}\n`);

    // Execute pg_dump command
    const command = `pg_dump -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -F p -f "${dumpPath}"`;

    const env = { ...process.env, PGPASSWORD: dbParams.password };

    exec(
      command,
      { env, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Export failed:", error.message);
          process.exit(1);
        }

        if (stderr) {
          console.log("⚠️  Warnings:", stderr);
        }

        // Check if file was created
        if (!fs.existsSync(dumpPath)) {
          console.error("❌ Dump file was not created");
          process.exit(1);
        }

        const stats = fs.statSync(dumpPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log("✅ Database export completed successfully!\n");
        console.log("Export Details:");
        console.log(`  File: ${dumpPath}`);
        console.log(`  Size: ${sizeMB} MB`);
        console.log(`  Location: ${dumpDir}`);
        console.log(
          "\n💡 To restore this dump, use: node import-dump.js <filename>"
        );
      }
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Check if pg_dump is available
exec("pg_dump --version", (error) => {
  if (error) {
    console.error("❌ pg_dump not found in PATH");
    console.error("   Please install PostgreSQL client tools");
    console.error("   Windows: Install PostgreSQL or add pg_dump to PATH");
    console.error("   Linux: sudo apt-get install postgresql-client");
    console.error("   Mac: brew install postgresql");
    process.exit(1);
  }
  exportDatabaseDump();
});
