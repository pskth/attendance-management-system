// src/routes/teacher.ts
import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import DatabaseService from '../lib/database';
import dashboardRoutes from './teacher/dashboardRoutes';
import courseRoutes from './teacher/courseRoutes';
import attendanceRoutes from './teacher/attendanceRoutes';
import marksRoutes from './teacher/marksRoutes';

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

//get coursename and coursecode from this course id :
router.get('/coursecnc/:courseId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();
        const cId = req.params.courseId;

        const cnc = await prisma.course.findUnique({
            where: { id: cId },
            select: {
                name: true,
                code: true
            }
        });

        if (!cnc) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        res.json({
            status: 'success',
            data: cnc
        });

    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load course',
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

                department: offering.course.department?.name || 'Unknown'
            },
            section: offering.sections ? {
                id: offering.sections.section_id,
                name: offering.sections.section_name
            } : null,
            academicYear: offering.academic_years?.year_name || 'Unknown',
            semester: offering.semester || 0,
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

// TEST ROUTE - to verify routing is working
router.get('/courses/:offeringId/test', authenticateToken, async (req: AuthenticatedRequest, res) => {
    console.log('🔥🔥🔥 TEST ROUTE HIT!!! 🔥🔥🔥');
    res.json({ message: 'Test route works!', offeringId: req.params.offeringId });
});

