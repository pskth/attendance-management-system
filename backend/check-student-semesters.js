const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkStudentSemesters() {
  try {
    console.log('🔍 Checking Student Semesters\n');

    // Get all students with their sections and departments
    const students = await prisma.student.findMany({
      where: {
        departments: {
          code: 'CS'
        }
      },
      include: {
        user: { select: { name: true } },
        sections: { select: { section_name: true } },
        departments: { select: { code: true, name: true } },
        colleges: { select: { code: true, name: true } }
      },
      orderBy: [
        { semester: 'asc' },
        { usn: 'asc' }
      ]
    });

    console.log(`📊 Total CS Students: ${students.length}\n`);

    // Group by semester
    const bySemester = students.reduce((acc, student) => {
      if (!acc[student.semester]) {
        acc[student.semester] = [];
      }
      acc[student.semester].push(student);
      return acc;
    }, {});

    // Display by semester
    Object.keys(bySemester).sort((a, b) => Number(a) - Number(b)).forEach(semester => {
      const studentsInSem = bySemester[semester];
      const yearOfStudy = Math.ceil(Number(semester) / 2);
      
      console.log(`\n📚 Semester ${semester} (Year ${yearOfStudy}): ${studentsInSem.length} students`);
      console.log('─'.repeat(80));
      
      // Group by section
      const bySection = studentsInSem.reduce((acc, s) => {
        const section = s.sections?.section_name || 'No Section';
        if (!acc[section]) acc[section] = [];
        acc[section].push(s);
        return acc;
      }, {});

      Object.keys(bySection).forEach(section => {
        console.log(`\n  Section ${section}: ${bySection[section].length} students`);
        bySection[section].forEach(s => {
          console.log(`    ${s.usn} - ${s.user?.name || 'Unknown'}`);
        });
      });
    });

    // Check enrollments for CS301
    console.log('\n\n🎓 CS301 Enrollments Check:\n');
    
    const cs301 = await prisma.course.findFirst({
      where: { code: 'CS301' },
      include: {
        courseOfferings: {
          include: {
            sections: true,
            academic_years: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true,
                    sections: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (cs301) {
      console.log(`Course: ${cs301.code} - ${cs301.name}\n`);
      
      cs301.courseOfferings.forEach(offering => {
        console.log(`\nOffering:`);
        console.log(`  Section: ${offering.sections?.section_name || 'Not assigned'}`);
        console.log(`  Semester: ${offering.semester}`);
        console.log(`  Academic Year: ${offering.academic_years?.year_name || 'Unknown'}`);
        console.log(`  Enrolled Students: ${offering.enrollments.length}`);
        
        if (offering.enrollments.length > 0) {
          offering.enrollments.slice(0, 3).forEach(e => {
            console.log(`    - ${e.student?.usn} (Sem ${e.student?.semester}, Section ${e.student?.sections?.section_name})`);
          });
          if (offering.enrollments.length > 3) {
            console.log(`    ... and ${offering.enrollments.length - 3} more`);
          }
        }
      });
    } else {
      console.log('CS301 course not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentSemesters();
