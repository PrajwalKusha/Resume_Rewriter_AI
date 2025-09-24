'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { userService, userStorage } from '@/services/userService'

interface ResumeUploadProps {
  onUploadComplete?: () => void
  onClose?: () => void
}

export default function ResumeUpload({ onUploadComplete, onClose }: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !allowedExtensions.includes(extension)) {
        return `Invalid file type. Please upload: ${allowedExtensions.join(', ').toUpperCase()}`
      }
    }

    // Check file size
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 10MB'
    }

    return null
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrorMessage(error)
      setUploadStatus('error')
      return
    }

    setSelectedFile(file)
    setErrorMessage('')
    setUploadStatus('idle')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const currentUserId = userStorage.getCurrentUserId()
    if (!currentUserId) {
      setErrorMessage('Please log in to upload resumes')
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const result = await userService.uploadResume(currentUserId, selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      
      console.log('Upload successful:', result)
      
      // Call completion callback after a short delay
      setTimeout(() => {
        onUploadComplete?.()
      }, 1500)

    } catch (error) {
      console.error('Upload failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upload Resume</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!selectedFile && uploadStatus === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Drag and drop your resume here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              browse files
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOCX, DOC, TXT (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Selected File */}
      {selectedFile && uploadStatus === 'idle' && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetUpload}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadStatus === 'success' && (
        <div className="text-center mb-4">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-green-700 font-medium">Resume uploaded successfully!</p>
          <p className="text-sm text-gray-600 mt-1">Processing and analyzing content...</p>
        </div>
      )}

      {/* Error State */}
      {uploadStatus === 'error' && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-red-700 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium text-sm">Upload failed</span>
          </div>
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        {selectedFile && uploadStatus === 'idle' && (
          <>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetUpload}>
              Cancel
            </Button>
          </>
        )}

        {uploadStatus === 'error' && (
          <Button onClick={resetUpload} variant="outline" className="flex-1">
            Try Again
          </Button>
        )}

        {uploadStatus === 'success' && onClose && (
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
