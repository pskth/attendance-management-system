"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface LoginFormProps {
  role: "student" | "teacher" | "admin" | "parent" | "report_viewers"
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
  parent: {
    title: "Parent Portal",
    icon: "👪", 
    subtitle: "Monitor your child's progress",
    gradient: "from-purple-500 to-purple-600"
  },
  report_viewers: {
    title: "Analytics Portal",
    icon: "📊",
    subtitle: "View institutional insights",
    gradient: "from-orange-500 to-orange-600"
  }
}

export default function LoginForm({ role }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const config = roleConfig[role]

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    
    try {
      console.log("Login attempt:", { email, password, role })
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Replace with actual authentication logic
      alert(`Welcome to ${config.title}!`)
    } catch (error) {
      console.error("Login failed:", error)
      setErrors({ email: "Invalid credentials. Please try again." })
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your institutional email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
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
