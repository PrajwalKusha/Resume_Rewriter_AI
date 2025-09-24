'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, User, Briefcase, GraduationCap, Code, Award, Globe } from "lucide-react"

// Type definitions based on the new comprehensive backend ResumeData model
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

// Helper function to convert comma-separated string to array and create badges
const createBadgesFromString = (str: string | undefined, variant: "default" | "secondary" | "outline" = "default") => {
  if (!str || str.trim() === '') return null;
  return str.split(',').map((item, idx) => (
    <Badge key={idx} variant={variant} className="text-xs">
      {item.trim()}
    </Badge>
  ));
};

// Helper function to format detailed text with proper line breaks and structure
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

// API call to backend
const analyzeResume = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:8000/api/analyze-resume', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error analyzing resume:', error)
    throw new Error('Failed to analyze resume. Please check if the backend is running and try again.')
  }
}

export default function ResumePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, DOC, or TXT file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    
    setIsAnalyzing(true)
    setError(null)
    try {
      const result = await analyzeResume(selectedFile)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Resume Analyzer
        </h1>
        <p className="text-lg text-gray-600">
          Upload your resume and get comprehensive AI-powered analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Resume Upload
            </CardTitle>
            <CardDescription>
              Upload your resume in PDF, DOCX, DOC, or TXT format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your resume here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Remove
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isAnalyzing}
              >
                Clear
              </Button>
            </div>

            {/* File Type Info */}
            <div className="text-xs text-gray-500">
              Supported formats: PDF, DOCX, DOC, TXT (Max size: 10MB)
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              AI-extracted information from your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center text-red-500 py-8 border border-red-200 rounded-lg bg-red-50">
                <p className="font-medium">Analysis Failed</p>
                <p className="text-sm mt-2">{error}</p>
                <p className="text-xs mt-2 text-gray-600">
                  Make sure the backend is running and you uploaded a valid resume file
                </p>
              </div>
            ) : !analysis ? (
              <div className="text-center text-gray-500 py-8">
                <p>Upload a resume and click "Analyze Resume" to see the structured analysis</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {analysis.full_name}</div>
                    <div><span className="font-medium">Email:</span> {analysis.email}</div>
                    <div><span className="font-medium">Phone:</span> {analysis.phone}</div>
                    {analysis.linkedin && (
                      <div><span className="font-medium">LinkedIn:</span> 
                        <a href={`https://${analysis.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-1">
                          {analysis.linkedin}
                        </a>
                      </div>
                    )}
                    {analysis.github && (
                      <div><span className="font-medium">GitHub:</span> 
                        <a href={`https://${analysis.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-1">
                          {analysis.github}
                        </a>
                      </div>
                    )}
                    {analysis.location && (
                      <div><span className="font-medium">Location:</span> {analysis.location}</div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Professional Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Professional Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.professional_summary}</p>
                </div>
                <Separator />

                {/* Career Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Career Summary</h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.career_summary)}
                  </div>
                </div>
                <Separator />

                {/* Technical Skills */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Technical Skills
                  </h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.technical_skills_detailed)}
                  </div>
                </div>
                <Separator />

                {/* Work Experience */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Work Experience
                  </h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.work_experience_detailed)}
                  </div>
                </div>
                <Separator />

                {/* Education */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Education
                  </h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.education_detailed)}
                  </div>
                </div>
                <Separator />

                {/* Projects */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Projects</h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.projects_detailed)}
                  </div>
                </div>
                <Separator />

                {/* Quantified Achievements */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Key Achievements
                  </h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.quantified_achievements)}
                  </div>
                </div>
                <Separator />

                {/* Professional Context */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Professional Context
                  </h3>
                  <div className="text-sm text-gray-700">
                    {formatDetailedText(analysis.professional_context)}
                  </div>
                </div>
                
                {/* Additional Information */}
                {analysis.additional_info && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
                      <div className="text-sm text-gray-700">
                        {formatDetailedText(analysis.additional_info)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