// Get course statistics for dashboard
router.get('/courses/:offeringId/statistics', authenticateToken, async (req: AuthenticatedRequest, res) => {
    console.log('🚨🚨🚨 STATISTICS ROUTE HIT!!! 🚨🚨🚨');
    try {
        const userId = req.user?.id;
        const { offeringId } = req.params;

        console.log('=== COURSE STATISTICS REQUEST ===');
        console.log('User ID:', userId);
        console.log('Offering ID:', offeringId);

        if (!userId) {
            console.log('ERROR: User not authenticated');
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

        console.log('Teacher found:', teacher ? 'Yes' : 'No');
        console.log('Course offerings for teacher:', teacher?.courseOfferings?.length || 0);

        if (!teacher || teacher.courseOfferings.length === 0) {
            console.log('ERROR: Access denied to course offering', offeringId);
            console.log('Teacher courseOfferings:', teacher?.courseOfferings);
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        console.log('Access granted, fetching statistics...');

        // Get statistics for this course offering
        const attendanceSessions = await prisma.attendance.findMany({
            where: {
                offeringId,
                teacherId: teacher.id,
                status: 'held'
            },
            include: {
                attendanceRecords: true
            }
        });

        console.log('Attendance sessions found:', attendanceSessions.length);

        const totalClasses = attendanceSessions.length;
        const totalAttendanceRecords = attendanceSessions.reduce((sum, session) => sum + session.attendanceRecords.length, 0);
        const totalPresentRecords = attendanceSessions.reduce((sum, session) =>
            sum + session.attendanceRecords.filter(record => record.status === 'present').length, 0);

        const overallAttendancePercentage = totalAttendanceRecords > 0
            ? (totalPresentRecords / totalAttendanceRecords) * 100
            : 0;

        const statistics = {
            classesCompleted: totalClasses,
            totalClasses: totalClasses, // For now, assume all held sessions are completed
            overallAttendancePercentage: Math.round(overallAttendancePercentage * 10) / 10
        };

        console.log('Statistics calculated:', statistics);
        console.log('=== END COURSE STATISTICS REQUEST ===');

        res.json({
            status: 'success',
            data: statistics
        });

    } catch (error) {
        console.error('Course statistics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load course statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// // Update student marks (teachers can only update marks for their assigned courses)
// router.put('/marks/:enrollmentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
//     const { enrollmentId } = req.params;
//     const markData = req.body;

//     try {
//         const userId = req.user?.id;
//         if (!userId) {
//             return res.status(401).json({ status: 'error', message: 'User not authenticated' });
//         }

//         const prisma = DatabaseService.getInstance();

//         // Get teacher info
//         const teacher = await prisma.teacher.findUnique({
//             where: { userId }
//         });

//         if (!teacher) {
//             return res.status(403).json({ status: 'error', message: 'Teacher not found' });
//         }

//         // Check if enrollment exists and verify teacher has access to this course
//         const enrollment = await prisma.studentEnrollment.findUnique({
//             where: { id: enrollmentId },
//             include: {
//                 offering: {
//                     include: {
//                         teacher: true
//                     }
//                 }
//             }
//         });

//         if (!enrollment) {
//             return res.status(404).json({
//                 status: 'error',
//                 error: 'Enrollment not found'
//             });
//         }

//         // Verify teacher has access to this course
//         if (!enrollment.offering || enrollment.offering.teacherId !== teacher.id) {
//             return res.status(403).json({
//                 status: 'error',
//                 error: 'Access denied - you can only update marks for your assigned courses'
//             });
//         }

//         // Determine if this is theory or lab marks update
//         const isTheoryUpdate = ['mse1_marks', 'mse2_marks', 'mse3_marks', 'task1_marks', 'task2_marks', 'task3_marks'].some(field => field in markData);
//         const isLabUpdate = ['record_marks', 'continuous_evaluation_marks', 'lab_mse_marks'].some(field => field in markData);

//         if (isTheoryUpdate) {
//             // Update theory marks
//             const theoryMarkData: any = {};
//             if ('mse1_marks' in markData) theoryMarkData.mse1Marks = markData.mse1_marks;
//             if ('mse2_marks' in markData) theoryMarkData.mse2Marks = markData.mse2_marks;
//             if ('mse3_marks' in markData) theoryMarkData.mse3Marks = markData.mse3_marks;
//             if ('task1_marks' in markData) theoryMarkData.task1Marks = markData.task1_marks;
//             if ('task2_marks' in markData) theoryMarkData.task2Marks = markData.task2_marks;
//             if ('task3_marks' in markData) theoryMarkData.task3Marks = markData.task3_marks;

//             // Get current marks to check MSE3 eligibility
//             const currentMarks = await prisma.theoryMarks.findUnique({
//                 where: { enrollmentId }
//             });

//             // Calculate MSE1 + MSE2 total (use new values if being updated, otherwise use current values)
//             const mse1 = theoryMarkData.mse1Marks !== undefined ? theoryMarkData.mse1Marks : (currentMarks?.mse1Marks || 0);
//             const mse2 = theoryMarkData.mse2Marks !== undefined ? theoryMarkData.mse2Marks : (currentMarks?.mse2Marks || 0);

//             // Check MSE3 eligibility constraint: MSE3 can only exist if MSE1 + MSE2 < 20
//             if ((mse1 + mse2) >= 20) {
//                 // If MSE1 + MSE2 >= 20, MSE3 must be null
//                 theoryMarkData.mse3Marks = null;
//             }

//             theoryMarkData.lastUpdatedAt = new Date();

//             await prisma.theoryMarks.upsert({
//                 where: { enrollmentId },
//                 update: theoryMarkData,
//                 create: {
//                     enrollmentId,
//                     ...theoryMarkData
//                 }
//             });
//         }

//         if (isLabUpdate) {
//             // Update lab marks
//             const labMarkData: any = {};
//             if ('record_marks' in markData) labMarkData.recordMarks = markData.record_marks;
//             if ('continuous_evaluation_marks' in markData) labMarkData.continuousEvaluationMarks = markData.continuous_evaluation_marks;
//             if ('lab_mse_marks' in markData) labMarkData.labMseMarks = markData.lab_mse_marks;

//             labMarkData.lastUpdatedAt = new Date();

//             await prisma.labMarks.upsert({
//                 where: { enrollmentId },
//                 update: labMarkData,
//                 create: {
//                     enrollmentId,
//                     ...labMarkData
//                 }
//             });
//         }

//         res.json({
//             status: 'success',
//             message: 'Marks updated successfully'
//         });

//     } catch (error) {
//         console.error('Error updating marks:', error);
//         res.status(500).json({
//             status: 'error',
//             message: 'Failed to update marks',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// });

// Get marks for students in teacher's courses
router.get('/marks', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { courseId, studentUsn } = req.query;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Get teacher info
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                courseOfferings: {
                    include: {
                        course: true
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher not found' });
        }

        // Build where clause for student enrollments
        let whereClause: any = {
            offering: {
                teacherId: teacher.id
            }
        };

        // Filter by course if specified
        if (courseId) {
            whereClause.offering.courseId = courseId as string;
        }

        // Filter by student USN if specified
        if (studentUsn) {
            whereClause.student = {
                usn: studentUsn as string
            };
        }

        const enrollments = await prisma.studentEnrollment.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
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
                                id: true,
                                code: true,
                                name: true,
                                hasTheoryComponent: true,
                                hasLabComponent: true
                            }
                        },
                        testComponents: true
                    }
                },
                studentMarks: {
                    include: {
                        testComponent: true
                    }
                }
            }
        });

        // Transform data to match expected format
        const transformedData = enrollments.map(enrollment => {
            // Group marks by test type
            const theoryMarks: any[] = [];
            const labMarks: any[] = [];
            let theoryTotal = 0;
            let labTotal = 0;

            enrollment.studentMarks.forEach(mark => {
                const markData = {
                    id: mark.id,
                    testComponentId: mark.testComponentId,
                    testName: mark.testComponent.name,
                    maxMarks: mark.testComponent.maxMarks,
                    marksObtained: mark.marksObtained,
                    weightage: mark.testComponent.weightage
                };

                if (mark.testComponent.type === 'theory') {
                    theoryMarks.push(markData);
                    theoryTotal += mark.marksObtained || 0;
                } else if (mark.testComponent.type === 'lab') {
                    labMarks.push(markData);
                    labTotal += mark.marksObtained || 0;
                }
            });

            return {
                id: enrollment.id,
                enrollmentId: enrollment.id,
                student: enrollment.student ? {
                    id: enrollment.student.id,
                    usn: enrollment.student.usn,
                    user: enrollment.student.user
                } : null,
                course: enrollment.offering?.course || null,
                testComponents: enrollment.offering?.testComponents || [],
                theoryMarks,
                labMarks,
                theoryTotal,
                labTotal,
                grandTotal: theoryTotal + labTotal,
                updatedAt: new Date()
            };
        });

        res.json({
            status: 'success',
            data: transformedData
        });

    } catch (error) {
        console.error('Error fetching teacher marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch marks',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


// Get student attendance for a specific date and course (simplified - no sessions needed)
router.get('/attendance/students', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { date, courseId } = req.query;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!date || !courseId) {
            return res.status(400).json({ status: 'error', message: 'Date and courseId parameters are required' });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = await prisma.courseOffering.findFirst({
            where: {
                id: courseId as string,
                teacherId: teacher.id
            }
        });

        if (!courseOffering) {
            courseOffering = await prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId as string,
                    teacherId: teacher.id
                }
            });
        }

        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        const classDate = new Date(date as string);

        // Get all enrolled students for this course
        const enrollments = await prisma.studentEnrollment.findMany({
            where: {
                offeringId: courseOffering.id
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Get existing attendance records for this date and course
        const validStudentIds = enrollments
            .map(e => e.studentId)
            .filter((id): id is string => id !== null);

        const existingAttendance = await prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: validStudentIds },
                attendance: {
                    classDate: classDate,
                    offeringId: courseOffering.id
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Create a map of existing attendance records
        const attendanceMap = new Map();
        existingAttendance.forEach(record => {
            attendanceMap.set(record.studentId, record);
        });

        // Build the response with all students and their attendance status
        const studentsWithAttendance = enrollments
            .filter(enrollment => enrollment.student && enrollment.studentId)
            .map(enrollment => {
                const existingRecord = attendanceMap.get(enrollment.studentId);
                return {
                    studentId: enrollment.studentId!,
                    usn: enrollment.student!.usn || enrollment.student!.user?.email || 'N/A',
                    student_name: enrollment.student!.user?.name || 'Unknown',
                    status: existingRecord ? existingRecord.status : 'unmarked', // Default to unmarked
                    attendanceRecordId: existingRecord ? existingRecord.id : null,
                    courseId: courseOffering.courseId,
                    courseName: 'Course Name' // Will be populated later if needed
                };
            });

        // Get course details
        const course = await prisma.course.findUnique({
            where: { id: courseOffering.courseId },
            select: { name: true, code: true }
        });

        // Update course name in response
        studentsWithAttendance.forEach(student => {
            student.courseName = course ? `${course.code} - ${course.name}` : 'Unknown Course';
        });

        res.json({
            status: 'success',
            data: studentsWithAttendance
        });

    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get attendance by date for teacher's courses
router.get('/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { date, courseId } = req.query;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!date) {
            return res.status(400).json({ status: 'error', message: 'Date parameter is required' });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Build the query conditions
        let whereClause: any = {
            teacherId: teacher.id,
            classDate: new Date(date as string),
            status: 'confirmed'
        };

        // If courseId is specified, verify teacher teaches this course
        if (courseId) {
            // First check if the courseId is actually an offering ID
            let courseOffering = await prisma.courseOffering.findFirst({
                where: {
                    id: courseId as string,
                    teacherId: teacher.id
                }
            });

            // If not found as offering ID, try as course ID
            if (!courseOffering) {
                courseOffering = await prisma.courseOffering.findFirst({
                    where: {
                        courseId: courseId as string,
                        teacherId: teacher.id
                    }
                });
            }

            if (!courseOffering) {
                return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
            }

            whereClause.offeringId = courseOffering.id;
        }

        // Get attendance sessions for the specified date
        const attendanceSessions = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
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
                }
            }
        });

        const formattedData = attendanceSessions.map((session: any) => ({
            attendanceId: session.id,
            date: session.classDate,
            period: session.periodNumber,
            course: {
                id: session.offering.course.id,
                name: session.offering.course.name,
                code: session.offering.course.code
            },
            section: session.offering.sections?.section_name,
            syllabusCovered: session.syllabusCovered,
            records: session.attendanceRecords.map((record: any) => ({
                recordId: record.id,
                studentId: record.studentId,
                student: {
                    id: record.student.id,
                    name: record.student.user.name,
                    email: record.student.user.email,
                    usn: record.student.usn
                },
                status: record.status
            }))
        }));

        res.json({
            status: 'success',
            data: formattedData
        });

    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch attendance data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Update individual student attendance (creates records automatically if they don't exist)
router.put('/attendance/student', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { studentId, courseId, date, status } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!studentId || !courseId || !date || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'studentId, courseId, date, and status are required'
            });
        }

        // Validate status
        if (!['present', 'absent', 'unmarked'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Status must be present, absent, or unmarked'
            });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = await prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });

        if (!courseOffering) {
            courseOffering = await prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }

        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        // Verify student is enrolled in this course
        const enrollment = await prisma.studentEnrollment.findFirst({
            where: {
                studentId: studentId,
                offeringId: courseOffering.id
            }
        });

        if (!enrollment) {
            return res.status(400).json({
                status: 'error',
                message: 'Student is not enrolled in this course'
            });
        }

        const classDate = new Date(date);

        // Find or create attendance session for this date and course
        let attendanceSession = await prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id
            }
        });

        if (!attendanceSession) {
            // Create attendance session automatically
            attendanceSession = await prisma.attendance.create({
                data: {
                    offeringId: courseOffering.id,
                    teacherId: teacher.id,
                    classDate: classDate,
                    periodNumber: 1,
                    syllabusCovered: '',
                    status: 'confirmed'
                }
            });
        }

        // Find or create attendance record for this student
        let attendanceRecord = await prisma.attendanceRecord.findFirst({
            where: {
                attendanceId: attendanceSession.id,
                studentId: studentId
            }
        });

        if (!attendanceRecord) {
            // Create record if student is not yet in the session
            if (status !== 'unmarked') {
                attendanceRecord = await prisma.attendanceRecord.create({
                    data: {
                        attendanceId: attendanceSession.id,
                        studentId: studentId,
                        status: status as 'present' | 'absent'
                    }
                });
            }
            // If status is unmarked and no record exists, do nothing (already unmarked)
        } else {
            // Update existing record
            if (status === 'unmarked') {
                // Delete the record to mark as unmarked
                await prisma.attendanceRecord.delete({
                    where: { id: attendanceRecord.id }
                });
                attendanceRecord = null;
            } else {
                // Update the status
                attendanceRecord = await prisma.attendanceRecord.update({
                    where: { id: attendanceRecord.id },
                    data: { status: status as 'present' | 'absent' }
                });
            }
        }

        res.json({
            status: 'success',
            message: `Student attendance updated to ${status}`,
            data: {
                studentId: studentId,
                status: attendanceRecord ? attendanceRecord.status : 'unmarked',
                date: date,
                sessionId: attendanceSession.id,
                recordId: attendanceRecord ? attendanceRecord.id : null
            }
        });

    } catch (error) {
        console.error('Error updating student attendance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update student attendance',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Create attendance record for teacher's courses
router.post('/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { studentId, date, status, courseId } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!studentId || !date || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'studentId, date, and status are required'
            });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Find the student enrollment in teacher's course
        let offeringId = null;

        if (courseId) {
            // First check if the courseId is actually an offering ID
            let courseOffering = await prisma.courseOffering.findFirst({
                where: {
                    id: courseId,
                    teacherId: teacher.id
                }
            });

            // If not found as offering ID, try as course ID
            if (!courseOffering) {
                courseOffering = await prisma.courseOffering.findFirst({
                    where: {
                        courseId: courseId,
                        teacherId: teacher.id
                    }
                });
            }

            if (!courseOffering) {
                return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
            }

            offeringId = courseOffering.id;
        }

        // Verify the student is enrolled in one of teacher's courses
        const enrollment = await prisma.studentEnrollment.findFirst({
            where: {
                studentId: studentId,
                offering: {
                    teacherId: teacher.id,
                    ...(offeringId && { id: offeringId })
                }
            },
            include: {
                offering: true
            }
        });

        if (!enrollment) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied: Student not enrolled in your courses'
            });
        }

        // Find or create attendance session for this date and offering
        const attendanceDate = new Date(date);
        let attendanceSession = await prisma.attendance.findFirst({
            where: {
                offeringId: enrollment.offeringId,
                teacherId: teacher.id,
                classDate: attendanceDate,
                status: 'confirmed'
            }
        });

        if (!attendanceSession) {
            // Create new attendance session
            attendanceSession = await prisma.attendance.create({
                data: {
                    offeringId: enrollment.offeringId,
                    teacherId: teacher.id,
                    classDate: attendanceDate,
                    periodNumber: 1, // Default period
                    status: 'confirmed',
                    syllabusCovered: ''
                }
            });
        }

        // Create or update attendance record
        const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
                attendanceId: attendanceSession.id,
                studentId: studentId
            }
        });

        let attendanceRecord;
        if (existingRecord) {
            // Update existing record
            attendanceRecord = await prisma.attendanceRecord.update({
                where: {
                    id: existingRecord.id
                },
                data: {
                    status: status
                }
            });
        } else {
            // Create new record
            attendanceRecord = await prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: studentId,
                    status: status
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                recordId: attendanceRecord.id,
                attendanceId: attendanceSession.id,
                studentId: studentId,
                status: status,
                date: attendanceDate
            }
        });

    } catch (error) {
        console.error('Error creating attendance record:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create attendance record',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Update attendance record for teacher's courses
router.put('/attendance/:attendanceRecordId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { attendanceRecordId } = req.params;
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required' });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Find the attendance record and verify it belongs to teacher's course
        const attendanceRecord = await prisma.attendanceRecord.findFirst({
            where: {
                id: attendanceRecordId
            },
            include: {
                attendance: {
                    include: {
                        offering: true
                    }
                }
            }
        });

        if (!attendanceRecord) {
            return res.status(404).json({ status: 'error', message: 'Attendance record not found' });
        }

        // Verify the attendance session belongs to this teacher
        if (!attendanceRecord.attendance || attendanceRecord.attendance.teacherId !== teacher.id) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied: This attendance record does not belong to your courses'
            });
        }

        // Update the attendance record
        const updatedRecord = await prisma.attendanceRecord.update({
            where: {
                id: attendanceRecordId
            },
            data: {
                status: status
            }
        });

        res.json({
            status: 'success',
            data: {
                recordId: updatedRecord.id,
                studentId: updatedRecord.studentId,
                status: updatedRecord.status
            }
        });

    } catch (error) {
        console.error('Error updating attendance record:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update attendance record',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Create attendance session for teacher's course
router.post('/attendance/session', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const userId = req.user?.id;
        const { courseId, date, periodNumber, syllabusCovered } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User authentication required' });
        }

        if (!courseId || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'courseId and date are required'
            });
        }

        // Get teacher's information
        const teacher = await prisma.teacher.findFirst({
            where: { userId: userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher access required' });
        }

        // Find the course offering (handle both offering ID and course ID)
        let courseOffering = await prisma.courseOffering.findFirst({
            where: {
                id: courseId,
                teacherId: teacher.id
            }
        });

        if (!courseOffering) {
            courseOffering = await prisma.courseOffering.findFirst({
                where: {
                    courseId: courseId,
                    teacherId: teacher.id
                }
            });
        }

        if (!courseOffering) {
            return res.status(403).json({ status: 'error', message: 'Access denied to this course' });
        }

        const classDate = new Date(date);

        // Check if attendance session already exists for this date and course
        const existingSession = await prisma.attendance.findFirst({
            where: {
                offeringId: courseOffering.id,
                classDate: classDate,
                teacherId: teacher.id,
                periodNumber: periodNumber || 1
            }
        });

        if (existingSession) {
            return res.status(400).json({
                status: 'error',
                message: 'Attendance session already exists for this date and period'
            });
        }

        // Create attendance session
        const attendanceSession = await prisma.attendance.create({
            data: {
                offeringId: courseOffering.id,
                teacherId: teacher.id,
                classDate: classDate,
                periodNumber: periodNumber || 1,
                syllabusCovered: syllabusCovered || '',
                status: 'confirmed'
            }
        });

        // Get all students enrolled in this course
        const enrollments = await prisma.studentEnrollment.findMany({
            where: {
                offeringId: courseOffering.id
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Create attendance records for all enrolled students
        const attendanceRecords = await Promise.all(
            enrollments.map(enrollment =>
                prisma.attendanceRecord.create({
                    data: {
                        attendanceId: attendanceSession.id,
                        studentId: enrollment.studentId,
                        status: 'absent' // Default to absent, teacher can mark present
                    }
                })
            )
        );

        // Return the created session with student records
        const sessionWithRecords = await prisma.attendance.findUnique({
            where: { id: attendanceSession.id },
            include: {
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                offering: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            status: 'success',
            message: `Attendance session created with ${attendanceRecords.length} students`,
            data: {
                sessionId: attendanceSession.id,
                date: attendanceSession.classDate,
                period: attendanceSession.periodNumber,
                course: sessionWithRecords?.offering ? {
                    id: sessionWithRecords.offering.course.id,
                    name: sessionWithRecords.offering.course.name,
                    code: sessionWithRecords.offering.course.code
                } : null,
                studentsCount: attendanceRecords.length,
                records: sessionWithRecords?.attendanceRecords.map(record => ({
                    id: record.id,
                    studentId: record.studentId,
                    usn: record.student?.usn || record.student?.user?.email || 'N/A',
                    student_name: record.student?.user?.name || 'Unknown',
                    status: record.status
                })) || []
            }
        });

    } catch (error) {
        console.error('Error creating attendance session:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create attendance session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


// Get test components for a specific course taught by the teacher
router.get('/course/:courseId/teacher/:teacherId/components', async (req, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const { courseId, teacherId } = req.params;

        // Find course offering for this teacher & course
        // Accept either actual courseId or an offeringId passed as courseId from UI
        let offering = await prisma.courseOffering.findFirst({
            where: { courseId, teacherId },
            include: { testComponents: true }
        });
        if (!offering) {
            // Fallback: treat courseId param as offeringId
            offering = await prisma.courseOffering.findFirst({
                where: { id: courseId, teacherId },
                include: { testComponents: true }
            });
        }

        if (!offering) {
            return res.status(404).json({
                status: 'error',
                error: 'Course offering not found for this teacher/course'
            });
        }

        // Map test components into table-usable structure
        const components = offering.testComponents.map(tc => ({
            id: tc.id,
            name: tc.name,
            maxMarks: tc.maxMarks,
            weightage: tc.weightage,
            type: tc.type
        }));

        res.json({
            status: 'success',
            offeringId: offering.id,
            courseId: offering.courseId,
            teacherId: offering.teacherId,
            components
        });
    } catch (error) {
        console.error('Error fetching test components:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

//to update the test components for a specific course taught by that teacher
// Save (add/update/delete) test components for a course offering
// router.post('/course/:courseId/teacher/:teacherId/components', async (req, res) => {
//   try {
//     const prisma = DatabaseService.getInstance();
//     const { courseId, teacherId } = req.params;
//     const { components } = req.body; // array of components from frontend

//     // Find course offering for this teacher & course
//     const offering = await prisma.courseOffering.findFirst({
//       where: { courseId, teacherId },
//       include: { testComponents: true },
//     });

//     if (!offering) {
//       return res.status(404).json({ status: 'error', error: 'Course offering not found' });
//     }

//     const existingComponents = offering.testComponents;

//     // Track IDs from frontend
//     const incomingIds = components.filter(c => c.id).map(c => c.id);

//     // 1️⃣ Delete removed components
//     const toDelete = existingComponents.filter(c => !incomingIds.includes(c.id));
//     for (const comp of toDelete) {
//       await prisma.testComponent.delete({ where: { id: comp.id } });
//     }

//     // 2️⃣ Update existing or create new components
//     for (const comp of components) {
//       if (comp.id) {
//         // Update
//         await prisma.testComponent.update({
//           where: { id: comp.id },
//           data: {
//             name: comp.name,
//             maxMarks: comp.maxMarks,
//             weightage: comp.weightage,
//             type: comp.type,
//           },
//         });
//       } else {
//         // Create new
//         await prisma.testComponent.create({
//           data: {
//             name: comp.name,
//             maxMarks: comp.maxMarks,
//             weightage: comp.weightage ?? 100,
//             type: comp.type ?? 'theory',
//             courseOfferingId: offering.id,
//           },
//         });
//       }
//     }

//     // 3️⃣ Fetch updated components to return
//     const updatedComponents = await prisma.testComponent.findMany({
//       where: { courseOfferingId: offering.id },
//     });

//     res.json({ status: 'success', components: updatedComponents });
//   } catch (error) {
//     console.error('Error saving components:', error);
//     res.status(500).json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
//   }
// });
router.post('/course/:courseId/teacher/:teacherId/components', async (req, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const { courseId, teacherId } = req.params;
        const { components } = req.body;

        if (!Array.isArray(components)) {
            return res.status(400).json({ status: 'error', error: 'Invalid components array' });
        }

        // Find course offering (accept courseId or offeringId)
        let offering = await prisma.courseOffering.findFirst({
            where: { courseId, teacherId },
            include: { testComponents: true },
        });
        if (!offering) {
            offering = await prisma.courseOffering.findFirst({
                where: { id: courseId, teacherId },
                include: { testComponents: true },
            });
        }

        if (!offering) {
            return res.status(404).json({ status: 'error', error: 'Course offering not found' });
        }

        const existingComponents = offering.testComponents;
        const incomingIds = components.filter(c => c.id).map(c => c.id);

        // 1️⃣ Delete removed components safely
        for (const comp of existingComponents) {
            if (!incomingIds.includes(comp.id)) {
                try {
                    await prisma.testComponent.delete({ where: { id: comp.id } });
                } catch (e) {
                    console.warn(`Failed to delete component ${comp.id}:`, (e as Error).message);
                }
            }
        }

        // 2️⃣ Upsert components (update if exists, create if not)
        for (const comp of components) {
            // Skip invalid components
            if (!comp.name || typeof comp.maxMarks !== 'number' || !comp.type) {
                console.warn('Skipping invalid component:', comp);
                continue;
            }

            if (comp.id) {
                // Update if exists, otherwise create
                const existing = await prisma.testComponent.findUnique({ where: { id: comp.id } });
                if (existing) {
                    await prisma.testComponent.update({
                        where: { id: comp.id },
                        data: {
                            name: comp.name,
                            maxMarks: comp.maxMarks,
                            weightage: comp.weightage ?? 100,
                            type: comp.type,
                        },
                    });
                } else {
                    await prisma.testComponent.create({
                        data: {
                            name: comp.name,
                            maxMarks: comp.maxMarks,
                            weightage: comp.weightage ?? 100,
                            type: comp.type,
                            courseOfferingId: offering.id,
                        },
                    });
                }
            } else {
                // Create new
                await prisma.testComponent.create({
                    data: {
                        name: comp.name,
                        maxMarks: comp.maxMarks,
                        weightage: comp.weightage ?? 100,
                        type: comp.type,
                        courseOfferingId: offering.id,
                    },
                });
            }
        }

        // 3️⃣ Fetch updated components
        const updatedComponents = await prisma.testComponent.findMany({
            where: { courseOfferingId: offering.id },
        });

        res.json({ status: 'success', components: updatedComponents });
    } catch (error) {
        console.error('Error saving components:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

//get students marks for a specific course taught by that teacher
router.get('/course/:courseId/teacher/:teacherId/marks', async (req, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const { courseId, teacherId } = req.params;

        // 1. Find the offering
        let offering = await prisma.courseOffering.findFirst({
            where: { courseId, teacherId },
            include: {
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: true // to get student name/email
                            }
                        },
                        studentMarks: {
                            include: {
                                testComponent: true
                            }
                        }
                    }
                }
            }
        });
        if (!offering) {
            // Fallback: treat param as offeringId
            offering = await prisma.courseOffering.findFirst({
                where: { id: courseId, teacherId },
                include: {
                    enrollments: {
                        include: {
                            student: { include: { user: true } },
                            studentMarks: { include: { testComponent: true } }
                        }
                    }
                }
            });
        }

        if (!offering) {
            return res.status(404).json({
                status: 'error',
                error: 'Course offering not found for this teacher/course'
            });
        }

        // 2. Restructure marks by student
        const students = offering.enrollments.map(enrollment => ({
            studentId: enrollment.student?.id,
            usn: enrollment.student?.usn,
            studentName: enrollment.student?.user?.name,
            studentEmail: enrollment.student?.user?.email,
            marks: enrollment.studentMarks.map(sm => ({
                componentId: sm.testComponentId,
                componentName: sm.testComponent.name,
                type: sm.testComponent.type,
                obtainedMarks: sm.marksObtained,
                maxMarks: sm.testComponent.maxMarks,
                weightage: sm.testComponent.weightage
            }))
        }));

        res.json({
            status: 'success',
            offeringId: offering.id,
            courseId: offering.courseId,
            teacherId: offering.teacherId,
            students
        });
    } catch (error) {
        console.error('Error fetching student marks:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update student marks for a course taught by a teacher
router.post('/course/:courseId/teacher/:teacherId/marks', async (req, res) => {
    try {
        const prisma = DatabaseService.getInstance();
        const { courseId, teacherId } = req.params;
        const { students } = req.body;
        // students = [{ studentId, marks: [{ componentId, marksObtained }] }]

        if (!Array.isArray(students)) {
            return res.status(400).json({ status: 'error', error: 'Students array is required' });
        }

        // 1️⃣ Find the course offering
        let offering = await prisma.courseOffering.findFirst({
            where: { courseId, teacherId },
            include: { enrollments: true },
        });
        if (!offering) {
            offering = await prisma.courseOffering.findFirst({
                where: { id: courseId, teacherId },
                include: { enrollments: true },
            });
        }

        if (!offering) {
            return res.status(404).json({ status: 'error', error: 'Course offering not found' });
        }

        const updatedStudents: any[] = [];

        // 2️⃣ Loop through each student and update/create marks
        for (const student of students) {
            const enrollment = offering.enrollments.find(e => e.studentId === student.studentId);
            if (!enrollment) continue;

            const updatedMarks: any[] = [];

            for (const mark of student.marks) {
                const existing = await prisma.studentMark.findUnique({
                    where: {
                        enrollmentId_testComponentId: {
                            enrollmentId: enrollment.id,
                            testComponentId: mark.componentId,
                        },
                    },
                });

                if (existing) {
                    const updated = await prisma.studentMark.update({
                        where: { id: existing.id },
                        data: { marksObtained: mark.marksObtained },
                    });
                    updatedMarks.push(updated);
                } else {
                    const created = await prisma.studentMark.create({
                        data: {
                            enrollmentId: enrollment.id,
                            testComponentId: mark.componentId,
                            marksObtained: mark.marksObtained,
                        },
                    });
                    updatedMarks.push(created);
                }
            }

            updatedStudents.push({
                studentId: student.studentId,
                updatedMarks,
            });
        }

        res.json({
            status: 'success',
            offeringId: offering.id,
            courseId: offering.courseId,
            teacherId: offering.teacherId,
            updatedStudents,
        });
    } catch (error) {
        console.error('Error updating student marks:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

//to update student marks for a specific test component
router.put('/teacher/marks/:enrollmentId', async (req, res) => {
    const prisma = DatabaseService.getInstance();
    const { enrollmentId } = req.params;
    const { testComponentId, marksObtained } = req.body;

    if (!testComponentId) {
        return res.status(400).json({ status: 'error', message: 'testComponentId is required' });
    }

    try {
        // Check if the student mark already exists
        const existingMark = await prisma.studentMark.findUnique({
            where: {
                enrollmentId_testComponentId: {
                    enrollmentId,
                    testComponentId
                }
            }
        });

        let updatedMark;
        if (existingMark) {
            // Update existing mark
            updatedMark = await prisma.studentMark.update({
                where: {
                    enrollmentId_testComponentId: {
                        enrollmentId,
                        testComponentId
                    }
                },
                data: {
                    marksObtained
                }
            });
        } else {
            // Create a new mark if it doesn't exist
            updatedMark = await prisma.studentMark.create({
                data: {
                    enrollmentId,
                    testComponentId,
                    marksObtained
                }
            });
        }

        res.json({
            status: 'success',
            message: 'Marks updated successfully',
            data: updatedMark
        });
    } catch (error) {
        console.error('Error updating student marks:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update marks' });
    }
});


export default router;
