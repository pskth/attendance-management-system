const { PrismaClient } = require("./generated/prisma");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

// Configuration
const EXCEL_FILES_DIR = path.join(__dirname, "excel-seed-data");
const DEFAULT_PASSWORD = "password123"; // Default password for all users

/**
 * Read Excel file and convert to JSON
 */
function readExcelFile(filename) {
  const filePath = path.join(EXCEL_FILES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return null;
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Loaded ${data.length} rows from ${filename}`);
  return data;
}

/**
 * Seed Colleges
 */
async function seedColleges() {
  console.log("\n📚 Seeding Colleges...");
  const data = readExcelFile("colleges.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      await prisma.college.upsert({
        where: { code: row.code },
        update: {
          name: row.name,
          code: row.code,
        },
        create: {
          name: row.name,
          code: row.code,
        },
      });
      count++;
      console.log(`  ✓ ${row.code} - ${row.name}`);
    } catch (error) {
      console.error(`  ✗ Error creating college ${row.code}:`, error.message);
    }
  }
  console.log(`✨ Created/Updated ${count} colleges`);
}

/**
 * Seed Departments
 */
async function seedDepartments() {
  console.log("\n🏢 Seeding Departments...");
  const data = readExcelFile("departments.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      // Find college by code
      const college = await prisma.college.findUnique({
        where: { code: row.college_code },
      });

      if (!college) {
        console.error(`  ✗ College not found: ${row.college_code}`);
        continue;
      }

      await prisma.department.upsert({
        where: {
          college_id_code: {
            college_id: college.id,
            code: row.code,
          },
        },
        update: {
          name: row.name,
        },
        create: {
          college_id: college.id,
          name: row.name,
          code: row.code,
        },
      });
      count++;
      console.log(`  ✓ ${row.code} - ${row.name} (${row.college_code})`);
    } catch (error) {
      console.error(
        `  ✗ Error creating department ${row.code}:`,
        error.message
      );
    }
  }
  console.log(`✨ Created/Updated ${count} departments`);
}

/**
 * Seed Sections
 */
async function seedSections() {
  console.log("\n📋 Seeding Sections...");
  const data = readExcelFile("sections.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      // Find department
      const department = await prisma.department.findFirst({
        where: {
          code: row.department_code,
          colleges: {
            code: row.college_code,
          },
        },
      });

      if (!department) {
        console.error(
          `  ✗ Department not found: ${row.department_code} in ${row.college_code}`
        );
        continue;
      }

      await prisma.sections.upsert({
        where: {
          department_id_section_name: {
            department_id: department.id,
            section_name: row.section_name,
          },
        },
        update: {},
        create: {
          department_id: department.id,
          section_name: row.section_name,
        },
      });
      count++;
      console.log(
        `  ✓ Section ${row.section_name} - ${row.department_code} (${row.college_code})`
      );
    } catch (error) {
      console.error(
        `  ✗ Error creating section ${row.section_name}:`,
        error.message
      );
    }
  }
  console.log(`✨ Created/Updated ${count} sections`);
}

/**
 * Seed Users (Students and Teachers)
 */
async function seedUsers() {
  console.log("\n👥 Seeding Users...");
  const data = readExcelFile("users.xlsx");
  if (!data) return;

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let count = 0;

  for (const row of data) {
    try {
      const user = await prisma.user.upsert({
        where: { username: row.username },
        update: {
          email: row.email || null,
          name: row.name,
          phone: row.phone || null,
        },
        create: {
          username: row.username,
          email: row.email || null,
          passwordHash: passwordHash,
          name: row.name,
          phone: row.phone || null,
        },
      });

      // Create user role
      const role = row.role || "student"; // Default to student
      await prisma.userRoleAssignment.upsert({
        where: {
          userId_role: {
            userId: user.id,
            role: role,
          },
        },
        update: {},
        create: {
          userId: user.id,
          role: role,
        },
      });

      count++;
      console.log(`  ✓ ${row.username} - ${row.name} (${role})`);
    } catch (error) {
      console.error(`  ✗ Error creating user ${row.username}:`, error.message);
    }
  }
  console.log(`✨ Created/Updated ${count} users`);
}

/**
 * Seed Students
 */
async function seedStudents() {
  console.log("\n🎓 Seeding Students...");
  const data = readExcelFile("students.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { username: row.usn },
      });

      if (!user) {
        console.error(`  ✗ User not found: ${row.usn}`);
        continue;
      }

      // Find college
      const college = await prisma.college.findUnique({
        where: { code: row.college_code },
      });

      if (!college) {
        console.error(`  ✗ College not found: ${row.college_code}`);
        continue;
      }

      // Find department
      const department = await prisma.department.findFirst({
        where: {
          code: row.department_code,
          college_id: college.id,
        },
      });

      if (!department) {
        console.error(`  ✗ Department not found: ${row.department_code}`);
        continue;
      }

      // Find section
      const section = await prisma.sections.findFirst({
        where: {
          section_name: row.section,
          department_id: department.id,
        },
      });

      if (!section) {
        console.error(`  ✗ Section not found: ${row.section}`);
        continue;
      }

      await prisma.student.upsert({
        where: { usn: row.usn },
        update: {
          semester: parseInt(row.semester) || 1,
          batchYear: parseInt(row.batch_year) || new Date().getFullYear(),
        },
        create: {
          usn: row.usn,
          userId: user.id,
          college_id: college.id,
          department_id: department.id,
          section_id: section.id,
          semester: parseInt(row.semester) || 1,
          batchYear: parseInt(row.batch_year) || new Date().getFullYear(),
        },
      });

      count++;
      console.log(`  ✓ ${row.usn} - ${user.name} (Sem ${row.semester})`);
    } catch (error) {
      console.error(`  ✗ Error creating student ${row.usn}:`, error.message);
    }
  }
  console.log(`✨ Created/Updated ${count} students`);
}

/**
 * Seed Teachers
 */
async function seedTeachers() {
  console.log("\n👨‍🏫 Seeding Teachers...");
  const data = readExcelFile("teachers.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { username: row.username },
      });

      if (!user) {
        console.error(`  ✗ User not found: ${row.username}`);
        continue;
      }

      // Find college
      const college = await prisma.college.findUnique({
        where: { code: row.college_code },
      });

      if (!college) {
        console.error(`  ✗ College not found: ${row.college_code}`);
        continue;
      }

      // Find department
      const department = await prisma.department.findFirst({
        where: {
          code: row.department_code,
          college_id: college.id,
        },
      });

      if (!department) {
        console.error(`  ✗ Department not found: ${row.department_code}`);
        continue;
      }

      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {
          department_id: department.id,
          college_id: college.id,
        },
        create: {
          userId: user.id,
          department_id: department.id,
          college_id: college.id,
        },
      });

      count++;
      console.log(
        `  ✓ ${row.username} - ${user.name} (${row.department_code})`
      );
    } catch (error) {
      console.error(
        `  ✗ Error creating teacher ${row.username}:`,
        error.message
      );
    }
  }
  console.log(`✨ Created/Updated ${count} teachers`);
}

/**
 * Seed Courses
 */
async function seedCourses() {
  console.log("\n📖 Seeding Courses...");
  const data = readExcelFile("courses.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      // Find department
      const department = await prisma.department.findFirst({
        where: {
          code: row.department_code,
          colleges: {
            code: row.college_code,
          },
        },
      });

      if (!department) {
        console.error(
          `  ✗ Department not found: ${row.department_code} in ${row.college_code}`
        );
        continue;
      }

      await prisma.course.upsert({
        where: {
          departmentId_code: {
            departmentId: department.id,
            code: row.code,
          },
        },
        update: {
          name: row.name,
          type: row.type || "core",
          year: parseInt(row.year) || 1,
          hasTheoryComponent:
            row.has_theory === "true" ||
            row.has_theory === true ||
            row.has_theory === 1,
          hasLabComponent:
            row.has_lab === "true" || row.has_lab === true || row.has_lab === 1,
        },
        create: {
          code: row.code,
          name: row.name,
          departmentId: department.id,
          type: row.type || "core",
          year: parseInt(row.year) || 1,
          hasTheoryComponent:
            row.has_theory === "true" ||
            row.has_theory === true ||
            row.has_theory === 1,
          hasLabComponent:
            row.has_lab === "true" || row.has_lab === true || row.has_lab === 1,
        },
      });

      count++;
      console.log(`  ✓ ${row.code} - ${row.name} (${row.type})`);
    } catch (error) {
      console.error(`  ✗ Error creating course ${row.code}:`, error.message);
    }
  }
  console.log(`✨ Created/Updated ${count} courses`);
}

/**
 * Seed Academic Years
 */
async function seedAcademicYears() {
  console.log("\n📅 Seeding Academic Years...");
  const data = readExcelFile("academic_years.xlsx");
  if (!data) return;

  let count = 0;
  for (const row of data) {
    try {
      await prisma.academicYear.upsert({
        where: { year_name: row.year_name },
        update: {
          startDate: new Date(row.start_date),
          endDate: new Date(row.end_date),
        },
        create: {
          year_name: row.year_name,
          startDate: new Date(row.start_date),
          endDate: new Date(row.end_date),
        },
      });

      count++;
      console.log(`  ✓ ${row.year_name}`);
    } catch (error) {
      console.error(
        `  ✗ Error creating academic year ${row.year_name}:`,
        error.message
      );
    }
  }
  console.log(`✨ Created/Updated ${count} academic years`);
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log("🌱 Starting Database Seeding from Excel Files...\n");
    console.log(`📁 Looking for Excel files in: ${EXCEL_FILES_DIR}\n`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(EXCEL_FILES_DIR)) {
      fs.mkdirSync(EXCEL_FILES_DIR, { recursive: true });
      console.log(`✅ Created directory: ${EXCEL_FILES_DIR}`);
      console.log(
        "\n⚠️  Please add your Excel files to this directory and run again.\n"
      );
      return;
    }

    // Seed in order of dependencies
    await seedColleges();
    await seedDepartments();
    await seedSections();
    await seedUsers();
    await seedStudents();
    await seedTeachers();
    await seedCourses();
    await seedAcademicYears();

    console.log("\n✅ Database seeding completed successfully!");
    console.log(
      `\n📝 Note: All users have been created with default password: "${DEFAULT_PASSWORD}"\n`
    );
  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log("✅ Seeding process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
