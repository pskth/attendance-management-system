"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Excel Import Route for Admin Dashboard
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const xlsx_1 = __importDefault(require("xlsx"));
const database_1 = __importDefault(require("../../lib/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Excel upload endpoint
router.post('/import-excel/:type', upload.single('file'), async (req, res) => {
    try {
        const { type } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        // Parse Excel file
        const workbook = xlsx_1.default.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx_1.default.utils.sheet_to_json(worksheet);
        if (!data || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Excel file is empty'
            });
        }
        const prisma = database_1.default.getInstance();
        let recordsProcessed = 0;
        const errors = [];
        // Process based on type
        switch (type) {
            case 'colleges':
                for (const row of data) {
                    try {
                        await prisma.college.upsert({
                            where: { code: row.code },
                            update: { name: row.name },
                            create: {
                                code: row.code,
                                name: row.name,
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'departments':
                for (const row of data) {
                    try {
                        const college = await prisma.college.findUnique({
                            where: { code: row.college_code }
                        });
                        if (!college) {
                            errors.push(`Row ${recordsProcessed + 1}: College ${row.college_code} not found`);
                            continue;
                        }
                        await prisma.department.upsert({
                            where: {
                                college_id_code: {
                                    college_id: college.id,
                                    code: row.code
                                }
                            },
                            update: { name: row.name },
                            create: {
                                college_id: college.id,
                                code: row.code,
                                name: row.name,
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'sections':
                for (const row of data) {
                    try {
                        const department = await prisma.department.findFirst({
                            where: {
                                code: row.department_code,
                                colleges: { code: row.college_code }
                            }
                        });
                        if (!department) {
                            errors.push(`Row ${recordsProcessed + 1}: Department ${row.department_code} not found`);
                            continue;
                        }
                        await prisma.sections.upsert({
                            where: {
                                department_id_section_name: {
                                    department_id: department.id,
                                    section_name: row.section_name
                                }
                            },
                            update: {},
                            create: {
                                department_id: department.id,
                                section_name: row.section_name,
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'users':
                const defaultPasswordHash = await bcryptjs_1.default.hash('password123', 10);
                for (const row of data) {
                    try {
                        const user = await prisma.user.upsert({
                            where: { username: row.username },
                            update: {
                                name: row.name,
                                email: row.email || null,
                                phone: row.phone || null,
                            },
                            create: {
                                username: row.username,
                                name: row.name,
                                email: row.email || null,
                                phone: row.phone || null,
                                passwordHash: defaultPasswordHash,
                            }
                        });
                        // Create user role if specified
                        if (row.role) {
                            await prisma.userRoleAssignment.upsert({
                                where: {
                                    userId_role: {
                                        userId: user.id,
                                        role: row.role
                                    }
                                },
                                update: {},
                                create: {
                                    userId: user.id,
                                    role: row.role,
                                }
                            });
                        }
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'students':
                for (const row of data) {
                    try {
                        const user = await prisma.user.findUnique({
                            where: { username: row.usn }
                        });
                        if (!user) {
                            errors.push(`Row ${recordsProcessed + 1}: User ${row.usn} not found`);
                            continue;
                        }
                        const college = await prisma.college.findUnique({
                            where: { code: row.college_code }
                        });
                        if (!college) {
                            errors.push(`Row ${recordsProcessed + 1}: College ${row.college_code} not found`);
                            continue;
                        }
                        const department = await prisma.department.findFirst({
                            where: {
                                code: row.department_code,
                                college_id: college.id
                            }
                        });
                        if (!department) {
                            errors.push(`Row ${recordsProcessed + 1}: Department ${row.department_code} not found`);
                            continue;
                        }
                        const section = await prisma.sections.findFirst({
                            where: {
                                section_name: row.section,
                                department_id: department.id
                            }
                        });
                        if (!section) {
                            errors.push(`Row ${recordsProcessed + 1}: Section ${row.section} not found`);
                            continue;
                        }
                        await prisma.student.upsert({
                            where: { usn: row.usn },
                            update: {
                                semester: parseInt(row.semester) || 1,
                                batchYear: parseInt(row.batch_year) || new Date().getFullYear(),
                            },
                            create: {
                                usn: row.usn,
                                userId: user.id,
                                college_id: college.id,
                                department_id: department.id,
                                section_id: section.section_id,
                                semester: parseInt(row.semester) || 1,
                                batchYear: parseInt(row.batch_year) || new Date().getFullYear(),
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'teachers':
                for (const row of data) {
                    try {
                        const user = await prisma.user.findUnique({
                            where: { username: row.username }
                        });
                        if (!user) {
                            errors.push(`Row ${recordsProcessed + 1}: User ${row.username} not found`);
                            continue;
                        }
                        const college = await prisma.college.findUnique({
                            where: { code: row.college_code }
                        });
                        if (!college) {
                            errors.push(`Row ${recordsProcessed + 1}: College ${row.college_code} not found`);
                            continue;
                        }
                        const department = await prisma.department.findFirst({
                            where: {
                                code: row.department_code,
                                college_id: college.id
                            }
                        });
                        if (!department) {
                            errors.push(`Row ${recordsProcessed + 1}: Department ${row.department_code} not found`);
                            continue;
                        }
                        await prisma.teacher.upsert({
                            where: { userId: user.id },
                            update: {
                                departmentId: department.id,
                                college_id: college.id,
                            },
                            create: {
                                userId: user.id,
                                departmentId: department.id,
                                college_id: college.id,
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'courses':
                for (const row of data) {
                    try {
                        const department = await prisma.department.findFirst({
                            where: {
                                code: row.department_code,
                                colleges: { code: row.college_code }
                            }
                        });
                        if (!department) {
                            errors.push(`Row ${recordsProcessed + 1}: Department ${row.department_code} not found`);
                            continue;
                        }
                        await prisma.course.upsert({
                            where: {
                                departmentId_code: {
                                    departmentId: department.id,
                                    code: row.code
                                }
                            },
                            update: {
                                name: row.name,
                                type: row.type || 'core',
                                year: parseInt(row.year) || 1
                            },
                            create: {
                                code: row.code,
                                name: row.name,
                                departmentId: department.id,
                                type: row.type || 'core',
                                year: parseInt(row.year) || 1
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            case 'academic_years':
                for (const row of data) {
                    try {
                        // Get the college
                        const college = await prisma.college.findUnique({
                            where: { code: row.college_code || 'NMAMIT' }
                        });
                        if (!college) {
                            errors.push(`Row ${recordsProcessed + 1}: College not found`);
                            continue;
                        }
                        await prisma.academic_years.upsert({
                            where: {
                                college_id_year_name: {
                                    college_id: college.id,
                                    year_name: row.year_name
                                }
                            },
                            update: {
                                start_date: new Date(row.start_date),
                                end_date: new Date(row.end_date),
                            },
                            create: {
                                college_id: college.id,
                                year_name: row.year_name,
                                start_date: new Date(row.start_date),
                                end_date: new Date(row.end_date),
                            }
                        });
                        recordsProcessed++;
                    }
                    catch (error) {
                        errors.push(`Row ${recordsProcessed + 1}: ${error.message}`);
                    }
                }
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown import type: ${type}`
                });
        }
        res.json({
            success: true,
            message: `Successfully imported ${recordsProcessed} records`,
            recordsProcessed,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Import failed'
        });
    }
});
exports.default = router;
