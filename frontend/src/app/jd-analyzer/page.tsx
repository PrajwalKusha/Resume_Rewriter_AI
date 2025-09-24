'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Real API call to backend
const analyzeJD = async (jdText: string) => {
  try {
    const response = await fetch('http://localhost:8000/api/analyze-jd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jd_text: jdText }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error analyzing JD:', error)
    throw new Error('Failed to analyze job description. Please check if the backend is running and try again.')
  }
}

export default function JDAnalyzerPage() {
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!jdText.trim()) return
    
    setIsAnalyzing(true)
    setError(null)
    try {
      const result = await analyzeJD(jdText)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    setJdText('')
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Job Description Analyzer
        </h1>
        <p className="text-lg text-gray-600">
          Analyze job descriptions and extract structured information with AI
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="outline" onClick={() => window.location.href = '/resume-analyzer'}>
            Resume Analyzer
          </Button>
          <Button variant="default">
            Job Description Analyzer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description Input</CardTitle>
            <CardDescription>
              Paste the job description you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={15}
              className="min-h-[400px]"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze}
                disabled={!jdText.trim() || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze JD'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isAnalyzing}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Structured Analysis</CardTitle>
            <CardDescription>
              AI-extracted information from the job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center text-red-500 py-8 border border-red-200 rounded-lg bg-red-50">
                <p className="font-medium">Analysis Failed</p>
                <p className="text-sm mt-2">{error}</p>
                <p className="text-xs mt-2 text-gray-600">
                  Make sure the backend is running on port 8000 and you have set your OpenAI API key
                </p>
              </div>
            ) : !analysis ? (
              <div className="text-center text-gray-500 py-8">
                <p>Paste a job description and click "Analyze JD" to see the structured output</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="font-medium">Job Title:</span> {analysis.job_title}</div>
                    <div><span className="font-medium">Company:</span> {analysis.company_name || 'Not specified'}</div>
                    <div><span className="font-medium">Location:</span> {analysis.work_location} {analysis.location_details && `(${analysis.location_details})`}</div>
                    <div><span className="font-medium">Type:</span> {analysis.employment_type}</div>
                    <div><span className="font-medium">Industry:</span> {analysis.industry || 'Not specified'}</div>
                  </div>
                </div>

                <Separator />

                {/* Job Summary */}
                {analysis.job_summary && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Job Summary</h3>
                      <p className="text-sm text-gray-700">{analysis.job_summary}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Key Responsibilities */}
                {analysis.key_responsibilities?.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Key Responsibilities</h3>
                      <ul className="text-sm space-y-1">
                        {analysis.key_responsibilities.map((resp: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Requirements */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Requirements</h3>
                  <div className="space-y-3">
                    {analysis.required_education && (
                      <div>
                        <span className="font-medium text-sm">Education:</span>
                        <p className="text-sm text-gray-700">{analysis.required_education}</p>
                      </div>
                    )}
                    {analysis.required_experience && (
                      <div>
                        <span className="font-medium text-sm">Experience:</span>
                        <p className="text-sm text-gray-700">{analysis.required_experience}</p>
                      </div>
                    )}
                    {analysis.required_skills?.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Required Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.required_skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="default" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Qualifications */}
                {(analysis.preferred_education || analysis.preferred_experience || analysis.preferred_skills?.length > 0) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Preferred Qualifications</h3>
                      <div className="space-y-3">
                        {analysis.preferred_education && (
                          <div>
                            <span className="font-medium text-sm">Education:</span>
                            <p className="text-sm text-gray-700">{analysis.preferred_education}</p>
                          </div>
                        )}
                        {analysis.preferred_experience && (
                          <div>
                            <span className="font-medium text-sm">Experience:</span>
                            <p className="text-sm text-gray-700">{analysis.preferred_experience}</p>
                          </div>
                        )}
                        {analysis.preferred_skills?.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Preferred Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.preferred_skills.map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Benefits */}
                {analysis.benefits?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Benefits</h3>
                      <ul className="text-sm space-y-1">
                        {analysis.benefits.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Application Details */}
                {(analysis.application_deadline || analysis.posting_date) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Application Details</h3>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {analysis.posting_date && (
                          <div><span className="font-medium">Posted:</span> {analysis.posting_date}</div>
                        )}
                        {analysis.application_deadline && (
                          <div><span className="font-medium">Deadline:</span> {analysis.application_deadline}</div>
                        )}
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
