'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download
} from "lucide-react"

interface ResumeAnalysis {
  // Contact Information (required)
  full_name: string;
  email: string;
  phone: string;
  
  // Contact Information (optional)
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
  
  // Professional Summary
  professional_summary: string;
  
  // Comprehensive Skills
  technical_skills_detailed: string;
  
  // Detailed Experience and Information
  work_experience_detailed: string;
  education_detailed: string;
  projects_detailed: string;
  quantified_achievements: string;
  professional_context: string;
  career_summary: string;
  
  // Additional Information (optional)
  additional_info?: string;
  
  // Raw content for reference
  raw_text?: string;
}

export default function ResumeAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const analyzeResume = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/api/analyze-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error analyzing resume:', error)
      throw error
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|docx|doc|txt)$/)) {
      setError('Please select a PDF, DOCX, DOC, or TXT file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.')
      return
    }

    setSelectedFile(file)
    setError(null)
    setIsAnalyzing(true)

    try {
      const result = await analyzeResume(file)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze resume. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setAnalysis(null)
    setError(null)
  }

  const formatDetailedText = (text: string | undefined) => {
    if (!text || text.trim() === '') return null;
    
    return text.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // Check if line starts with bullet point
      if (trimmedLine.startsWith('●') || trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <div key={idx} className="flex items-start mb-2">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span className="text-sm text-gray-700">{trimmedLine.replace(/^[●•\-]\s*/, '')}</span>
          </div>
        );
      }
      
      // Check if line looks like a header (all caps or contains "|")
      if (trimmedLine === trimmedLine.toUpperCase() || trimmedLine.includes('|') || trimmedLine.includes(':')) {
        return (
          <div key={idx} className="font-medium text-sm text-gray-900 mt-3 mb-1">
            {trimmedLine}
          </div>
        );
      }
      
      // Regular text
      return (
        <div key={idx} className="text-sm text-gray-700 mb-1">
          {trimmedLine}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Resume Analyzer
        </h1>
        <p className="text-lg text-gray-600">
          Upload your resume and get comprehensive AI analysis
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="default">
            Resume Analyzer
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/jd-analyzer'}>
            Job Description Analyzer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
            <CardDescription>
              Upload your resume in PDF, DOCX, DOC, or TXT format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-sm text-gray-500">
                    Supports PDF, DOCX, DOC, and TXT files (max 10MB)
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium text-green-800">{selectedFile.name}</div>
                      <div className="text-sm text-green-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    {isAnalyzing && (
                      <div className="text-sm text-green-700">Analyzing...</div>
                    )}
                  </div>
                </div>
                
                <Button variant="outline" onClick={handleClear} className="w-full">
                  Upload Different File
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <div className="text-red-800 font-medium">Error</div>
                </div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Comprehensive breakdown of your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your resume...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : !analysis ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Upload a resume to see the detailed analysis</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><span className="font-medium">Name:</span> {analysis.full_name}</div>
                    <div><span className="font-medium">Email:</span> {analysis.email}</div>
                    <div><span className="font-medium">Phone:</span> {analysis.phone}</div>
                    {analysis.location && <div><span className="font-medium">Location:</span> {analysis.location}</div>}
                    {analysis.linkedin && (
                      <div>
                        <span className="font-medium">LinkedIn:</span>{' '}
                        <a 
                          href={analysis.linkedin.startsWith('http') ? analysis.linkedin : `https://${analysis.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {analysis.linkedin}
                        </a>
                      </div>
                    )}
                    {analysis.github && (
                      <div>
                        <span className="font-medium">GitHub:</span>{' '}
                        <a 
                          href={analysis.github.startsWith('http') ? analysis.github : `https://${analysis.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {analysis.github}
                        </a>
                      </div>
                    )}
                    {analysis.portfolio && (
                      <div>
                        <span className="font-medium">Portfolio:</span>{' '}
                        <a 
                          href={analysis.portfolio.startsWith('http') ? analysis.portfolio : `https://${analysis.portfolio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {analysis.portfolio}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Professional Summary</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.professional_summary)}
                  </div>
                </div>

                {/* Career Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Career Summary</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.career_summary)}
                  </div>
                </div>

                {/* Technical Skills */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Technical Skills</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.technical_skills_detailed)}
                  </div>
                </div>

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Work Experience</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.work_experience_detailed)}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Education</h3>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.education_detailed)}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Projects</h3>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.projects_detailed)}
                  </div>
                </div>

                {/* Quantified Achievements */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Quantified Achievements</h3>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.quantified_achievements)}
                  </div>
                </div>

                {/* Professional Context */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Professional Context</h3>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    {formatDetailedText(analysis.professional_context)}
                  </div>
                </div>

                {/* Additional Information */}
                {analysis.additional_info && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Additional Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {formatDetailedText(analysis.additional_info)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
