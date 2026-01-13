"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

interface LoginFormProps {
  role: "student" | "teacher" | "admin" | "analytics"
}

const roleConfig = {
  student: {
    title: "Student Portal",
    icon: "🎓",
    subtitle: "Access your academic dashboard",
    gradient: "from-blue-500 to-blue-600"
  },
  teacher: {
    title: "Faculty Portal", 
    icon: "👨‍🏫",
    subtitle: "Manage your classes and students",
    gradient: "from-emerald-500 to-emerald-600"
  },
  admin: {
    title: "Admin Portal",
    icon: "⚙️",
    subtitle: "System administration panel",
    gradient: "from-red-500 to-red-600"
  },
  analytics: {
    title: "Analytics Portal",
    icon: "📊",
    subtitle: "View institutional insights",
    gradient: "from-orange-500 to-orange-600"
  }
}

export default function LoginForm({ role }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const config = roleConfig[role]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const newErrors: { username?: string; password?: string } = {}
    
    if (!username) {
      newErrors.username = "Username/Email is required"
    }
    
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 3) {
      newErrors.password = "Password must be at least 3 characters"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await login(username, password, role)
      
      if (response.status === 'success') {
        // Redirect based on role
        if (role === 'student') {
          router.push('/student/')
        } else if (role === 'teacher') {
          router.push('/teacher/')
        } else if (role === 'admin') {
          router.push('/admin/')
        } else if (role === 'analytics') {
          router.push('/analytics/')
        }
      } else {
        // Handle login errors
        let errorMessage = response.error || 'Login failed'
        
        if (response.code === 'INVALID_CREDENTIALS') {
          errorMessage = 'Invalid username or password'
        } else if (response.code === 'ROLE_ACCESS_DENIED') {
          errorMessage = `You don't have ${role} access privileges`
        } else if (response.code === 'USER_NOT_FOUND') {
          errorMessage = 'User not found'
        }
        
        setErrors({ general: errorMessage })
      }
    } catch (error) {
      console.error("Login failed:", error)
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} text-white text-2xl mb-4 shadow-lg`}>
              {config.icon}
            </div>
            
            <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
              {config.title}
            </CardTitle>
            <p className="text-slate-600">
              {config.subtitle}
            </p>
          </CardHeader>
          
          <CardContent>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.general}
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username or Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.username}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} pr-12`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.076.348-2.084.96-3M6.634 6.634A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.198-.375 2.326-1.034 3.32M9.88 9.88a3 3 0 104.24 4.24"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <a 
                href="#" 
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
              >
                Forgot your password?
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure institutional access
          </p>
        </div>
      </div>
    </div>
  )
}
