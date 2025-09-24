'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  X,
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
  TrendingUp,
  ArrowLeft
} from "lucide-react"

interface JobDetailModalProps {
  isOpen: boolean
  onClose: () => void
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
    description?: string
    requirements?: string[]
    niceToHave?: string[]
    companyInfo?: {
      size: string
      founded: string
      headquarters: string
      website: string
      description: string
    }
  } | null
}

export default function JobDetailModal({ isOpen, onClose, job }: JobDetailModalProps) {
  const [isApplying, setIsApplying] = useState(false)

  if (!isOpen || !job) return null

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
      window.location.href = '/create?jobId=' + job.id
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {job.company.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-gray-600">{job.company}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-lg text-gray-600 mb-3">
                        <span className="font-medium">{job.company}</span>
                        <span>•</span>
                        <span>{job.industry}</span>
                        <span>•</span>
                        <span>{job.companyType}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Posted {job.postedTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{job.workType}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{job.salary}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{job.startDate}</span>
                    </div>
                  </div>

                  {/* Job Type and Level */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge variant="secondary">{job.jobType}</Badge>
                    <Badge variant="outline">{job.level}</Badge>
                  </div>

                  {/* Benefits */}
                  {job.benefits.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Benefits:</span>
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description */}
              {job.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {job.description.split('\n').map((paragraph, index) => (
                        <div key={index} className="mb-3">
                          {paragraph.startsWith('•') ? (
                            <div className="flex items-start">
                              <span className="text-blue-500 mr-2 mt-1">•</span>
                              <span className="text-gray-700">{paragraph.replace('• ', '')}</span>
                            </div>
                          ) : paragraph.trim() ? (
                            <p className="text-gray-700">{paragraph}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Qualifications:</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2 mt-1">•</span>
                              <span className="text-gray-700 text-sm">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {job.niceToHave && job.niceToHave.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Nice to Have:</h4>
                            <ul className="space-y-2">
                              {job.niceToHave.map((item, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-gray-400 mr-2 mt-1">•</span>
                                  <span className="text-gray-600 text-sm">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Company Info */}
              {job.companyInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {job.company}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700">{job.companyInfo.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Size:</span>
                          <div className="text-gray-600">{job.companyInfo.size}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Founded:</span>
                          <div className="text-gray-600">{job.companyInfo.founded}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">HQ:</span>
                          <div className="text-gray-600">{job.companyInfo.headquarters}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Website:</span>
                          <a 
                            href={`https://${job.companyInfo.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center"
                          >
                            {job.companyInfo.website}
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
                  <div className={`rounded-lg p-4 text-center ${getMatchColor(job.matchLevel)}`}>
                    <div className="text-3xl font-bold mb-1">
                      {job.matchScore}%
                    </div>
                    <div className="text-sm font-medium">
                      {job.matchLevel} MATCH
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Apply Section */}
              <Card>
                <CardContent className="p-6">
                  {job.applied ? (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
