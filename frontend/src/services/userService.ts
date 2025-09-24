/**
 * User Service for handling user-related API calls
 */

const API_BASE_URL = 'http://localhost:8000'

export interface User {
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  subscription_tier: string
  created_at?: string
}

export interface CreateUserRequest {
  email: string
  first_name?: string
  last_name?: string
}

export interface DashboardData {
  total_applications: number
  applied_jobs: number
  interviews: number
  avg_match_score: number
  total_analyses: number
  total_generated_resumes: number
  recent_jobs: any[]
  recent_analyses: any[]
}

export interface Job {
  job_id: string
  job_title: string
  company_name: string
  location?: string
  work_type?: string
  employment_type?: string
  salary_range?: string
  application_status: string
  created_at?: string
  priority?: string
  notes?: string
  parsed_jd_data?: string | object
}

export const userService = {
  /**
   * Create a new user or get existing user
   */
  async createUser(userData: CreateUserRequest): Promise<{ user_id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get user information
   */
  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`)

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<DashboardData> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/dashboard`)

    if (!response.ok) {
      throw new Error(`Failed to get dashboard data: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get user's jobs
   */
  async getUserJobs(userId: string, limit: number = 50): Promise<{ jobs: Job[] }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/jobs?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to get user jobs: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<any> {
    // If the id looks like a file-based JD (e.g., jd_008), fetch from file API
    if (jobId.startsWith('jd_')) {
      const res = await fetch(`${API_BASE_URL}/api/jd-files/${jobId}`)
      if (!res.ok) throw new Error(`Failed to get jd file: ${res.status}`)
      const fileData = await res.json()
      // Normalize to a shape similar to DB job details for the UI
      const analysis = fileData.analysis || {}
      return {
        job_id: jobId,
        job_title: analysis.job_title || fileData?.metadata?.job_title || 'Unknown Position',
        company_name: analysis.company_name || fileData?.metadata?.company || 'Unknown Company',
        job_description: fileData.original_jd_text || '',
        location: analysis.work_location,
        work_type: analysis.location_details,
        employment_type: analysis.employment_type,
        salary_range: analysis.salary_range,
        application_status: 'new',
        created_at: fileData.timestamp,
        parsed_jd_data: fileData,
        keywords: analysis.required_skills || [],
        priority: null,
        notes: null
      }
    }
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`)

    if (!response.ok) {
      throw new Error(`Failed to get job details: ${response.status}`)
    }

    return response.json()
  },

  /**
   * List parsed JD files from backend/data via API
   */
  async listJDFiles(): Promise<{ items: Array<{ id: string; job_title?: string; company_name?: string }> }> {
    const res = await fetch(`${API_BASE_URL}/api/jd-files`)
    if (!res.ok) throw new Error(`Failed to list JD files: ${res.status}`)
    return res.json()
  },

  /**
   * Analyze JD with user context (saves to database)
   */
  async analyzeJobDescription(jdText: string, userId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/analyze-jd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jd_text: jdText,
        user_id: userId
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to analyze job description: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Create job for wizard flow
   */
  async createJobForWizard(userId: string, jdText: string, jobTitle?: string, companyName?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/wizard/create-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        jd_text: jdText,
        job_title: jobTitle,
        company_name: companyName
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Analyze resume for wizard flow with job matching
   */
  async analyzeResumeForWizard(file: File, userId: string, jobId: string): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    formData.append('job_id', jobId)

    const response = await fetch(`${API_BASE_URL}/api/wizard/analyze-resume`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to analyze resume: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get job details from database
   */
  async getJobDetails(jobId: string): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch job details')
    }
    
    return response.json()
  },

  /**
   * Get specific JD analysis file from backend/data
   */
  async getJDFile(fileId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/jd-files/${fileId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch JD file')
    }
    
    return response.json()
  },

  /**
   * Soft delete a single job
   */
  async deleteJob(jobId: string): Promise<{ message: string; job_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete job: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Soft delete multiple jobs
   */
  async deleteMultipleJobs(jobIds: string[]): Promise<{ message: string; results: { success: string[]; failed: string[] } }> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/delete-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_ids: jobIds })
    })

    if (!response.ok) {
      throw new Error(`Failed to delete jobs: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Restore a soft-deleted job
   */
  async restoreJob(jobId: string): Promise<{ message: string; job_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to restore job: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get user's uploaded (base) resumes
   */
  async getUserUploadedResumes(userId: string): Promise<{ resumes: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/resumes/uploaded`)

    if (!response.ok) {
      throw new Error(`Failed to get uploaded resumes: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get user's AI-generated resumes
   */
  async getUserGeneratedResumes(userId: string): Promise<{ resumes: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/resumes/generated`)

    if (!response.ok) {
      throw new Error(`Failed to get generated resumes: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get detailed resume information
   */
  async getResumeDetails(resumeId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`)

    if (!response.ok) {
      throw new Error(`Failed to get resume details: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Delete a resume (uploaded or generated)
   */
  async deleteResume(resumeId: string): Promise<{ message: string; resume_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete resume: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Set an uploaded resume as primary
   */
  async setPrimaryResume(resumeId: string): Promise<{ message: string; resume_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/set-primary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to set primary resume: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Upload a resume file
   */
  async uploadResume(userId: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/resumes/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to upload resume: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get download URL for a resume
   */
  async getResumeDownloadUrl(resumeId: string): Promise<{ download_url: string; expires_in: number }> {
    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/download`)

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get preview URL for a resume (optimized for viewing)
   */
  async getResumePreviewUrl(resumeId: string): Promise<{ preview_url: string; expires_in: number }> {
    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/preview`)

    if (!response.ok) {
      throw new Error(`Failed to get preview URL: ${response.status}`)
    }

    return response.json()
  }
}

// Local storage utilities for user session
export const userStorage = {
  setCurrentUser(userId: string) {
    localStorage.setItem('current_user_id', userId)
  },

  getCurrentUserId(): string | null {
    return localStorage.getItem('current_user_id')
  },

  clearCurrentUser() {
    localStorage.removeItem('current_user_id')
  },

  setUserData(userData: User) {
    localStorage.setItem('user_data', JSON.stringify(userData))
  },

  getUserData(): User | null {
    const data = localStorage.getItem('user_data')
    return data ? JSON.parse(data) : null
  }
}
