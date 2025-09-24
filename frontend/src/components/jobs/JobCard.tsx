'use client'

import Link from 'next/link'
import { Building, CheckSquare, Square } from "lucide-react"

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    logo: string
    industry: string
    companyType: string
    location: string
    workType: string
    jobType: string
    level: string
    salary: string
    startDate: string
    applicants: number
    postedTime: string
    matchScore: number
    matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    benefits: string[]
    applied: boolean
  }
  selectionMode?: boolean
  isSelected?: boolean
  onSelectionChange?: (jobId: string) => void
}

export default function JobCard({ job, selectionMode = false, isSelected = false, onSelectionChange }: JobCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelectionChange) {
      e.preventDefault()
      onSelectionChange(job.id)
    }
  }

  const CardContent = () => (
    <div 
      className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 border-b border-gray-100 ${
        selectionMode ? 'cursor-pointer' : ''
      } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
      onClick={selectionMode ? handleClick : undefined}
    >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
        
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
            <Building className="w-3 h-3" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
    </div>
  )

  if (selectionMode) {
    return <CardContent />
  }

  return (
    <Link href={`/job/${job.id}`} className="block">
      <CardContent />
    </Link>
  )
}
