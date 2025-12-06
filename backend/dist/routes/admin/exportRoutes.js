"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin/exportRoutes.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../../lib/database"));
const xlsx_1 = __importDefault(require("xlsx"));
const archiver_1 = __importDefault(require("archiver"));
const router = (0, express_1.Router)();
const prisma = database_1.default.getInstance();
console.log('=== ADMIN EXPORT ROUTES LOADED ===');
// Get all academic years
router.get('/academic-years', async (req, res) => {
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
    }
    catch (error) {
        console.error('Failed to fetch academic years:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Export data for a specific academic year
router.get('/export-academic-year/:yearId', async (req, res) => {
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
        const [colleges, departments, sections, courses, students, teachers, users, academicYears, courseOfferings, attendanceRecords, testComponents, studentMarks] = await Promise.all([
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
            }),
            // Test components for this academic year
            prisma.testComponent.findMany({
                where: {
                    courseOffering: {
                        year_id: yearId
                    }
                },
                include: {
                    courseOffering: {
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
            }),
            // Student marks for this academic year
            prisma.studentMark.findMany({
                where: {
                    testComponent: {
                        courseOffering: {
                            year_id: yearId
                        }
                    }
                },
                include: {
                    testComponent: {
                        include: {
                            courseOffering: {
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
                    },
                    enrollment: {
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: { username: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);
        // Create Excel workbooks
        const workbooks = {};
        // 1. Colleges
        workbooks['colleges'] = xlsx_1.default.utils.book_new();
        const collegesData = colleges.map(c => ({
            code: c.code,
            name: c.name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['colleges'], xlsx_1.default.utils.json_to_sheet(collegesData), 'Colleges');
        // 2. Departments
        workbooks['departments'] = xlsx_1.default.utils.book_new();
        const departmentsData = departments.map(d => ({
            college_code: d.colleges.code,
            code: d.code,
            name: d.name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['departments'], xlsx_1.default.utils.json_to_sheet(departmentsData), 'Departments');
        // 3. Sections
        workbooks['sections'] = xlsx_1.default.utils.book_new();
        const sectionsData = sections.map(s => ({
            college_code: s.departments.colleges.code,
            department_code: s.departments.code,
            section_name: s.section_name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['sections'], xlsx_1.default.utils.json_to_sheet(sectionsData), 'Sections');
        // 4. Users
        workbooks['users'] = xlsx_1.default.utils.book_new();
        const usersData = users.map(u => ({
            username: u.username,
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            role: u.userRoles[0]?.role || 'student'
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['users'], xlsx_1.default.utils.json_to_sheet(usersData), 'Users');
        // 5. Students
        workbooks['students'] = xlsx_1.default.utils.book_new();
        const studentsData = students.map(s => ({
            usn: s.usn,
            college_code: s.colleges.code,
            department_code: s.departments?.code || '',
            section: s.sections?.section_name || '',
            semester: s.semester || 1,
            batch_year: s.batchYear
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['students'], xlsx_1.default.utils.json_to_sheet(studentsData), 'Students');
        // 6. Teachers
        workbooks['teachers'] = xlsx_1.default.utils.book_new();
        const teachersData = teachers.map(t => ({
            username: t.user.username,
            college_code: t.colleges.code,
            department_code: t.department?.code || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['teachers'], xlsx_1.default.utils.json_to_sheet(teachersData), 'Teachers');
        // 7. Courses
        workbooks['courses'] = xlsx_1.default.utils.book_new();
        const coursesData = courses.map(c => ({
            college_code: c.department.colleges.code,
            department_code: c.department.code,
            code: c.code,
            name: c.name,
            type: c.type,
            year: c.year
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['courses'], xlsx_1.default.utils.json_to_sheet(coursesData), 'Courses');
        // 8. Academic Years
        workbooks['academic_years'] = xlsx_1.default.utils.book_new();
        const academicYearsData = academicYears.map(ay => ({
            college_code: ay.colleges.code,
            year_name: ay.year_name,
            start_date: ay.start_date ? new Date(ay.start_date).toISOString().split('T')[0] : '',
            end_date: ay.end_date ? new Date(ay.end_date).toISOString().split('T')[0] : ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['academic_years'], xlsx_1.default.utils.json_to_sheet(academicYearsData), 'Academic Years');
        // 9. Course Offerings
        workbooks['course_offerings'] = xlsx_1.default.utils.book_new();
        const offeringsData = courseOfferings.map(co => ({
            course_code: co.course.code,
            teacher_username: co.teacher?.user.username || '',
            section_name: co.sections?.section_name || '',
            semester: co.semester,
            year_name: academicYear.year_name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['course_offerings'], xlsx_1.default.utils.json_to_sheet(offeringsData), 'Course Offerings');
        // 10. Attendance Records
        workbooks['attendance_records'] = xlsx_1.default.utils.book_new();
        const attendanceData = attendanceRecords.map(ar => ({
            student_usn: ar.student?.user.username || '',
            course_code: ar.attendance?.offering?.course.code || '',
            section_name: ar.attendance?.offering?.sections?.section_name || '',
            class_date: ar.attendance?.classDate ? new Date(ar.attendance.classDate).toISOString().split('T')[0] : '',
            period_number: ar.attendance?.periodNumber || '',
            status: ar.status,
            syllabus_covered: ar.attendance?.syllabusCovered || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['attendance_records'], xlsx_1.default.utils.json_to_sheet(attendanceData), 'Attendance Records');
        // 11. Test Components
        workbooks['test_components'] = xlsx_1.default.utils.book_new();
        const testComponentsData = testComponents.map(tc => ({
            course_code: tc.courseOffering?.course.code || '',
            section_name: tc.courseOffering?.sections?.section_name || '',
            component_name: tc.name,
            type: tc.type,
            max_marks: tc.maxMarks,
            weightage: tc.weightage
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['test_components'], xlsx_1.default.utils.json_to_sheet(testComponentsData), 'Test Components');
        // 12. Student Marks
        workbooks['student_marks'] = xlsx_1.default.utils.book_new();
        const studentMarksData = studentMarks.map(sm => ({
            student_usn: sm.enrollment?.student?.user.username || '',
            course_code: sm.testComponent?.courseOffering?.course.code || '',
            section_name: sm.testComponent?.courseOffering?.sections?.section_name || '',
            test_component: sm.testComponent?.name || '',
            type: sm.testComponent?.type || '',
            marks_obtained: sm.marksObtained ?? '',
            max_marks: sm.testComponent?.maxMarks || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['student_marks'], xlsx_1.default.utils.json_to_sheet(studentMarksData), 'Student Marks');
        // Create ZIP archive
        const archive = (0, archiver_1.default)('zip', {
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
            const buffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
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
- test_components.xlsx: Test component definitions (MSE, assignments, lab tests, etc.)
- student_marks.xlsx: All student marks for this academic year

How to Use:
1. Extract all files from this ZIP
2. Modify the data as needed for your new academic year
3. Use the Excel Import tab in the admin dashboard to reimport base data
4. Follow the import order: colleges → departments → sections → users → students/teachers → courses → academic_years
5. Note: Attendance and marks data are for archival/reference

Attendance Data:
- The attendance_records.xlsx contains the complete attendance history
- Includes student USN, course code, date, period, status, and syllabus covered
- This is a read-only export for record keeping and analysis
- ${attendanceRecords.length} attendance records exported

Marks Data:
- test_components.xlsx: Contains all test definitions (${testComponents.length} components)
  * Includes component name, type (theory/lab), max marks, and weightage
  * These define the assessment structure for courses
- student_marks.xlsx: Contains all student marks (${studentMarks.length} mark entries)
  * Links students to test components with marks obtained
  * This is a read-only export for archival and analysis
  * Cannot be re-imported directly but serves as permanent record

Note: All users in the users.xlsx file will be created with the default password: password123
`;
        archive.append(readme, { name: 'README.txt' });
        // Finalize the archive
        await archive.finalize();
    }
    catch (error) {
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
router.get('/export-all-data', async (req, res) => {
    try {
        // Fetch all data
        const [colleges, departments, sections, courses, students, teachers, users, academicYears, courseOfferings, attendanceRecords, testComponents, studentMarks] = await Promise.all([
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
            }),
            // All test components
            prisma.testComponent.findMany({
                include: {
                    courseOffering: {
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
            }),
            // All student marks
            prisma.studentMark.findMany({
                include: {
                    testComponent: {
                        include: {
                            courseOffering: {
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
                    },
                    enrollment: {
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: { username: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);
        // Create Excel workbooks
        const workbooks = {};
        // 1. Colleges
        workbooks['colleges'] = xlsx_1.default.utils.book_new();
        const collegesData = colleges.map(c => ({
            code: c.code,
            name: c.name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['colleges'], xlsx_1.default.utils.json_to_sheet(collegesData), 'Colleges');
        // 2. Departments
        workbooks['departments'] = xlsx_1.default.utils.book_new();
        const departmentsData = departments.map(d => ({
            college_code: d.colleges.code,
            code: d.code,
            name: d.name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['departments'], xlsx_1.default.utils.json_to_sheet(departmentsData), 'Departments');
        // 3. Sections
        workbooks['sections'] = xlsx_1.default.utils.book_new();
        const sectionsData = sections.map(s => ({
            college_code: s.departments.colleges.code,
            department_code: s.departments.code,
            section_name: s.section_name
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['sections'], xlsx_1.default.utils.json_to_sheet(sectionsData), 'Sections');
        // 4. Users
        workbooks['users'] = xlsx_1.default.utils.book_new();
        const usersData = users.map(u => ({
            username: u.username,
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            role: u.userRoles[0]?.role || 'student'
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['users'], xlsx_1.default.utils.json_to_sheet(usersData), 'Users');
        // 5. Students
        workbooks['students'] = xlsx_1.default.utils.book_new();
        const studentsData = students.map(s => ({
            usn: s.usn,
            college_code: s.colleges.code,
            department_code: s.departments?.code || '',
            section: s.sections?.section_name || '',
            semester: s.semester || 1,
            batch_year: s.batchYear
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['students'], xlsx_1.default.utils.json_to_sheet(studentsData), 'Students');
        // 6. Teachers
        workbooks['teachers'] = xlsx_1.default.utils.book_new();
        const teachersData = teachers.map(t => ({
            username: t.user.username,
            college_code: t.colleges.code,
            department_code: t.department?.code || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['teachers'], xlsx_1.default.utils.json_to_sheet(teachersData), 'Teachers');
        // 7. Courses
        workbooks['courses'] = xlsx_1.default.utils.book_new();
        const coursesData = courses.map(c => ({
            college_code: c.department.colleges.code,
            department_code: c.department.code,
            code: c.code,
            name: c.name,
            type: c.type,
            year: c.year
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['courses'], xlsx_1.default.utils.json_to_sheet(coursesData), 'Courses');
        // 8. Academic Years
        workbooks['academic_years'] = xlsx_1.default.utils.book_new();
        const academicYearsData = academicYears.map(ay => ({
            college_code: ay.colleges.code,
            year_name: ay.year_name,
            start_date: ay.start_date ? new Date(ay.start_date).toISOString().split('T')[0] : '',
            end_date: ay.end_date ? new Date(ay.end_date).toISOString().split('T')[0] : ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['academic_years'], xlsx_1.default.utils.json_to_sheet(academicYearsData), 'Academic Years');
        // 9. Course Offerings
        workbooks['course_offerings'] = xlsx_1.default.utils.book_new();
        const offeringsDataAll = courseOfferings.map(co => ({
            course_code: co.course.code,
            teacher_username: co.teacher?.user.username || '',
            section_name: co.sections?.section_name || '',
            semester: co.semester,
            year_name: co.academic_years?.year_name || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['course_offerings'], xlsx_1.default.utils.json_to_sheet(offeringsDataAll), 'Course Offerings');
        // 10. Attendance Records
        workbooks['attendance_records'] = xlsx_1.default.utils.book_new();
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
        xlsx_1.default.utils.book_append_sheet(workbooks['attendance_records'], xlsx_1.default.utils.json_to_sheet(attendanceDataAll), 'Attendance Records');
        // 11. Test Components
        workbooks['test_components'] = xlsx_1.default.utils.book_new();
        const testComponentsDataAll = testComponents.map(tc => ({
            course_code: tc.courseOffering?.course.code || '',
            section_name: tc.courseOffering?.sections?.section_name || '',
            academic_year: tc.courseOffering?.academic_years?.year_name || '',
            component_name: tc.name,
            type: tc.type,
            max_marks: tc.maxMarks,
            weightage: tc.weightage
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['test_components'], xlsx_1.default.utils.json_to_sheet(testComponentsDataAll), 'Test Components');
        // 12. Student Marks
        workbooks['student_marks'] = xlsx_1.default.utils.book_new();
        const studentMarksDataAll = studentMarks.map(sm => ({
            student_usn: sm.enrollment?.student?.user.username || '',
            course_code: sm.testComponent?.courseOffering?.course.code || '',
            section_name: sm.testComponent?.courseOffering?.sections?.section_name || '',
            academic_year: sm.testComponent?.courseOffering?.academic_years?.year_name || '',
            test_component: sm.testComponent?.name || '',
            type: sm.testComponent?.type || '',
            marks_obtained: sm.marksObtained ?? '',
            max_marks: sm.testComponent?.maxMarks || ''
        }));
        xlsx_1.default.utils.book_append_sheet(workbooks['student_marks'], xlsx_1.default.utils.json_to_sheet(studentMarksDataAll), 'Student Marks');
        // Create ZIP archive
        const archive = (0, archiver_1.default)('zip', {
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
            const buffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
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
Total Test Components: ${testComponents.length}
Total Student Marks: ${studentMarks.length}

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
- test_components.xlsx: All test component definitions (MSE, assignments, labs, etc.)
- student_marks.xlsx: All student marks across all years

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

Marks Data (NEW - Dynamic Schema):
- test_components.xlsx: Complete test assessment structure
  * Contains all test definitions with name, type (theory/lab), max marks, weightage
  * Defines the flexible assessment framework for each course offering
  * ${testComponents.length} test components across all courses and years
  
- student_marks.xlsx: Complete marks history
  * All student marks linked to test components
  * Includes student USN, course, section, academic year, test name, and marks
  * ${studentMarks.length} mark entries total
  * Read-only export for permanent records and analysis
  
Note: The new marks system uses dynamic test components, making it infinitely flexible!
Admins can define any test structure without code changes.

Note: All users will be created with the default password: password123
`;
        archive.append(readme, { name: 'README.txt' });
        // Finalize the archive
        await archive.finalize();
    }
    catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});
exports.default = router;
