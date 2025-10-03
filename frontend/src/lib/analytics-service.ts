// lib/analytics-service.ts
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface College {
  id: string;
  name: string;
  code: string;
}

export interface OverviewStats {
  studyYear: number;
  totalStudents: number;
  totalCourses: number;
  totalSections: number;
  averageAttendance: number;
  averageMarks: number;
  passRate: number;
  lowAttendanceStudents: number;
  totalAttendanceSessions: number;
  totalTeachers: number;
  totalDepartments: number;
}

export interface CourseStats {
  name: string;
  code: string;
  attendance?: number;
  avgMarks?: number;
  passRate?: number;
  failRate?: number;
  students?: StudentInfo[];
}

export interface StudentInfo {
  id?: string;
  name?: string;
  usn?: string;
  semester?: number;
  attendancePercent?: number; // For attendance analytics
  theoryMarks?: number; // For marks analytics
  labMarks?: number; // For marks analytics
  totalMarks?: number; // For marks analytics
}

export interface SectionStats {
  section: string;
  attendance?: number;
  avgMarks?: number;
  passRate?: number;
  students: number;
  courses: number;
  courseStats: CourseStats[];
}

export interface DepartmentStats {
  name: string;
  code: string;
  attendance?: number;
  avgMarks?: number;
  passRate?: number;
  students: number;
  sections: SectionStats[];
}

export interface AttendanceAnalyticsData {
  studyYear: number;
  departments: DepartmentStats[];
}

export interface MarksAnalyticsData {
  studyYear: number;
  departments: DepartmentStats[];
}

class AnalyticsService {
  private async makeRequest(endpoint: string, options?: RequestInit) {
    // Get token from auth service (which uses cookies)
    const token = authService.getToken();

    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          throw new Error('Authentication failed. Please log in again.');
        }

        // Retry the request with new token
        const newToken = authService.getToken();
        if (newToken) {
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
              ...options?.headers,
            },
            ...options,
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData.status === 'error') {
              throw new Error(retryData.error || 'Unknown API error');
            }
            return retryData.data;
          }
        }

        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(data.error || 'Unknown API error');
    }

    return data.data;
  }

  async getOverviewStats(studyYear?: number, collegeId?: string): Promise<OverviewStats> {
    let endpoint = studyYear
      ? `/api/analytics/overview/${studyYear}`
      : '/api/analytics/overview';

    if (collegeId && collegeId !== 'all') {
      endpoint += `?collegeId=${collegeId}`;
    }

    return this.makeRequest(endpoint);
  }

  async getAttendanceAnalytics(studyYear?: number, collegeId?: string): Promise<AttendanceAnalyticsData> {
    let endpoint = studyYear
      ? `/api/analytics/attendance/${studyYear}`
      : '/api/analytics/attendance';

    if (collegeId && collegeId !== 'all') {
      endpoint += `?collegeId=${collegeId}`;
    }

    return this.makeRequest(endpoint);
  }

  async getMarksAnalytics(studyYear?: number, collegeId?: string): Promise<MarksAnalyticsData> {
    let endpoint = studyYear
      ? `/api/analytics/marks/${studyYear}`
      : '/api/analytics/marks';

    if (collegeId && collegeId !== 'all') {
      endpoint += `?collegeId=${collegeId}`;
    }

    return this.makeRequest(endpoint);
  }

  async getColleges(): Promise<College[]> {
    return this.makeRequest('/api/analytics/colleges');
  }

  // Keep this for potential future use
  async getAcademicYears(): Promise<string[]> {
    return this.makeRequest('/api/analytics/academic-years');
  }
}

const analyticsService = new AnalyticsService();
export { analyticsService };
export default analyticsService;
