'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface AttendancePieChartProps {
  present: number
  absent: number
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
}

const COLORS = {
  present: '#10b981',
  absent: '#ef4444'
}

const SIZES = {
  sm: 120,
  md: 180,
  lg: 240
}

export function AttendancePieChart({ 
  present, 
  absent, 
  size = 'md', 
  showLegend = true 
}: AttendancePieChartProps) {
  const total = present + absent
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        No attendance data available
      </div>
    )
  }

  const data = [
    { name: 'Present', value: present, color: COLORS.present },
    { name: 'Absent', value: absent, color: COLORS.absent }
  ]

  const chartSize = SIZES[size]

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartSize + 40}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={chartSize / 3}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [
              `${value} classes`, 
              name
            ]}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary stats */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Present: {present} ({((present / total) * 100).toFixed(1)}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Absent: {absent} ({((absent / total) * 100).toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  )
}