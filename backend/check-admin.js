const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkAdmin() {
    const admins = await prisma.admin.findMany({
        include: {
            user: {
                include: {
                    student: true,
                    teacher: true,
                    admin: true,
                    reportViewer: true
                }
            }
        }
    });
    
    console.log('Admin users:', JSON.stringify(admins, null, 2));
    await prisma.$disconnect();
}

checkAdmin();
