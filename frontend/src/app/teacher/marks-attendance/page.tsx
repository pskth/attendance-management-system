'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TeacherAPI, type CourseOffering } from '@/lib/teacher-api'
import { authService } from '@/lib/auth'
import TeacherMarksAttendanceManagement from '@/app/teacher/TeacherMarksAttendanceManagement'
import { ArrowLeft } from 'lucide-react'

export default function TeacherMarksAttendancePage() {
    const router = useRouter()
    const [courses, setCourses] = useState<CourseOffering[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [teacherId, setTeacherId] = useState<string>('')
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const hasLoadedRef = useRef(false)

    useEffect(() => {
        if (hasLoadedRef.current) return
        hasLoadedRef.current = true
        loadTeacherCourses()
    }, [])

    const loadTeacherCourses = async () => {
        try {
            setLoading(true)
            setError(null)

            if (!authService.isAuthenticated()) {
                router.push('/login/teacher')
                return
            }

            const coursesData = await TeacherAPI.getCourses()
            setCourses(coursesData)
            if (coursesData.length > 0) {
                setSelectedCourseId(coursesData[0].offeringId)
                // Use teacherId from the course data
                if (coursesData[0].teacherId) {
                    setTeacherId(coursesData[0].teacherId)
                }
            }
        } catch (err) {
            console.error('Error loading teacher courses:', err)
            setError(err instanceof Error ? err.message : 'Failed to load courses')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading courses...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={loadTeacherCourses}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marks & Attendance Management</h1>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                View and edit student marks and attendance for all your courses
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <TeacherMarksAttendanceManagement
                    courses={courses}
                    selectedCourseId={selectedCourseId}
                    teacherId={teacherId}
                    initialMode="marks"
                />
            </div>
        </div>
    )
}
