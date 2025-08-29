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
exports.autoEnrollStudentForSemester = autoEnrollStudentForSemester;
exports.autoEnrollFirstYearStudent = autoEnrollFirstYearStudent;
exports.autoEnrollStudentBySemester = autoEnrollStudentBySemester;
exports.getAvailableCoursesForSemester = getAvailableCoursesForSemester;
exports.getCoursesBySemester = getCoursesBySemester;
exports.promoteStudentToNextSemester = promoteStudentToNextSemester;
const database_1 = __importDefault(require("../lib/database"));
/**
 * Automatically enrolls a student in core courses for their department's specific semester
 * @param studentId - The ID of the student to enroll
 * @param semester - The specific semester to enroll for (1, 2, 3, 4, etc.)
 * @returns AutoEnrollmentResult with details of the enrollment process
 */
function autoEnrollStudentForSemester(studentId, semester) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            success: false,
            enrollmentsCreated: 0,
            errors: [],
            details: {
                studentId,
                courseOfferingsEnrolled: []
            }
        };
        try {
            const prisma = database_1.default.getInstance();
            // Get student details with department and college info
            const student = yield prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    departments: true,
                    colleges: true,
                    sections: true
                }
            });
            if (!student) {
                result.errors.push('Student not found');
                return result;
            }
            if (!student.department_id) {
                result.errors.push('Student is not assigned to a department');
                return result;
            }
            // Get the current active academic year
            console.log(`🔍 Looking for active academic year for college: ${student.college_id}`);
            // First, let's see all academic years for this college
            const allAcademicYears = yield prisma.academic_years.findMany({
                where: {
                    college_id: student.college_id
                }
            });
            console.log(`📅 Found ${allAcademicYears.length} academic years for college:`, allAcademicYears);
            // Get all active academic years
            const activeAcademicYears = yield prisma.academic_years.findMany({
                where: {
                    college_id: student.college_id,
                    is_active: true
                },
                orderBy: {
                    year_name: 'desc' // Prefer newer academic years
                }
            });
            console.log(`🎯 Active academic years:`, activeAcademicYears);
            if (activeAcademicYears.length === 0) {
                result.errors.push('No active academic year found for the college');
                return result;
            }
            // Try each active academic year until we find one with course offerings
            let selectedAcademicYear = null;
            let semesterOfferings = [];
            for (const academicYear of activeAcademicYears) {
                console.log(`🔍 Trying academic year: ${academicYear.year_name} (${academicYear.year_id})`);
                // Find all core courses for the student's department
                const coreCourses = yield prisma.course.findMany({
                    where: {
                        college_id: student.college_id,
                        departmentId: student.department_id,
                        type: 'core'
                    }
                });
                if (coreCourses.length === 0) {
                    console.log(`❌ No core courses found for department`);
                    continue;
                }
                // Find course offerings for the specific semester for these core courses
                const testOfferings = yield prisma.courseOffering.findMany({
                    where: Object.assign({ courseId: {
                            in: coreCourses.map((course) => course.id)
                        }, semester: semester, year_id: academicYear.year_id }, (student.section_id ? { section_id: student.section_id } : {})),
                    include: {
                        course: true,
                        sections: true
                    }
                });
                console.log(`📚 Found ${testOfferings.length} course offerings for semester ${semester} in academic year ${academicYear.year_name}`);
                if (testOfferings.length > 0) {
                    selectedAcademicYear = academicYear;
                    semesterOfferings = testOfferings;
                    console.log(`✅ Using academic year ${academicYear.year_name} with ${testOfferings.length} course offerings`);
                    break;
                }
            }
            if (!selectedAcademicYear || semesterOfferings.length === 0) {
                result.errors.push(`No course offerings found for semester ${semester} courses in the student's department across any active academic year`);
                return result;
            }
            // Check for existing enrollments to avoid duplicates
            const existingEnrollments = yield prisma.studentEnrollment.findMany({
                where: {
                    studentId: student.id,
                    offeringId: {
                        in: semesterOfferings.map((offering) => offering.id)
                    }
                }
            });
            const existingOfferingIds = new Set(existingEnrollments.map((enrollment) => enrollment.offeringId));
            const offeringsToEnroll = semesterOfferings.filter((offering) => !existingOfferingIds.has(offering.id));
            // Create enrollments for each offering
            const enrollmentPromises = offeringsToEnroll.map((offering) => prisma.studentEnrollment.create({
                data: {
                    studentId: student.id,
                    offeringId: offering.id,
                    year_id: selectedAcademicYear.year_id,
                    attemptNumber: 1
                }
            }));
            const createdEnrollments = yield Promise.all(enrollmentPromises);
            result.success = true;
            result.enrollmentsCreated = createdEnrollments.length;
            result.details.courseOfferingsEnrolled = offeringsToEnroll.map((offering) => `${offering.course.code} - ${offering.course.name} (Semester ${offering.semester})`);
            if (existingEnrollments.length > 0) {
                result.errors.push(`Student was already enrolled in ${existingEnrollments.length} course(s)`);
            }
        }
        catch (error) {
            result.errors.push(`Error during auto-enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    });
}
/**
 * Automatically enrolls a first-year student in core courses for semester 1 only
 * @param studentId - The ID of the student to enroll
 * @returns AutoEnrollmentResult with details of the enrollment process
 */
function autoEnrollFirstYearStudent(studentId) {
    return __awaiter(this, void 0, void 0, function* () {
        // First-year students should only be enrolled in semester 1 initially
        return yield autoEnrollStudentForSemester(studentId, 1);
    });
}
/**
 * Automatically enrolls a student in core courses based on their current semester
 * @param studentId - The ID of the student to enroll
 * @param targetSemester - Optional: specific semester to enroll for (defaults to student's current semester)
 * @returns AutoEnrollmentResult with details of the enrollment process
 */
function autoEnrollStudentBySemester(studentId, targetSemester) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            success: false,
            enrollmentsCreated: 0,
            errors: [],
            details: {
                studentId,
                courseOfferingsEnrolled: []
            }
        };
        try {
            const prisma = database_1.default.getInstance();
            // Get student details
            const student = yield prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    departments: true,
                    colleges: true,
                    sections: true
                }
            });
            if (!student) {
                result.errors.push('Student not found');
                return result;
            }
            if (!student.department_id) {
                result.errors.push('Student is not assigned to a department');
                return result;
            }
            const semesterToEnroll = targetSemester || student.semester || 1;
            return yield autoEnrollStudentForSemester(studentId, semesterToEnroll);
        }
        catch (error) {
            result.errors.push(`Error during auto-enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    });
}
/**
 * Get available courses for a specific semester and department
 * @param collegeId - College ID
 * @param departmentId - Department ID
 * @param semester - Semester number
 * @param academicYearId - Academic year ID (optional, uses active if not provided)
 * @returns Array of course offerings
 */
