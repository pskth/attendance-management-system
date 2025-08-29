"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
// src/services/importService.ts
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const autoEnrollmentService_1 = require("./autoEnrollmentService");
class ImportService {
    static importCSVData(table, buffer, prisma) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = [];
            const errors = [];
            console.log(`=== IMPORT CSV DATA CALLED ===`);
            console.log(`Starting import for table: ${table}`);
            console.log(`Buffer size: ${buffer.length}`);
            return new Promise((resolve) => {
                const stream = stream_1.Readable.from(buffer);
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (data) => {
                    console.log('CSV row parsed:', data);
                    records.push(data);
                })
                    .on('end', () => __awaiter(this, void 0, void 0, function* () {
                    console.log(`Parsed ${records.length} records from CSV`);
                    try {
                        let recordsProcessed = 0;
                        console.log(`Processing table: ${table.toLowerCase()}`);
                        console.log(`Available records: ${records.length}`);
                        switch (table.toLowerCase()) {
                            case 'colleges':
                                recordsProcessed = yield ImportService.importColleges(records, prisma, errors);
                                break;
                            case 'users':
                                recordsProcessed = yield ImportService.importUsers(records, prisma, errors);
                                break;
                            case 'departments':
                                recordsProcessed = yield ImportService.importDepartments(records, prisma, errors);
                                break;
                            case 'sections':
                                recordsProcessed = yield ImportService.importSections(records, prisma, errors);
                                break;
                            case 'students':
                                recordsProcessed = yield ImportService.importStudents(records, prisma, errors);
                                break;
                            case 'teachers':
                                recordsProcessed = yield ImportService.importTeachers(records, prisma, errors);
                                break;
                            case 'courses':
                                recordsProcessed = yield ImportService.importCourses(records, prisma, errors);
                                break;
                            case 'user_roles':
                                recordsProcessed = yield ImportService.importUserRoles(records, prisma, errors);
                                break;
                            case 'academic_years':
                                recordsProcessed = yield ImportService.importAcademicYears(records, prisma, errors);
                                break;
                            case 'course_offerings':
                                recordsProcessed = yield ImportService.importCourseOfferings(records, prisma, errors);
                                break;
                            case 'attendance':
                                recordsProcessed = yield ImportService.importAttendance(records, prisma, errors);
                                break;
                            case 'attendance_records':
                                recordsProcessed = yield ImportService.importAttendanceRecords(records, prisma, errors);
                                break;
                            case 'student_enrollments':
                                recordsProcessed = yield ImportService.importStudentEnrollments(records, prisma, errors);
                                break;
                            case 'theory_marks':
                                recordsProcessed = yield ImportService.importTheoryMarks(records, prisma, errors);
                                break;
                            case 'lab_marks':
                                recordsProcessed = yield ImportService.importLabMarks(records, prisma, errors);
                                break;
                            default:
                                errors.push(`Unknown table: ${table}`);
                        }
                        resolve({
                            success: errors.length === 0,
                            message: errors.length === 0 ? 'Import completed successfully' : 'Import completed with errors',
                            recordsProcessed,
                            errors
                        });
                    }
                    catch (error) {
                        resolve({
                            success: false,
                            message: error instanceof Error ? error.message : 'Import failed',
                            recordsProcessed: 0,
                            errors: [error instanceof Error ? error.message : 'Unknown error']
                        });
                    }
                }));
            });
        });
    }
    static importColleges(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    yield prisma.college.create({
                        data: {
                            name: record.college_name || record.name,
                            code: record.college_code || record.code,
                            logoUrl: record.logo_url || record.logoUrl || null
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`College ${record.college_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importUsers(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            console.log(`Importing ${records.length} user records...`);
            console.log('First record:', records[0]);
            for (const record of records) {
                try {
                    console.log('Processing user record:', record);
                    const userData = {
                        username: record.username,
                        passwordHash: record.password_hash || record.passwordHash,
                        name: record.name,
                        phone: record.phone || null
                    };
                    console.log('User data to create:', userData);
                    const result = yield prisma.user.create({
                        data: userData
                    });
                    console.log('Created user:', result);
                    count++;
                }
                catch (error) {
                    console.error('Error creating user:', error);
                    errors.push(`User ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            console.log(`Imported ${count} users`);
            return count;
        });
    }
    static importDepartments(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find college by code
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Department ${record.department_name}: College ${record.college_code} not found`);
                        continue;
                    }
                    yield prisma.department.create({
                        data: {
                            college_id: college.id,
                            name: record.department_name || record.name,
                            code: record.department_code || record.code
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Department ${record.department_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importSections(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find college first
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Section ${record.section_name}: College ${record.college_code} not found`);
                        continue;
                    }
                    // Find department by college_id and department_code
                    const department = yield prisma.department.findFirst({
                        where: {
                            code: record.department_code,
                            college_id: college.id
                        }
                    });
                    if (!department) {
                        errors.push(`Section ${record.section_name}: Department ${record.department_code} in college ${record.college_code} not found`);
                        continue;
                    }
                    yield prisma.sections.create({
                        data: {
                            department_id: department.id,
                            section_name: record.section_name
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Section ${record.section_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importStudents(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find user
                    const user = yield prisma.user.findUnique({
                        where: { username: record.username }
                    });
                    if (!user) {
                        errors.push(`Student ${record.username}: User not found`);
                        continue;
                    }
                    // Find college
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Student ${record.username}: College ${record.college_code} not found`);
                        continue;
                    }
                    // Find department
                    const department = yield prisma.department.findFirst({
                        where: {
                            code: record.department_code,
                            college_id: college.id
                        }
                    });
                    if (!department) {
                        errors.push(`Student ${record.username}: Department ${record.department_code} not found`);
                        continue;
                    }
                    // Find section
                    const section = yield prisma.sections.findFirst({
                        where: {
                            section_name: record.section_name,
                            department_id: department.id
                        }
                    });
                    if (!section) {
                        errors.push(`Student ${record.username}: Section ${record.section_name} not found`);
                        continue;
                    }
                    const createdStudent = yield prisma.student.create({
                        data: {
                            userId: user.id,
                            college_id: college.id,
                            department_id: department.id,
                            section_id: section.section_id,
                            usn: record.usn,
                            semester: parseInt(record.semester) || 1,
                            batchYear: parseInt(record.batch_year)
                        }
                    });
                    // Auto-enroll student in core courses for their department and semester
                    try {
                        const semester = parseInt(record.semester) || 1;
                        const enrollmentResult = yield (0, autoEnrollmentService_1.autoEnrollStudentForSemester)(createdStudent.id, semester);
                        console.log(`Auto-enrollment for imported student ${createdStudent.id} (semester ${semester}):`, enrollmentResult);
                    }
                    catch (enrollmentError) {
                        console.warn(`Failed to auto-enroll imported student ${createdStudent.id}:`, enrollmentError);
                        // Don't fail the import if auto-enrollment fails
                    }
                    count++;
                }
                catch (error) {
                    errors.push(`Student ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importTeachers(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find user
                    const user = yield prisma.user.findUnique({
                        where: { username: record.username }
                    });
                    if (!user) {
                        errors.push(`Teacher ${record.username}: User not found`);
                        continue;
                    }
                    // Find college
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Teacher ${record.username}: College ${record.college_code} not found`);
                        continue;
                    }
                    // Find department
                    const department = yield prisma.department.findFirst({
                        where: {
                            code: record.department_code,
                            college_id: college.id
                        }
                    });
                    if (!department) {
                        errors.push(`Teacher ${record.username}: Department ${record.department_code} not found`);
                        continue;
                    }
                    yield prisma.teacher.create({
                        data: {
                            userId: user.id,
                            college_id: college.id,
                            departmentId: department.id
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Teacher ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importCourses(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find college
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Course ${record.course_code}: College ${record.college_code} not found`);
                        continue;
                    }
                    // Find department (optional)
                    let department = null;
                    if (record.department_code) {
                        department = yield prisma.department.findFirst({
                            where: {
                                code: record.department_code,
                                college_id: college.id
                            }
                        });
                    }
                    yield prisma.course.create({
                        data: {
                            college_id: college.id,
                            code: record.course_code,
                            name: record.course_name,
                            departmentId: department === null || department === void 0 ? void 0 : department.id,
                            type: record.course_type || 'core',
                            hasTheoryComponent: ['true', 'TRUE', '1', 'yes', 'YES', true].includes(record.has_theory_component),
                            hasLabComponent: ['true', 'TRUE', '1', 'yes', 'YES', true].includes(record.has_lab_component)
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Course ${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importCourseOfferings(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find course
                    const course = yield prisma.course.findFirst({
                        where: { code: record.course_code }
                    });
                    if (!course) {
                        errors.push(`Course offering ${record.course_code}: Course not found`);
                        continue;
                    }
                    // Find academic year
                    const academicYear = yield prisma.academic_years.findFirst({
                        where: {
                            year_name: record.academic_year,
                            college_id: course.college_id
                        }
                    });
                    // Find section
                    const section = yield prisma.sections.findFirst({
                        where: {
                            section_name: record.section_name,
                            departments: {
                                code: record.section_dept_code,
                                college_id: course.college_id
                            }
                        }
                    });
                    // Find teacher
                    const teacher = yield prisma.teacher.findFirst({
                        where: {
                            user: {
                                username: record.teacher_username
                            },
                            college_id: course.college_id
                        }
                    });
                    yield prisma.courseOffering.create({
                        data: {
                            courseId: course.id,
                            year_id: academicYear === null || academicYear === void 0 ? void 0 : academicYear.year_id,
                            semester: parseInt(record.semester) || 1,
                            section_id: section === null || section === void 0 ? void 0 : section.section_id,
                            teacherId: teacher === null || teacher === void 0 ? void 0 : teacher.id
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Course offering ${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importStudentEnrollments(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find student
                    const student = yield prisma.student.findFirst({
                        where: { usn: record.student_usn }
                    });
                    // Find course
                    const course = yield prisma.course.findFirst({
                        where: { code: record.course_code }
                    });
                    // Find academic year
                    const academicYear = yield prisma.academic_years.findFirst({
                        where: {
                            year_name: record.academic_year,
                            college_id: course.college_id
                        }
                    });
                    if (!student || !course) {
                        errors.push(`Enrollment ${record.student_usn}-${record.course_code}: Student or course not found`);
                        continue;
                    }
                    // Find course offering
                    const courseOffering = yield prisma.courseOffering.findFirst({
                        where: {
                            courseId: course.id,
                            year_id: academicYear === null || academicYear === void 0 ? void 0 : academicYear.year_id,
                            semester: parseInt(record.semester) || 1
                        }
                    });
                    if (!courseOffering) {
                        errors.push(`Enrollment ${record.student_usn}-${record.course_code}: Course offering not found`);
                        continue;
                    }
                    yield prisma.studentEnrollment.create({
                        data: {
                            studentId: student.id,
                            offeringId: courseOffering.id,
                            year_id: academicYear === null || academicYear === void 0 ? void 0 : academicYear.year_id
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Enrollment ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importUserRoles(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find user
                    const user = yield prisma.user.findUnique({
                        where: { username: record.username }
                    });
                    if (!user) {
                        errors.push(`User role ${record.username}: User not found`);
                        continue;
                    }
                    yield prisma.userRoleAssignment.create({
                        data: {
                            userId: user.id,
                            role: record.role
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`User role ${record.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importAcademicYears(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find college
                    const college = yield prisma.college.findUnique({
                        where: { code: record.college_code }
                    });
                    if (!college) {
                        errors.push(`Academic year ${record.year_name}: College ${record.college_code} not found`);
                        continue;
                    }
                    yield prisma.academic_years.create({
                        data: {
                            college_id: college.id,
                            year_name: record.year_name,
                            start_date: new Date(record.start_date),
                            end_date: new Date(record.end_date),
                            is_active: record.is_active === 'TRUE' || record.is_active === true
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Academic year ${record.year_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importAttendance(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find course
                    const course = yield prisma.course.findFirst({
                        where: { code: record.course_code }
                    });
                    // Find section
                    const section = yield prisma.sections.findFirst({
                        where: {
                            section_name: record.section_name,
                            departments: {
                                code: record.section_dept_code,
                                college_id: course.college_id
                            }
                        }
                    });
                    // Find teacher
                    const teacher = yield prisma.teacher.findFirst({
                        where: {
                            user: {
                                username: record.teacher_username
                            },
                            college_id: course.college_id
                        }
                    });
                    if (!course || !section || !teacher) {
                        errors.push(`Attendance ${record.course_code}-${record.class_date}: Missing course, section, or teacher`);
                        continue;
                    }
                    // Find course offering
                    const courseOffering = yield prisma.courseOffering.findFirst({
                        where: {
                            courseId: course.id,
                            section_id: section === null || section === void 0 ? void 0 : section.section_id,
                            teacherId: teacher === null || teacher === void 0 ? void 0 : teacher.id
                        }
                    });
                    if (!courseOffering) {
                        errors.push(`Attendance ${record.course_code}-${record.class_date}: Course offering not found`);
                        continue;
                    }
                    yield prisma.attendance.create({
                        data: {
                            offeringId: courseOffering.id,
                            teacherId: teacher.id,
                            classDate: new Date(record.class_date),
                            periodNumber: parseInt(record.period_number) || 1,
                            syllabusCovered: record.syllabus_covered || null
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Attendance ${record.course_code}-${record.class_date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importAttendanceRecords(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find student
                    const student = yield prisma.student.findFirst({
                        where: { usn: record.student_usn }
                    });
                    // Find attendance session
                    const attendance = yield prisma.attendance.findFirst({
                        where: {
                            offering: {
                                course: { code: record.course_code }
                            },
                            classDate: new Date(record.class_date),
                            periodNumber: parseInt(record.period_number) || 1
                        }
                    });
                    if (!student || !attendance) {
                        errors.push(`Attendance record ${record.student_usn}-${record.class_date}: Missing references`);
                        continue;
                    }
                    yield prisma.attendanceRecord.create({
                        data: {
                            attendanceId: attendance.id,
                            studentId: student.id,
                            status: record.status || 'present'
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Attendance record ${record.student_usn}-${record.class_date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importTheoryMarks(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find student
                    const student = yield prisma.student.findFirst({
                        where: { usn: record.student_usn }
                    });
                    // Find course
                    const course = yield prisma.course.findFirst({
                        where: { code: record.course_code }
                    });
                    if (!student || !course) {
                        errors.push(`Theory marks ${record.student_usn}-${record.course_code}: Student or course not found`);
                        continue;
                    }
                    // Find enrollment first
                    const enrollment = yield prisma.studentEnrollment.findFirst({
                        where: {
                            studentId: student.id,
                            offering: {
                                courseId: course.id
                            }
                        }
                    });
                    if (!enrollment) {
                        errors.push(`Theory marks ${record.student_usn}-${record.course_code}: Enrollment not found`);
                        continue;
                    }
                    yield prisma.theoryMarks.create({
                        data: {
                            enrollmentId: enrollment.id,
                            mse1Marks: record.mse1_marks ? parseInt(record.mse1_marks) : null,
                            mse2Marks: record.mse2_marks ? parseInt(record.mse2_marks) : null,
                            mse3Marks: record.mse3_marks ? parseInt(record.mse3_marks) : null,
                            task1Marks: record.task1_marks ? parseInt(record.task1_marks) : null,
                            task2Marks: record.task2_marks ? parseInt(record.task2_marks) : null,
                            task3Marks: record.task3_marks ? parseInt(record.task3_marks) : null
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Theory marks ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
    static importLabMarks(records, prisma, errors) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            for (const record of records) {
                try {
                    // Find student
                    const student = yield prisma.student.findFirst({
                        where: { usn: record.student_usn }
                    });
                    // Find course
                    const course = yield prisma.course.findFirst({
                        where: { code: record.course_code }
                    });
                    if (!student || !course) {
                        errors.push(`Lab marks ${record.student_usn}-${record.course_code}: Student or course not found`);
                        continue;
                    }
                    // Find enrollment first
                    const enrollment = yield prisma.studentEnrollment.findFirst({
                        where: {
                            studentId: student.id,
                            offering: {
                                courseId: course.id
                            }
                        }
                    });
                    if (!enrollment) {
                        errors.push(`Lab marks ${record.student_usn}-${record.course_code}: Enrollment not found`);
                        continue;
                    }
                    yield prisma.labMarks.create({
                        data: {
                            enrollmentId: enrollment.id,
                            recordMarks: record.record_marks ? parseInt(record.record_marks) : null,
                            continuousEvaluationMarks: record.continuous_evaluation_marks ? parseInt(record.continuous_evaluation_marks) : null,
                            labMseMarks: record.lab_mse_marks ? parseInt(record.lab_mse_marks) : null
                        }
                    });
                    count++;
                }
                catch (error) {
                    errors.push(`Lab marks ${record.student_usn}-${record.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return count;
        });
    }
}
exports.ImportService = ImportService;
