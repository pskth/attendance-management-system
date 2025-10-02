import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import DatabaseService from '../src/services/database.service';

async function seed() {
    const db = DatabaseService.getInstance();
    const prisma = db.getPrisma();

    try {
        // Clean up existing data
        console.log('🧹 Cleaning up existing data...');
        await prisma.user.deleteMany();
        await prisma.college.deleteMany();

        // Create colleges
        console.log('🏫 Creating colleges...');
        const [nmamit, nmit] = await Promise.all([
            prisma.college.create({
                data: {
                    name: 'NMAM Institute of Technology',
                    code: 'NMAMIT',
                },
            }),
            prisma.college.create({
                data: {
                    name: 'Nitte Meenakshi Institute of Technology',
                    code: 'NMIT',
                },
            }),
        ]);

        // Create academic years for both colleges
        console.log('📅 Creating academic years...');
        const [nmamitYear, nmitYear] = await Promise.all([
            prisma.academic_years.create({
                data: {
                    college_id: nmamit.id,
                    year_name: '2024-25',
                    start_date: new Date('2024-06-01'),
                    end_date: new Date('2025-05-31'),
                    is_active: true,
                },
            }),
            prisma.academic_years.create({
                data: {
                    college_id: nmit.id,
                    year_name: '2024-25',
                    start_date: new Date('2024-06-01'),
                    end_date: new Date('2025-05-31'),
                    is_active: true,
                },
            })
        ]);

        // Create departments for both colleges
        console.log('🏢 Creating departments...');
        const departmentData = [
            { name: 'Computer Science and Engineering', code: 'CSE' },
            { name: 'Information Science and Engineering', code: 'ISE' },
            { name: 'Mechanical Engineering', code: 'ME' },
            { name: 'Civil Engineering', code: 'CE' },
            { name: 'Electronics and Communication Engineering', code: 'ECE' }
        ];

        const [nmamitDepts, nmitDepts] = await Promise.all([
            Promise.all(departmentData.map(dept =>
                prisma.department.create({
                    data: {
                        college_id: nmamit.id,
                        name: dept.name,
                        code: dept.code ?? '',
                    },
                })
            )),
            Promise.all(departmentData.map(dept =>
                prisma.department.create({
                    data: {
                        college_id: nmit.id,
                        name: dept.name,
                        code: dept.code ?? '',
                    },
                })
            ))
        ]);

        // Define course structure for departments
        type StudentTemplate = {
            name: string;
            usn: string;
            email: string;
            semester: number;
            batchYear: number;
        };

        type TeacherTemplate = {
            name: string;
            username: string;
            email: string;
        };

        type CourseTemplate = {
            code: string;
            name: string;
            type: 'core' | 'department_elective' | 'open_elective';
            hasTheoryComponent: boolean;
            hasLabComponent: boolean;
        };

        function generateStudentData(collegeCode: 'NNM' | 'NMI', deptCode: string, startingNumber: number, count: number): StudentTemplate[] {
            const indianNames = [
                "Aditya Sharma", "Priya Patel", "Rahul Kumar", "Ananya Reddy", "Arjun Singh",
                "Kavya Nair", "Rishi Verma", "Tanvi Desai", "Vivek Gupta", "Sneha Iyer",
                "Nikhil Menon", "Meera Krishnan", "Dev Malhotra", "Zara Shetty", "Aryan Joshi",
                "Ishita Kapoor", "Rohan Mehta", "Diya Choudhury", "Kabir Rao", "Anisha Mohan"
            ];

            return Array.from({ length: count }, (_, i) => {
                const name = indianNames[(startingNumber + i) % indianNames.length];
                const usn = `${collegeCode}23${deptCode}${String(startingNumber + i + 1).padStart(3, '0')}`;
                const email = `${usn.toLowerCase()}@example.com`;
                return {
                    name,
                    usn,
                    email,
                    semester: 3, // All students in 3rd semester
                    batchYear: 2023 // Students who joined in 2023
                };
            });
        }

        function generateTeacherData(collegeCode: 'NMAMIT' | 'NMIT', deptCode: string, count: number): TeacherTemplate[] {
            return Array.from({ length: count }, (_, i) => {
                const prefix = collegeCode === 'NMAMIT' ? 'nnm' : 'nmi';
                return {
                    name: `${deptCode} Teacher ${i + 1}`,
                    username: `${prefix}_${deptCode.toLowerCase()}_teacher${i + 1}`,
                    email: `${prefix}_${deptCode.toLowerCase()}_teacher${i + 1}@example.com`,
                };
            });
        }

        const courseData: Record<string, CourseTemplate[]> = {
            CSE: [
                {
                    code: 'CS3P01',
                    name: 'Data Structures and Algorithms',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'CS3P02',
                    name: 'Database Management Systems',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'CS3P03',
                    name: 'Machine Learning',
                    type: "department_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'CS3O01',
                    name: 'Python Programming',
                    type: "open_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                }
            ],
            ISE: [
                {
                    code: 'IS3P01',
                    name: 'Software Engineering',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: false,
                },
                {
                    code: 'IS3P02',
                    name: 'Web Technologies',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'IS3O01',
                    name: 'Cloud Computing',
                    type: "open_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: false,
                }
            ],
            ME: [
                {
                    code: 'ME3P01',
                    name: 'Engineering Mechanics',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'ME3O01',
                    name: 'Automobile Engineering',
                    type: "open_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: false,
                }
            ],
            CE: [
                {
                    code: 'CE3P01',
                    name: 'Structural Engineering',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'CE3O01',
                    name: 'Environmental Engineering',
                    type: "open_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: false,
                }
            ],
            ECE: [
                {
                    code: 'EC3P01',
                    name: 'Digital Electronics',
                    type: "core",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                },
                {
                    code: 'EC3O01',
                    name: 'Internet of Things',
                    type: "open_elective",
                    hasTheoryComponent: true,
                    hasLabComponent: true,
                }
            ]
        };

        // Create courses for both colleges
        console.log('📚 Creating courses...');
        const [nmamitCourses, nmitCourses] = await Promise.all([
            Promise.all(nmamitDepts.map((dept) =>
                Promise.all(courseData[dept.code as keyof typeof courseData].map((course: CourseTemplate) =>
                    prisma.course.create({
                        data: {
                            departmentId: dept.id,
                            ...course
                        }
                    })
                ))
            )).then(courses => courses.flat()),
            Promise.all(nmitDepts.map((dept) =>
                Promise.all(courseData[dept.code as keyof typeof courseData].map((course: CourseTemplate) =>
                    prisma.course.create({
                        data: {
                            departmentId: dept.id,
                            ...course
                        }
                    })
                ))
            )).then(courses => courses.flat())
        ]);

        // Create teachers for both colleges
        console.log('👩‍🏫 Creating teachers...');
        const [nmamitTeachers, nmitTeachers] = await Promise.all([
            Promise.all(nmamitDepts.map(async (dept) => {
                // Generate 3 teachers per department
                const teacherTemplates = generateTeacherData('NMAMIT', dept.code ?? 'UNKNOWN', 3);
                return Promise.all(teacherTemplates.map(async (teacher) => {
                    const passwordHash = await hash('teacher123', 10);
                    return prisma.user.create({
                        data: {
                            ...teacher,
                            passwordHash,
                            userRoles: {
                                create: {
                                    role: 'teacher',
                                },
                            },
                            teacher: {
                                create: {
                                    department: {
                                        connect: {
                                            id: dept.id
                                        }
                                    },
                                    colleges: {
                                        connect: {
                                            id: nmamit.id
                                        }
                                    }
                                }
                            }
                        },
                        include: {
                            teacher: true,
                            userRoles: true
                        }
                    });
                }));
            })).then(teachers => teachers.flat()),
            Promise.all(nmitDepts.map(async (dept) => {
                // Generate 3 teachers per department
                const teacherTemplates = generateTeacherData('NMIT', dept.code ?? 'UNKNOWN', 3);
                return Promise.all(teacherTemplates.map(async (teacher) => {
                    const passwordHash = await hash('teacher123', 10);
                    return prisma.user.create({
                        data: {
                            ...teacher,
                            passwordHash,
                            userRoles: {
                                create: {
                                    role: 'teacher',
                                },
                            },
                            teacher: {
                                create: {
                                    department: {
                                        connect: {
                                            id: dept.id
                                        }
                                    },
                                    colleges: {
                                        connect: {
                                            id: nmit.id
                                        }
                                    }
                                }
                            }
                        },
                        include: {
                            teacher: true,
                            userRoles: true
                        }
                    });
                }));
            })).then(teachers => teachers.flat())
        ]);

        // Create students for both colleges
        console.log('👨‍🎓 Creating students...');
        const [nmamitStudents, nmitStudents] = await Promise.all([
            Promise.all(nmamitDepts.map(async (dept, deptIndex) => {
                // Generate 5 students per department
                const studentTemplates = generateStudentData('NNM', dept.code ?? 'UNK', deptIndex * 5, 5);
                return Promise.all(studentTemplates.map(async (student) => {
                    const passwordHash = await hash('student123', 10);
                    return prisma.user.create({
                        data: {
                            name: student.name,
                            username: student.usn,
                            email: student.email,
                            passwordHash,
                            userRoles: {
                                create: {
                                    role: 'student',
                                },
                            },
                            student: {
                                create: {
                                    usn: student.usn,
                                    semester: student.semester,
                                    batchYear: student.batchYear,
                                    departments: {
                                        connect: {
                                            id: dept.id
                                        }
                                    },
                                    colleges: {
                                        connect: {
                                            id: nmamit.id
                                        }
                                    }
                                }
                            }
                        },
                        include: {
                            student: true,
                            userRoles: true
                        }
                    });
                }));
            })).then(students => students.flat()),
            Promise.all(nmitDepts.map(async (dept, deptIndex) => {
                // Generate 5 students per department
                const studentTemplates = generateStudentData('NMI', dept.code ?? 'UNK', deptIndex * 5, 5);
                return Promise.all(studentTemplates.map(async (student) => {
                    const passwordHash = await hash('student123', 10);
                    return prisma.user.create({
                        data: {
                            name: student.name,
                            username: student.usn,
                            email: student.email,
                            passwordHash,
                            userRoles: {
                                create: {
                                    role: 'student',
                                },
                            },
                            student: {
                                create: {
                                    usn: student.usn,
                                    semester: student.semester,
                                    batchYear: student.batchYear,
                                    departments: {
                                        connect: {
                                            id: dept.id
                                        }
                                    },
                                    colleges: {
                                        connect: {
                                            id: nmit.id
                                        }
                                    }
                                }
                            }
                        },
                        include: {
                            student: true,
                            userRoles: true
                        }
                    });
                }));
            })).then(students => students.flat())
        ]);

        // Create admin user
        const adminPasswordHash = await hash('admin123', 10);
        const adminUser = await prisma.user.create({
            data: {
                username: 'admin',
                passwordHash: adminPasswordHash,
                name: 'System Admin',
                email: 'admin@example.com',
                userRoles: {
                    create: {
                        role: 'admin',
                    },
                },
                admin: {
                    create: {},
                },
            },
        });

        console.log('✅ Seed data created successfully');
        console.log('Colleges:', [nmamit.name, nmit.name].join(', '));
        console.log('Academic Years:', [nmamitYear.year_name, nmitYear.year_name].join(', '));
        console.log('NMAMIT Departments:', nmamitDepts.map(d => d.name).join(', '));
        console.log('NMIT Departments:', nmitDepts.map(d => d.name).join(', '));
        console.log('NMAMIT Courses created:', nmamitCourses.length);
        console.log('NMIT Courses created:', nmitCourses.length);
        console.log('NMAMIT Teachers created:', nmamitTeachers.length);
        console.log('NMIT Teachers created:', nmitTeachers.length);
        console.log('NMAMIT Students created:', nmamitStudents.length);
        console.log('NMIT Students created:', nmitStudents.length);
        console.log('Admin User:', adminUser.username);

        return {
            colleges: { nmamit, nmit },
            academicYears: { nmamitYear, nmitYear },
            departments: { nmamitDepts, nmitDepts },
            courses: { nmamitCourses, nmitCourses },
            adminUser,
            teachers: { nmamitTeachers, nmitTeachers },
            students: { nmamitStudents, nmitStudents }
        };
    } catch (error) {
        console.error('Failed to seed database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();