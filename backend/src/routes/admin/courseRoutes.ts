// src/routes/admin/courseRoutes.ts
import { Router } from 'express';
import DatabaseService from '../../lib/database';

const router = Router();

console.log('=== COURSE ROUTES MODULE LOADED ===');

// Get eligible students for a course
router.get('/courses/:courseId/eligible-students', async (req, res) => {
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

		const prisma = DatabaseService.getInstance();

		// Get course details
		const course = await prisma.course.findUnique({
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
		const yearNumber = parseInt(year as string);
		const semesterNumber = parseInt(semester as string);

		// Convert semester to year using proper mapping:
		// Semester 1,2 = Year 1; Semester 3,4 = Year 2; Semester 5,6 = Year 3; Semester 7,8 = Year 4
		const courseYear = Math.ceil(semesterNumber / 2);

		// Students are stored with semester field which indicates their current semester
		// We don't use batchYear for filtering as it stores the batch start year (e.g., 2023), not year of study
		const absoluteSemester: number = semesterNumber;

		// Build student where conditions
		let studentWhereConditions: any = {
			college_id: course.department.college_id,
			semester: absoluteSemester
		};

		// Apply course-specific filters
		if (course.type === 'core' || course.type === 'department_elective') {
			if (course.departmentId) {
				studentWhereConditions.department_id = course.departmentId;
			}
		} else if (course.type === 'open_elective') {
			const restrictedDepartmentIds = course.openElectiveRestrictions?.map((r: any) => r.restrictedDepartmentId) || [];
			if (restrictedDepartmentIds.length > 0) {
				studentWhereConditions.department_id = {
					notIn: restrictedDepartmentIds
				};
			}
		}

		// Get students who are NOT already enrolled in this course for this semester
		const eligibleStudents = await prisma.student.findMany({
			where: {
				...studentWhereConditions,
				enrollments: {
					none: {
						offering: {
							courseId: courseId,
							semester: absoluteSemester
						}
					}
				}
			},
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

		const transformedStudents = eligibleStudents.map((student: any) => ({
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
					restrictions: course.openElectiveRestrictions?.map((r: any) => ({
						departmentCode: r.restrictedDepartment.code,
						departmentName: r.restrictedDepartment.name
					})) || []
				},
				eligibleStudents: transformedStudents,
				filters: {
					year: yearNumber,
					semester: semesterNumber,
					absoluteSemester: absoluteSemester
				}
			}
		});

	} catch (error) {
		console.error('Error fetching eligible students:', error);
		res.status(500).json({
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Enroll students in a course
router.post('/courses/:courseId/enroll-students', async (req, res) => {
	try {
		const { courseId } = req.params;
		const { studentIds, year, semester, teacherId, sectionId } = req.body;

		// Only error if both studentIds is empty and no teacherId/sectionId is provided
		if ((!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) && !teacherId && !sectionId) {
			res.status(400).json({
				status: 'error',
				error: 'At least one student, teacher assignment, or section assignment is required'
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

		const prisma = DatabaseService.getInstance();

		// Get course details
		const course = await prisma.course.findUnique({
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
			const teacherRecord = await prisma.teacher.findUnique({ where: { userId: teacherId } });
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
		let academicYear = await prisma.academic_years.findFirst({
			where: {
				year_name: `${yearNumber}-${(yearNumber + 1).toString().slice(-2)}`,
				college_id: course.department.college_id
			}
		});

		if (!academicYear) {
			academicYear = await prisma.academic_years.create({
				data: {
					year_name: `${yearNumber}-${(yearNumber + 1).toString().slice(-2)}`,
					college_id: course.department.college_id,
					start_date: new Date(`${yearNumber}-06-01`),
					end_date: new Date(`${yearNumber + 1}-05-31`),
					is_active: true
				}
			});
		}

		// Get or create course offering
		let courseOffering = await prisma.courseOffering.findFirst({
			where: {
				courseId: courseId,
				semester: parseInt(semester),
				year_id: academicYear.year_id
			}
		});

		if (!courseOffering) {
			courseOffering = await prisma.courseOffering.create({
				data: {
					courseId: courseId,
					semester: parseInt(semester),
					year_id: academicYear.year_id,
					teacherId: resolvedTeacherId || null,
					section_id: sectionId || null
				}
			});
		} else {
			// Update teacher and/or section if provided and different
			const needsUpdate =
				(resolvedTeacherId && courseOffering.teacherId !== resolvedTeacherId) ||
				(sectionId && courseOffering.section_id !== sectionId);

			if (needsUpdate) {
				const updateData: any = {};
				if (resolvedTeacherId) updateData.teacherId = resolvedTeacherId;
				if (sectionId) updateData.section_id = sectionId;

				courseOffering = await prisma.courseOffering.update({
					where: { id: courseOffering.id },
					data: updateData
				});
			}
		}


		let results: any[] = [];
		let enrolledCount = 0;
		let alreadyEnrolledCount = 0;
		let errorCount = 0;

		if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
			// Create enrollments if students are provided
			const enrollmentPromises = studentIds.map(async (studentId: string) => {
				try {
					// Check if enrollment already exists
					const existingEnrollment = await prisma.studentEnrollment.findFirst({
						where: {
							studentId: studentId,
							offeringId: courseOffering!.id
						}
					});

					if (existingEnrollment) {
						return { studentId, status: 'already_enrolled' };
					}

					// Create new enrollment
					await prisma.studentEnrollment.create({
						data: {
							studentId: studentId,
							offeringId: courseOffering!.id,
							year_id: academicYear!.year_id,
							attemptNumber: 1
						}
					});

					return { studentId, status: 'enrolled' };
				} catch (error) {
					return {
						studentId,
						status: 'error',
						error: error instanceof Error ? error.message : 'Unknown error'
					};
				}
			});

			results = await Promise.all(enrollmentPromises);
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

	} catch (error) {
		console.error('Error enrolling students:', error);
		res.status(500).json({
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Get course enrollments
router.get('/courses/:courseId/enrollments', async (req, res) => {
	try {
		const prisma = DatabaseService.getInstance();
		const { courseId } = req.params;
		const { year, semester } = req.query;

		let whereClause: any = {
			offering: {
				courseId: courseId
			}
		};

		if (year) {
			whereClause.academic_years = {
				year_name: year as string
			};
		}

		if (semester) {
			whereClause.offering.semester = parseInt(semester as string);
		}

		const enrollments = await prisma.studentEnrollment.findMany({
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

		const enrollmentData = enrollments.map(enrollment => ({
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
			course: enrollment.offering?.course || null,
			teacher: enrollment.offering?.teacher ? {
				id: enrollment.offering.teacher.id,
				name: enrollment.offering.teacher.user.name
			} : null,
			academicYear: enrollment.academic_years?.year_name || null,
			semester: enrollment.offering?.semester || null
		}));

		res.json({
			status: 'success',
			data: enrollmentData,
			count: enrollmentData.length
		});
	} catch (error) {
		console.error('Error fetching course enrollments:', error);
		res.status(500).json({
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Get courses with teacher assignments for admin UI
router.get('/course-management', async (req, res) => {
	try {
		const prisma = DatabaseService.getInstance();

		const courses = await prisma.course.findMany({
			include: {
				department: {
					include: {
						colleges: true
					}
				},
				openElectiveRestrictions: {
					include: {
						restrictedDepartment: {
							select: {
								id: true,
								name: true,
								code: true
							}
						}
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
			// Group offerings by section to find which ones have teachers assigned
			const offeringsWithTeachers = course.courseOfferings.filter(o => o.teacherId);
			const offeringsWithoutTeachers = course.courseOfferings.filter(o => !o.teacherId);

			// For the UI, we want to show if ANY offering has a teacher, and who that teacher is
			const primaryTeacher = offeringsWithTeachers.length > 0 ? offeringsWithTeachers[0].teacher : null;

			// Use the year from the database if available, otherwise calculate from semester
			let courseYear = course.year || 1; // Use database year or default to 1st year
			if (!course.year && course.courseOfferings.length > 0) {
				// Fallback: Calculate based on semester if year is not set
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
					id: course.departmentId, // Add department ID
					name: course.department?.name,
					code: course.department?.code
				},
				college: {
					name: course.department?.colleges?.name,
					code: course.department?.colleges?.code
				},
				teacher: primaryTeacher ? {
					id: primaryTeacher.userId,  // Use userId instead of teacher.id
					name: primaryTeacher.user?.name
				} : null,
				teacherAssigned: offeringsWithTeachers.length > 0,
				totalOfferings: course.courseOfferings.length,
				offeringsWithTeacher: offeringsWithTeachers.length,
				offeringsWithoutTeacher: offeringsWithoutTeachers.length,
				hasTheoryComponent: course.hasTheoryComponent,
				hasLabComponent: course.hasLabComponent,
				// Include open elective restrictions
				openElectiveRestrictions: course.openElectiveRestrictions?.map(restriction => ({
					id: restriction.id,
					restrictedDepartment: {
						id: restriction.restrictedDepartment.id,
						name: restriction.restrictedDepartment.name,
						code: restriction.restrictedDepartment.code
					}
				})) || [],
				// Include detailed offerings for debugging
				offerings: course.courseOfferings.map(offering => ({
					id: offering.id,
					semester: offering.semester,
					section: offering.sections?.section_name,
					academicYear: offering.academic_years?.year_name,
					teacher: offering.teacher ? {
						id: offering.teacher.userId,  // Use userId instead of teacher.id
						name: offering.teacher.user?.name
					} : null,
					hasTeacher: !!offering.teacherId
				}))
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
	} catch (error) {
		console.error('Error fetching course management data:', error);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Auto-assign teachers to course offerings that don't have teachers
router.post('/auto-assign-teachers', async (req, res) => {
	try {
		const prisma = DatabaseService.getInstance();

		// Get all course offerings without teachers
		const offeringsWithoutTeachers = await prisma.courseOffering.findMany({
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
		const teachers = await prisma.teacher.findMany({
			include: {
				user: true,
				department: true
			}
		});

		// Group teachers by department
		const teachersByDepartment = teachers.reduce((acc, teacher) => {
			const deptId = teacher.departmentId;
			if (deptId) {
				if (!acc[deptId]) acc[deptId] = [];
				acc[deptId].push(teacher);
			}
			return acc;
		}, {} as Record<string, any[]>);

		let assignedCount = 0;
		const assignments = [];

		// Auto-assign teachers to course offerings
		for (const offering of offeringsWithoutTeachers) {
			const departmentId = offering.course?.departmentId;
			if (departmentId && teachersByDepartment[departmentId]) {
				const availableTeachers = teachersByDepartment[departmentId];

				// Simple round-robin assignment - can be made more sophisticated
				const teacherIndex = assignedCount % availableTeachers.length;
				const selectedTeacher = availableTeachers[teacherIndex];

				// Update the course offering with teacher assignment
				await prisma.courseOffering.update({
					where: { id: offering.id },
					data: { teacherId: selectedTeacher.id }
				});

				assignments.push({
					courseCode: offering.course?.code,
					courseName: offering.course?.name,
					section: offering.sections?.section_name,
					semester: offering.semester,
					academicYear: offering.academic_years?.year_name,
					assignedTeacher: {
						id: selectedTeacher.id,
						name: selectedTeacher.user?.name
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

	} catch (error) {
		console.error('Error auto-assigning teachers:', error);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Assign specific teacher to specific course offering
router.post('/assign-teacher', async (req, res) => {
	try {
		const { offeringId, teacherId } = req.body;

		if (!offeringId || !teacherId) {
			res.status(400).json({
				status: 'error',
				message: 'offeringId and teacherId are required'
			});
			return;
		}

		const prisma = DatabaseService.getInstance();

		// Verify the offering exists
		const offering = await prisma.courseOffering.findUnique({
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
		const teacher = await prisma.teacher.findUnique({
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
		await prisma.courseOffering.update({
			where: { id: offeringId },
			data: { teacherId: teacherId }
		});

		res.json({
			status: 'success',
			message: 'Teacher assigned successfully',
			data: {
				offering: {
					id: offering.id,
					courseCode: offering.course?.code,
					courseName: offering.course?.name,
					section: offering.sections?.section_name,
					semester: offering.semester,
					academicYear: offering.academic_years?.year_name
				},
				teacher: {
					id: teacher.id,
					name: teacher.user?.name
				}
			}
		});

	} catch (error) {
		console.error('Error assigning teacher:', error);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Remove teacher assignment from course offering
router.post('/unassign-teacher', async (req, res) => {
	try {
		const { offeringId } = req.body;

		if (!offeringId) {
			res.status(400).json({
				status: 'error',
				message: 'offeringId is required'
			});
			return;
		}

		const prisma = DatabaseService.getInstance();

		// Verify the offering exists
		const offering = await prisma.courseOffering.findUnique({
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
		await prisma.courseOffering.update({
			where: { id: offeringId },
			data: { teacherId: null }
		});

		res.json({
			status: 'success',
			message: 'Teacher assignment removed successfully',
			data: {
				offering: {
					id: offering.id,
					courseCode: offering.course?.code,
					courseName: offering.course?.name,
					section: offering.sections?.section_name
				},
				removedTeacher: offering.teacher ? {
					id: offering.teacher.id,
					name: offering.teacher.user?.name
				} : null
			}
		});

	} catch (error) {
		console.error('Error removing teacher assignment:', error);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Assign teacher to course by creating or updating offering
router.post('/courses/:courseId/assign-teacher', async (req, res) => {
	console.log('=== ASSIGN TEACHER ROUTE HIT ===');
	console.log('Course ID:', req.params.courseId);
	console.log('Request body:', req.body);

	try {
		const { courseId } = req.params;
		const { teacherId, sectionId, semester, academicYear } = req.body;

		console.log('Extracted values:', { courseId, teacherId, sectionId, semester, academicYear });

		if (!teacherId || !sectionId || !semester) {
			console.log('Validation failed - missing required fields');
			res.status(400).json({
				status: 'error',
				error: 'teacherId, sectionId, and semester are required'
			});
			return;
		}

		console.log('Validation passed - getting Prisma instance');
		const prisma = DatabaseService.getInstance();

		// Verify course exists
		console.log('Looking up course with ID:', courseId);
		const course = await prisma.course.findUnique({
			where: { id: courseId }
		});
		console.log('Course lookup result:', course ? `Found: ${course.code}` : 'NOT FOUND');

		if (!course) {
			res.status(404).json({
				status: 'error',
				error: 'Course not found'
			});
			return;
		}

		// Verify teacher exists
		console.log('Looking up teacher with user ID:', teacherId);
		const teacher = await prisma.teacher.findFirst({
			where: { userId: teacherId },
			include: { user: true }
		});
		console.log('Teacher lookup result:', teacher ? `Found: ${teacher.user?.name} (Teacher ID: ${teacher.id})` : 'NOT FOUND');

		if (!teacher) {
			res.status(404).json({
				status: 'error',
				error: 'Teacher not found'
			});
			return;
		}

		// Use the actual teacher ID for the offering
		const actualTeacherId = teacher.id;

		// Get or create academic year
		let year = await prisma.academic_years.findFirst({
			where: {
				year_name: academicYear || new Date().getFullYear().toString(),
				is_active: true
			}
		});

		// If no year found with that name, try to get any active year
		if (!year) {
			console.log('No year found with name:', academicYear, '- trying to get any active year');
			year = await prisma.academic_years.findFirst({
				where: { is_active: true }
			});
		}

		// If still no year, get the first year available
		if (!year) {
			console.log('No active year found - getting first available year');
			year = await prisma.academic_years.findFirst();
		}

		if (!year) {
			res.status(404).json({
				status: 'error',
				error: 'No academic year found in database'
			});
			return;
		}

		console.log('Using academic year:', year.year_name, 'ID:', year.year_id);

		// Find or create course offering
		console.log('Looking for existing offering...');
		let offering = await prisma.courseOffering.findFirst({
			where: {
				courseId: courseId,
				section_id: sectionId,
				semester: parseInt(semester),
				year_id: year.year_id
			}
		});

		if (!offering) {
			// Create new offering
			console.log('No existing offering found - creating new one');
			offering = await prisma.courseOffering.create({
				data: {
					courseId: courseId,
					section_id: sectionId,
					semester: parseInt(semester),
					year_id: year.year_id,
					teacherId: actualTeacherId
				}
			});
			console.log('Created new offering:', offering.id);
		} else {
			// Update existing offering
			console.log('Found existing offering:', offering.id, '- updating teacher');
			offering = await prisma.courseOffering.update({
				where: { id: offering.id },
				data: { teacherId: actualTeacherId }
			});
			console.log('Updated offering');
		}

		// Fetch complete offering data for response
		console.log('Fetching complete offering data...');
		const updatedOffering = await prisma.courseOffering.findUnique({
			where: { id: offering.id },
			include: {
				course: true,
				sections: true,
				teacher: { include: { user: true } }
			}
		});

		console.log('=== SUCCESS: Teacher assigned ===');
		res.json({
			status: 'success',
			data: {
				offering: updatedOffering,
				message: 'Teacher assigned successfully'
			}
		});

	} catch (error) {
		console.error('=== ERROR in assign teacher route ===');
		console.error('Error assigning teacher to course:', error);
		res.status(500).json({
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

console.log('=== COURSE ROUTES: /courses/:courseId/assign-teacher route registered ===');

export default router;
