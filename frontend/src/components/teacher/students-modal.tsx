'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, Mail, Phone, X, Search } from 'lucide-react'
import { TeacherAPI, type CourseOffering, type Student } from '@/lib/teacher-api'
import { Input } from '@/components/ui/input'

interface StudentsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function StudentsModal({ open, onOpenChange }: StudentsModalProps) {
    const [courses, setCourses] = useState<CourseOffering[]>([])
    const [allStudents, setAllStudents] = useState<(Student & { courseName: string; courseCode: string })[]>([])
    const [filteredStudents, setFilteredStudents] = useState<(Student & { courseName: string; courseCode: string })[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (open) {
            loadStudents()
        }
    }, [open])

    useEffect(() => {
        // Filter students based on search term
        if (searchTerm.trim() === '') {
            setFilteredStudents(allStudents)
        } else {
            const filtered = allStudents.filter(student =>
                student.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.student.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredStudents(filtered)
        }
    }, [searchTerm, allStudents])

    const loadStudents = async () => {
        try {
            setLoading(true)
            setError(null)

            // First get all courses
            const coursesData = await TeacherAPI.getCourses()
            setCourses(coursesData)

            // Then get students for each course
            const studentPromises = coursesData.map(async (course) => {
                try {
                    const students = await TeacherAPI.getCourseStudents(course.offeringId)
                    return students.map(student => ({
                        ...student,
                        courseName: course.course.name,
                        courseCode: course.course.code
                    }))
                } catch (err) {
                    console.error(`Error loading students for course ${course.course.code}:`, err)
                    return []
                }
            })

            const studentsData = await Promise.all(studentPromises)
            const flattenedStudents = studentsData.flat()
            setAllStudents(flattenedStudents)
            setFilteredStudents(flattenedStudents)
        } catch (err) {
            console.error('Error loading students:', err)
            setError(err instanceof Error ? err.message : 'Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const getTotalStudentsCount = () => {
        const uniqueStudents = new Set(allStudents.map(s => s.student.id))
        return uniqueStudents.size
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            My Students
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {getTotalStudentsCount()} unique students across {courses.length} courses
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="p-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by name, USN, email, or course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span className="ml-2 text-gray-600">Loading students...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-600">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadStudents}
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {!loading && !error && filteredStudents.length === 0 && allStudents.length > 0 && (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No students found matching your search</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                                className="mt-2"
                            >
                                Clear Search
                            </Button>
                        </div>
                    )}

                    {!loading && !error && allStudents.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No students enrolled in your courses yet</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map((studentData, index) => (
                            <Card
                                key={`${studentData.student.id}-${studentData.courseCode}-${index}`}
                                className="hover:shadow-lg transition-all duration-200"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg line-clamp-1 mb-1">
                                                {studentData.student.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="font-medium">{studentData.student.usn}</span>
                                                <span>•</span>
                                                <span>Sem {studentData.student.semester}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {/* Course Badge */}
                                        <Badge variant="outline" className="text-xs">
                                            {studentData.courseCode} - {studentData.courseName}
                                        </Badge>

                                        {/* Contact Info */}
                                        <div className="space-y-2 text-sm">
                                            {studentData.student.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-600 truncate">{studentData.student.email}</span>
                                                </div>
                                            )}
                                            {studentData.student.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-600">{studentData.student.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Department & Section */}
                                        <div className="text-xs text-gray-500 pt-2 border-t">
                                            <div className="flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" />
                                                <span>{studentData.student.department} - {studentData.student.section}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Summary */}
                    {!loading && !error && filteredStudents.length > 0 && (
                        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
                            Showing {filteredStudents.length} of {allStudents.length} student enrollments
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
