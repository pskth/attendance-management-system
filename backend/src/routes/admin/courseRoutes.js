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
// src/routes/admin/courseRoutes.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../../lib/database"));
const router = (0, express_1.Router)();
// Get eligible students for a course
router.get('/courses/:courseId/eligible-students', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { courseId } = req.params;
        const { year, semester } = req.query;
        if (!year || !semester) {
            res.status(400).json({
                status: 'error',
                error: 'Year and semester parameters are required'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        // Get course details
        const course = yield prisma.course.findUnique({
            where: { id: courseId },
            include: {
                department: {
                    include: {
                        colleges: true
                    }
                },
                openElectiveRestrictions: {
                    include: {
                        restrictedDepartment: true
                    }
                }
            }
        });
        if (!course) {
            res.status(404).json({
                status: 'error',
                error: 'Course not found'
            });
            return;
        }
        // Build query conditions based on course type
        const yearNumber = parseInt(year);
        const semesterNumber = parseInt(semester);
        // Convert semester to year using proper mapping:
        // Semester 1,2 = Year 1; Semester 3,4 = Year 2; Semester 5,6 = Year 3; Semester 7,8 = Year 4
        const courseYear = Math.ceil(semesterNumber / 2);
        // Students are stored with batchYear which represents their academic year
        // We need to find students whose current year matches the course year
        const batchYear = courseYear;
        const absoluteSemester = semesterNumber;
        // Build student where conditions
        let studentWhereConditions = {
            batchYear: batchYear,
            college_id: course.college_id,
            semester: absoluteSemester
        };
        // Apply course-specific filters
        if (course.type === 'core' || course.type === 'department_elective') {
            if (course.departmentId) {
                studentWhereConditions.department_id = course.departmentId;
            }
        }
        else if (course.type === 'open_elective') {
            const restrictedDepartmentIds = ((_a = course.openElectiveRestrictions) === null || _a === void 0 ? void 0 : _a.map((r) => r.restrictedDepartmentId)) || [];
            if (restrictedDepartmentIds.length > 0) {
                studentWhereConditions.department_id = {
                    notIn: restrictedDepartmentIds
                };
            }
        }
        // Get students who are NOT already enrolled in this course for this semester
        const eligibleStudents = yield prisma.student.findMany({
            where: Object.assign(Object.assign({}, studentWhereConditions), { enrollments: {
                    none: {
                        offering: {
                            courseId: courseId,
                            semester: absoluteSemester
                        }
                    }
                } }),
            include: {
                user: { select: { name: true, email: true } },
                departments: { select: { id: true, name: true, code: true } },
                sections: { select: { section_id: true, section_name: true } }
            },
            orderBy: [
                { departments: { code: 'asc' } },
                { usn: 'asc' }
            ]
        });
        const transformedStudents = eligibleStudents.map((student) => ({
            id: student.id,
            name: student.user.name,
            email: student.user.email,
            usn: student.usn,
            semester: student.semester,
            batchYear: student.batchYear,
            department: student.departments ? {
                id: student.departments.id,
                name: student.departments.name,
                code: student.departments.code
            } : null,
            section: student.sections ? {
                id: student.sections.section_id,
                name: student.sections.section_name
            } : null
        }));
        res.json({
            status: 'success',
            data: {
                course: {
                    id: course.id,
                    code: course.code,
                    name: course.name,
                    type: course.type,
                    department: course.department ? {
                        id: course.department.id,
                        name: course.department.name,
                        code: course.department.code
                    } : null,
                    restrictions: ((_b = course.openElectiveRestrictions) === null || _b === void 0 ? void 0 : _b.map((r) => ({
                        departmentCode: r.restrictedDepartment.code,
                        departmentName: r.restrictedDepartment.name
                    }))) || []
                },
                eligibleStudents: transformedStudents,
                filters: {
                    year: yearNumber,
                    semester: semesterNumber,
                    absoluteSemester: absoluteSemester
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching eligible students:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Enroll students in a course
router.post('/courses/:courseId/enroll-students', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const { studentIds, year, semester, teacherId } = req.body;
        // Only error if both studentIds is empty and no teacherId is provided
        if ((!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) && !teacherId) {
            res.status(400).json({
                status: 'error',
                error: 'At least one student or a teacher assignment is required'
            });
            return;
        }
        if (!year || !semester) {
            res.status(400).json({
                status: 'error',
                error: 'Year and semester are required'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        // Get course details
        const course = yield prisma.course.findUnique({
            where: { id: courseId },
            include: {
                department: true
            }
        });
        if (!course) {
            res.status(404).json({
                status: 'error',
                error: 'Course not found'
            });
            return;
        }
        // Resolve teacherId to teachers.id if provided
        let resolvedTeacherId = null;
        if (teacherId) {
            const teacherRecord = yield prisma.teacher.findUnique({ where: { userId: teacherId } });
            if (!teacherRecord) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Teacher not found for the given user id'
                });
            }
            resolvedTeacherId = teacherRecord.id;
        }
        // Get or create academic year
        const yearNumber = parseInt(year);
        let academicYear = yield prisma.academic_years.findFirst({
            where: {
                year_name: `${yearNumber}-${(yearNumber + 1).toString().slice(-2)}`,
                college_id: course.college_id
            }
        });
        if (!academicYear) {
            academicYear = yield prisma.academic_years.create({
                data: {
                    year_name: `${yearNumber}-${(yearNumber + 1).toString().slice(-2)}`,
                    college_id: course.college_id,
                    start_date: new Date(`${yearNumber}-06-01`),
                    end_date: new Date(`${yearNumber + 1}-05-31`),
                    is_active: true
                }
            });
        }
        // Get or create course offering
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                courseId: courseId,
                semester: parseInt(semester),
                year_id: academicYear.year_id
            }
        });
        if (!courseOffering) {
            courseOffering = yield prisma.courseOffering.create({
                data: {
                    courseId: courseId,
                    semester: parseInt(semester),
                    year_id: academicYear.year_id,
                    teacherId: resolvedTeacherId || null
                }
            });
        }
        else if (resolvedTeacherId && courseOffering.teacherId !== resolvedTeacherId) {
            // Update teacher if provided and different
            courseOffering = yield prisma.courseOffering.update({
                where: { id: courseOffering.id },
                data: { teacherId: resolvedTeacherId }
            });
        }
        let results = [];
        let enrolledCount = 0;
        let alreadyEnrolledCount = 0;
        let errorCount = 0;
        if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
            // Create enrollments if students are provided
            const enrollmentPromises = studentIds.map((studentId) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    // Check if enrollment already exists
                    const existingEnrollment = yield prisma.studentEnrollment.findFirst({
                        where: {
                            studentId: studentId,
                            offeringId: courseOffering.id
                        }
                    });
                    if (existingEnrollment) {
                        return { studentId, status: 'already_enrolled' };
                    }
                    // Create new enrollment
                    yield prisma.studentEnrollment.create({
                        data: {
                            studentId: studentId,
                            offeringId: courseOffering.id,
                            year_id: academicYear.year_id,
                            attemptNumber: 1
                        }
                    });
                    return { studentId, status: 'enrolled' };
                }
                catch (error) {
                    return {
                        studentId,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }));
            results = yield Promise.all(enrollmentPromises);
            enrolledCount = results.filter(r => r.status === 'enrolled').length;
            alreadyEnrolledCount = results.filter(r => r.status === 'already_enrolled').length;
            errorCount = results.filter(r => r.status === 'error').length;
        }
        // If only teacher assignment (no students), just return success
        res.json({
            status: 'success',
            data: {
                enrollmentsCreated: enrolledCount,
                alreadyEnrolled: alreadyEnrolledCount,
                errors: errorCount,
                results: results,
                courseOffering: {
                    id: courseOffering.id,
                    courseId: courseOffering.courseId,
                    semester: courseOffering.semester,
                    teacherId: courseOffering.teacherId
                }
            }
        });
    }
    catch (error) {
        console.error('Error enrolling students:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get course enrollments
router.get('/courses/:courseId/enrollments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const { courseId } = req.params;
        const { year, semester } = req.query;
        let whereClause = {
            offering: {
                courseId: courseId
            }
        };
        if (year) {
            whereClause.academic_years = {
                year_name: year
            };
        }
        if (semester) {
            whereClause.offering.semester = parseInt(semester);
        }
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        departments: {
                            select: {
                                name: true,
                                code: true
                            }
                        },
                        sections: {
                            select: {
                                section_name: true
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                type: true
                            }
                        },
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                academic_years: {
                    select: {
                        year_name: true
                    }
                }
            }
        });
        const enrollmentData = enrollments.map(enrollment => {
            var _a, _b, _c, _d;
            return ({
                id: enrollment.id,
                attemptNumber: enrollment.attemptNumber,
                student: enrollment.student ? {
                    id: enrollment.student.id,
                    usn: enrollment.student.usn,
                    name: enrollment.student.user.name,
                    semester: enrollment.student.semester,
                    batchYear: enrollment.student.batchYear,
                    department: enrollment.student.departments ? {
                        name: enrollment.student.departments.name,
                        code: enrollment.student.departments.code
                    } : null,
                    section: enrollment.student.sections ? {
                        name: enrollment.student.sections.section_name
                    } : null
                } : null,
                course: ((_a = enrollment.offering) === null || _a === void 0 ? void 0 : _a.course) || null,
                teacher: ((_b = enrollment.offering) === null || _b === void 0 ? void 0 : _b.teacher) ? {
                    id: enrollment.offering.teacher.id,
                    name: enrollment.offering.teacher.user.name
                } : null,
                academicYear: ((_c = enrollment.academic_years) === null || _c === void 0 ? void 0 : _c.year_name) || null,
                semester: ((_d = enrollment.offering) === null || _d === void 0 ? void 0 : _d.semester) || null
            });
        });
        res.json({
            status: 'success',
            data: enrollmentData,
            count: enrollmentData.length
        });
    }
    catch (error) {
        console.error('Error fetching course enrollments:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get courses with teacher assignments for admin UI
router.get('/course-management', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const courses = yield prisma.course.findMany({
            include: {
                department: {
                    include: {
                        colleges: true
                    }
                },
                courseOfferings: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        sections: {
                            select: {
                                section_name: true
                            }
                        },
                        academic_years: {
                            select: {
                                year_name: true
                            }
                        }
                    }
                }
            }
        });
        // Transform the data to what the frontend expects
        const formattedCourses = courses.map(course => {
            var _a, _b, _c, _d, _e, _f, _g;
            // Group offerings by section to find which ones have teachers assigned
            const offeringsWithTeachers = course.courseOfferings.filter(o => o.teacherId);
            const offeringsWithoutTeachers = course.courseOfferings.filter(o => !o.teacherId);
            // For the UI, we want to show if ANY offering has a teacher, and who that teacher is
            const primaryTeacher = offeringsWithTeachers.length > 0 ? offeringsWithTeachers[0].teacher : null;
            // Calculate the course year based on semester using the mapping:
            // Semesters 1,2 = Year 1; 3,4 = Year 2; 5,6 = Year 3; 7,8 = Year 4
            let courseYear = 1; // Default to 1st year
            if (course.courseOfferings.length > 0) {
                const firstSemester = course.courseOfferings[0].semester;
                if (firstSemester) {
                    courseYear = Math.ceil(firstSemester / 2);
                }
            }
            return {
                id: course.id,
                code: course.code,
                name: course.name,
                type: course.type,
                year: courseYear, // Add calculated year field
                department: {
                    name: (_a = course.department) === null || _a === void 0 ? void 0 : _a.name,
                    code: (_b = course.department) === null || _b === void 0 ? void 0 : _b.code
                },
                college: {
                    name: (_d = (_c = course.department) === null || _c === void 0 ? void 0 : _c.colleges) === null || _d === void 0 ? void 0 : _d.name,
                    code: (_f = (_e = course.department) === null || _e === void 0 ? void 0 : _e.colleges) === null || _f === void 0 ? void 0 : _f.code
                },
                teacher: primaryTeacher ? {
                    id: primaryTeacher.userId, // Use userId instead of teacher.id
                    name: (_g = primaryTeacher.user) === null || _g === void 0 ? void 0 : _g.name
                } : null,
                teacherAssigned: offeringsWithTeachers.length > 0,
                totalOfferings: course.courseOfferings.length,
                offeringsWithTeacher: offeringsWithTeachers.length,
                offeringsWithoutTeacher: offeringsWithoutTeachers.length,
                hasTheoryComponent: course.hasTheoryComponent,
                hasLabComponent: course.hasLabComponent,
                // Include detailed offerings for debugging
                offerings: course.courseOfferings.map(offering => {
                    var _a, _b, _c;
                    return ({
                        id: offering.id,
                        semester: offering.semester,
                        section: (_a = offering.sections) === null || _a === void 0 ? void 0 : _a.section_name,
                        academicYear: (_b = offering.academic_years) === null || _b === void 0 ? void 0 : _b.year_name,
                        teacher: offering.teacher ? {
                            id: offering.teacher.userId, // Use userId instead of teacher.id
                            name: (_c = offering.teacher.user) === null || _c === void 0 ? void 0 : _c.name
                        } : null,
                        hasTeacher: !!offering.teacherId
                    });
                })
            };
        });
        res.json({
            status: 'success',
            data: formattedCourses,
            count: formattedCourses.length,
            summary: {
                totalCourses: formattedCourses.length,
                coursesWithTeachers: formattedCourses.filter(c => c.teacherAssigned).length,
                coursesWithoutTeachers: formattedCourses.filter(c => !c.teacherAssigned).length
            }
        });
    }
    catch (error) {
        console.error('Error fetching course management data:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Auto-assign teachers to course offerings that don't have teachers
router.post('/auto-assign-teachers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const prisma = database_1.default.getInstance();
        // Get all course offerings without teachers
        const offeringsWithoutTeachers = yield prisma.courseOffering.findMany({
            where: {
                teacherId: null
            },
            include: {
                course: {
                    include: {
                        department: true
                    }
                },
                sections: true,
                academic_years: true
            }
        });
        // Get all teachers grouped by department
        const teachers = yield prisma.teacher.findMany({
            include: {
                user: true,
                department: true
            }
        });
        // Group teachers by department
        const teachersByDepartment = teachers.reduce((acc, teacher) => {
            const deptId = teacher.departmentId;
            if (deptId) {
                if (!acc[deptId])
                    acc[deptId] = [];
                acc[deptId].push(teacher);
            }
            return acc;
        }, {});
        let assignedCount = 0;
        const assignments = [];
        // Auto-assign teachers to course offerings
        for (const offering of offeringsWithoutTeachers) {
            const departmentId = (_a = offering.course) === null || _a === void 0 ? void 0 : _a.departmentId;
            if (departmentId && teachersByDepartment[departmentId]) {
                const availableTeachers = teachersByDepartment[departmentId];
                // Simple round-robin assignment - can be made more sophisticated
                const teacherIndex = assignedCount % availableTeachers.length;
                const selectedTeacher = availableTeachers[teacherIndex];
                // Update the course offering with teacher assignment
                yield prisma.courseOffering.update({
                    where: { id: offering.id },
                    data: { teacherId: selectedTeacher.id }
                });
                assignments.push({
                    courseCode: (_b = offering.course) === null || _b === void 0 ? void 0 : _b.code,
                    courseName: (_c = offering.course) === null || _c === void 0 ? void 0 : _c.name,
                    section: (_d = offering.sections) === null || _d === void 0 ? void 0 : _d.section_name,
                    semester: offering.semester,
                    academicYear: (_e = offering.academic_years) === null || _e === void 0 ? void 0 : _e.year_name,
                    assignedTeacher: {
                        id: selectedTeacher.id,
                        name: (_f = selectedTeacher.user) === null || _f === void 0 ? void 0 : _f.name
                    }
                });
                assignedCount++;
            }
        }
        res.json({
            status: 'success',
            message: `Successfully assigned teachers to ${assignedCount} course offerings`,
            data: {
                totalAssigned: assignedCount,
                assignments: assignments.slice(0, 10), // Show first 10 assignments
                totalAssignments: assignments.length
            }
        });
    }
    catch (error) {
        console.error('Error auto-assigning teachers:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Assign specific teacher to specific course offering
router.post('/assign-teacher', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { offeringId, teacherId } = req.body;
        if (!offeringId || !teacherId) {
            res.status(400).json({
                status: 'error',
                message: 'offeringId and teacherId are required'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        // Verify the offering exists
        const offering = yield prisma.courseOffering.findUnique({
            where: { id: offeringId },
            include: {
                course: true,
                sections: true,
                academic_years: true
            }
        });
        if (!offering) {
            res.status(404).json({
                status: 'error',
                message: 'Course offering not found'
            });
            return;
        }
        // Verify the teacher exists
        const teacher = yield prisma.teacher.findUnique({
            where: { id: teacherId },
            include: {
                user: true
            }
        });
        if (!teacher) {
            res.status(404).json({
                status: 'error',
                message: 'Teacher not found'
            });
            return;
        }
        // Assign the teacher
        yield prisma.courseOffering.update({
            where: { id: offeringId },
            data: { teacherId: teacherId }
        });
        res.json({
            status: 'success',
            message: 'Teacher assigned successfully',
            data: {
                offering: {
                    id: offering.id,
                    courseCode: (_a = offering.course) === null || _a === void 0 ? void 0 : _a.code,
                    courseName: (_b = offering.course) === null || _b === void 0 ? void 0 : _b.name,
                    section: (_c = offering.sections) === null || _c === void 0 ? void 0 : _c.section_name,
                    semester: offering.semester,
                    academicYear: (_d = offering.academic_years) === null || _d === void 0 ? void 0 : _d.year_name
                },
                teacher: {
                    id: teacher.id,
                    name: (_e = teacher.user) === null || _e === void 0 ? void 0 : _e.name
                }
            }
        });
    }
    catch (error) {
        console.error('Error assigning teacher:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Remove teacher assignment from course offering
router.post('/unassign-teacher', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { offeringId } = req.body;
        if (!offeringId) {
            res.status(400).json({
                status: 'error',
                message: 'offeringId is required'
            });
            return;
        }
        const prisma = database_1.default.getInstance();
        // Verify the offering exists
        const offering = yield prisma.courseOffering.findUnique({
            where: { id: offeringId },
            include: {
                course: true,
                sections: true,
                teacher: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!offering) {
            res.status(404).json({
                status: 'error',
                message: 'Course offering not found'
            });
            return;
        }
        // Remove the teacher assignment
        yield prisma.courseOffering.update({
            where: { id: offeringId },
            data: { teacherId: null }
        });
        res.json({
            status: 'success',
            message: 'Teacher assignment removed successfully',
            data: {
                offering: {
                    id: offering.id,
                    courseCode: (_a = offering.course) === null || _a === void 0 ? void 0 : _a.code,
                    courseName: (_b = offering.course) === null || _b === void 0 ? void 0 : _b.name,
                    section: (_c = offering.sections) === null || _c === void 0 ? void 0 : _c.section_name
                },
                removedTeacher: offering.teacher ? {
                    id: offering.teacher.id,
                    name: (_d = offering.teacher.user) === null || _d === void 0 ? void 0 : _d.name
                } : null
            }
        });
    }
    catch (error) {
        console.error('Error removing teacher assignment:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
