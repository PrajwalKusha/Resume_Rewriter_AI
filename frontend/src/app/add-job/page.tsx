'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { userStorage } from '@/services/userService'
import { 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Building,
  MapPin,
  DollarSign,
  Clock
} from "lucide-react"

export default function AddJobPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const userId = userStorage.getCurrentUserId()
    if (!userId) {
      router.push('/')
      return
    }
    setCurrentUserId(userId)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jobDescription.trim()) {
      setError('Job description is required')
      return
    }

    if (!currentUserId) {
      setError('Please log in to add a job')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          job_description: jobDescription,
          job_title: jobTitle || undefined,
          company_name: companyName || undefined,
          job_url: jobUrl || undefined
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create job: ${errorText}`)
      }

      const result = await response.json()
      setAnalysisResult(result)
      
      // Clear form
      setJobDescription('')
      setJobTitle('')
      setCompanyName('')
      setJobUrl('')

    } catch (err) {
      console.error('Error creating job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGoToDashboard = () => {
    router.push('/')
  }

  const handleViewJobDetails = () => {
    if (analysisResult?.job_id) {
      router.push(`/job/${analysisResult.job_id}`)
    }
  }

  const renderAnalysisPreview = () => {
    if (!analysisResult?.jd_analysis_data) return null

    const analysis = analysisResult.jd_analysis_data
    
    return (
      <Card className="mt-6 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-800">Job Analysis Complete!</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            AI has successfully analyzed your job posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{analysis.company_name || 'Company'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{analysis.work_location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>{analysis.salary_range || 'Salary not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{analysis.employment_type || 'Full-time'}</span>
            </div>
          </div>

          {/* Skills Preview */}
          {analysis.required_skills && analysis.required_skills.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Key Skills Required:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.required_skills.slice(0, 6).map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {analysis.required_skills.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{analysis.required_skills.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleViewJobDetails} className="bg-blue-500 hover:bg-blue-600">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Analysis
            </Button>
            <Button onClick={handleGoToDashboard} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentUserId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Add New Job</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Paste a job description and let AI extract all the key details for you
            </p>
          </div>
        </div>

        {/* Main Form */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Job Information</span>
            </CardTitle>
            <CardDescription>
              Fill in the job description and any additional details you have
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Optional Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                    Job Title (Optional)
                  </Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                    Company Name (Optional)
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="jobUrl" className="text-sm font-medium text-gray-700">
                    Job URL (Optional)
                  </Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://company.com/jobs/123"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div>
                <Label htmlFor="jobDescription" className="text-sm font-medium text-gray-700">
                  Job Description *
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Paste the complete job posting here. The more details, the better the AI analysis.
                </p>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={12}
                  className="mt-1 font-mono text-sm"
                  required
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isAnalyzing || !jobDescription.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI is Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Analysis Result */}
        {renderAnalysisPreview()}

        {/* Tips Section */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
              Pro Tips for Better Analysis
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Include the complete job posting with requirements, responsibilities, and benefits
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Copy from the original job board (LinkedIn, Indeed, company website) for best results
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                AI will extract salary, skills, location, and 20+ other attributes automatically
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                You can always edit the extracted information later in the job details page
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
