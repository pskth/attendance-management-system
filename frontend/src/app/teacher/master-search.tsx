'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  Star,
  ChevronRight,
  X
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'year' | 'department' | 'course' | 'student' | 'elective'
  title: string
  subtitle: string
  description?: string
  metadata?: {
    year?: string
    department?: string
    course_code?: string
    usn?: string
    section?: string
    academic_year?: string
    semester?: number
  }
}

interface MasterSearchProps {
  onNavigate: (result: SearchResult) => void
  placeholder?: string
}

// Mock search data - replace with actual API calls
const mockSearchData: SearchResult[] = [
  // Years
  {
    id: 'year_2',
    type: 'year',
    title: '2nd Year',
    subtitle: 'Semester 4 • 2024-25',
    description: '580 students, 12 courses',
    metadata: { academic_year: '2024-25', semester: 4 }
  },
  {
    id: 'year_3',
    type: 'year',
    title: '3rd Year',
    subtitle: 'Semester 6 • 2024-25',
    description: '550 students, 15 courses',
    metadata: { academic_year: '2024-25', semester: 6 }
  },
  {
    id: 'year_4',
    type: 'year',
    title: '4th Year',
    subtitle: 'Semester 8 • 2024-25',
    description: '520 students, 8 courses',
    metadata: { academic_year: '2024-25', semester: 8 }
  },
  // Departments
  {
    id: 'dept_cse',
    type: 'department',
    title: 'Computer Science Engineering',
    subtitle: 'CSE',
    description: '120 students, 8 courses',
    metadata: { department: 'Computer Science Engineering', year: '3rd Year' }
  },
  {
    id: 'dept_aids',
    type: 'department',
    title: 'Artificial Intelligence and Data Science',
    subtitle: 'AIDS',
    description: '80 students, 6 courses',
    metadata: { department: 'Artificial Intelligence and Data Science', year: '3rd Year' }
  },
  {
    id: 'dept_ise',
    type: 'department',
    title: 'Information Science Engineering',
    subtitle: 'ISE',
    description: '100 students, 7 courses',
    metadata: { department: 'Information Science Engineering', year: '3rd Year' }
  },
  {
    id: 'dept_ece',
    type: 'department',
    title: 'Electronics and Communication',
    subtitle: 'ECE',
    description: '90 students, 6 courses',
    metadata: { department: 'Electronics and Communication', year: '3rd Year' }
  },
  {
    id: 'dept_me',
    type: 'department',
    title: 'Mechanical Engineering',
    subtitle: 'ME',
    description: '85 students, 5 courses',
    metadata: { department: 'Mechanical Engineering', year: '3rd Year' }
  },
  {
    id: 'dept_ce',
    type: 'department',
    title: 'Civil Engineering',
    subtitle: 'CE',
    description: '75 students, 5 courses',
    metadata: { department: 'Civil Engineering', year: '3rd Year' }
  },
  // Courses
  {
    id: 'course_cs301',
    type: 'course',
    title: 'CS301 - Data Structures and Algorithms',
    subtitle: 'Section A • Core Course',
    description: '60 students, 24 classes held',
    metadata: { 
      course_code: 'CS301', 
      section: 'A', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'course_cs302',
    type: 'course',
    title: 'CS302 - Database Management Systems',
    subtitle: 'Section A • Core Course',
    description: '60 students, 20 classes held',
    metadata: { 
      course_code: 'CS302', 
      section: 'A', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'course_cs303',
    type: 'course',
    title: 'CS303 - Computer Networks',
    subtitle: 'Section B • Core Course',
    description: '58 students, 22 classes held',
    metadata: { 
      course_code: 'CS303', 
      section: 'B', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'course_cs304',
    type: 'course',
    title: 'CS304 - Operating Systems',
    subtitle: 'Section A • Department Elective',
    description: '60 students, 18 classes held',
    metadata: { 
      course_code: 'CS304', 
      section: 'A', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'course_aids201',
    type: 'course',
    title: 'AIDS201 - Machine Learning Fundamentals',
    subtitle: 'Section A • Core Course',
    description: '40 students, 16 classes held',
    metadata: { 
      course_code: 'AIDS201', 
      section: 'A', 
      department: 'Artificial Intelligence and Data Science',
      year: '3rd Year'
    }
  },
  {
    id: 'course_ise301',
    type: 'course',
    title: 'ISE301 - Software Engineering',
    subtitle: 'Section A • Core Course',
    description: '50 students, 18 classes held',
    metadata: { 
      course_code: 'ISE301', 
      section: 'A', 
      department: 'Information Science Engineering',
      year: '3rd Year'
    }
  },
  // Students
  {
    id: 'student_1',
    type: 'student',
    title: 'Aditya Sharma',
    subtitle: 'NNM22CS001',
    description: 'Computer Science Engineering • 3rd Year',
    metadata: { 
      usn: 'NNM22CS001', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'student_2',
    type: 'student',
    title: 'Bhavana Nair',
    subtitle: 'NNM22CS002',
    description: 'Computer Science Engineering • 3rd Year',
    metadata: { 
      usn: 'NNM22CS002', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'student_3',
    type: 'student',
    title: 'Chetan Kumar',
    subtitle: 'NNM22CS003',
    description: 'Computer Science Engineering • 3rd Year',
    metadata: { 
      usn: 'NNM22CS003', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'student_4',
    type: 'student',
    title: 'Divya Rao',
    subtitle: 'NNM22CS004',
    description: 'Computer Science Engineering • 3rd Year',
    metadata: { 
      usn: 'NNM22CS004', 
      department: 'Computer Science Engineering',
      year: '3rd Year'
    }
  },
  {
    id: 'student_5',
    type: 'student',
    title: 'Rahul Verma',
    subtitle: 'NNM22AIDS001',
    description: 'Artificial Intelligence and Data Science • 3rd Year',
    metadata: { 
      usn: 'NNM22AIDS001', 
      department: 'Artificial Intelligence and Data Science',
      year: '3rd Year'
    }
  },
  {
    id: 'student_6',
    type: 'student',
    title: 'Priya Singh',
    subtitle: 'NNM22ISE001',
    description: 'Information Science Engineering • 3rd Year',
    metadata: { 
      usn: 'NNM22ISE001', 
      department: 'Information Science Engineering',
      year: '3rd Year'
    }
  },
  // Electives
  {
    id: 'elective_1',
    type: 'elective',
    title: 'Machine Learning',
    subtitle: 'CS401 • Department Elective',
    description: 'Computer Science Engineering • 4th Year',
    metadata: { 
      course_code: 'CS401', 
      department: 'Computer Science Engineering',
      year: '4th Year'
    }
  },
  {
    id: 'elective_2',
    type: 'elective',
    title: 'Web Technologies',
    subtitle: 'CS402 • Department Elective',
    description: 'Computer Science Engineering • 4th Year',
    metadata: { 
      course_code: 'CS402', 
      department: 'Computer Science Engineering',
      year: '4th Year'
    }
  },
  {
    id: 'elective_3',
    type: 'elective',
    title: 'Data Mining',
    subtitle: 'CS403 • Open Elective',
    description: 'Available for all departments • 4th Year',
    metadata: { 
      course_code: 'CS403', 
      year: '4th Year'
    }
  },
  {
    id: 'elective_4',
    type: 'elective',
    title: 'Blockchain Technology',
    subtitle: 'CS404 • Department Elective',
    description: 'Computer Science Engineering • 4th Year',
    metadata: { 
      course_code: 'CS404', 
      department: 'Computer Science Engineering',
      year: '4th Year'
    }
  }
]

export function MasterSearch({ onNavigate, placeholder = "Search years, departments, courses, students..." }: MasterSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const handleResultClick = useCallback((result: SearchResult) => {
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    onNavigate(result)
  }, [onNavigate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, handleResultClick])
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      // Replace with actual API call
      // const searchResults = await searchAllEntities(teacherId, term)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const searchTermLower = term.toLowerCase()
      const filteredResults = mockSearchData.filter(item => {
        // Search in main fields
        if (item.title.toLowerCase().includes(searchTermLower) ||
            item.subtitle.toLowerCase().includes(searchTermLower) ||
            (item.description && item.description.toLowerCase().includes(searchTermLower))) {
          return true
        }
        
        // Search in metadata fields
        if (item.metadata) {
          if ((item.metadata.course_code && item.metadata.course_code.toLowerCase().includes(searchTermLower)) ||
              (item.metadata.usn && item.metadata.usn.toLowerCase().includes(searchTermLower)) ||
              (item.metadata.department && item.metadata.department.toLowerCase().includes(searchTermLower)) ||
              (item.metadata.year && item.metadata.year.toLowerCase().includes(searchTermLower)) ||
              (item.metadata.section && item.metadata.section.toLowerCase().includes(searchTermLower)) ||
              (item.metadata.academic_year && item.metadata.academic_year.toLowerCase().includes(searchTermLower))) {
            return true
          }
        }
        
        return false
      })
      
      // Sort results by relevance (exact matches first, then partial matches)
      const sortedResults = filteredResults.sort((a, b) => {
        const aExactMatch = a.title.toLowerCase().startsWith(searchTermLower) ||
                           (a.metadata?.course_code && a.metadata.course_code.toLowerCase().startsWith(searchTermLower)) ||
                           (a.metadata?.usn && a.metadata.usn.toLowerCase().startsWith(searchTermLower))
        const bExactMatch = b.title.toLowerCase().startsWith(searchTermLower) ||
                           (b.metadata?.course_code && b.metadata.course_code.toLowerCase().startsWith(searchTermLower)) ||
                           (b.metadata?.usn && b.metadata.usn.toLowerCase().startsWith(searchTermLower))
        
        if (aExactMatch && !bExactMatch) return -1
        if (!aExactMatch && bExactMatch) return 1
        
        // Sort by type priority: year > department > course > student > elective
        const typePriority = { year: 1, department: 2, course: 3, student: 4, elective: 5 }
        return (typePriority[a.type] || 6) - (typePriority[b.type] || 6)
      }).slice(0, 8) // Limit to 8 results for better UX
      
      setResults(sortedResults)
      setIsOpen(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    performSearch(value)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'year': return <GraduationCap className="w-4 h-4 text-blue-500" />
      case 'department': return <Building2 className="w-4 h-4 text-purple-500" />
      case 'course': return <BookOpen className="w-4 h-4 text-green-500" />
      case 'student': return <Users className="w-4 h-4 text-orange-500" />
      case 'elective': return <Star className="w-4 h-4 text-yellow-500" />
      default: return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'year': return 'Year'
      case 'department': return 'Department'
      case 'course': return 'Course'
      case 'student': return 'Student'
      case 'elective': return 'Elective'
      default: return 'Result'
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm text-base font-medium text-gray-900 placeholder-gray-400 focus:placeholder-gray-300"
        />{searchTerm && (
          <button
            onClick={clearSearch}
            title="Clear search"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="py-2">
              {results.map((result, index) => (                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  title={`Navigate to ${result.title}`}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {result.subtitle}
                        </p>
                        {result.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && searchTerm && results.length === 0 && !loading && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-50">
          <CardContent className="p-4 text-center text-gray-500">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No results found for &quot;{searchTerm}&quot;</p>
            <p className="text-xs text-gray-400 mt-1">
              Try searching for years, departments, courses, or students
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
