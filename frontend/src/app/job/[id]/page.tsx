'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { userService } from '@/services/userService'
import { 
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Building,
  Star,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface JobDetail {
  job_id: string
  job_title: string
  company_name: string
  location?: string
  work_type?: string
  employment_type?: string
  salary_range?: string
  application_status: string
  created_at?: string
  priority?: string
  notes?: string
  parsed_jd_data?: string | object
  jd_analysis_data?: string | object
}

// Helper function to categorize technologies
const getUniqueCategories = (technologies: string[]) => {
  const categories = new Set<string>()
  
  technologies.forEach(tech => {
    const lower = tech.toLowerCase()
    if (lower.includes('excel') || lower.includes('sheets') || lower.includes('office')) {
      categories.add('Productivity Tools')
    } else if (lower.includes('tableau') || lower.includes('power bi') || lower.includes('looker')) {
      categories.add('Data Visualization')
    } else if (lower.includes('python') || lower.includes('sql') || lower.includes('r ') || lower.includes('javascript')) {
      categories.add('Programming')
    } else if (lower.includes('salesforce') || lower.includes('crm')) {
      categories.add('CRM Platforms')
    } else if (lower.includes('aws') || lower.includes('azure') || lower.includes('cloud')) {
      categories.add('Cloud Services')
    } else if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('ml')) {
      categories.add('AI/ML Tools')
    } else {
      categories.add('Business Tools')
    }
  })
  
  return Array.from(categories)
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  
  const [job, setJob] = useState<JobDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isJobDescExpanded, setIsJobDescExpanded] = useState(false)

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true)
        const jobData = await userService.getJobDetails(jobId)
        setJob(jobData)
      } catch (err) {
        console.error('Error fetching job details:', err)
        setError('Failed to load job details')
      } finally {
        setIsLoading(false)
      }
    }

    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  // Parse the job data for display
  const parseJobData = (job: JobDetail) => {
    let parsedData = null
    let analysisData = null
    
    try {
      // Check both possible field names for the analysis data
      const analysisField = job.jd_analysis_data || job.parsed_jd_data
      if (analysisField) {
        // The analysis data might already be an object or a string
        parsedData = typeof analysisField === 'string' 
          ? JSON.parse(analysisField) 
          : analysisField
        
        // Handle both data structures:
        // 1. Direct analysis object: {job_title: "...", company_name: "...", ...}
        // 2. Wrapper object: {analysis: {...}, original_jd_text: "...", timestamp: "..."}
        if (parsedData?.analysis) {
          // Case 2: Wrapper structure (from JD files)
          analysisData = parsedData.analysis
        } else if (parsedData?.job_title || parsedData?.company_name) {
          // Case 1: Direct analysis object (from database)
          analysisData = parsedData
        }
        
        console.log('Parsed Data:', parsedData)
        console.log('Analysis Data:', analysisData)
      }
    } catch (e) {
      console.warn('Failed to parse job data:', e)
    }

    return {
      id: job.job_id,
      title: job.job_title,
      company: job.company_name,
      logo: `/logos/${job.company_name.toLowerCase().replace(/\s+/g, '')}.png`,
      industry: analysisData?.industry || 'Technology',
      companyType: 'Company',
      location: job.location || analysisData?.work_location || 'Remote',
      locationDetails: analysisData?.location_details,
      workType: job.work_type || 'Hybrid',
      jobType: job.employment_type || analysisData?.employment_type || 'Full Time',
      level: 'Mid-Level',
      salary: job.salary_range || analysisData?.salary_range || 'Competitive',
      startDate: 'Flexible',
      applicants: 50, // Mock data
      postedTime: job.created_at ? getTimeAgo(new Date(job.created_at)) : '1 day ago',
      matchScore: 75, // Mock data
      matchLevel: 'GOOD' as const,
      benefits: analysisData?.benefits || ['Great Benefits', 'Growth Opportunities'],
      applied: job.application_status === 'applied',
      description: analysisData?.job_summary || '',
      requirements: analysisData?.required_skills || [],
      niceToHave: analysisData?.preferred_skills || [],
      keyResponsibilities: analysisData?.key_responsibilities || [],
      requiredEducation: analysisData?.required_education,
      requiredExperience: analysisData?.required_experience,
      preferredEducation: analysisData?.preferred_education,
      preferredExperience: analysisData?.preferred_experience,
      toolsTechnologies: analysisData?.tools_technologies || [],
      certifications: analysisData?.certifications || [],
      travelRequirements: analysisData?.travel_requirements,
      physicalRequirements: analysisData?.physical_requirements,
      additionalNotes: analysisData?.additional_notes,
      department: analysisData?.department,
      originalText: parsedData?.original_jd_text || job.job_description,
      companyInfo: analysisData?.company_culture ? {
        size: '1000+ employees',
        founded: '2004',
        headquarters: 'Global',
        website: job.company_name.toLowerCase().replace(/\s+/g, '') + '.com',
        description: analysisData.company_culture
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The job you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </Layout>
    )
  }

  const jobData = parseJobData(job)
  
  // Debug logging
  console.log('Raw Job:', job)
  console.log('Job Data:', jobData)
  console.log('Key Responsibilities:', jobData.keyResponsibilities)
  console.log('Requirements:', jobData.requirements)
  console.log('Original Text:', jobData.originalText)
  console.log('JD Analysis Data:', job.jd_analysis_data)
  console.log('Parsed JD Data:', job.parsed_jd_data)

  const getMatchColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT': return 'text-green-600 border-green-500 bg-green-50'
      case 'GOOD': return 'text-blue-600 border-blue-500 bg-blue-50'
      case 'FAIR': return 'text-yellow-600 border-yellow-500 bg-yellow-50'
      case 'POOR': return 'text-red-600 border-red-500 bg-red-50'
      default: return 'text-gray-600 border-gray-500 bg-gray-50'
    }
  }

  const handleApply = () => {
    setIsApplying(true)
    // Redirect to create resume wizard with pre-filled job data
    setTimeout(() => {
      router.push('/create?jobId=' + jobData.id)
    }, 1000)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-6 max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {jobData.company.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-gray-900">{jobData.company}</span>
                    <span>•</span>
                    <span>{jobData.postedTime}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    {jobData.title}
                  </h1>
                </div>
              </div>

              {/* Key Job Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-800 font-medium">{jobData.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-gray-800 font-medium">{jobData.jobType}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-800 font-medium">{jobData.workType}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-800 font-medium">{jobData.level}</span>
                </div>
              </div>

              {/* Job Summary */}
              {jobData.description && (
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed text-base">
                    {jobData.description}
                  </p>
                </div>
              )}

              {/* Skills Tags */}
              {jobData.toolsTechnologies.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {jobData.toolsTechnologies.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {jobData.benefits.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                  {jobData.benefits.slice(0, 2).map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Responsibilities */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Key Responsibilities</h2>
                  <p className="text-sm text-gray-600">{jobData.keyResponsibilities?.length || 0} tasks identified</p>
                </div>
              </div>
              
              {jobData.keyResponsibilities && jobData.keyResponsibilities.length > 0 ? (
                <div className="space-y-3">
                  {jobData.keyResponsibilities.map((responsibility, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">{responsibility}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No key responsibilities extracted by AI</p>
                </div>
              )}
            </div>

            {/* Expandable Job Description */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Full Job Description</h2>
                    <p className="text-sm text-gray-600">Complete job posting details</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsJobDescExpanded(!isJobDescExpanded)}
                  className="flex items-center space-x-2"
                >
                  <span className="text-sm">{isJobDescExpanded ? 'Collapse' : 'Expand'}</span>
                  {isJobDescExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              
              {isJobDescExpanded && (
                <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200">
                  <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                    {jobData.originalText || 'No job description available.'}
                  </div>
                </div>
              )}
            </div>

            {/* Requirements & Skills */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Requirements & Skills</h2>
                  <p className="text-sm text-gray-600">
                    {(jobData.requirements?.length || 0) + (jobData.niceToHave?.length || 0)} skills identified
                  </p>
                </div>
              </div>

              {/* Required Skills */}
              {jobData.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-red-700 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Must-Have Skills ({jobData.requirements.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {jobData.requirements.map((req, index) => (
                      <span key={index} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-200 transition-colors">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {jobData.niceToHave.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-blue-700 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Nice-to-Have Skills ({jobData.niceToHave.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {jobData.niceToHave.map((item, index) => (
                      <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-200 transition-colors">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & Education */}
              {(jobData.requiredEducation || jobData.requiredExperience) && (
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Experience & Education</h3>
                  <div className="space-y-2 text-sm">
                    {jobData.requiredExperience && (
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{jobData.requiredExperience}</span>
                      </div>
                    )}
                    {jobData.requiredEducation && (
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{jobData.requiredEducation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Technologies & Tools */}
            {jobData.toolsTechnologies.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Technologies & Tools</h2>
                    <p className="text-sm text-gray-600">{jobData.toolsTechnologies.length} technologies required</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {jobData.toolsTechnologies.map((tool, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-3 border border-purple-100 hover:shadow-md transition-all duration-200 hover:scale-105">
                      <div className="font-medium text-purple-800 text-sm">{tool}</div>
                      <div className="text-xs text-purple-600 mt-1">Required</div>
                    </div>
                  ))}
                </div>
                
                {/* Tech Categories */}
                <div className="bg-white/70 rounded-lg p-4 border border-purple-100">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Technology Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {getUniqueCategories(jobData.toolsTechnologies).map((category, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Benefits Section */}
            {jobData.benefits.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Benefits & Perks</h2>
                    <p className="text-sm text-gray-600">{jobData.benefits.length} benefits offered</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {jobData.benefits.map((benefit, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-3 border border-green-100 flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-800 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Section */}
            {jobData.companyInfo && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">About {jobData.company}</h2>
                    <p className="text-sm text-gray-600">Company information</p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {jobData.company.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{jobData.company}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Founded {jobData.companyInfo.founded}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{jobData.companyInfo.headquarters}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{jobData.companyInfo.size}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>{jobData.companyInfo.website}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {jobData.companyInfo.description}
                  </p>
                </div>
              </div>
            )}



            {/* AI Analysis Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-6">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Analysis Summary</h2>
                  <p className="text-sm text-gray-600">Job posting insights powered by AI</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/70 rounded-lg p-4 border border-indigo-100 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{jobData.requirements?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Required Skills</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-indigo-100 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{jobData.keyResponsibilities?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Key Responsibilities</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-indigo-100 text-center">
                  <div className="text-2xl font-bold text-purple-600">{jobData.toolsTechnologies?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Technologies</div>
                </div>
              </div>
              
              {/* Quick Overview */}
              <div className="bg-white/70 rounded-lg p-4 border border-indigo-100">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">Job Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry:</span>
                    <span className="font-medium text-gray-800">{jobData.industry || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium text-gray-800">{jobData.department || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience Level:</span>
                    <span className="font-medium text-gray-800">{jobData.level || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Work Type:</span>
                    <span className="font-medium text-gray-800">{jobData.workType || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            {jobData.companyInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>About {jobData.company}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{jobData.companyInfo.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Size:</span>
                        <div className="text-gray-600">{jobData.companyInfo.size}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Founded:</span>
                        <div className="text-gray-600">{jobData.companyInfo.founded}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">HQ:</span>
                        <div className="text-gray-600">{jobData.companyInfo.headquarters}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Website:</span>
                        <a 
                          href={`https://${jobData.companyInfo.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          {jobData.companyInfo.website}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Match Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                                  <div className={`rounded-lg p-4 text-center ${getMatchColor(jobData.matchLevel)}`}>
                    <div className="text-3xl font-bold mb-1">
                      {jobData.matchScore}%
                    </div>
                    <div className="text-sm font-medium">
                      {jobData.matchLevel} MATCH
                    </div>
                  </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Skills Match</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium">70%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Education</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">60%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apply Section */}
            <Card>
              <CardContent className="p-6">
                {jobData.applied ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Application Submitted</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your application was submitted successfully.
                    </p>
                    <Button variant="outline" className="w-full">
                      View Application
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleApply}
                      disabled={isApplying}
                    >
                      {isApplying ? 'Creating Resume...' : 'Apply with AI Resume'}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Star className="w-4 h-4 mr-2" />
                      Ask AI Questions
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      AI will optimize your resume for this specific job
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: 'Data Analyst Intern', company: 'Google', match: 72 },
                    { title: 'Business Analyst', company: 'Microsoft', match: 68 },
                    { title: 'Strategy Consultant', company: 'McKinsey', match: 65 }
                  ].map((similarJob, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {similarJob.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {similarJob.company}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {similarJob.match}%
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View All Similar Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  )
}
