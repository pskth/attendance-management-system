import React from 'react'

interface ProgressBarProps {
  percentage: number
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ProgressBar({ percentage, height = 'md', showLabel = false }: ProgressBarProps) {
  const getHeightClass = () => {
    switch (height) {
      case 'sm': return 'h-2'
      case 'md': return 'h-3'
      case 'lg': return 'h-4'
      default: return 'h-3'
    }
  }

  const getColorClass = () => {
    if (percentage >= 85) return 'bg-green-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getWidthPercentage = () => {
    return Math.min(Math.max(percentage, 0), 100)
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${getHeightClass()}`}>
        <div 
          className={`${getHeightClass()} rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${getWidthPercentage()}%` }}
        ></div>
      </div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>0%</span>
          <span className="font-medium">{percentage}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  )
}