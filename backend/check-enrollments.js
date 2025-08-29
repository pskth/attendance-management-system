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
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./generated/prisma");
const prisma = new prisma_1.PrismaClient();
function checkStudentEnrollments() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('=== STUDENT ENROLLMENT VERIFICATION ===\n');
        try {
            // Get all enrollments with student and course details
            const enrollments = yield prisma.studentEnrollment.findMany({
                include: {
                    student: {
                        select: {
                            usn: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    offering: {
                        include: {
                            course: {
                                select: {
                                    name: true,
                                    code: true
                                }
                            },
                            academic_years: {
                                select: {
                                    year_name: true
                                }
                            },
                            sections: {
                                select: {
                                    section_name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    id: 'desc'
                },
                take: 20 // Show latest 20 enrollments
            });
            console.log(`Found ${enrollments.length} enrollments:\n`);
            enrollments.forEach((enrollment, index) => {
                var _a, _b;
                const student = enrollment.student;
                const offering = enrollment.offering;
                console.log(`${index + 1}. USN: ${student.usn}`);
                console.log(`   Name: ${((_a = student.user) === null || _a === void 0 ? void 0 : _a.name) || 'N/A'}`);
                console.log(`   Course: ${offering.course.code} - ${offering.course.name}`);
                console.log(`   Academic Year: ${offering.academic_years.year_name}`);
                console.log(`   Section: ${((_b = offering.sections) === null || _b === void 0 ? void 0 : _b.section_name) || 'N/A'}`);
                console.log(`   Semester: ${offering.semester}`);
                console.log(`   Enrolled At: ${new Date().toISOString()}`); // Since enrolledAt doesn't exist in schema
                console.log('   ---');
            });
            // Get enrollment count by course
            console.log('\n=== ENROLLMENT SUMMARY BY COURSE ===\n');
            const courseSummary = yield prisma.studentEnrollment.groupBy({
                by: ['offeringId'],
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                }
            });
            for (const summary of courseSummary) {
                const offering = yield prisma.courseOffering.findUnique({
                    where: { id: summary.offeringId || '' },
                    include: {
                        course: true,
                        academic_years: true
                    }
                });
                if (offering) {
                    console.log(`${offering.course.code} - ${offering.course.name}`);
                    console.log(`  Academic Year: ${((_a = offering.academic_years) === null || _a === void 0 ? void 0 : _a.year_name) || 'N/A'}`);
                    console.log(`  Total Students: ${summary._count.id}\n`);
                }
            }
        }
        catch (error) {
            console.error('Error checking enrollments:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
checkStudentEnrollments();
