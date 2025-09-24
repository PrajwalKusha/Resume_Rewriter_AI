'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import JobCard from '@/components/jobs/JobCard'

import Link from 'next/link'
import UserOnboarding from '@/components/auth/UserOnboarding'
import { Button } from "@/components/ui/button"
import { 
  Filter,
  SortDesc,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react"
import { userService, userStorage, DashboardData, Job } from '@/services/userService'

// Convert database job to JobCard format
const convertToJobCardFormat = (job: Job, index: number) => {
  const getMatchLevel = (score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' => {
    if (score >= 85) return 'EXCELLENT'
    if (score >= 70) return 'GOOD'
    if (score >= 50) return 'FAIR'
    return 'POOR'
  }

  // Generate a mock match score for now (you can implement real matching later)
  const mockMatchScore = 65 + (index * 7) % 30

  // Parse the job description data if available
  let parsedData = null
  try {
    if (job.parsed_jd_data) {
      parsedData = typeof job.parsed_jd_data === 'string' 
        ? JSON.parse(job.parsed_jd_data) 
        : job.parsed_jd_data
    }
  } catch (e) {
    console.warn('Failed to parse job data:', e)
  }

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.company_name,
    logo: `/logos/${job.company_name.toLowerCase().replace(/\s+/g, '')}.png`,
    industry: parsedData?.analysis?.industry || 'Technology',
    companyType: 'Company',
    location: job.location || parsedData?.analysis?.work_location || 'Remote',
    workType: job.work_type || 'Hybrid',
    jobType: job.employment_type || 'Full Time',
    level: 'Mid-Level',
    salary: job.salary_range || 'Competitive',
    startDate: 'Flexible',
    applicants: 50 + (index * 23) % 200, // Mock data
    postedTime: job.created_at ? getTimeAgo(new Date(job.created_at)) : '1 day ago',
    matchScore: mockMatchScore,
    matchLevel: getMatchLevel(mockMatchScore),
    benefits: parsedData?.analysis?.benefits || ['Great Benefits', 'Growth Opportunities'],
    applied: job.application_status === 'applied',
    // Additional data for modal
    description: parsedData?.analysis?.job_summary || '',
    requirements: parsedData?.analysis?.required_skills || [],
    niceToHave: parsedData?.analysis?.preferred_skills || [],
    companyInfo: parsedData?.analysis?.company_culture ? {
      size: '1000+ employees',
      founded: '2004',
      headquarters: 'Global',
      website: job.company_name.toLowerCase().replace(/\s+/g, '') + '.com',
      description: parsedData.analysis.company_culture
    } : undefined
  }
}

const getTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

export default function Dashboard() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteMode, setShowDeleteMode] = useState(false)



  useEffect(() => {
    // Check if user is already logged in
    const userId = userStorage.getCurrentUserId()
    if (userId) {
      setCurrentUserId(userId)
      loadDashboardData(userId)
    } else {
      // Fallback: if no user, show JD files as a simple list view
      ;(async () => {
        try {
          const files = await userService.listJDFiles()
          // Convert JD files to JobCard-like items
          const items = files.items.map((f, idx) => ({
            id: f.id,
            title: f.job_title || 'Unknown Position',
            company: f.company_name || 'Unknown Company',
            logo: '/logos/default.png',
            industry: '—',
            companyType: '—',
            location: '—',
            workType: '—',
            jobType: '—',
            level: '—',
            salary: '—',
            startDate: '—',
            applicants: 0,
            postedTime: '—',
            matchScore: 0,
            matchLevel: 'FAIR' as const,
            benefits: [],
            applied: false
          }))
          // Temporarily render them in place of DB jobs
          setDashboardData({
            total_applications: 0,
            applied_jobs: 0,
            interviews: 0,
            avg_match_score: 0,
            total_analyses: 0,
            total_generated_resumes: 0,
            recent_jobs: [],
            recent_analyses: []
          })
          // Store in jobs-like list by mocking the Job[] type minimal fields
          setJobs(items.map(i => ({
            job_id: i.id,
            job_title: i.title,
            company_name: i.company,
            application_status: 'new'
          })) as any)
        } catch (e) {
          console.warn('Failed to load JD files list', e)
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }, [])

  const loadDashboardData = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Load dashboard data and jobs in parallel
      const [dashboardResult, jobsResult] = await Promise.all([
        userService.getUserDashboard(userId),
        userService.getUserJobs(userId)
      ])

      setDashboardData(dashboardResult)
      setJobs(jobsResult.jobs)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(job => job.job_id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedJobs.size === 0) return

    setIsDeleting(true)
    try {
      const jobIds = Array.from(selectedJobs)
      await userService.deleteMultipleJobs(jobIds)
      
      // Refresh jobs list
      await loadJobs()
      
      // Reset selection
      setSelectedJobs(new Set())
      setShowDeleteMode(false)
      
      console.log(`Successfully deleted ${jobIds.length} jobs`)
    } catch (error) {
      console.error('Failed to delete jobs:', error)
      setError('Failed to delete jobs. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUserCreated = (userId: string) => {
    setCurrentUserId(userId)
    loadDashboardData(userId)
  }





  // Show onboarding if no user is logged in
  if (!currentUserId && !isLoading) {
    return <UserOnboarding onUserCreated={handleUserCreated} />
  }

  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => currentUserId && loadDashboardData(currentUserId)}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const jobCardData = jobs.map((job, index) => convertToJobCardFormat(job, index))

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600 mt-1">Track and manage your job applications</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-3">
            {!showDeleteMode ? (
              <>
                <Link href="/add-job">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Job
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <SortDesc className="w-4 h-4 mr-2" />
                  Sort
                </Button>
                {jobs.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDeleteMode(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Jobs
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedJobs.size === jobs.length ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  {selectedJobs.size === jobs.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedJobs.size === 0 || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Selected ({selectedJobs.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowDeleteMode(false)
                    setSelectedJobs(new Set())
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_applications || 0}
            </div>
            <div className="text-sm text-gray-500">Total Applications</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.applied_jobs || 0}
            </div>
            <div className="text-sm text-gray-500">Applied</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.interviews || 0}
            </div>
            <div className="text-sm text-gray-500">Interviews</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.avg_match_score || 0}%
            </div>
            <div className="text-sm text-gray-500">Avg Match</div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-600 mb-6">
              Start by creating your first AI-optimized resume for a specific job
            </p>
            <Link href="/add-job">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {jobCardData.map((job) => (
              <JobCard 
                key={job.id} 
                job={job}
                selectionMode={showDeleteMode}
                isSelected={selectedJobs.has(job.id)}
                onSelectionChange={handleJobSelection}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {jobs.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Jobs
            </Button>
          </div>
        )}




      </div>
    </Layout>
  )
}