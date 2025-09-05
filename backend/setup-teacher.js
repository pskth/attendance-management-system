const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function createTeacherProfile() {
  try {
    await prisma.$connect();
    
    // Find the teacher user
    const teacherUser = await prisma.user.findUnique({
      where: { username: 'teacher' },
      include: { teacher: true }
    });
    
    if (!teacherUser) {
      console.log('Teacher user not found');
      return;
    }
    
    if (teacherUser.teacher) {
      console.log('Teacher profile already exists');
      return;
    }
    
    // Get a department and college
    const dept = await prisma.department.findFirst();
    const college = await prisma.college.findFirst();
    
    if (!dept || !college) {
      console.log('No department or college found');
      return;
    }
    
    // Create teacher profile
    const teacherProfile = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        departmentId: dept.id,
        college_id: college.id
      }
    });
    
    console.log('Teacher profile created:', {
      id: teacherProfile.id,
      userId: teacherProfile.userId,
      departmentId: teacherProfile.departmentId,
      collegeId: teacherProfile.collegeId
    });
    
    // Now let's assign some courses to this teacher
    const courses = await prisma.course.findMany({
      where: { departmentId: dept.id },
      take: 2
    });
    
    if (courses.length > 0) {
      // Get academic year and section
      const academicYear = await prisma.academicYear.findFirst();
      const section = await prisma.section.findFirst({
        where: { departmentId: dept.id }
      });
      
      for (const course of courses) {
        try {
          const offering = await prisma.courseOffering.create({
            data: {
              courseId: course.id,
              teacherId: teacherProfile.id,
              academicYearId: academicYear?.id || '',
              sectionId: section?.section_id || ''
            }
          });
          console.log('Course offering created:', {
            course: course.name,
            offering: offering.id
          });
        } catch (error) {
          console.log('Course offering might already exist for:', course.name);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacherProfile();
