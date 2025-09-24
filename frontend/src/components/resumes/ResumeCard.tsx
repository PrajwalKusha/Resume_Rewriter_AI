'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Eye, 
  MoreVertical, 
  Star, 
  Trash2, 
  Edit,
  Sparkles,
  Calendar,
  Building,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { userService } from '@/services/userService'
import ResumePreviewModal from './ResumePreviewModal'

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

interface ResumeCardProps {
  resume: Resume
  onDeleted?: () => void
}

export default function ResumeCard({ resume, onDeleted }: ResumeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)

  // Load thumbnail only when hovered or clicked
  useEffect(() => {
    if ((isHovered || showPreview) && !thumbnailLoaded) {
      loadThumbnail()
    }
  }, [isHovered, showPreview, thumbnailLoaded, resume.id])

  const loadThumbnail = async () => {
    if (thumbnailLoaded || isLoadingThumbnail) return
    
    setIsLoadingThumbnail(true)
    try {
      // Use preview URL for thumbnails (optimized for viewing)
      const { preview_url } = await userService.getResumePreviewUrl(resume.id)
      setThumbnailUrl(preview_url)
      setThumbnailLoaded(true)
    } catch (error) {
      console.error('Failed to load thumbnail:', error)
      // Fallback to download URL if preview fails
      try {
        const { download_url } = await userService.getResumeDownloadUrl(resume.id)
        setThumbnailUrl(download_url)
        setThumbnailLoaded(true)
      } catch (fallbackError) {
        console.error('Failed to load fallback thumbnail:', fallbackError)
      }
    } finally {
      setIsLoadingThumbnail(false)
    }
  }

  const handleView = () => {
    setShowPreview(true)
  }

  const handleDownload = async () => {
    try {
      console.log('Downloading resume:', resume.id)
      
      // Get download URL from backend
      const { download_url } = await userService.getResumeDownloadUrl(resume.id)
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = download_url
      link.download = resume.original_filename || resume.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Download initiated successfully')
    } catch (error) {
      console.error('Failed to download resume:', error)
      alert('Failed to download resume. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await userService.deleteResume(resume.id)
      onDeleted?.()
    } catch (error) {
      console.error('Failed to delete resume:', error)
      alert('Failed to delete resume. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetPrimary = async () => {
    if (resume.type !== 'uploaded') return
    
    try {
      await userService.setPrimaryResume(resume.id)
      onDeleted?.() // Refresh the list
    } catch (error) {
      console.error('Failed to set primary resume:', error)
      alert('Failed to set as primary resume. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div 
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Resume Type Indicator */}
      <div className={`absolute top-3 right-3 ${
        resume.type === 'uploaded' ? 'text-blue-500' : 'text-green-500'
      }`}>
        {resume.type === 'uploaded' ? <FileText className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </div>

      {/* Primary Badge */}
      {resume.is_primary && (
        <div className="absolute top-3 left-3">
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Star className="w-3 h-3 mr-1" />
            Primary
          </Badge>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 cursor-pointer" onClick={handleView}>
        {/* Resume Thumbnail/Preview */}
        <div className="flex items-center justify-center mb-4">
          <div className={`w-20 h-24 rounded-lg overflow-hidden border-2 relative ${
            resume.type === 'uploaded' 
              ? 'border-blue-200 bg-gradient-to-br from-blue-100 to-blue-200' 
              : 'border-green-200 bg-gradient-to-br from-green-100 to-green-200'
          }`}>
            {thumbnailUrl && thumbnailLoaded && resume.file_type?.toLowerCase() === 'pdf' ? (
              <div className="relative w-full h-full overflow-hidden">
                {/* PDF iframe with all controls disabled */}
                <iframe
                  src={`${thumbnailUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&zoom=25`}
                  className="w-full h-full border-0 pointer-events-none"
                  style={{ 
                    transform: 'scale(0.4)', 
                    transformOrigin: 'top left', 
                    width: '250%', 
                    height: '250%',
                    clipPath: 'inset(0 0 30px 0)',  // Clip bottom area where controls appear
                    filter: 'none'
                  }}
                  sandbox="allow-same-origin"
                  scrolling="no"
                />
                {/* Complete overlay to block any remaining controls */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-20 pointer-events-none"
                  style={{ 
                    background: 'linear-gradient(to top, rgba(255,255,255,0.8) 0%, transparent 20%, transparent 100%)'
                  }}
                />
                {/* File type indicator */}
                <div className={`absolute top-1 right-1 z-20 ${
                  resume.type === 'uploaded' ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {resume.type === 'uploaded' ? (
                    <FileText className="w-3 h-3" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                </div>
              </div>
            ) : (
              // Show icon by default (before hover/click) or if thumbnail not available
              <div className="w-full h-full flex items-center justify-center">
                {isLoadingThumbnail ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : resume.type === 'uploaded' ? (
                  <FileText className={`w-10 h-10 ${
                    resume.type === 'uploaded' ? 'text-blue-600' : 'text-green-600'
                  }`} />
                ) : (
                  <div className="relative">
                    <FileText className="w-10 h-10 text-green-600" />
                    <Sparkles className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resume Info */}
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
            {resume.name}
          </h3>
          
          {resume.type === 'uploaded' ? (
            <div className="text-xs text-gray-600 space-y-1">
              <p>{resume.file_type?.toUpperCase()} • v{resume.version}</p>
              <p>{resume.file_size ? formatFileSize(resume.file_size) : 'Unknown size'}</p>
              <p>Uploaded {formatDate(resume.upload_date)}</p>
            </div>
          ) : (
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Building className="w-3 h-3" />
                <span>{resume.company_name}</span>
              </div>
              <p>{resume.job_title}</p>
              <p>Generated {formatDate(resume.created_at)}</p>
              {resume.download_count !== undefined && (
                <p>{resume.download_count} downloads</p>
              )}
            </div>
          )}
        </div>

        {/* Status/Match Score */}
        {resume.type === 'generated' && resume.match_score && (
          <div className="text-center mb-3">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              resume.match_score >= 85 ? 'bg-green-100 text-green-800' :
              resume.match_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {resume.match_score}% Match
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-4">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleView}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {resume.type === 'uploaded' && !resume.is_primary && (
                <>
                  <DropdownMenuItem onClick={handleSetPrimary}>
                    <Star className="w-4 h-4 mr-2" />
                    Set as Primary
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
              
              {resume.type === 'generated' && (
                <DropdownMenuItem>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Preview Modal */}
      <ResumePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        resumeId={resume.id}
        resumeName={resume.name}
        fileType={resume.file_type || 'pdf'}
      />
    </div>
  )
}
