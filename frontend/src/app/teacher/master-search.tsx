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
import mockSearchDataImport from '@/data/mockSearchData.json'

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

// Type the imported data and replace with actual API calls
const mockSearchData: SearchResult[] = mockSearchDataImport as SearchResult[]

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
    <div ref={searchRef} className="relative w-full max-w-2xl z-[70]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 focus:placeholder-gray-300"
        />
        {searchTerm && (
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
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-[70] max-h-80 sm:max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  title={`Navigate to ${result.title}`}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
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
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-[70]">
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
