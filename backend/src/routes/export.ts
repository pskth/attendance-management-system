// src/routes/export.ts
import { Router, Response } from 'express';
import DatabaseService from '../lib/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface ExportFilters {
    academicYear?: string;
    department?: string;
    section?: string;
    course?: string;
}

// Helper function to get analytics data for export
async function getAnalyticsDataForExport(filters: ExportFilters) {
    const prisma = DatabaseService.getInstance();

    // Get departments with their sections and course offerings (matching existing analytics structure)
    const departments = await prisma.department.findMany({
        include: {
            sections: {
                include: {
                    course_offerings: {
                        include: {
                            course: true,
                            enrollments: {
                                include: {
                                    student: {
                                        include: {
                                            user: true
                                        }
                                    },
                                    theoryMarks: true,
                                    labMarks: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const exportData = {
        overview: {
            totalStudents: 0,
            totalCourses: 0,
            totalSections: 0,
            averageAttendance: 0,
            averageMarks: 0,
            generatedAt: new Date().toISOString(),
            academicYear: filters.academicYear || '2024-25'
        },
        departments: [] as any[],
        detailedStudentData: [] as any[]
    };

    let allUniqueStudents = new Set();
    let allCourses = new Set();
    let totalAttendanceRecords = 0;
    let totalPresentRecords = 0;
    let totalMarks = 0;
    let marksCount = 0;

    for (const dept of departments) {
        const deptData = {
            departmentName: dept.name,
            departmentCode: dept.code || 'N/A',
            sections: [] as any[],
            totalStudents: 0,
            averageAttendance: 0,
            averageMarks: 0
        };

        // Get unique students for this department
        const departmentUniqueStudentIds = new Set();

        for (const section of dept.sections) {
            const sectionData = {
                sectionName: section.section_name,
                students: [] as any[],
                courses: [] as any[]
            };

            // Process course offerings and their enrolled students
            for (const offering of section.course_offerings) {
                allCourses.add(offering.course.code);

                for (const enrollment of offering.enrollments) {
                    if (!enrollment.student) continue;

                    const student = enrollment.student;
                    allUniqueStudents.add(student.id);
                    departmentUniqueStudentIds.add(student.id);

                    // Calculate individual student attendance for this course
                    const studentAttendanceRecords = await prisma.attendanceRecord.findMany({
                        where: {
                            studentId: student.id,
                            attendance: {
                                offeringId: offering.id
                            }
                        }
                    });

                    const studentPresentCount = studentAttendanceRecords.filter(record => record.status === 'present').length;
                    const studentTotalCount = studentAttendanceRecords.length;
                    const studentAttendancePercent = studentTotalCount > 0 ? (studentPresentCount / studentTotalCount) * 100 : 0;

                    totalAttendanceRecords += studentTotalCount;
                    totalPresentRecords += studentPresentCount;

                    // Calculate individual student marks for this course
                    let studentTheoryMarks = 0;
                    let studentLabMarks = 0;

                    if (enrollment.theoryMarks) {
                        const theoryMark = enrollment.theoryMarks;
                        studentTheoryMarks = (theoryMark.mse1Marks || 0) + (theoryMark.mse2Marks || 0) +
                            (theoryMark.mse3Marks || 0) + (theoryMark.task1Marks || 0) +
                            (theoryMark.task2Marks || 0) + (theoryMark.task3Marks || 0);
                        totalMarks += studentTheoryMarks;
                        marksCount++;
                    }

                    if (enrollment.labMarks) {
                        const labMark = enrollment.labMarks;
                        studentLabMarks = (labMark.recordMarks || 0) + (labMark.continuousEvaluationMarks || 0) +
                            (labMark.labMseMarks || 0);
                        totalMarks += studentLabMarks;
                        marksCount++;
                    }

                    const studentTotalMarks = studentTheoryMarks + studentLabMarks;

                    const studentData = {
                        name: student.user?.name || 'Unknown',
                        usn: student.usn,
                        semester: student.semester,
                        courseName: offering.course.name,
                        courseCode: offering.course.code,
                        attendancePercent: Math.round(studentAttendancePercent * 10) / 10,
                        theoryMarks: studentTheoryMarks,
                        labMarks: studentLabMarks,
                        totalMarks: studentTotalMarks
                    };

                    exportData.detailedStudentData.push({
                        ...studentData,
                        department: dept.name,
                        departmentCode: dept.code || 'N/A',
                        section: section.section_name
                    });
                }
            }

            deptData.sections.push(sectionData);
        }

        deptData.totalStudents = departmentUniqueStudentIds.size;
        exportData.departments.push(deptData);
    }

    // Calculate department averages
    for (const deptData of exportData.departments) {
        const deptStudents = exportData.detailedStudentData.filter(s => s.departmentCode === deptData.departmentCode);
        if (deptStudents.length > 0) {
            deptData.averageAttendance = deptStudents.reduce((sum, s) => sum + s.attendancePercent, 0) / deptStudents.length;
            deptData.averageMarks = deptStudents.reduce((sum, s) => sum + s.totalMarks, 0) / deptStudents.length;
        }
    }

    // Set overview statistics
    exportData.overview.totalStudents = allUniqueStudents.size;
    exportData.overview.totalCourses = allCourses.size;
    exportData.overview.totalSections = departments.reduce((sum, d) => sum + d.sections.length, 0);
    exportData.overview.averageAttendance = totalAttendanceRecords > 0 ?
        ((totalPresentRecords / totalAttendanceRecords) * 100) : 0;
    exportData.overview.averageMarks = marksCount > 0 ? (totalMarks / marksCount) : 0;

    return exportData;
}

// Convert data to CSV format
function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
        Object.values(row).map(value =>
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
    ).join('\n');

    return `${headers}\n${rows}`;
}

// Set response headers for file download
function setDownloadHeaders(res: Response, filename: string, contentType: string) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
}

// Export as CSV
router.get('/csv', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const filters: ExportFilters = {
            academicYear: req.query.academicYear as string
        };

        const data = await getAnalyticsDataForExport(filters);
        const csvData = convertToCSV(data.detailedStudentData);

        const filename = `analytics_report_${filters.academicYear}_${Date.now()}.csv`;
        setDownloadHeaders(res, filename, 'text/csv');

        res.send(csvData);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to export CSV data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Export as JSON (for Excel processing)
router.get('/excel', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const filters: ExportFilters = {
            academicYear: req.query.academicYear as string
        };

        const data = await getAnalyticsDataForExport(filters);

        // Format data for Excel-friendly structure
        const excelData = {
            summary: {
                report_title: `Analytics Report - ${data.overview.academicYear}`,
                generated_at: data.overview.generatedAt,
                total_students: data.overview.totalStudents,
                total_courses: data.overview.totalCourses,
                average_attendance: `${data.overview.averageAttendance.toFixed(1)}%`,
                average_marks: data.overview.averageMarks.toFixed(1)
            },
            student_details: data.detailedStudentData.map(student => ({
                'Student Name': student.name,
                'USN': student.usn,
                'Department': student.department,
                'Section': student.section,
                'Semester': student.semester,
                'Course Name': student.courseName,
                'Course Code': student.courseCode,
                'Attendance %': student.attendancePercent,
                'Theory Marks': student.theoryMarks,
                'Lab Marks': student.labMarks,
                'Total Marks': student.totalMarks
            })),
            department_summary: data.departments.map(dept => ({
                'Department': dept.departmentName,
                'Code': dept.departmentCode,
                'Total Students': dept.totalStudents,
                'Average Attendance %': dept.averageAttendance.toFixed(1),
                'Average Marks': dept.averageMarks.toFixed(1)
            }))
        };

        const filename = `analytics_report_${filters.academicYear}_${Date.now()}.json`;
        setDownloadHeaders(res, filename, 'application/json');

        res.json(excelData);
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to export Excel data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Export as PDF-ready JSON
router.get('/pdf', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const filters: ExportFilters = {
            academicYear: req.query.academicYear as string
        };

        const data = await getAnalyticsDataForExport(filters);

        // Format data for PDF generation
        const pdfData = {
            title: `Analytics Report - ${data.overview.academicYear}`,
            subtitle: `Generated on ${new Date(data.overview.generatedAt).toLocaleDateString()}`,
            overview: data.overview,
            departments: data.departments,
            studentData: data.detailedStudentData,
            metadata: {
                totalPages: Math.ceil(data.detailedStudentData.length / 20), // Assuming 20 students per page
                recordCount: data.detailedStudentData.length
            }
        };

        const filename = `analytics_report_${filters.academicYear}_${Date.now()}.json`;
        setDownloadHeaders(res, filename, 'application/json');

        res.json(pdfData);
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to export PDF data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get available academic years for export filters
router.get('/academic-years', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();

        const academicYears = await prisma.academic_years.findMany({
            select: {
                year_name: true
            },
            orderBy: {
                year_name: 'desc'
            }
        });

        const years = academicYears.map(ay => ay.year_name);

        res.json({
            status: 'success',
            data: years
        });
    } catch (error) {
        console.error('Academic years export error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch academic years',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
