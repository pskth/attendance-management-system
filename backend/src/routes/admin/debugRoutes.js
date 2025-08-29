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
// src/routes/admin/debugRoutes.ts
const express_1 = require("express");
const database_1 = __importDefault(require("../../lib/database"));
const router = (0, express_1.Router)();
console.log('=== ADMIN DEBUG ROUTES LOADED ===');
// Debug endpoint to check student data
router.get('/debug/students', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const students = yield prisma.student.findMany({
            include: {
                user: { select: { name: true } },
                departments: { select: { code: true, name: true } }
            },
            orderBy: { usn: 'asc' },
            take: 10 // Just first 10 for debugging
        });
        const summary = yield prisma.student.groupBy({
            by: ['batchYear', 'semester'],
            _count: true,
            orderBy: [
                { batchYear: 'asc' },
                { semester: 'asc' }
            ]
        });
        res.json({
            status: 'success',
            data: {
                sampleStudents: students.map(s => {
                    var _a;
                    return ({
                        usn: s.usn,
                        name: s.user.name,
                        batchYear: s.batchYear,
                        semester: s.semester,
                        department: (_a = s.departments) === null || _a === void 0 ? void 0 : _a.code
                    });
                }),
                summary: summary.map(s => ({
                    batchYear: s.batchYear,
                    semester: s.semester,
                    count: s._count
                }))
            }
        });
    }
    catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Debug endpoint to check data consistency
