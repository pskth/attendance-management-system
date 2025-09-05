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

// Update student marks (teachers can only update marks for their assigned courses)
router.put('/marks/:enrollmentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { enrollmentId } = req.params;
    const markData = req.body;

    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'User not authenticated' });
        }

        const prisma = DatabaseService.getInstance();

        // Get teacher info
        const teacher = await prisma.teacher.findUnique({
            where: { userId }
        });

        if (!teacher) {
            return res.status(403).json({ status: 'error', message: 'Teacher not found' });
        }

        // Check if enrollment exists and verify teacher has access to this course
        const enrollment = await prisma.studentEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                offering: {
                    include: {
                        teacher: true
                    }
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({
                status: 'error',
                error: 'Enrollment not found'
            });
        }

        // Verify teacher has access to this course
        if (!enrollment.offering || enrollment.offering.teacherId !== teacher.id) {
            return res.status(403).json({
                status: 'error',
                error: 'Access denied - you can only update marks for your assigned courses'
            });
        }

        // Determine if this is theory or lab marks update
        const isTheoryUpdate = ['mse1_marks', 'mse2_marks', 'mse3_marks', 'task1_marks', 'task2_marks', 'task3_marks'].some(field => field in markData);
        const isLabUpdate = ['record_marks', 'continuous_evaluation_marks', 'lab_mse_marks'].some(field => field in markData);

        if (isTheoryUpdate) {
            // Update theory marks
            const theoryMarkData: any = {};
            if ('mse1_marks' in markData) theoryMarkData.mse1Marks = markData.mse1_marks;
            if ('mse2_marks' in markData) theoryMarkData.mse2Marks = markData.mse2_marks;
            if ('mse3_marks' in markData) theoryMarkData.mse3Marks = markData.mse3_marks;
            if ('task1_marks' in markData) theoryMarkData.task1Marks = markData.task1_marks;
            if ('task2_marks' in markData) theoryMarkData.task2Marks = markData.task2_marks;
            if ('task3_marks' in markData) theoryMarkData.task3Marks = markData.task3_marks;

            // Get current marks to check MSE3 eligibility
            const currentMarks = await prisma.theoryMarks.findUnique({
                where: { enrollmentId }
            });

            // Calculate MSE1 + MSE2 total (use new values if being updated, otherwise use current values)
            const mse1 = theoryMarkData.mse1Marks !== undefined ? theoryMarkData.mse1Marks : (currentMarks?.mse1Marks || 0);
            const mse2 = theoryMarkData.mse2Marks !== undefined ? theoryMarkData.mse2Marks : (currentMarks?.mse2Marks || 0);

            // Check MSE3 eligibility constraint: MSE3 can only exist if MSE1 + MSE2 < 20
            if ((mse1 + mse2) >= 20) {
                // If MSE1 + MSE2 >= 20, MSE3 must be null
                theoryMarkData.mse3Marks = null;
            }

            theoryMarkData.lastUpdatedAt = new Date();

            await prisma.theoryMarks.upsert({
                where: { enrollmentId },
                update: theoryMarkData,
                create: {
                    enrollmentId,
                    ...theoryMarkData
                }
            });
        }

        if (isLabUpdate) {
            // Update lab marks
            const labMarkData: any = {};
            if ('record_marks' in markData) labMarkData.recordMarks = markData.record_marks;
            if ('continuous_evaluation_marks' in markData) labMarkData.continuousEvaluationMarks = markData.continuous_evaluation_marks;
            if ('lab_mse_marks' in markData) labMarkData.labMseMarks = markData.lab_mse_marks;

            labMarkData.lastUpdatedAt = new Date();

            await prisma.labMarks.upsert({
                where: { enrollmentId },
                update: labMarkData,
                create: {
                    enrollmentId,
                    ...labMarkData
                }
            });
        }

        res.json({
            status: 'success',
            message: 'Marks updated successfully'
        });

    } catch (error) {
        console.error('Error updating marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update marks',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

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
                                name: true
                            }
                        }
                    }
                },
                theoryMarks: true,
                labMarks: true
            }
        });

        // Transform data to match admin API format
        const transformedData = enrollments.map(enrollment => ({
            id: enrollment.id,
            enrollmentId: enrollment.id,
            student: enrollment.student ? {
                id: enrollment.student.id,
                usn: enrollment.student.usn,
                user: enrollment.student.user
            } : null,
            course: enrollment.offering?.course || null,
            theoryMarks: enrollment.theoryMarks ? {
                id: enrollment.theoryMarks.id,
                mse1_marks: enrollment.theoryMarks.mse1Marks,
                mse2_marks: enrollment.theoryMarks.mse2Marks,
                mse3_marks: enrollment.theoryMarks.mse3Marks,
                task1_marks: enrollment.theoryMarks.task1Marks,
                task2_marks: enrollment.theoryMarks.task2Marks,
                task3_marks: enrollment.theoryMarks.task3Marks,
                last_updated_at: enrollment.theoryMarks.lastUpdatedAt
            } : null,
            labMarks: enrollment.labMarks ? {
                id: enrollment.labMarks.id,
                record_marks: enrollment.labMarks.recordMarks,
                continuous_evaluation_marks: enrollment.labMarks.continuousEvaluationMarks,
                lab_mse_marks: enrollment.labMarks.labMseMarks,
                last_updated_at: enrollment.labMarks.lastUpdatedAt
            } : null,
            updatedAt: new Date() // Use current date as fallback
        }));

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

        if (attendanceRecord) {
            // Update existing record
            attendanceRecord = await prisma.attendanceRecord.update({
                where: { id: attendanceRecord.id },
                data: { status: status as any }
            });
        } else {
            // Create new record
            attendanceRecord = await prisma.attendanceRecord.create({
                data: {
                    attendanceId: attendanceSession.id,
                    studentId: studentId,
                    status: status as any
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                recordId: attendanceRecord.id,
                studentId: attendanceRecord.studentId,
                status: attendanceRecord.status,
                date: classDate
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

export default router;