function getAvailableCoursesForSemester(collegeId, departmentId, semester, academicYearId) {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = database_1.default.getInstance();
        let targetAcademicYear = academicYearId;
        if (!targetAcademicYear) {
            const activeAcademicYear = yield prisma.academic_years.findFirst({
                where: {
                    college_id: collegeId,
                    is_active: true
                }
            });
            if (!activeAcademicYear) {
                throw new Error('No active academic year found');
            }
            targetAcademicYear = activeAcademicYear.year_id;
        }
        // Find all core courses for the department
        const coreCourses = yield prisma.course.findMany({
            where: {
                college_id: collegeId,
                departmentId: departmentId,
                type: 'core'
            }
        });
        // Find course offerings for the specific semester
        const courseOfferings = yield prisma.courseOffering.findMany({
            where: {
                courseId: {
                    in: coreCourses.map((course) => course.id)
                },
                semester: semester,
                year_id: targetAcademicYear
            },
            include: {
                course: {
                    include: {
                        department: true
                    }
                },
                sections: true,
                teacher: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                course: {
                    code: 'asc'
                }
            }
        });
        return courseOfferings;
    });
}
/**
 * Get course offerings grouped by semester for a department
 * @param collegeId - College ID
 * @param departmentId - Department ID
 * @param academicYearId - Academic year ID (optional)
 * @returns Object with semesters as keys and course offerings as values
 */
function getCoursesBySemester(collegeId, departmentId, academicYearId) {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = database_1.default.getInstance();
        let targetAcademicYear = academicYearId;
        if (!targetAcademicYear) {
            const activeAcademicYear = yield prisma.academic_years.findFirst({
                where: {
                    college_id: collegeId,
                    is_active: true
                }
            });
            if (!activeAcademicYear) {
                throw new Error('No active academic year found');
            }
            targetAcademicYear = activeAcademicYear.year_id;
        }
        // Find all core courses for the department
        const coreCourses = yield prisma.course.findMany({
            where: {
                college_id: collegeId,
                departmentId: departmentId,
                type: 'core'
            }
        });
        // Find all course offerings for this department
        const allOfferings = yield prisma.courseOffering.findMany({
            where: {
                courseId: {
                    in: coreCourses.map((course) => course.id)
                },
                year_id: targetAcademicYear
            },
            include: {
                course: {
                    include: {
                        department: true
                    }
                },
                sections: true,
                teacher: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: [
                { semester: 'asc' },
                { course: { code: 'asc' } }
            ]
        });
        // Group by semester
        const coursesBySemester = {};
        allOfferings.forEach((offering) => {
            const semester = offering.semester;
            if (!coursesBySemester[semester]) {
                coursesBySemester[semester] = [];
            }
            coursesBySemester[semester].push(offering);
        });
        return coursesBySemester;
    });
}
/**
 * Enroll a student in next semester's courses (semester promotion)
 * @param studentId - The ID of the student to promote
 * @returns AutoEnrollmentResult with details of the enrollment process
 */
function promoteStudentToNextSemester(studentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            success: false,
            enrollmentsCreated: 0,
            errors: [],
            details: {
                studentId,
                courseOfferingsEnrolled: []
            }
        };
        try {
            const prisma = database_1.default.getInstance();
            // Get student details
            const student = yield prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    departments: true,
                    colleges: true,
                    sections: true
                }
            });
            if (!student) {
                result.errors.push('Student not found');
                return result;
            }
            const currentSemester = student.semester || 1;
            const nextSemester = currentSemester + 1;
            // Update student's semester
            yield prisma.student.update({
                where: { id: studentId },
                data: { semester: nextSemester }
            });
            // Auto-enroll in next semester's courses
            const enrollmentResult = yield autoEnrollStudentForSemester(studentId, nextSemester);
            result.success = enrollmentResult.success;
            result.enrollmentsCreated = enrollmentResult.enrollmentsCreated;
            result.errors = enrollmentResult.errors;
            result.details = enrollmentResult.details;
            if (enrollmentResult.success) {
                result.errors.unshift(`Student promoted from semester ${currentSemester} to semester ${nextSemester}`);
            }
        }
        catch (error) {
            result.errors.push(`Error during semester promotion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    });
}
