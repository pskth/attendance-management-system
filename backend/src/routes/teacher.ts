// src/routes/teacher.ts
import { Router } from 'express';
import DatabaseService from '../lib/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

console.log('=== TEACHER ROUTES LOADED ===');

// Get teacher profile and dashboard data
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Get teacher profile with related data
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                colleges: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                courseOfferings: {
                    include: {
                        course: {
                            include: {
                                department: true
                            }
                        },
                        sections: true,
                        academic_years: true,
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher profile not found' });
        }

        // Calculate statistics
        const totalCourses = teacher.courseOfferings.length;
        const totalStudents = new Set(
            teacher.courseOfferings.flatMap(offering =>
                offering.enrollments.map(enrollment => enrollment.student?.id)
            ).filter(Boolean)
        ).size;

        // Get total sessions count for statistics (all sessions ever taken by this teacher)
        const totalSessionsCount = await prisma.attendance.count({
            where: {
                teacherId: teacher.id,
                status: 'held' // Only count sessions that were actually held
            }
        });

        // Get recent attendance sessions for display (separate from total count)
        const recentAttendanceSessions = await prisma.attendance.findMany({
            where: {
                teacherId: teacher.id
            },
            include: {
                offering: {
                    include: {
                        course: true,
                        sections: true
                    }
                },
                attendanceRecords: true
            },
            orderBy: {
                classDate: 'desc'
            },
            take: 5 // Only get 5 recent sessions for display
        });

        // Calculate average attendance across all sessions
        const allAttendanceSessions = await prisma.attendance.findMany({
            where: {
                teacherId: teacher.id,
                status: 'held'
            },
            include: {
                attendanceRecords: true
            }
        });

        let averageAttendance = 0;
        if (allAttendanceSessions.length > 0) {
            const totalAttendanceRecords = allAttendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.length, 0);
            const totalPresentRecords = allAttendanceSessions.reduce((sum, session) =>
                sum + session.attendanceRecords.filter(record => record.status === 'present').length, 0);

            averageAttendance = totalAttendanceRecords > 0 ? (totalPresentRecords / totalAttendanceRecords) * 100 : 0;
        }

        // Calculate today's schedule (mock for now)
        const todaySchedule = teacher.courseOfferings.map(offering => ({
            courseId: offering.course.id,
            courseName: offering.course.name,
            courseCode: offering.course.code,
            section: offering.sections?.section_name || 'Unknown',
            time: '10:00 AM', // Mock time - should come from timetable
            duration: '1 hour',
            studentsEnrolled: offering.enrollments.length
        }));

        const dashboardData = {
            teacher: {
                id: teacher.id,
                name: teacher.user.name,
                email: teacher.user.email,
                phone: teacher.user.phone,
                photoUrl: teacher.user.photoUrl,
                department: teacher.department?.name || 'Unknown',
                departmentCode: teacher.department?.code || 'N/A',
                college: teacher.colleges?.name || 'Unknown',
                collegeCode: teacher.colleges?.code || 'N/A'
            },
            statistics: {
                totalCourses,
                totalStudents,
                totalSessions: totalSessionsCount, // Use correct total count instead of recentAttendanceSessions.length
                averageAttendance: Math.round(averageAttendance * 10) / 10 // Use calculated average attendance with 1 decimal place
            },
            recentSessions: recentAttendanceSessions.map(session => ({
                id: session.id,
                date: session.classDate,
                courseName: session.offering?.course.name || 'Unknown',
                courseCode: session.offering?.course.code || 'N/A',
                section: session.offering?.sections?.section_name || 'Unknown',
                topic: session.syllabusCovered || 'No topic recorded',
                attendanceCount: session.attendanceRecords.length,
                presentCount: session.attendanceRecords.filter(r => r.status === 'present').length
            })),
            todaySchedule
        };

        res.json({
            status: 'success',
            data: dashboardData
        });

    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load teacher dashboard',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get courses assigned to teacher