router.get('/debug/data-mismatch', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get student data grouped by year/semester
        const students = yield prisma.student.findMany({
            select: {
                batchYear: true,
                semester: true,
                department_id: true
            }
        });
        // Get course offering data
        const courseOfferings = yield prisma.courseOffering.findMany({
            include: {
                academic_years: {
                    select: {
                        year_name: true
                    }
                }
            }
        });
        // Group students by batch year and semester
        const studentGroups = students.reduce((acc, student) => {
            const key = `batch${student.batchYear}_sem${student.semester}_dept${student.department_id}`;
            if (!acc[key]) {
                acc[key] = 0;
            }
            acc[key]++;
            return acc;
        }, {});
        // Group course offerings by year/semester
        const courseGroups = courseOfferings.reduce((acc, offering) => {
            var _a;
            const year = ((_a = offering.academic_years) === null || _a === void 0 ? void 0 : _a.year_name) || 'unknown';
            const key = `year${year}_sem${offering.semester}`;
            if (!acc[key]) {
                acc[key] = 0;
            }
            acc[key]++;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                studentGroups,
                courseGroups,
                totalStudents: students.length,
                totalCourseOfferings: courseOfferings.length
            }
        });
    }
    catch (error) {
        console.error('Error in data mismatch debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Simple debug endpoint to check raw data
router.get('/debug/raw-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get sample student data
        const sampleStudents = yield prisma.student.findMany({
            take: 5,
            select: {
                batchYear: true,
                semester: true,
                department_id: true,
                usn: true
            }
        });
        // Get sample course offering data
        const sampleOfferings = yield prisma.courseOffering.findMany({
            take: 5,
            select: {
                semester: true,
                courseId: true,
                year_id: true
            }
        });
        // Get academic years
        const academicYears = yield prisma.academic_years.findMany({
            select: {
                year_id: true,
                year_name: true
            }
        });
        res.json({
            success: true,
            data: {
                sampleStudents,
                sampleOfferings,
                academicYears
            }
        });
    }
    catch (error) {
        console.error('Error in raw data debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Debug endpoint to check department-course alignment
router.get('/debug/department-courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get students by department and semester
        const studentsByDept = yield prisma.student.findMany({
            include: {
                departments: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            }
        });
        // Get courses by department
        const coursesByDept = yield prisma.course.findMany({
            include: {
                department: {
                    select: {
                        name: true,
                        code: true
                    }
                },
                courseOfferings: {
                    select: {
                        semester: true
                    }
                }
            }
        });
        // Group data for analysis
        const deptStudentMap = studentsByDept.reduce((acc, student) => {
            var _a;
            const deptKey = ((_a = student.departments) === null || _a === void 0 ? void 0 : _a.code) || 'Unknown';
            const semKey = `sem${student.semester}`;
            if (!acc[deptKey])
                acc[deptKey] = {};
            if (!acc[deptKey][semKey])
                acc[deptKey][semKey] = [];
            acc[deptKey][semKey].push(student.usn);
            return acc;
        }, {});
        const deptCourseMap = coursesByDept.reduce((acc, course) => {
            var _a;
            const deptKey = ((_a = course.department) === null || _a === void 0 ? void 0 : _a.code) || 'Unknown';
            if (!acc[deptKey])
                acc[deptKey] = [];
            acc[deptKey].push({
                code: course.code,
                name: course.name,
                type: course.type,
                semesters: course.courseOfferings.map((o) => o.semester)
            });
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                studentsByDepartment: deptStudentMap,
                coursesByDepartment: deptCourseMap
            }
        });
    }
    catch (error) {
        console.error('Error in department-courses debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Debug endpoint to check teacher assignments
router.get('/debug/teacher-assignments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get course offerings with teacher information
        const courseOfferingsWithTeachers = yield prisma.courseOffering.findMany({
            include: {
                course: {
                    select: {
                        code: true,
                        name: true
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
                },
                academic_years: {
                    select: {
                        year_name: true
                    }
                }
            }
        });
        // Separate offerings with and without teachers
        const withTeachers = courseOfferingsWithTeachers.filter(co => co.teacherId);
        const withoutTeachers = courseOfferingsWithTeachers.filter(co => !co.teacherId);
        res.json({
            success: true,
            data: {
                totalOfferings: courseOfferingsWithTeachers.length,
                withTeachers: {
                    count: withTeachers.length,
                    sample: withTeachers.slice(0, 5).map(co => {
                        var _a, _b, _c, _d, _e;
                        return ({
                            courseCode: (_a = co.course) === null || _a === void 0 ? void 0 : _a.code,
                            courseName: (_b = co.course) === null || _b === void 0 ? void 0 : _b.name,
                            semester: co.semester,
                            academicYear: (_c = co.academic_years) === null || _c === void 0 ? void 0 : _c.year_name,
                            teacherName: (_e = (_d = co.teacher) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name,
                            teacherId: co.teacherId
                        });
                    })
                },
                withoutTeachers: {
                    count: withoutTeachers.length,
                    sample: withoutTeachers.slice(0, 5).map(co => {
                        var _a, _b, _c;
                        return ({
                            courseCode: (_a = co.course) === null || _a === void 0 ? void 0 : _a.code,
                            courseName: (_b = co.course) === null || _b === void 0 ? void 0 : _b.name,
                            semester: co.semester,
                            academicYear: (_c = co.academic_years) === null || _c === void 0 ? void 0 : _c.year_name,
                            teacherId: null
                        });
                    })
                }
            }
        });
    }
    catch (error) {
        console.error('Error in teacher assignments debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Enhanced debug endpoint for course offerings structure
router.get('/debug/course-offerings-detailed', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get all course offerings with complete information
        const courseOfferings = yield prisma.courseOffering.findMany({
            include: {
                course: {
                    select: {
                        code: true,
                        name: true,
                        departmentId: true
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
                },
                academic_years: {
                    select: {
                        year_name: true
                    }
                },
                sections: {
                    select: {
                        section_name: true,
                        departmentId: true
                    }
                }
            },
            orderBy: [
                { course: { code: 'asc' } },
                { semester: 'asc' }
            ]
        });
        // Group by course code to see the pattern
        const groupedByCourse = courseOfferings.reduce((acc, offering) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const key = `${(_a = offering.course) === null || _a === void 0 ? void 0 : _a.code}-${offering.semester}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({
                id: offering.id,
                courseCode: (_b = offering.course) === null || _b === void 0 ? void 0 : _b.code,
                courseName: (_c = offering.course) === null || _c === void 0 ? void 0 : _c.name,
                semester: offering.semester,
                academicYear: (_d = offering.academic_years) === null || _d === void 0 ? void 0 : _d.year_name,
                sectionName: (_e = offering.sections) === null || _e === void 0 ? void 0 : _e.section_name,
                teacherName: (_g = (_f = offering.teacher) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.name,
                teacherId: offering.teacherId,
                hasTeacher: !!offering.teacherId
            });
            return acc;
        }, {});
        // Find courses with mixed teacher assignments
        const coursesWithMixedAssignments = Object.entries(groupedByCourse)
            .filter(([_, offerings]) => {
            const withTeacher = offerings.filter(o => o.hasTeacher).length;
            const withoutTeacher = offerings.filter(o => !o.hasTeacher).length;
            return withTeacher > 0 && withoutTeacher > 0;
        })
            .map(([courseKey, offerings]) => ({
            courseKey,
            totalOfferings: offerings.length,
            withTeacher: offerings.filter(o => o.hasTeacher).length,
            withoutTeacher: offerings.filter(o => !o.hasTeacher).length,
            offerings
        }));
        res.json({
            success: true,
            data: {
                totalOfferings: courseOfferings.length,
                totalUniqueCourses: Object.keys(groupedByCourse).length,
                coursesWithMixedAssignments: {
                    count: coursesWithMixedAssignments.length,
                    details: coursesWithMixedAssignments.slice(0, 3) // Show first 3 for analysis
                },
                sampleGroupedData: Object.entries(groupedByCourse).slice(0, 3).map(([key, offerings]) => ({
                    courseKey: key,
                    count: offerings.length,
                    offerings
                }))
            }
        });
    }
    catch (error) {
        console.error('Error in detailed course offerings debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Simple debug to check course offering structure
router.get('/debug/ui-teacher-issue', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get sample course offerings that should have teachers
        const sampleOfferings = yield prisma.courseOffering.findMany({
            where: {
                teacherId: { not: null }
            },
            include: {
                course: true,
                teacher: {
                    include: {
                        user: true
                    }
                },
                sections: true,
                academic_years: true
            },
            take: 5
        });
        // Check what the frontend API returns for course management
        const courseManagementData = yield prisma.course.findMany({
            include: {
                department: true,
                courseOfferings: {
                    include: {
                        teacher: {
                            include: {
                                user: true
                            }
                        },
                        sections: true,
                        academic_years: true
                    }
                }
            },
            take: 3
        });
        res.json({
            success: true,
            data: {
                sampleOfferingsWithTeachers: sampleOfferings.map(offering => {
                    var _a, _b, _c, _d;
                    return ({
                        id: offering.id,
                        courseCode: offering.course.code,
                        courseName: offering.course.name,
                        teacherId: offering.teacherId,
                        teacherName: (_b = (_a = offering.teacher) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name,
                        sectionName: (_c = offering.sections) === null || _c === void 0 ? void 0 : _c.section_name,
                        academicYear: (_d = offering.academic_years) === null || _d === void 0 ? void 0 : _d.year_name,
                        semester: offering.semester
                    });
                }),
                courseManagementStructure: courseManagementData.map(course => ({
                    courseId: course.id,
                    courseCode: course.code,
                    courseName: course.name,
                    offerings: course.courseOfferings.map(offering => {
                        var _a, _b, _c;
                        return ({
                            offeringId: offering.id,
                            teacherId: offering.teacherId,
                            teacherName: (_b = (_a = offering.teacher) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name,
                            sectionName: (_c = offering.sections) === null || _c === void 0 ? void 0 : _c.section_name,
                            semester: offering.semester
                        });
                    })
                }))
            }
        });
    }
    catch (error) {
        console.error('Error in UI teacher issue debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Debug endpoint to check user year distribution
router.get('/debug/user-year-distribution', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get all users - using basic query since schema may not have role/currentYear
        const users = yield prisma.user.findMany({
            select: {
                id: true,
                name: true
            }
        });
        // Get students with more detailed information
        const students = yield prisma.student.findMany({
            include: {
                departments: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            }
        });
        // Get teachers for comparison
        const teachers = yield prisma.teacher.findMany({
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        // Group students by year and semester
        const studentsByYear = students.reduce((acc, student) => {
            const year = student.batchYear || 'Unknown';
            const semester = student.semester || 'Unknown';
            const key = `Year${year}_Sem${semester}`;
            if (!acc[key])
                acc[key] = 0;
            acc[key]++;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                totalUsers: users.length,
                totalStudents: students.length,
                totalTeachers: teachers.length,
                studentsByYear,
                sampleStudents: students.slice(0, 5).map(s => {
                    var _a;
                    return ({
                        usn: s.usn,
                        studentBatchYear: s.batchYear,
                        studentSemester: s.semester,
                        department: (_a = s.departments) === null || _a === void 0 ? void 0 : _a.code
                    });
                })
            }
        });
    }
    catch (error) {
        console.error('Error in user year distribution debug:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Debug endpoint to analyze the year mismatch problem
router.get('/debug/year-mismatch-analysis', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get course offerings grouped by semester
        const courseOfferings = yield prisma.courseOffering.findMany({
            include: {
                course: {
                    select: {
                        code: true,
                        name: true
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
        });
        // Parse section names to understand year structure
        const sectionAnalysis = courseOfferings.reduce((acc, offering) => {
            var _a, _b, _c;
            const sectionName = ((_a = offering.sections) === null || _a === void 0 ? void 0 : _a.section_name) || 'No Section';
            const semester = offering.semester;
            const academicYear = (_b = offering.academic_years) === null || _b === void 0 ? void 0 : _b.year_name;
            // Extract year from section name (e.g., NM_CSE_A2 -> 2, NM_CSE_A4 -> 4)
            const yearMatch = sectionName.match(/[A-Z](\d+)$/);
            const yearFromSection = yearMatch ? parseInt(yearMatch[1]) : null;
            const key = `Sem${semester}_SecYear${yearFromSection}_AcadYear${academicYear}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({
                courseCode: (_c = offering.course) === null || _c === void 0 ? void 0 : _c.code,
                sectionName,
                semester,
                academicYear,
                extractedYear: yearFromSection
            });
            return acc;
        }, {});
        // Get students and their year distribution
        const students = yield prisma.student.findMany({
            include: {
                user: {
                    select: {
                        currentYear: true
                    }
                }
            }
        });
        const studentYearDistribution = students.reduce((acc, student) => {
            var _a;
            const userYear = (_a = student.user) === null || _a === void 0 ? void 0 : _a.currentYear;
            const batchYear = student.batchYear;
            const semester = student.semester;
            const key = `UserYear${userYear}_BatchYear${batchYear}_Sem${semester}`;
            if (!acc[key])
                acc[key] = 0;
            acc[key]++;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                sectionAnalysis,
                studentYearDistribution,
                totalCourseOfferings: courseOfferings.length,
                totalStudents: students.length,
                recommendedFix: {
                    description: "Students appear to be in different years than course offerings",
                    suggestion: "Either update student years to match course years, or create course offerings for student years"
                }
            }
        });
    }
    catch (error) {
        console.error('Error in year mismatch analysis:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Endpoint to fix year mismatch by updating student years
router.post('/fix/update-student-years', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get all students
        const students = yield prisma.student.findMany({
            include: {
                user: true
            }
        });
        const updates = [];
        for (const student of students) {
            let newYear = null;
            // Map semester to year based on course offering pattern
            // Semester 3 -> 2nd year, Semester 7 -> 4th year
            if (student.semester === 3) {
                newYear = 2;
            }
            else if (student.semester === 7) {
                newYear = 4;
            }
            else if (student.semester === 1) {
                newYear = 1;
            }
            else if (student.semester === 5) {
                newYear = 3;
            }
            if (newYear && student.user.currentYear !== newYear) {
                yield prisma.user.update({
                    where: { id: student.user.id },
                    data: { currentYear: newYear }
                });
                updates.push({
                    userId: student.user.id,
                    usn: student.usn,
                    previousYear: student.user.currentYear,
                    newYear: newYear,
                    semester: student.semester
                });
            }
        }
        res.json({
            success: true,
            message: `Updated ${updates.length} student years`,
            data: {
                updates,
                totalStudentsProcessed: students.length
            }
        });
    }
    catch (error) {
        console.error('Error updating student years:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Endpoint to fix year mismatch by creating course offerings for student years
router.post('/fix/create-matching-course-offerings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prisma = database_1.default.getInstance();
        // Get current student distribution
        const students = yield prisma.student.findMany({
            include: {
                user: {
                    select: {
                        currentYear: true
                    }
                },
                departments: {
                    select: {
                        id: true,
                        code: true
                    }
                }
            }
        });
        // Get existing courses
        const courses = yield prisma.course.findMany({
            include: {
                department: true
            }
        });
        // Get or create academic year
        let academicYear = yield prisma.academic_years.findFirst({
            where: { year_name: '2024-25' }
        });
        if (!academicYear) {
            academicYear = yield prisma.academic_years.create({
                data: {
                    year_name: '2024-25',
                    start_date: new Date('2024-08-01'),
                    end_date: new Date('2025-07-31')
                }
            });
        }
        const newOfferings = [];
        // Group students by department and year
        const studentGroups = students.reduce((acc, student) => {
            var _a, _b;
            const year = (_a = student.user) === null || _a === void 0 ? void 0 : _a.currentYear;
            const deptId = (_b = student.departments) === null || _b === void 0 ? void 0 : _b.id;
            const semester = student.semester;
            if (year && deptId) {
                const key = `dept${deptId}_year${year}_sem${semester}`;
                if (!acc[key])
                    acc[key] = {
                        departmentId: deptId,
                        year,
                        semester,
                        count: 0
                    };
                acc[key].count++;
            }
            return acc;
        }, {});
        // Create course offerings for each student group
        for (const [groupKey, group] of Object.entries(studentGroups)) {
            // Find courses for this department
            const deptCourses = courses.filter(c => { var _a; return ((_a = c.department) === null || _a === void 0 ? void 0 : _a.id) === group.departmentId; });
            for (const course of deptCourses) {
                // Check if offering already exists
                const existingOffering = yield prisma.courseOffering.findFirst({
                    where: {
                        courseId: course.id,
                        semester: group.semester,
                        year_id: academicYear.year_id
                    }
                });
                if (!existingOffering) {
                    // Create section for this group
                    const sectionName = `NM_${(_a = course.department) === null || _a === void 0 ? void 0 : _a.code}_A${group.year}`;
                    let section = yield prisma.sections.findFirst({
                        where: { section_name: sectionName }
                    });
                    if (!section) {
                        section = yield prisma.sections.create({
                            data: {
                                section_name: sectionName,
                                departmentId: group.departmentId
                            }
                        });
                    }
                    // Create course offering
                    const offering = yield prisma.courseOffering.create({
                        data: {
                            courseId: course.id,
                            semester: group.semester,
                            year_id: academicYear.year_id,
                            sectionId: section.id
                        }
                    });
                    newOfferings.push({
                        courseCode: course.code,
                        courseName: course.name,
                        semester: group.semester,
                        sectionName: sectionName,
                        studentCount: group.count,
                        offeringId: offering.id
                    });
                }
            }
        }
        res.json({
            success: true,
            message: `Created ${newOfferings.length} new course offerings`,
            data: {
                newOfferings,
                studentGroups: Object.values(studentGroups)
            }
        });
    }
    catch (error) {
        console.error('Error creating matching course offerings:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Simple endpoint to update student batch years to match available courses
router.post('/fix/align-student-years', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        // Get all students
        const students = yield prisma.student.findMany();
        const updates = [];
        // Strategy: Map semester to expected year based on course offerings
        // Semester 3 -> 2nd year, Semester 7 -> 4th year
        for (const student of students) {
            let newBatchYear = null;
            if (student.semester === 3) {
                newBatchYear = 2; // 2nd year students take 3rd semester
            }
            else if (student.semester === 7) {
                newBatchYear = 4; // 4th year students take 7th semester
            }
            else if (student.semester === 1) {
                newBatchYear = 1;
            }
            else if (student.semester === 5) {
                newBatchYear = 3;
            }
            if (newBatchYear && student.batchYear !== newBatchYear) {
                yield prisma.student.update({
                    where: { id: student.id },
                    data: { batchYear: newBatchYear }
                });
                updates.push({
                    studentId: student.id,
                    usn: student.usn,
                    previousBatchYear: student.batchYear,
                    newBatchYear: newBatchYear,
                    semester: student.semester
                });
            }
        }
        res.json({
            success: true,
            message: `Updated ${updates.length} student batch years to align with course offerings`,
            data: {
                updates,
                totalStudentsProcessed: students.length,
                explanation: "Students in semester 3 are now year 2, students in semester 7 are now year 4"
            }
        });
    }
    catch (error) {
        console.error('Error updating student batch years:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
