'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  X,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react"

interface AddJobModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated: (job: any) => void
  userId: string
}

export default function AddJobModal({ isOpen, onClose, onJobCreated, userId }: AddJobModalProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jobDescription.trim()) {
      setError('Job description is required')
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
          user_id: userId,
          job_description: jobDescription.trim(),
          job_title: jobTitle.trim() || undefined,
          company_name: companyName.trim() || undefined,
          job_url: jobUrl.trim() || undefined
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setAnalysisResult(result)
      
      // Notify parent component
      onJobCreated(result)
      
      // Auto-close after 2 seconds to show success
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Error creating job:', error)
      setError(error instanceof Error ? error.message : 'Failed to create job')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClose = () => {
    setJobDescription('')
    setJobTitle('')
    setCompanyName('')
    setJobUrl('')
    setError(null)
    setAnalysisResult(null)
    setIsAnalyzing(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Add New Job
              </CardTitle>
              <CardDescription>
                Paste a job description and let AI extract all the details
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {!analysisResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Optional job details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    placeholder="e.g., Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name (Optional)</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="e.g., Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job URL (Optional)</Label>
                <Input
                  id="jobUrl"
                  type="url"
                  placeholder="https://company.com/jobs/123"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              {/* Job description */}
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none"
                  disabled={isAnalyzing}
                  required
                />
                <div className="text-xs text-gray-500">
                  AI will extract job title, company, requirements, and other details automatically
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isAnalyzing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!jobDescription.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Job...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Job
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            // Success state with analysis results
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Job Added Successfully!</div>
                  <div className="text-sm">AI has analyzed and extracted all job details</div>
                </div>
              </div>

              {/* Analysis Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Analysis Results:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Job Title:</span>
                    <div className="text-gray-700">{analysisResult.job_title}</div>
                  </div>
                  <div>
                    <span className="font-medium">Company:</span>
                    <div className="text-gray-700">{analysisResult.company_name}</div>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <div className="text-gray-700">{analysisResult.location || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Work Type:</span>
                    <div className="text-gray-700">{analysisResult.work_type || 'Not specified'}</div>
                  </div>
                </div>

                {analysisResult.salary_range && (
                  <div>
                    <span className="font-medium text-sm">Salary:</span>
                    <div className="text-gray-700">{analysisResult.salary_range}</div>
                  </div>
                )}

                {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Key Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {analysisResult.keywords.slice(0, 10).map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {analysisResult.keywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{analysisResult.keywords.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button onClick={handleClose}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