router.get('/courses', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    include: {
                        course: {
                            include: {
                                department: true
                            }
                        },
                        sections: true,
                        academic_years: true,
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }

        const coursesData = teacher.courseOfferings.map(offering => ({
            offeringId: offering.id,
            course: {
                id: offering.course.id,
                name: offering.course.name,
                code: offering.course.code,
                type: offering.course.type,
                hasTheoryComponent: offering.course.hasTheoryComponent,
                hasLabComponent: offering.course.hasLabComponent,
                department: offering.course.department?.name || 'Unknown'
            },
            section: offering.sections ? {
                id: offering.sections.section_id,
                name: offering.sections.section_name
            } : null,
            academicYear: offering.academic_years?.year_name || 'Unknown',
            enrolledStudents: offering.enrollments.length,
            students: offering.enrollments.map(enrollment => ({
                id: enrollment.student?.id || '',
                name: enrollment.student?.user?.name || 'Unknown',
                usn: enrollment.student?.usn || 'N/A'
            }))
        }));

        res.json({
            status: 'success',
            data: coursesData
        });

    } catch (error) {
        console.error('Teacher courses error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load teacher courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get students for a specific course offering
router.get('/courses/:offeringId/students', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { offeringId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Verify teacher has access to this course offering
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });

        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        // Get students enrolled in the course offering
        const enrollments = await prisma.studentEnrollment.findMany({
            where: { offeringId },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        departments: true,
                        sections: true
                    }
                },
                offering: {
                    include: {
                        course: true
                    }
                }
            }
        });

        const studentsData = enrollments.map(enrollment => ({
            enrollmentId: enrollment.id,
            student: {
                id: enrollment.student?.id || '',
                usn: enrollment.student?.usn || 'N/A',
                name: enrollment.student?.user?.name || 'Unknown',
                email: enrollment.student?.user?.email || 'N/A',
                phone: enrollment.student?.user?.phone || 'N/A',
                semester: enrollment.student?.semester || 0,
                department: enrollment.student?.departments?.name || 'Unknown',
                section: enrollment.student?.sections?.section_name || 'Unknown'
            },
            course: {
                id: enrollment.offering?.course.id || '',
                name: enrollment.offering?.course.name || 'Unknown',
                code: enrollment.offering?.course.code || 'N/A'
            }
        }));

        res.json({
            status: 'success',
            data: studentsData
        });

    } catch (error) {
        console.error('Teacher course students error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load course students',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Take attendance for a course
router.post('/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { offeringId, classDate, periodNumber, syllabusCovered, hoursTaken, attendanceData } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Verify teacher has access to this course offering
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });

        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        // Create attendance session
        const attendanceSession = await prisma.attendance.create({
            data: {
                offeringId,
                teacherId: teacher.id,
                classDate: new Date(classDate),
                periodNumber: periodNumber || 1,
                syllabusCovered: syllabusCovered || '',
                status: 'held'
            }
        });

        // Create attendance records for each student
        const attendanceRecords = [];
        for (const record of attendanceData) {
            const attendanceRecord = await prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: record.studentId,
                    status: record.status
                }
            });
            attendanceRecords.push(attendanceRecord);
        }

        res.json({
            status: 'success',
            message: 'Attendance saved successfully',
            data: {
                sessionId: attendanceSession.id,
                recordsCount: attendanceRecords.length,
                presentCount: attendanceRecords.filter(r => r.status === 'present').length,
                absentCount: attendanceRecords.filter(r => r.status === 'absent').length
            }
        });

    } catch (error) {
        console.error('Take attendance error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to save attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get attendance history for a course
router.get('/courses/:offeringId/attendance-history', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { offeringId } = req.params;
        const { limit = '10' } = req.query;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Verify teacher has access to this course offering
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });

        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        const attendanceSessions = await prisma.attendance.findMany({
            where: {
                offeringId,
                teacherId: teacher.id
            },
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                classDate: 'desc'
            },
            take: parseInt(limit as string)
        });

        const historyData = attendanceSessions.map(session => ({
            id: session.id,
            date: session.classDate,
            periodNumber: session.periodNumber,
            topic: session.syllabusCovered,
            totalStudents: session.attendanceRecords.length,
            presentCount: session.attendanceRecords.filter(r => r.status === 'present').length,
            absentCount: session.attendanceRecords.filter(r => r.status === 'absent').length,
            attendancePercentage: session.attendanceRecords.length > 0
                ? (session.attendanceRecords.filter(r => r.status === 'present').length / session.attendanceRecords.length) * 100
                : 0
        }));

        res.json({
            status: 'success',
            data: historyData
        });

    } catch (error) {
        console.error('Attendance history error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load attendance history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get student attendance analytics for a course
router.get('/courses/:offeringId/attendance-analytics', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { offeringId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Verify teacher has access to this course offering
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    where: { id: offeringId }
                }
            }
        });

        if (!teacher || teacher.courseOfferings.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        // Get all students and their attendance records for this course
        const enrollments = await prisma.studentEnrollment.findMany({
            where: { offeringId },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        attendanceRecords: {
                            include: {
                                attendance: {
                                    where: {
                                        offeringId
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const analyticsData = enrollments.map(enrollment => {
            const student = enrollment.student;
            if (!student) return null;

            const attendanceRecords = student.attendanceRecords.filter(record =>
                record.attendance?.offeringId === offeringId
            );

            const totalClasses = attendanceRecords.length;
            const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
            const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

            return {
                student: {
                    id: student.id,
                    usn: student.usn,
                    name: student.user?.name || 'Unknown',
                    email: student.user?.email || 'N/A',
                    phone: student.user?.phone || 'N/A'
                },
                attendance: {
                    totalClasses,
                    presentCount,
                    absentCount: totalClasses - presentCount,
                    attendancePercentage: Math.round(attendancePercentage * 10) / 10
                }
            };
        }).filter(Boolean);

        // Sort by attendance percentage (lowest first to identify at-risk students)
        analyticsData.sort((a, b) => (a?.attendance.attendancePercentage || 0) - (b?.attendance.attendancePercentage || 0));

        res.json({
            status: 'success',
            data: analyticsData
        });

    } catch (error) {
        console.error('Attendance analytics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load attendance analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
