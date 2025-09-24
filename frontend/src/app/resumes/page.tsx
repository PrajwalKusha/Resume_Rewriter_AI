'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import ResumeCard from '@/components/resumes/ResumeCard'
import ResumeUpload from '@/components/resumes/ResumeUpload'
import UserOnboarding from '@/components/auth/UserOnboarding'
import { Button } from "@/components/ui/button"
import { 
  Upload,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus
} from "lucide-react"
import { userService, userStorage } from '@/services/userService'

interface Resume {
  id: string
  name: string
  type: 'uploaded' | 'generated'
  file_type?: string
  original_filename?: string
  upload_date?: string
  is_primary?: boolean
  version?: number
  status?: string
  file_size?: number
  job_id?: string
  job_title?: string
  company_name?: string
  base_resume_id?: string
  resume_type?: string
  generation_method?: string
  is_active?: boolean
  created_at?: string
  download_count?: number
  last_downloaded?: string
  feedback_rating?: number
  match_score?: number
}

export default function ResumesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [uploadedResumes, setUploadedResumes] = useState<Resume[]>([])
  const [generatedResumes, setGeneratedResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const userId = userStorage.getCurrentUserId()
    if (userId) {
      setCurrentUserId(userId)
      loadResumes(userId)
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadResumes = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Load uploaded resumes
      const uploadedResponse = await userService.getUserUploadedResumes(userId)
      setUploadedResumes(uploadedResponse.resumes || [])

      // Load generated resumes
      const generatedResponse = await userService.getUserGeneratedResumes(userId)
      setGeneratedResumes(generatedResponse.resumes || [])

    } catch (error) {
      console.error('Error loading resumes:', error)
      setError(error instanceof Error ? error.message : 'Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserCreated = (userId: string) => {
    setCurrentUserId(userId)
    loadResumes(userId)
  }

  const handleResumeDeleted = async () => {
    if (currentUserId) {
      await loadResumes(currentUserId)
    }
  }

  const handleUploadComplete = async () => {
    setShowUploadModal(false)
    if (currentUserId) {
      await loadResumes(currentUserId)
    }
  }

  // Show onboarding if no user
  if (!currentUserId) {
    return (
      <Layout>
        <div className="p-6">
          <UserOnboarding onUserCreated={handleUserCreated} />
        </div>
      </Layout>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your resumes...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => currentUserId && loadResumes(currentUserId)}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const totalResumes = uploadedResumes.length + generatedResumes.length

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-gray-600 mt-2">Manage your uploaded and AI-generated resumes</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{uploadedResumes.length}</p>
                <p className="text-sm text-gray-600">Uploaded Resumes</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{generatedResumes.length}</p>
                <p className="text-sm text-gray-600">AI Generated</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalResumes}</p>
                <p className="text-sm text-gray-600">Total Resumes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Resumes Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Uploaded Resumes</h2>
                <p className="text-sm text-gray-600">Your master resume templates</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          </div>

          {uploadedResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {uploadedResumes.map((resume) => (
                <ResumeCard 
                  key={resume.id} 
                  resume={resume}
                  onDeleted={handleResumeDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No uploaded resumes</h3>
              <p className="text-gray-600 mb-6">
                Upload your first resume to get started with AI-powered optimization
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Resume
              </Button>
            </div>
          )}
        </div>

        {/* AI Generated Resumes Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Generated Resumes</h2>
                <p className="text-sm text-gray-600">Job-specific optimized resumes</p>
              </div>
            </div>
          </div>

          {generatedResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generatedResumes.map((resume) => (
                <ResumeCard 
                  key={resume.id} 
                  resume={resume}
                  onDeleted={handleResumeDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI generated resumes</h3>
              <p className="text-gray-600 mb-6">
                Generate your first AI-optimized resume by applying to a job
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ResumeUpload 
              onUploadComplete={handleUploadComplete}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}