'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Calendar, GraduationCap, X } from 'lucide-react'
import { TeacherAPI, type CourseOffering } from '@/lib/teacher-api'

interface CoursesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCourseSelect?: (course: CourseOffering) => void
}

export function CoursesModal({ open, onOpenChange, onCourseSelect }: CoursesModalProps) {
    const [courses, setCourses] = useState<CourseOffering[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            loadCourses()
        }
    }, [open])

    const loadCourses = async () => {
        try {
            setLoading(true)
            setError(null)
            const coursesData = await TeacherAPI.getCourses()
            setCourses(coursesData)
        } catch (err) {
            console.error('Error loading courses:', err)
            setError(err instanceof Error ? err.message : 'Failed to load courses')
        } finally {
            setLoading(false)
        }
    }

    const handleCourseClick = (course: CourseOffering) => {
        if (onCourseSelect) {
            onCourseSelect(course)
        }
        onOpenChange(false)
    }

    const getCourseTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'core':
                return 'bg-blue-100 text-blue-800'
            case 'department_elective':
                return 'bg-purple-100 text-purple-800'
            case 'open_elective':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        My Courses ({courses.length})
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="p-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-2 text-gray-600">Loading courses...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-600">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadCourses}
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {!loading && !error && courses.length === 0 && (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No courses assigned yet</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course) => (
                            <Card
                                key={course.offeringId}
                                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-emerald-300"
                                onClick={() => handleCourseClick(course)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg line-clamp-2 mb-1">
                                                {course.course.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="font-medium">{course.course.code}</span>
                                                <span>•</span>
                                                <span>{course.academicYear}</span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={getCourseTypeColor(course.course.type)}
                                        >
                                            {course.course.type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {/* Course Components */}
                                        <div className="flex gap-2">
                                            {course.course.hasTheoryComponent && (
                                                <Badge variant="outline" className="text-xs">
                                                    Theory
                                                </Badge>
                                            )}
                                            {course.course.hasLabComponent && (
                                                <Badge variant="outline" className="text-xs">
                                                    Lab
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Statistics */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Students:</span>
                                                <span className="font-medium">{course.enrolledStudents}</span>
                                            </div>
                                            {course.section && (
                                                <div className="flex items-center gap-1">
                                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-600">Section:</span>
                                                    <span className="font-medium">{course.section.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Department */}
                                        <div className="text-xs text-gray-500 pt-2 border-t">
                                            Department: {course.course.department}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
