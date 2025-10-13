import { PrismaClient, Department } from '../generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Cleaning up existing data...');

        // Get admin user IDs BEFORE clearing (to preserve them)
        const adminUsers = await prisma.admin.findMany({
            select: { userId: true }
        });
        const adminUserIds = adminUsers.map(a => a.userId);

        if (adminUserIds.length > 0) {
            console.log(`⚠️  Preserving ${adminUserIds.length} admin user(s) during seed...`);
        } else {
            console.log('⚠️  WARNING: No admin users found! Consider running create-admin.js after seeding.');
        }

        // Delete in proper order, excluding admin users
        await prisma.studentEnrollment.deleteMany();
        await prisma.courseOffering.deleteMany();
        await prisma.course.deleteMany();
        await prisma.teacher.deleteMany({
            where: adminUserIds.length > 0 ? { userId: { notIn: adminUserIds } } : {}
        });
        await prisma.student.deleteMany({
            where: adminUserIds.length > 0 ? { userId: { notIn: adminUserIds } } : {}
        });
        await prisma.sections.deleteMany();
        await prisma.department.deleteMany();
        await prisma.academic_years.deleteMany();
        await prisma.college.deleteMany();

        // Delete non-admin users and their roles
        if (adminUserIds.length > 0) {
            await prisma.userRoleAssignment.deleteMany({
                where: { userId: { notIn: adminUserIds } }
            });
            await prisma.user.deleteMany({
                where: { id: { notIn: adminUserIds } }
            });
            console.log('✅ Admin users preserved during seed');
        } else {
            await prisma.userRoleAssignment.deleteMany();
            await prisma.user.deleteMany();
        }

        console.log('Creating colleges...');
        const [nmamit, nmit] = await Promise.all([
            prisma.college.create({
                data: {
                    name: 'NMAM Institute of Technology',
                    code: 'NMAMIT'
                }
            }),
            prisma.college.create({
                data: {
                    name: 'Nitte Meenakshi Institute of Technology',
                    code: 'NMIT'
                }
            })
        ]);

        console.log('Creating academic years...');
        await Promise.all([
            prisma.academic_years.create({
                data: {
                    college_id: nmamit.id,
                    year_name: '2024-25',
                    start_date: new Date('2024-06-01'),
                    end_date: new Date('2025-05-31'),
                    is_active: true
                }
            }),
            prisma.academic_years.create({
                data: {
                    college_id: nmit.id,
                    year_name: '2024-25',
                    start_date: new Date('2024-06-01'),
                    end_date: new Date('2025-05-31'),
                    is_active: true
                }
            })
        ]);

        console.log('Creating departments...');
        const departments = [
            { name: 'Computer Science and Engineering', code: 'CS' },
            { name: 'Information Science and Engineering', code: 'IS' },
            { name: 'Mechanical Engineering', code: 'ME' },
            { name: 'Civil Engineering', code: 'CE' },
            { name: 'Electronics and Communication Engineering', code: 'EC' }
        ] as const;

        const [nmamitDepts, nmitDepts] = await Promise.all([
            Promise.all(
                departments.map(dept =>
                    prisma.department.create({
                        data: {
                            name: dept.name,
                            code: dept.code,
                            college_id: nmamit.id
                        }
                    })
                )
            ),
            Promise.all(
                departments.map(dept =>
                    prisma.department.create({
                        data: {
                            name: dept.name,
                            code: dept.code,
                            college_id: nmit.id
                        }
                    })
                )
            )
        ]);

        console.log('Creating courses...');
        type CourseType = 'core' | 'department_elective' | 'open_elective';
        interface CourseData {
            code: string;
            name: string;
            type: CourseType;
        }

        const departmentCourses: Record<string, CourseData[]> = {
            'CS': [
                { code: 'CS201', name: 'Data Structures and Algorithms', type: 'core' },
                { code: 'CS202', name: 'Operating Systems', type: 'core' },
                { code: 'CS203', name: 'Database Management Systems', type: 'core' },
                { code: 'CS204', name: 'Computer Networks', type: 'core' },
                { code: 'CS205', name: 'Machine Learning', type: 'department_elective' }
            ],
            'IS': [
                { code: 'IS201', name: 'Information Systems', type: 'core' },
                { code: 'IS202', name: 'Software Engineering', type: 'core' },
                { code: 'IS203', name: 'Web Technologies', type: 'core' },
                { code: 'IS204', name: 'Data Analytics', type: 'core' },
                { code: 'IS205', name: 'Cloud Computing', type: 'department_elective' }
            ],
            'ME': [
                { code: 'ME201', name: 'Thermodynamics', type: 'core' },
                { code: 'ME202', name: 'Fluid Mechanics', type: 'core' },
                { code: 'ME203', name: 'Machine Design', type: 'core' },
                { code: 'ME204', name: 'Heat Transfer', type: 'core' },
                { code: 'ME205', name: 'Robotics', type: 'department_elective' }
            ],
            'CE': [
                { code: 'CE201', name: 'Structural Engineering', type: 'core' },
                { code: 'CE202', name: 'Geotechnical Engineering', type: 'core' },
                { code: 'CE203', name: 'Transportation Engineering', type: 'core' },
                { code: 'CE204', name: 'Environmental Engineering', type: 'core' },
                { code: 'CE205', name: 'Construction Management', type: 'department_elective' }
            ],
            'EC': [
                { code: 'EC201', name: 'Digital Electronics', type: 'core' },
                { code: 'EC202', name: 'Analog Circuits', type: 'core' },
                { code: 'EC203', name: 'Communication Systems', type: 'core' },
                { code: 'EC204', name: 'Microprocessors', type: 'core' },
                { code: 'EC205', name: 'VLSI Design', type: 'department_elective' }
            ]
        };

        // Create courses for each department in both colleges
        const allDepts = [...nmamitDepts, ...nmitDepts];

        for (const dept of allDepts) {
            const courses = departmentCourses[dept.code!];
            if (!courses) continue;

            await Promise.all(
                courses.map(course =>
                    prisma.course.create({
                        data: {
                            code: course.code,
                            name: course.name,
                            departmentId: dept.id,
                            type: course.type,
                            hasTheoryComponent: true,
                            hasLabComponent: course.code.endsWith('L')
                        }
                    })
                )
            );
        }

        console.log('Creating sections...');
        const deptSectionMapping: Record<string, string[]> = {
            'CS': ['A', 'B', 'C'],
            'IS': ['D', 'E', 'F'],
            'ME': ['G', 'H', 'I'],
            'CE': ['J', 'K', 'L'],
            'EC': ['M', 'N', 'O']
        };

        type DeptWithSections = {
            dept: Department;
            sections: { section_id: string; section_name: string; department_id: string; }[];
        };

        const deptSections: DeptWithSections[] = [];

        for (const dept of allDepts) {
            if (!dept.code || !deptSectionMapping[dept.code]) continue;

            const sections = await Promise.all(
                deptSectionMapping[dept.code].map(name =>
                    prisma.sections.create({
                        data: {
                            section_name: name,
                            department_id: dept.id
                        }
                    })
                )
            );
            deptSections.push({ dept, sections });
        }

        console.log('Creating teachers...');
        const teachersByCollege: { nmamit: any[]; nmit: any[] } = { nmamit: [], nmit: [] };

        for (const { dept, sections } of deptSections) {
            const isNMAMIT = nmamitDepts.includes(dept);
            const college = isNMAMIT ? nmamit : nmit;
            const prefix = college.code;

            for (let i = 1; i <= 3; i++) {
                const username = `${prefix.toLowerCase()}_${dept.code}_t${i}`;
                const passwordHash = await hash('teacher123', 10);

                const teacher = await prisma.user.create({
                    data: {
                        username,
                        name: `${dept.code} Teacher ${i}`,
                        email: `${username.toLowerCase()}@example.com`,
                        passwordHash,
                        userRoles: {
                            create: {
                                role: 'teacher'
                            }
                        },
                        teacher: {
                            create: {
                                college_id: college.id,
                                departmentId: dept.id
                            }
                        }
                    }
                });

                if (isNMAMIT) {
                    teachersByCollege.nmamit.push(teacher);
                } else {
                    teachersByCollege.nmit.push(teacher);
                }
            }
        }

        console.log('Creating students...');
        const studentsByCollege: { nmamit: any[]; nmit: any[] } = { nmamit: [], nmit: [] };

        for (const { dept, sections } of deptSections) {
            const isNMAMIT = nmamitDepts.includes(dept);
            const college = isNMAMIT ? nmamit : nmit;
            const prefix = isNMAMIT ? 'NNM' : 'NMI';

            for (const section of sections) {
                for (let i = 1; i <= 5; i++) {
                    const usn = `${prefix}23${dept.code}${section.section_name}${String(i).padStart(2, '0')}`;
                    const passwordHash = await hash('student123', 10);

                    const student = await prisma.user.create({
                        data: {
                            username: usn,
                            name: `Student ${usn}`,
                            email: `${usn.toLowerCase()}@example.com`,
                            passwordHash,
                            userRoles: {
                                create: {
                                    role: 'student'
                                }
                            },
                            student: {
                                create: {
                                    usn,
                                    semester: 3,
                                    batchYear: 2023,
                                    college_id: college.id,
                                    department_id: dept.id,
                                    section_id: section.section_id
                                }
                            }
                        }
                    });

                    if (isNMAMIT) {
                        studentsByCollege.nmamit.push(student);
                    } else {
                        studentsByCollege.nmit.push(student);
                    }
                }
            }
        }

        console.log('Creating admin user...');
        const adminPasswordHash = await hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                name: 'System Admin',
                email: 'admin@example.com',
                passwordHash: adminPasswordHash,
                userRoles: {
                    create: {
                        role: 'admin'
                    }
                },
                admin: {
                    create: {}
                }
            }
        });

        console.log('Seed completed successfully');
        console.log('--------------------');
        console.log('Summary:');
        console.log(`NMAMIT Teachers: ${teachersByCollege.nmamit.length}`);
        console.log(`NMIT Teachers: ${teachersByCollege.nmit.length}`);
        console.log(`NMAMIT Students: ${studentsByCollege.nmamit.length}`);
        console.log(`NMIT Students: ${studentsByCollege.nmit.length}`);
        console.log('--------------------');
    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
