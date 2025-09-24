'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { userService, userStorage } from '@/services/userService'
import { 
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Target,
  Wand2,
  Download,
  CheckCircle
} from "lucide-react"

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Job Description',
    description: 'Paste the job description you want to target',
    icon: <Target className="w-5 h-5" />
  },
  {
    id: 2,
    title: 'Upload Resume',
    description: 'Upload your existing resume',
    icon: <Upload className="w-5 h-5" />
  },
  {
    id: 3,
    title: 'Analysis Review',
    description: 'Review AI analysis and choose your approach',
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 4,
    title: 'AI Rewrite',
    description: 'Generate your optimized resume',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 5,
    title: 'Download & Save',
    description: 'Review and download your new resume',
    icon: <Download className="w-5 h-5" />
  }
]

export default function CreateResumePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [jdText, setJdText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jdAnalysis, setJdAnalysis] = useState<any>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
  const [rewriteApproach, setRewriteApproach] = useState<'complete' | 'stepByStep' | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = (currentStep / wizardSteps.length) * 100

  const handleNext = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const analyzeJD = async () => {
    if (!jdText.trim()) return
    
    // Get current user ID
    const userId = userStorage.getCurrentUserId()
    if (!userId) {
      setError('Please log in to continue')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    try {
      // Use the new wizard endpoint that creates a job and analyzes JD
      const result = await userService.createJobForWizard(userId, jdText)
      setJdAnalysis(result.analysis)
      
      // Store the job_id for the next step
      localStorage.setItem('current_job_id', result.job_id)
      
      handleNext()
    } catch (error) {
      console.error('Error analyzing JD:', error)
      setError('Failed to analyze job description. Please check if the backend is running and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeResume = async () => {
    if (!resumeFile) return
    
    // Get current user ID and job ID
    const userId = userStorage.getCurrentUserId()
    const jobId = localStorage.getItem('current_job_id')
    
    if (!userId) {
      setError('Please log in to continue')
      return
    }
    
    if (!jobId) {
      setError('Job information not found. Please go back and analyze the job description first.')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    try {
      // Use the new wizard endpoint that analyzes resume with job matching
      const result = await userService.analyzeResumeForWizard(resumeFile, userId, jobId)
      setResumeAnalysis(result)
      
      // Store the analysis_id for later steps
      if (result.analysis_id) {
        localStorage.setItem('current_analysis_id', result.analysis_id)
      }
      
      handleNext()
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setError('Failed to analyze resume. Please check if the backend is running and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Paste Job Description
              </h2>
              <p className="text-gray-600 mb-4">
                Copy and paste the full job description from the company's website or job board.
              </p>
            </div>
            
            <Textarea
              placeholder="Paste the complete job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" disabled>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={analyzeJD}
                disabled={!jdText.trim() || isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze & Continue'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your Resume
              </h2>
              <p className="text-gray-600 mb-4">
                Upload your current resume in PDF, DOCX, or TXT format.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {resumeFile ? resumeFile.name : 'Click to upload resume'}
                </div>
                <div className="text-sm text-gray-500">
                  Supports PDF, DOCX, DOC, and TXT files
                </div>
              </label>
            </div>
            
            {resumeFile && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">File uploaded successfully!</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={analyzeResume}
                disabled={!resumeFile || isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume & Continue'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Analysis Review
              </h2>
              <p className="text-gray-600 mb-4">
                Review the AI analysis and choose your rewrite approach.
              </p>
            </div>

            {/* Match Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">Overall Match Score</span>
                  <div className="text-3xl font-bold text-blue-600">
                    {resumeAnalysis?.match_score || 78}%
                  </div>
                </div>
                <Progress value={resumeAnalysis?.match_score || 78} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-600">Strong Matches:</span>
                    <ul className="mt-1 space-y-1 text-gray-700">
                      <li>• Technical Skills</li>
                      <li>• Years of Experience</li>
                      <li>• Industry Knowledge</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-red-600">Areas to Improve:</span>
                    <ul className="mt-1 space-y-1 text-gray-700">
                      <li>• Leadership Experience</li>
                      <li>• Specific Frameworks</li>
                      <li>• Quantified Achievements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approach Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Your Rewrite Approach
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    rewriteApproach === 'complete' 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setRewriteApproach('complete')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Wand2 className="w-5 h-5 mr-2" />
                      Complete Rewrite
                    </CardTitle>
                    <CardDescription>
                      AI generates a fully optimized resume automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Fastest option (2-3 minutes)</li>
                      <li>• AI handles all optimizations</li>
                      <li>• Review and edit after generation</li>
                      <li>• Best for quick applications</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    rewriteApproach === 'stepByStep' 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setRewriteApproach('stepByStep')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Step-by-Step
                    </CardTitle>
                    <CardDescription>
                      Guided optimization with your input at each stage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• More control over changes</li>
                      <li>• Review each section individually</li>
                      <li>• Learn optimization techniques</li>
                      <li>• Takes 10-15 minutes</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!rewriteApproach}
              >
                Continue with {rewriteApproach === 'complete' ? 'Complete Rewrite' : 'Step-by-Step'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Resume Generation
              </h2>
              <p className="text-gray-600 mb-4">
                Your optimized resume is being generated...
              </p>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Wand2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Generating Your Optimized Resume
                </h3>
                <p className="text-gray-600 mb-4">
                  AI is analyzing the job requirements and optimizing your resume...
                </p>
                <Progress value={65} className="mb-4" />
                <div className="text-sm text-gray-500">
                  This usually takes 2-3 minutes
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext}>
                View Generated Resume
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your Optimized Resume is Ready!
              </h2>
              <p className="text-gray-600 mb-4">
                Review your new resume and download it when you're satisfied.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Resume Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-lg font-medium text-green-800 mb-2">
                      Match Score Improved: 78% → 92%
                    </div>
                    <div className="text-sm text-green-700">
                      +18% improvement in job matching
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Optimizations Made:</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Enhanced technical skills section</li>
                        <li>• Added quantified achievements</li>
                        <li>• Optimized keywords for ATS</li>
                        <li>• Improved formatting and structure</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Improvements:</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Added 15 relevant keywords</li>
                        <li>• Highlighted leadership experience</li>
                        <li>• Emphasized project outcomes</li>
                        <li>• Tailored to job requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Preview Resume
              </Button>
              <Button variant="outline">
                Edit Resume
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={() => window.location.href = '/resumes'}>
                Save & Go to My Resumes
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Resume</h1>
            <Badge variant="outline">
              Step {currentStep} of {wizardSteps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index < wizardSteps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep > step.id 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === step.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="hidden md:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < wizardSteps.length - 1 && (
                  <div className="hidden md:block flex-1 h-px bg-gray-300 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
