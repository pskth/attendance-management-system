// lib/analytics-service.ts
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface OverviewStats {
  academicYear: string;
  totalStudents: number;
  totalCourses: number;
  totalSections: number;
  averageAttendance: number;
  averageMarks: number;
  passRate: number;
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
  academicYear: string;
  departments: DepartmentStats[];
}

export interface MarksAnalyticsData {
  academicYear: string;
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

  async getOverviewStats(academicYear?: string): Promise<OverviewStats> {
    const endpoint = academicYear 
      ? `/api/analytics/overview/${academicYear}`
      : '/api/analytics/overview';
    
    return this.makeRequest(endpoint);
  }

  async getAttendanceAnalytics(academicYear?: string): Promise<AttendanceAnalyticsData> {
    const endpoint = academicYear 
      ? `/api/analytics/attendance/${academicYear}`
      : '/api/analytics/attendance';
    
    return this.makeRequest(endpoint);
  }

  async getMarksAnalytics(academicYear?: string): Promise<MarksAnalyticsData> {
    const endpoint = academicYear 
      ? `/api/analytics/marks/${academicYear}`
      : '/api/analytics/marks';
    
    return this.makeRequest(endpoint);
  }

  async getAcademicYears(): Promise<string[]> {
    return this.makeRequest('/api/analytics/academic-years');
  }
}

const analyticsService = new AnalyticsService();
export { analyticsService };
export default analyticsService;
