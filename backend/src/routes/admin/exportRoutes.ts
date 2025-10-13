// src/routes/admin/exportRoutes.ts
import { Router, Request, Response } from 'express';
import DatabaseService from '../../lib/database';
import XLSX from 'xlsx';
import archiver from 'archiver';

const router = Router();
const prisma = DatabaseService.getInstance();

console.log('=== ADMIN EXPORT ROUTES LOADED ===');

// Get all academic years
router.get('/academic-years', async (req: Request, res: Response) => {
    try {
        const academicYears = await prisma.academic_years.findMany({
            include: {
                colleges: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                start_date: 'desc'
            }
        });

        res.json(academicYears);
    } catch (error: any) {
        console.error('Failed to fetch academic years:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export data for a specific academic year
router.get('/export-academic-year/:yearId', async (req: Request, res: Response) => {
    try {
        const { yearId } = req.params;

        // Get the academic year details
        const academicYear = await prisma.academic_years.findUnique({
            where: { year_id: yearId },
            include: {
                colleges: true
            }
        });

        if (!academicYear) {
            return res.status(404).json({
                success: false,
                error: 'Academic year not found'
            });
        }

        const collegeId = academicYear.college_id;

        // Fetch all related data
        const [
            colleges,
            departments,
            sections,
            courses,
            students,
            teachers,
            users,
            academicYears,
            courseOfferings,
            attendanceRecords
        ] = await Promise.all([
            // Colleges - just this college
            prisma.college.findMany({
                where: { id: collegeId },
                select: {
                    code: true,
                    name: true
                }
            }),

            // Departments for this college
            prisma.department.findMany({
                where: { college_id: collegeId },
                include: {
                    colleges: {
                        select: { code: true }
                    }
                }
            }),

            // Sections for this college's departments
            prisma.sections.findMany({
                where: {
                    departments: {
                        college_id: collegeId
                    }
                },
                include: {
                    departments: {
                        select: {
                            code: true,
                            colleges: {
                                select: { code: true }
                            }
                        }
                    }
                }
            }),

            // Courses for this college
            prisma.course.findMany({
                where: {
                    department: {
                        college_id: collegeId
                    }
                },
                include: {
                    department: {
                        select: {
                            code: true,
                            colleges: {
                                select: { code: true }
                            }
                        }
                    }
                }
            }),

            // Students for this college
            prisma.student.findMany({
                where: { college_id: collegeId },
                include: {
                    user: {
                        select: { username: true }
                    },
                    colleges: {
                        select: { code: true }
                    },
                    departments: {
                        select: { code: true }
                    },
                    sections: {
                        select: { section_name: true }
                    }
                }
            }),

            // Teachers for this college
            prisma.teacher.findMany({
                where: { college_id: collegeId },
                include: {
                    user: {
                        select: { username: true }
                    },
                    colleges: {
                        select: { code: true }
                    },
                    department: {
                        select: { code: true }
                    }
                }
            }),

            // Users (students and teachers from this college)
            prisma.user.findMany({
                where: {
                    OR: [
                        {
                            student: {
                                college_id: collegeId
                            }
                        },
                        {
                            teacher: {
                                college_id: collegeId
                            }
                        }
                    ]
                },
                include: {
                    userRoles: true
                }
            }),

            // Academic years for this college
            prisma.academic_years.findMany({
                where: { college_id: collegeId },
                include: {
                    colleges: {
                        select: { code: true }
                    }
                }
            }),

            // Course offerings for this academic year
            prisma.courseOffering.findMany({
                where: { year_id: yearId },
                include: {
                    course: {
                        include: {
                            department: {
                                include: {
                                    colleges: {
                                        select: { code: true }
                                    }
                                }
                            }
                        }
                    },
                    sections: {
                        select: {
                            section_name: true
                        }
                    },
                    teacher: {
                        include: {
                            user: {
                                select: { username: true }
                            }
                        }
                    }
                }
            }),

            // Attendance records for this academic year
            prisma.attendanceRecord.findMany({
                where: {
                    attendance: {
                        offering: {
                            year_id: yearId
                        }
                    }
                },
                include: {
                    student: {
                        include: {
                            user: {
                                select: { username: true }
                            }
                        }
                    },
                    attendance: {
                        include: {
                            offering: {
                                include: {
                                    course: {
                                        select: { code: true }
                                    },
                                    sections: {
                                        select: { section_name: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Create Excel workbooks
        const workbooks: { [key: string]: XLSX.WorkBook } = {};

        // 1. Colleges
        workbooks['colleges'] = XLSX.utils.book_new();
        const collegesData = colleges.map(c => ({
            code: c.code,
            name: c.name
        }));
        XLSX.utils.book_append_sheet(workbooks['colleges'], XLSX.utils.json_to_sheet(collegesData), 'Colleges');

        // 2. Departments
        workbooks['departments'] = XLSX.utils.book_new();
        const departmentsData = departments.map(d => ({
            college_code: d.colleges.code,
            code: d.code,
            name: d.name
        }));
        XLSX.utils.book_append_sheet(workbooks['departments'], XLSX.utils.json_to_sheet(departmentsData), 'Departments');

        // 3. Sections
        workbooks['sections'] = XLSX.utils.book_new();
        const sectionsData = sections.map(s => ({
            college_code: s.departments.colleges.code,
            department_code: s.departments.code,
            section_name: s.section_name
        }));
        XLSX.utils.book_append_sheet(workbooks['sections'], XLSX.utils.json_to_sheet(sectionsData), 'Sections');

        // 4. Users
        workbooks['users'] = XLSX.utils.book_new();
        const usersData = users.map(u => ({
            username: u.username,
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            role: u.userRoles[0]?.role || 'student'
        }));
        XLSX.utils.book_append_sheet(workbooks['users'], XLSX.utils.json_to_sheet(usersData), 'Users');

        // 5. Students
        workbooks['students'] = XLSX.utils.book_new();
        const studentsData = students.map(s => ({
            usn: s.usn,
            college_code: s.colleges.code,
            department_code: s.departments?.code || '',
            section: s.sections?.section_name || '',
            semester: s.semester || 1,
            batch_year: s.batchYear
        }));
        XLSX.utils.book_append_sheet(workbooks['students'], XLSX.utils.json_to_sheet(studentsData), 'Students');

        // 6. Teachers
        workbooks['teachers'] = XLSX.utils.book_new();
        const teachersData = teachers.map(t => ({
            username: t.user.username,
            college_code: t.colleges.code,
            department_code: t.department?.code || ''
        }));
        XLSX.utils.book_append_sheet(workbooks['teachers'], XLSX.utils.json_to_sheet(teachersData), 'Teachers');

        // 7. Courses
        workbooks['courses'] = XLSX.utils.book_new();
        const coursesData = courses.map(c => ({
            college_code: c.department.colleges.code,
            department_code: c.department.code,
            code: c.code,
            name: c.name,
            type: c.type,
            year: c.year,
            has_theory: c.hasTheoryComponent,
            has_lab: c.hasLabComponent
        }));
        XLSX.utils.book_append_sheet(workbooks['courses'], XLSX.utils.json_to_sheet(coursesData), 'Courses');

        // 8. Academic Years
        workbooks['academic_years'] = XLSX.utils.book_new();
        const academicYearsData = academicYears.map(ay => ({
            college_code: ay.colleges.code,
            year_name: ay.year_name,
            start_date: ay.start_date ? new Date(ay.start_date).toISOString().split('T')[0] : '',
            end_date: ay.end_date ? new Date(ay.end_date).toISOString().split('T')[0] : ''
        }));
        XLSX.utils.book_append_sheet(workbooks['academic_years'], XLSX.utils.json_to_sheet(academicYearsData), 'Academic Years');

        // 9. Course Offerings
        workbooks['course_offerings'] = XLSX.utils.book_new();
        const offeringsData = courseOfferings.map(co => ({
            course_code: co.course.code,
            teacher_username: co.teacher?.user.username || '',
            section_name: co.sections?.section_name || '',
            semester: co.semester,
            year_name: academicYear.year_name
        }));
        XLSX.utils.book_append_sheet(workbooks['course_offerings'], XLSX.utils.json_to_sheet(offeringsData), 'Course Offerings');

        // 10. Attendance Records
        workbooks['attendance_records'] = XLSX.utils.book_new();
        const attendanceData = attendanceRecords.map(ar => ({
            student_usn: ar.student?.user.username || '',
            course_code: ar.attendance?.offering?.course.code || '',
            section_name: ar.attendance?.offering?.sections?.section_name || '',
            class_date: ar.attendance?.classDate ? new Date(ar.attendance.classDate).toISOString().split('T')[0] : '',
            period_number: ar.attendance?.periodNumber || '',
            status: ar.status,
            syllabus_covered: ar.attendance?.syllabusCovered || ''
        }));
        XLSX.utils.book_append_sheet(workbooks['attendance_records'], XLSX.utils.json_to_sheet(attendanceData), 'Attendance Records');

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Set response headers
        const filename = `academic-year-${academicYear.year_name.replace(/\//g, '-')}-${Date.now()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe archive to response
        archive.pipe(res);

        // Add each Excel file to the archive
        for (const [name, workbook] of Object.entries(workbooks)) {
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            archive.append(buffer, { name: `${name}.xlsx` });
        }

        // Add a README file
        const readme = `Academic Year Data Export
========================

Academic Year: ${academicYear.year_name}
College: ${academicYear.colleges.name}
Export Date: ${new Date().toISOString()}

Files Included:
- colleges.xlsx: College information
- departments.xlsx: Department details
- sections.xlsx: Class sections
- users.xlsx: All users (students, teachers, admins)
- students.xlsx: Student enrollment data
- teachers.xlsx: Teacher assignments
- courses.xlsx: Course catalog
- academic_years.xlsx: Academic year information
- course_offerings.xlsx: Course-section-teacher assignments for this year
- attendance_records.xlsx: Complete attendance history for this year

How to Use:
1. Extract all files from this ZIP
2. Modify the data as needed for your new academic year
3. Use the Excel Import tab in the admin dashboard to reimport base data
4. Follow the import order: colleges → departments → sections → users → students/teachers → courses → academic_years
5. Note: Attendance data is for archival/reference - cannot be reimported directly

Attendance Data:
- The attendance_records.xlsx contains the complete attendance history
- Includes student USN, course code, date, period, status, and syllabus covered
- This is a read-only export for record keeping and analysis
- ${attendanceRecords.length} attendance records exported

Note: All users in the users.xlsx file will be created with the default password: password123
`;
        archive.append(readme, { name: 'README.txt' });

        // Finalize the archive
        await archive.finalize();

    } catch (error: any) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// Export complete database backup
router.get('/export-all-data', async (req: Request, res: Response) => {
    try {
        // Fetch all data
        const [
            colleges,
            departments,
            sections,
            courses,
            students,
            teachers,
            users,
            academicYears,
            courseOfferings,
            attendanceRecords
        ] = await Promise.all([
            prisma.college.findMany({
                select: {
                    code: true,
                    name: true
                }
            }),

            prisma.department.findMany({
                include: {
                    colleges: {
                        select: { code: true }
                    }
                }
            }),

            prisma.sections.findMany({
                include: {
                    departments: {
                        select: {
                            code: true,
                            colleges: {
                                select: { code: true }
                            }
                        }
                    }
                }
            }),

            prisma.course.findMany({
                include: {
                    department: {
                        select: {
                            code: true,
                            colleges: {
                                select: { code: true }
                            }
                        }
                    }
                }
            }),

            prisma.student.findMany({
                include: {
                    user: {
                        select: { username: true }
                    },
                    colleges: {
                        select: { code: true }
                    },
                    departments: {
                        select: { code: true }
                    },
                    sections: {
                        select: { section_name: true }
                    }
                }
            }),

            prisma.teacher.findMany({
                include: {
                    user: {
                        select: { username: true }
                    },
                    colleges: {
                        select: { code: true }
                    },
                    department: {
                        select: { code: true }
                    }
                }
            }),

            prisma.user.findMany({
                include: {
                    userRoles: true
                }
            }),

            prisma.academic_years.findMany({
                include: {
                    colleges: {
                        select: { code: true }
                    }
                }
            }),

            // All course offerings
            prisma.courseOffering.findMany({
                include: {
                    course: {
                        select: { code: true }
                    },
                    sections: {
                        select: { section_name: true }
                    },
                    teacher: {
                        include: {
                            user: {
                                select: { username: true }
                            }
                        }
                    },
                    academic_years: {
                        select: { year_name: true }
                    }
                }
            }),

            // All attendance records
            prisma.attendanceRecord.findMany({
                include: {
                    student: {
                        include: {
                            user: {
                                select: { username: true }
                            }
                        }
                    },
                    attendance: {
                        include: {
                            offering: {
                                include: {
                                    course: {
                                        select: { code: true }
                                    },
                                    sections: {
                                        select: { section_name: true }
                                    },
                                    academic_years: {
                                        select: { year_name: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Create Excel workbooks
        const workbooks: { [key: string]: XLSX.WorkBook } = {};

        // 1. Colleges
        workbooks['colleges'] = XLSX.utils.book_new();
        const collegesData = colleges.map(c => ({
            code: c.code,
            name: c.name
        }));
        XLSX.utils.book_append_sheet(workbooks['colleges'], XLSX.utils.json_to_sheet(collegesData), 'Colleges');

        // 2. Departments
        workbooks['departments'] = XLSX.utils.book_new();
        const departmentsData = departments.map(d => ({
            college_code: d.colleges.code,
            code: d.code,
            name: d.name
        }));
        XLSX.utils.book_append_sheet(workbooks['departments'], XLSX.utils.json_to_sheet(departmentsData), 'Departments');

        // 3. Sections
        workbooks['sections'] = XLSX.utils.book_new();
        const sectionsData = sections.map(s => ({
            college_code: s.departments.colleges.code,
            department_code: s.departments.code,
            section_name: s.section_name
        }));
        XLSX.utils.book_append_sheet(workbooks['sections'], XLSX.utils.json_to_sheet(sectionsData), 'Sections');

        // 4. Users
        workbooks['users'] = XLSX.utils.book_new();
        const usersData = users.map(u => ({
            username: u.username,
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            role: u.userRoles[0]?.role || 'student'
        }));
        XLSX.utils.book_append_sheet(workbooks['users'], XLSX.utils.json_to_sheet(usersData), 'Users');

        // 5. Students
        workbooks['students'] = XLSX.utils.book_new();
        const studentsData = students.map(s => ({
            usn: s.usn,
            college_code: s.colleges.code,
            department_code: s.departments?.code || '',
            section: s.sections?.section_name || '',
            semester: s.semester || 1,
            batch_year: s.batchYear
        }));
        XLSX.utils.book_append_sheet(workbooks['students'], XLSX.utils.json_to_sheet(studentsData), 'Students');

        // 6. Teachers
        workbooks['teachers'] = XLSX.utils.book_new();
        const teachersData = teachers.map(t => ({
            username: t.user.username,
            college_code: t.colleges.code,
            department_code: t.department?.code || ''
        }));
        XLSX.utils.book_append_sheet(workbooks['teachers'], XLSX.utils.json_to_sheet(teachersData), 'Teachers');

        // 7. Courses
        workbooks['courses'] = XLSX.utils.book_new();
        const coursesData = courses.map(c => ({
            college_code: c.department.colleges.code,
            department_code: c.department.code,
            code: c.code,
            name: c.name,
            type: c.type,
            year: c.year,
            has_theory: c.hasTheoryComponent,
            has_lab: c.hasLabComponent
        }));
        XLSX.utils.book_append_sheet(workbooks['courses'], XLSX.utils.json_to_sheet(coursesData), 'Courses');

        // 8. Academic Years
        workbooks['academic_years'] = XLSX.utils.book_new();
        const academicYearsData = academicYears.map(ay => ({
            college_code: ay.colleges.code,
            year_name: ay.year_name,
            start_date: ay.start_date ? new Date(ay.start_date).toISOString().split('T')[0] : '',
            end_date: ay.end_date ? new Date(ay.end_date).toISOString().split('T')[0] : ''
        }));
        XLSX.utils.book_append_sheet(workbooks['academic_years'], XLSX.utils.json_to_sheet(academicYearsData), 'Academic Years');

        // 9. Course Offerings
        workbooks['course_offerings'] = XLSX.utils.book_new();
        const offeringsDataAll = courseOfferings.map(co => ({
            course_code: co.course.code,
            teacher_username: co.teacher?.user.username || '',
            section_name: co.sections?.section_name || '',
            semester: co.semester,
            year_name: co.academic_years?.year_name || ''
        }));
        XLSX.utils.book_append_sheet(workbooks['course_offerings'], XLSX.utils.json_to_sheet(offeringsDataAll), 'Course Offerings');

        // 10. Attendance Records
        workbooks['attendance_records'] = XLSX.utils.book_new();
        const attendanceDataAll = attendanceRecords.map(ar => ({
            student_usn: ar.student?.user.username || '',
            course_code: ar.attendance?.offering?.course.code || '',
            section_name: ar.attendance?.offering?.sections?.section_name || '',
            academic_year: ar.attendance?.offering?.academic_years?.year_name || '',
            class_date: ar.attendance?.classDate ? new Date(ar.attendance.classDate).toISOString().split('T')[0] : '',
            period_number: ar.attendance?.periodNumber || '',
            status: ar.status,
            syllabus_covered: ar.attendance?.syllabusCovered || ''
        }));
        XLSX.utils.book_append_sheet(workbooks['attendance_records'], XLSX.utils.json_to_sheet(attendanceDataAll), 'Attendance Records');

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Set response headers
        const filename = `complete-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe archive to response
        archive.pipe(res);

        // Add each Excel file to the archive
        for (const [name, workbook] of Object.entries(workbooks)) {
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            archive.append(buffer, { name: `${name}.xlsx` });
        }

        // Add a README file
        const readme = `Complete Database Backup
========================

Export Date: ${new Date().toISOString()}
Total Colleges: ${colleges.length}
Total Departments: ${departments.length}
Total Students: ${students.length}
Total Teachers: ${teachers.length}
Total Courses: ${courses.length}
Total Course Offerings: ${courseOfferings.length}
Total Attendance Records: ${attendanceRecords.length}

Files Included:
- colleges.xlsx: All college information
- departments.xlsx: All department details
- sections.xlsx: All class sections
- users.xlsx: All users (students, teachers, admins)
- students.xlsx: All student enrollment data
- teachers.xlsx: All teacher assignments
- courses.xlsx: Complete course catalog
- academic_years.xlsx: All academic year information
- course_offerings.xlsx: All course-section-teacher assignments
- attendance_records.xlsx: Complete attendance history

How to Use:
1. Extract all files from this ZIP
2. This is a complete backup of your database
3. Use the Excel Import tab in the admin dashboard to restore to a new database
4. Follow the import order: colleges → departments → sections → users → students/teachers → courses → academic_years

Attendance Data:
- The attendance_records.xlsx file contains the complete historical attendance data
- This is for archival and reference purposes only
- Attendance data cannot be re-imported but serves as a permanent record
- Use this for compliance, analysis, and historical reference

Note: All users will be created with the default password: password123
`;
        archive.append(readme, { name: 'README.txt' });

        // Finalize the archive
        await archive.finalize();

    } catch (error: any) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

export default router;
