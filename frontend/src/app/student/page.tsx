  'use client'

  import { useState, useEffect } from 'react'
  import Image from 'next/image'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { AttendanceCalendar } from '@/app/student/attendance-calendar'
  import { DailyAttendanceCheck } from '@/app/student/daily-attendance-check'
  import { AttendanceStats } from '@/app/student/attendance-stats'
  import { 
    User, 
    TrendingUp, 
    BookOpen,
    GraduationCap,
    Phone,
    Mail,
    Award
  } from 'lucide-react'

import { studentApi } from '@/lib/api'
import { StudentInfo,StudentMarksResponse,MarksDataItem } from '@/types/student'





  export default function StudentDashboard() {
    const emptystud : StudentInfo = {
      id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      semester: 0,
      college_name: '',
      usn: '',
      photo_url: '',
    };
    const [activeTab, setActiveTab] = useState('overview')
    const [UserId, setUserId] = useState<string>("");
    const [studentData, setStudentData] = useState<StudentInfo>(emptystud);
    const [loading, setLoading] = useState(true);
    const [marksData, setMarksData] = useState<MarksDataItem[]>([]);
    const [marksLoading, setMarksLoading] = useState(true);
  useEffect(() => {
    
    const match = document.cookie.match(/(^| )user_data=([^;]+)/);
    if (match) {
      try {
        const cookieData = JSON.parse(decodeURIComponent(match[2]));
        if (cookieData && cookieData.id !== "") {
          setUserId(cookieData.id);
        }
        console.log("current user", UserId);
      } catch (err) {
        console.error("Invalid cookie format", err);
      }
    }
  }, []);




    useEffect(() => {
      async function fetchData() {
      try {
         // you’ll get this from auth or route params
         if(UserId !== "") {
          const data  = await studentApi.getStudentProfile(UserId);
          setStudentData(data);
          console.log("why is this not working",data)
          setLoading(true);
         }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    }, [UserId]);


    //to get marks data 
    useEffect(() => {
  async function fetchMarks() {
    try {
      if (UserId !== "") {
        const data = await studentApi.getStudentMarks(UserId);
        setMarksData(data.marksData);
        console.log("Marks data:", data);
        setMarksLoading(true);
        console.log("Student marks object:", data);
      }
    } catch (err) {
      console.error("Failed to load student marks:", err);
    } finally {
      setMarksLoading(false);
    }
  }

  fetchMarks();
}, [UserId]);



    

    const [currentDate] = useState(new Date())
   const [selectedDate, setSelectedDate] = useState<string>(
  new Date().toISOString().split("T")[0] // "YYYY-MM-DD"
);

    const [selectedDateData, setSelectedDateData] = useState<{
      present: number
      absent: number
      total: number
      classes: Array<{
        course_name: string
        course_code: string
        status: 'present' | 'absent'
      }>
    } | null>(null)

    // Handle date selection from calendar
    const handleDateSelect = (date: string, data: {
      present: number
      absent: number
      total: number
      classes: Array<{
        course_name: string
        course_code: string
        status: 'present' | 'absent'
      }>
    } | null) => {
      setSelectedDate(date)
      setSelectedDateData(data)
    }
    // Mock function to load student data - replace with actual API call


    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">Today</p>
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>        {/* Student Profile Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto sm:mx-0">             
                   {loading && studentData.photo_url ? (
                    <Image
                      src={studentData.photo_url } 
                      alt={ studentData.name}
                      width={56}
                      height={56}
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  )}



                </div>
                <div className="flex-1 text-center sm:text-left">
                  <CardTitle className="text-white text-lg sm:text-xl lg:text-2xl">Welcome back, {loading ? 'Loading' : studentData.name}</CardTitle>
                  <CardDescription className="text-blue-100 text-sm sm:text-base  flex justify-between align-middle">
                    {loading ? 'Loading' : studentData.usn} • Semester {loading ? 'Loading' : studentData.semester} • {loading ? 'Loading' : studentData.department}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{loading ? 'Loading' : studentData.college_name}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{loading ? 'Loading' : studentData.phone}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:col-span-2 lg:col-span-1">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{loading ? 'Loading' : studentData.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>{/* Navigation Tabs */}
          <div className="flex space-x-0.5 sm:space-x-1 bg-gray-100 p-0.5 sm:p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-w-fit whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-w-fit whitespace-nowrap ${
                activeTab === 'marks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Marks</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-w-fit whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Attendance</span>
            </button>
          </div>        {/* Content based on active tab */}        {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">            {/* Single Row - Class Details (Left) and Calendar (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-auto lg:h-[320px]">
                {/* Left Column - Class Details (Takes 2/3 width on desktop) */}
                {/* <div className="lg:col-span-2 order-2 lg:order-1 h-full">

                  <DailyAttendanceCheck 
                    userId={studentData ? studentData.user_id : ''} 
                    selectedDate={selectedDate}
                    selectedDateData={selectedDateData}
                    showDetailsCard={true}
                  />
                </div> */}
                <div className="lg:col-span-2 order-2 lg:order-1 h-full">
  {studentData?.user_id ? (
    console.log("Selected date:", selectedDate, "Selected date data:", selectedDateData),
    <DailyAttendanceCheck
      userId={studentData.user_id}
      selectedDate={selectedDate}
      selectedDateData={selectedDateData}
      showDetailsCard={true}
    />
  ) : (
    <div>Loading...</div> // or a skeleton loader
  )}
</div>

                {/* Right Column - Compact Attendance Calendar (Takes 1/3 width on desktop) */}
                {/* <div className="lg:col-span-1 order-1 lg:order-2 h-full">
                  <AttendanceCalendar 
                    studentId={studentData ? studentData.user_id : ''} 
                    onDateSelect={handleDateSelect}
                  />
                </div> */}
                <div className="lg:col-span-1 order-1 lg:order-2 h-full">
  {studentData?.user_id ? (
    <AttendanceCalendar 
      studentId={studentData.user_id} 
      onDateSelect={handleDateSelect}
    />
  ) : (
    <div>Loading...</div> // or a skeleton loader
  )}
</div>

              </div>
            </div>
          )}{activeTab === 'stats' && (
            <AttendanceStats userId={studentData ? studentData.user_id : ''} compact={false} />
          )}        {activeTab === 'marks' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Course-wise Marks Table */}            <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Course-wise Marks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0"><div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">                      <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50 ">
                            <tr>
                              <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 border-r border-gray-200 lg:hidden">Course</th>
                              <th className="hidden lg:table-cell sticky left-0 z-10 bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700 border-r border-gray-200">Course Code</th>
                              <th className="hidden lg:table-cell px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Course Name</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Type</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">MSE I</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">MSE II</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">MSE III</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Task I</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Task II</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Task III</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Theory</th>                            
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Record</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">CE</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Lab MSE</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Lab</th>
                              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-700 bg-purple-50">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
  {marksData.map((course, index) => (
    <tr key={index} className="hover:bg-gray-50 transition-colors">
      {/* Combined course info for mobile/tablet */}
      <td className="sticky left-0 z-10 bg-white px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200 lg:hidden">
        <div className="min-w-[120px] sm:min-w-[140px]">
          <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">{course.course_code}</div>
          <div className="text-gray-600 text-xs truncate max-w-[100px] sm:max-w-[120px]">{course.course_name}</div>
        </div>
      </td>
      {/* Separate course code for desktop */}
      <td className="hidden lg:table-cell sticky left-0 z-10 bg-white px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200">
        <div className="font-medium text-gray-900 text-sm">{course.course_code}</div>
      </td>
      {/* Separate course name for desktop */}
      <td className="hidden lg:table-cell px-2 sm:px-3 py-2 sm:py-3">
        <div className="font-medium text-gray-900 text-sm min-w-[200px]">{course.course_name}</div>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        <span
          className={`inline-block px-1 py-0.5 text-xs rounded ${
            course.course_type === 'core'
              ? 'bg-blue-100 text-blue-700'
              : course.course_type === 'department_elective'
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {course.course_type === 'core'
            ? 'Core'
            : course.course_type === 'department_elective'
            ? 'Dept'
            : 'Open'}
        </span>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium">{course.theory_marks?.mse1Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium">{course.theory_marks?.mse2Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component && course.total_theory_marks < 20 ? (
          <span className="font-medium">{course.theory_marks?.mse3Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium">{course.theory_marks?.task1Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium">{course.theory_marks?.task2Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium">{course.theory_marks?.task3Marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_theory_component ? (
          <span className="font-medium text-blue-600">{course.total_theory_marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_lab_component ? (
          <span className="font-medium">{course.lab_marks?.recordMarks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_lab_component ? (
          <span className="font-medium">{course.lab_marks?.continuousEvaluationMarks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_lab_component ? (
          <span className="font-medium">{course.lab_marks?.labMseMarks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
        {course.has_lab_component ? (
          <span className="font-medium text-green-600">{course.total_lab_marks || '-'}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center bg-purple-50">
        <span className="font-bold text-sm sm:text-lg text-purple-600">{course.total_marks || '-'}</span>
      </td>
    </tr>
  ))}
</tbody>

                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>  
          )}
        </div>
      </div>
    )
  } 