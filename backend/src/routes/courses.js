"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// src/routes/courses.ts
const express_1 = require("express");
const multer = __importStar(require("multer"));
const database_1 = __importDefault(require("../lib/database"));
const router = (0, express_1.Router)();
const upload = multer.default({ storage: multer.default.memoryStorage() });
// Get all courses
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                                user: true
                            }
                        },
                        sections: true,
                        academic_years: true
                    },
                    take: 5 // Limit course offerings for performance
                },
                openElectiveRestrictions: {
                    include: {
                        restrictedDepartment: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                code: 'asc'
            }
        });
        // Extract year from each course code and add it to the response
        const coursesWithYear = courses.map(course => {
            let year = 1; // default
            // Try to extract year from course code pattern
            const yearMatch = course.code.match(/[A-Z]{2,4}([1-4])[0-9]{2,3}/);
            if (yearMatch) {
                year = parseInt(yearMatch[1]);
            }
            return Object.assign(Object.assign({}, course), { year });
        });
        res.json({
            status: 'success',
            data: coursesWithYear,
            count: coursesWithYear.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get course by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const { id } = req.params;
        const course = yield prisma.course.findUnique({
            where: { id: id },
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
                                user: true
                            }
                        },
                        sections: true,
                        academic_years: true,
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: true
                                    }
                                }
                            },
                            take: 10 // Limit enrollments for performance
                        }
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({
                status: 'error',
                error: 'Course not found',
                timestamp: new Date().toISOString()
            });
        }
        res.json({
            status: 'success',
            data: course,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get courses by department
router.get('/department/:departmentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const { departmentId } = req.params;
        const courses = yield prisma.course.findMany({
            where: { departmentId },
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
                                user: true
                            }
                        },
                        sections: true
                    },
                    take: 3 // Limit course offerings for performance
                }
            },
            orderBy: {
                code: 'asc'
            }
        });
        res.json({
            status: 'success',
            data: courses,
            count: courses.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get courses by type
router.get('/type/:courseType', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prisma = database_1.default.getInstance();
        const { courseType } = req.params;
        // Validate course type
        const validTypes = ['core', 'department_elective', 'open_elective'];
        if (!validTypes.includes(courseType)) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid course type. Must be one of: core, department_elective, open_elective',
                timestamp: new Date().toISOString()
            });
        }
        const courses = yield prisma.course.findMany({
            where: { type: courseType },
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
                                user: true
                            }
                        },
                        sections: true
                    },
                    take: 3
                }
            },
            orderBy: {
                code: 'asc'
            }
        });
        res.json({
            status: 'success',
            data: courses,
            count: courses.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Create new course
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, code, department, year, credits, type, restrictedDepartments } = req.body;
        if (!name || !code || !department || !year) {
            return res.status(400).json({
                status: 'error',
                error: 'Missing required fields: name, code, department, year',
                timestamp: new Date().toISOString()
            });
        }
        // Validate year (should be 1-4)
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
            return res.status(400).json({
                status: 'error',
                error: 'Year must be a number between 1 and 4',
                timestamp: new Date().toISOString()
            });
        }
        // Validate restricted departments if provided (for open electives)
        if (type === 'open_elective' && restrictedDepartments && !Array.isArray(restrictedDepartments)) {
            return res.status(400).json({
                status: 'error',
                error: 'Restricted departments must be an array',
                timestamp: new Date().toISOString()
            });
        }
        const prisma = database_1.default.getInstance();
        // Check if course code already exists
        const existingCourse = yield prisma.course.findFirst({
            where: { code: code.toUpperCase() }
        });
        if (existingCourse) {
            return res.status(409).json({
                status: 'error',
                error: 'Course code already exists',
                timestamp: new Date().toISOString()
            });
        }
        // Find the department
        const departmentRecord = yield prisma.department.findFirst({
            where: { code: department },
            include: {
                colleges: true
            }
        });
        if (!departmentRecord) {
            return res.status(404).json({
                status: 'error',
                error: 'Department not found',
                timestamp: new Date().toISOString()
            });
        }
        // Create the course - we'll embed the year info in the course code pattern
        // Ensure the course code follows a pattern that includes the year
        let finalCode = code.toUpperCase().trim();
        // If the code doesn't already contain the year pattern, prepend it
        if (!finalCode.match(/^[A-Z]{2,4}[1-4][0-9]{2,3}$/)) {
            // Extract department prefix (first 2-4 letters)
            const deptPrefix = (departmentRecord.code || 'DEPT').substring(0, Math.min(4, (departmentRecord.code || 'DEPT').length));
            // Create a pattern like CS3XX where 3 is the year
            const codeNumber = finalCode.match(/\d+$/) ? finalCode.match(/\d+$/)[0] : '01';
            finalCode = `${deptPrefix}${yearNum}${codeNumber.padStart(2, '0')}`;
        }
        const course = yield prisma.course.create({
            data: {
                name: name.trim(),
                code: finalCode,
                college_id: departmentRecord.college_id,
                departmentId: departmentRecord.id,
                type: type || 'theory'
            },
            include: {
                department: {
                    include: {
                        colleges: true
                    }
                }
            }
        });
        // Add open elective restrictions if provided
        if (type === 'open_elective' && restrictedDepartments && restrictedDepartments.length > 0) {
            // Find department IDs for the restricted department codes
            const restrictedDepts = yield prisma.department.findMany({
                where: {
                    code: {
                        in: restrictedDepartments
                    }
                },
                select: {
                    id: true,
                    code: true,
                    name: true
                }
            });
            // Create restrictions
            const restrictions = restrictedDepts.map(dept => ({
                courseId: course.id,
                restrictedDepartmentId: dept.id
            }));
            if (restrictions.length > 0) {
                yield prisma.openElectiveRestriction.createMany({
                    data: restrictions
                });
            }
        }
        // Fetch the course with restrictions for response
        const courseWithRestrictions = yield prisma.course.findUnique({
            where: { id: course.id },
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
        res.status(201).json({
            status: 'success',
            data: Object.assign(Object.assign({}, courseWithRestrictions), { year: yearNum // Include the year in the response
             }),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error creating course:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Update course
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, code, department, year, type, restrictedDepartments } = req.body;
        if (!name || !code || !department) {
            return res.status(400).json({
                status: 'error',
                error: 'Missing required fields: name, code, department',
                timestamp: new Date().toISOString()
            });
        }
        // Validate year if provided (should be 1-4)
        let yearNum = null;
        if (year) {
            yearNum = parseInt(year);
            if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Year must be a number between 1 and 4',
                    timestamp: new Date().toISOString()
                });
            }
        }
        // Validate restricted departments if provided (for open electives)
        if (type === 'open_elective' && restrictedDepartments && !Array.isArray(restrictedDepartments)) {
            return res.status(400).json({
                status: 'error',
                error: 'Restricted departments must be an array',
                timestamp: new Date().toISOString()
            });
        }
        const prisma = database_1.default.getInstance();
        // Check if course exists
        const existingCourse = yield prisma.course.findUnique({
            where: { id }
        });
        if (!existingCourse) {
            return res.status(404).json({
                status: 'error',
                error: 'Course not found',
                timestamp: new Date().toISOString()
            });
        }
        // Find the department
        const departmentRecord = yield prisma.department.findFirst({
            where: { code: department },
            include: {
                colleges: true
            }
        });
        if (!departmentRecord) {
            return res.status(404).json({
                status: 'error',
                error: 'Department not found',
                timestamp: new Date().toISOString()
            });
        }
        // Prepare the final code first
        let finalCode = code.toUpperCase().trim();
        // If year is provided, ensure the course code embeds the year information
        if (yearNum) {
            // If the code doesn't already contain the year pattern, modify it
            if (!finalCode.match(/^[A-Z]{2,4}[1-4][0-9]{2,3}$/)) {
                // Extract department prefix (first 2-4 letters)
                const deptPrefix = (departmentRecord.code || 'DEPT').substring(0, Math.min(4, (departmentRecord.code || 'DEPT').length));
                // Create a pattern like CS3XX where 3 is the year
                const codeNumber = finalCode.match(/\d+$/) ? finalCode.match(/\d+$/)[0] : '01';
                finalCode = `${deptPrefix}${yearNum}${codeNumber.padStart(2, '0')}`;
            }
            else {
                // Replace the year digit in existing pattern
                finalCode = finalCode.replace(/^([A-Z]{2,4})[1-4]/, `$1${yearNum}`);
            }
        }
        // Check if the final course code already exists (excluding current course)
        const codeConflict = yield prisma.course.findFirst({
            where: {
                code: finalCode,
                id: { not: id }
            }
        });
        if (codeConflict) {
            return res.status(409).json({
                status: 'error',
                error: 'Course code already exists',
                timestamp: new Date().toISOString()
            });
        }
        // Update the course
        const updatedCourse = yield prisma.course.update({
            where: { id },
            data: {
                name: name.trim(),
                code: finalCode,
                college_id: departmentRecord.college_id,
                departmentId: departmentRecord.id,
                type: type || 'theory'
            },
            include: {
                department: {
                    include: {
                        colleges: true
                    }
                }
            }
        });
        // Handle open elective restrictions
        if (type === 'open_elective') {
            // First, delete all existing restrictions for this course
            yield prisma.openElectiveRestriction.deleteMany({
                where: { courseId: id }
            });
            // Then add new restrictions if provided
            if (restrictedDepartments && restrictedDepartments.length > 0) {
                // Find department IDs for the restricted department codes
                const restrictedDepts = yield prisma.department.findMany({
                    where: {
                        code: {
                            in: restrictedDepartments
                        }
                    },
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                });
                // Create restrictions
                const restrictions = restrictedDepts.map(dept => ({
                    courseId: id,
                    restrictedDepartmentId: dept.id
                }));
                if (restrictions.length > 0) {
                    yield prisma.openElectiveRestriction.createMany({
                        data: restrictions
                    });
                }
            }
        }
        else {
            // If not an open elective, remove any existing restrictions
            yield prisma.openElectiveRestriction.deleteMany({
                where: { courseId: id }
            });
        }
        // Fetch the updated course with restrictions for response
        const courseWithRestrictions = yield prisma.course.findUnique({
            where: { id },
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
        res.json({
            status: 'success',
            data: Object.assign(Object.assign({}, courseWithRestrictions), { year: yearNum // Include the year in the response if provided
             }),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error updating course:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Delete course
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const prisma = database_1.default.getInstance();
        // Check if course exists
        const existingCourse = yield prisma.course.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        courseOfferings: true
                    }
                }
            }
        });
        if (!existingCourse) {
            return res.status(404).json({
                status: 'error',
                error: 'Course not found',
                timestamp: new Date().toISOString()
            });
        }
        // Check if course has offerings
        if (existingCourse._count.courseOfferings > 0) {
            return res.status(409).json({
                status: 'error',
                error: `Cannot delete course. It has ${existingCourse._count.courseOfferings} active offering(s). Please remove these offerings first.`,
                dependencies: {
                    courseOfferings: existingCourse._count.courseOfferings
                },
                timestamp: new Date().toISOString()
            });
        }
        // Delete course
        yield prisma.course.delete({
            where: { id }
        });
        res.json({
            status: 'success',
            message: 'Course deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Force delete course (cascading delete)
router.delete('/:id/force', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const prisma = database_1.default.getInstance();
        // Check if course exists and get all dependencies
        const existingCourse = yield prisma.course.findUnique({
            where: { id },
            include: {
                courseOfferings: {
                    include: {
                        enrollments: true,
                        attendances: true
                    }
                },
                courseElectiveGroupMembers: true
            }
        });
        if (!existingCourse) {
            return res.status(404).json({
                status: 'error',
                error: 'Course not found',
                timestamp: new Date().toISOString()
            });
        }
        // Force delete course with explicit cascading deletes
        // Delete all course offerings and their dependencies
        for (const offering of existingCourse.courseOfferings) {
            // Delete attendance records for this offering (through attendance sessions)
            for (const attendance of offering.attendances) {
                yield prisma.attendanceRecord.deleteMany({
                    where: { attendanceId: attendance.id }
                });
            }
            // Delete attendance sessions for this offering
            yield prisma.attendance.deleteMany({
                where: { offeringId: offering.id }
            });
            // Delete theory marks for enrollments in this offering
            yield prisma.theoryMarks.deleteMany({
                where: {
                    enrollment: {
                        offeringId: offering.id
                    }
                }
            });
            // Delete lab marks for enrollments in this offering
            yield prisma.labMarks.deleteMany({
                where: {
                    enrollment: {
                        offeringId: offering.id
                    }
                }
            });
            // Delete enrollments for this offering
            yield prisma.studentEnrollment.deleteMany({
                where: { offeringId: offering.id }
            });
            // Delete the offering
            yield prisma.courseOffering.delete({
                where: { id: offering.id }
            });
        }
        // Delete course elective group members
        yield prisma.courseElectiveGroupMember.deleteMany({
            where: { courseId: id }
        });
        // Finally delete the course
        yield prisma.course.delete({
            where: { id }
        });
        res.json({
            status: 'success',
            message: 'Course and all related data deleted successfully (forced)',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Upload students to course endpoint
router.post('/:courseId/students/upload', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { courseId } = req.params;
        const { academicYear, semester } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                status: 'error',
                error: 'No CSV file uploaded'
            });
        }
        if (!academicYear || !semester) {
            return res.status(400).json({
                status: 'error',
                error: 'Academic year and semester are required'
            });
        }
        const prisma = database_1.default.getInstance();
        // Verify course exists
        const course = yield prisma.course.findUnique({
            where: { id: courseId },
            include: {
                department: true,
                colleges: true,
                openElectiveRestrictions: {
                    include: {
                        restrictedDepartment: true
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({
                status: 'error',
                error: 'Course not found'
            });
        }
        // Find or create course offering
        let courseOffering = yield prisma.courseOffering.findFirst({
            where: {
                courseId: courseId,
                semester: parseInt(semester),
                academic_years: {
                    year_name: academicYear
                }
            },
            include: {
                academic_years: true
            }
        });
        if (!courseOffering) {
            // First find or create the academic year
            let academicYearRecord = yield prisma.academic_years.findFirst({
                where: {
                    year_name: academicYear,
                    college_id: course.college_id
                }
            });
            if (!academicYearRecord) {
                academicYearRecord = yield prisma.academic_years.create({
                    data: {
                        year_name: academicYear,
                        college_id: course.college_id,
                        is_active: true
                    }
                });
            }
            courseOffering = yield prisma.courseOffering.create({
                data: {
                    courseId: courseId,
                    semester: parseInt(semester),
                    year_id: academicYearRecord.year_id
                },
                include: {
                    academic_years: true
                }
            });
        }
        // Parse CSV data
        const csvData = file.buffer.toString('utf-8');
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({
                status: 'error',
                error: 'CSV file must contain headers and at least one student record'
            });
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        // Validate required headers
        const requiredHeaders = ['usn'];
        const optionalHeaders = ['name', 'email', 'section'];
        for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
                return res.status(400).json({
                    status: 'error',
                    error: `Missing required column: ${required}`
                });
            }
        }
        const results = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: []
        };
        // Process each student record
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                results.failed++;
                results.errors.push(`Line ${i + 1}: Column count mismatch`);
                continue;
            }
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            results.total++;
            try {
                // Find student by USN
                const student = yield prisma.student.findUnique({
                    where: { usn: record.usn },
                    include: {
                        departments: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        }
                    }
                });
                if (!student) {
                    results.failed++;
                    results.errors.push(`Line ${i + 1}: Student with USN ${record.usn} not found`);
                    continue;
                }
                // Validate open elective restrictions
                if (course.type === 'open_elective') {
                    const restrictedDepartmentIds = ((_a = course.openElectiveRestrictions) === null || _a === void 0 ? void 0 : _a.map((r) => r.restrictedDepartmentId)) || [];
                    if (restrictedDepartmentIds.length > 0 && student.departments && restrictedDepartmentIds.includes(student.departments.id)) {
                        results.failed++;
                        results.errors.push(`Line ${i + 1}: Student ${record.usn} from ${student.departments.code} department cannot enroll in this open elective course`);
                        continue;
                    }
                }
                // Check if enrollment already exists
                const existingEnrollment = yield prisma.studentEnrollment.findFirst({
                    where: {
                        studentId: student.id,
                        offeringId: courseOffering.id
                    }
                });
                if (existingEnrollment) {
                    results.failed++;
                    results.errors.push(`Line ${i + 1}: Student ${record.usn} is already enrolled in this course offering`);
                    continue;
                }
                // Create enrollment
                yield prisma.studentEnrollment.create({
                    data: {
                        studentId: student.id,
                        offeringId: courseOffering.id,
                        attemptNumber: 1
                    }
                });
                results.successful++;
            }
            catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Line ${i + 1}: ${errorMessage}`);
            }
        }
        res.json({
            status: 'success',
            message: `Student enrollment upload completed`,
            data: {
                course: {
                    id: course.id,
                    code: course.code,
                    name: course.name
                },
                offering: {
                    id: courseOffering.id,
                    academicYear: ((_b = courseOffering.academic_years) === null || _b === void 0 ? void 0 : _b.year_name) || academicYear,
                    semester: courseOffering.semester
                },
                results
            }
        });
    }
    catch (error) {
        console.error('Upload students error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
// Get enrolled students for a course offering
router.get('/:courseId/students', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const { academicYear, semester } = req.query;
        const prisma = database_1.default.getInstance();
        // Build where clause for course offering
        const offeringWhere = { courseId };
        if (semester)
            offeringWhere.semester = parseInt(semester);
        if (academicYear) {
            offeringWhere.academic_years = {
                year_name: academicYear
            };
        }
        const enrollments = yield prisma.studentEnrollment.findMany({
            where: {
                offering: offeringWhere
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                username: true
                            }
                        },
                        sections: {
                            select: {
                                section_id: true,
                                section_name: true
                            }
                        },
                        departments: {
                            select: {
                                id: true,
                                name: true,
                                code: true
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
                                name: true
                            }
                        },
                        academic_years: {
                            select: {
                                year_id: true,
                                year_name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                student: {
                    usn: 'asc'
                }
            }
        });
        res.json({
            status: 'success',
            data: enrollments
        });
    }
    catch (error) {
        console.error('Get enrolled students error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}));
exports.default = router;
