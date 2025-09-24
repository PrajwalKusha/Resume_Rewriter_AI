"""
Enhanced FastAPI application with Job-First Workflow
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import uuid
from datetime import datetime
import os
import glob
import json

# Existing imports
from agent_jd_strands import JobDescription, analyze_job_description
from agent_resume_strands import ResumeData, analyze_resume, extract_text_from_file

# Updated DynamoDB imports
from services.database_service import DatabaseService
from models.dynamodb_models import check_connection
from services.s3_service import s3_service

app = FastAPI(title="ResumeForge API - Job Workflow", version="2.1.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Request/Response Models
class CreateJobRequest(BaseModel):
    user_id: str
    job_description: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    job_url: Optional[str] = None

class JobResponse(BaseModel):
    job_id: str
    user_id: str
    job_title: str
    company_name: str
    job_description: str
    job_url: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    employment_type: Optional[str] = None
    salary_range: Optional[str] = None
    application_status: str
    jd_analysis_data: Dict[str, Any]
    keywords: List[str]
    priority: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str
    status: str

class CreateResumeRequest(BaseModel):
    user_id: str
    resume_name: str

class ResumeResponse(BaseModel):
    base_resume_id: str
    user_id: str
    resume_name: str
    file_url: str
    file_type: str
    original_filename: str
    file_size: int
    upload_date: str
    is_primary: bool
    parsed_content: Dict[str, Any]
    version: int
    status: str

class UserRequest(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class DeleteJobsRequest(BaseModel):
    job_ids: List[str]

class DashboardResponse(BaseModel):
    total_applications: int
    applied_jobs: int
    interviews: int
    avg_match_score: float
    total_analyses: int
    total_generated_resumes: int
    recent_jobs: List[Dict[str, Any]]
    recent_analyses: List[Dict[str, Any]]

# Startup event
@app.on_event("startup")
async def startup_event():
    """Check database connection on startup"""
    print("🚀 Starting ResumeForge API - Job Workflow...")
    if check_connection():
        print("✅ Database connection verified")
    else:
        print("❌ Database connection failed - some features may not work")

# Health and Info endpoints
@app.get("/")
async def root():
    return {
        "message": "ResumeForge API - Job Workflow", 
        "version": "2.1.0",
        "workflows": ["Job Management", "Resume Management"]
    }

@app.get("/health")
async def health_check():
    db_healthy = check_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "message": "API is operational",
        "database": "connected" if db_healthy else "disconnected"
    }

# User Management Endpoints
@app.post("/api/users")
async def create_user(request: UserRequest):
    """Create a new user"""
    try:
        # Check if user already exists
        existing_user = DatabaseService.get_user_by_email(request.email)
        if existing_user:
            return {"user_id": existing_user.user_id, "message": "User already exists"}
        
        # Create new user
        user = DatabaseService.create_user(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name
        )
        
        return {"user_id": user.user_id, "message": "User created successfully"}
    
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    user = DatabaseService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "subscription_tier": user.subscription_tier,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@app.get("/api/users/{user_id}/dashboard", response_model=DashboardResponse)
async def get_user_dashboard(user_id: str):
    """Get dashboard data for a user"""
    try:
        dashboard_data = DatabaseService.get_user_dashboard_data(user_id)
        return dashboard_data
    
    except Exception as e:
        print(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

# ========================================
# WORKFLOW 1: JOB MANAGEMENT
# ========================================

@app.post("/api/jobs", response_model=JobResponse)
async def create_job(request: CreateJobRequest):
    """
    Workflow 1: Create a new job entry and analyze JD
    """
    try:
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")
        
        # Analyze the job description with AI
        print(f"🤖 Analyzing job description for user {request.user_id}...")
        jd_analysis = await analyze_job_description(request.job_description)
        
        # Extract job details from analysis or use provided values
        job_title = request.job_title or jd_analysis.job_title or "Unknown Position"
        company_name = request.company_name or jd_analysis.company_name or "Unknown Company"
        
        # Create job entry in database
        job = DatabaseService.create_job(
            user_id=request.user_id,
            job_title=job_title,
            company_name=company_name,
            job_description=request.job_description,
            job_url=request.job_url,
            location=jd_analysis.work_location,
            work_type=jd_analysis.location_details,
            employment_type=jd_analysis.employment_type,
            salary_range=jd_analysis.salary_range,
            parsed_jd_data=jd_analysis.dict(),
            keywords=jd_analysis.required_skills + jd_analysis.preferred_skills + jd_analysis.tools_technologies
        )
        
        print(f"✅ Job created successfully: {job.job_id}")
        
        # Return job response
        return JobResponse(
            job_id=job.job_id,
            user_id=job.user_id,
            job_title=job.job_title,
            company_name=job.company_name,
            job_description=job.job_description,
            job_url=job.job_url,
            location=job.location,
            work_type=job.work_type,
            employment_type=job.employment_type,
            salary_range=job.salary_range,
            application_status=job.application_status,
            jd_analysis_data=job.parsed_jd_data,
            keywords=job.keywords,
            priority=job.priority,
            notes=job.notes,
            created_at=job.created_at.isoformat() if job.created_at else datetime.utcnow().isoformat(),
            updated_at=job.updated_at.isoformat() if job.updated_at else datetime.utcnow().isoformat(),
            status=job.status
        )
        
    except Exception as e:
        print(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@app.get("/api/users/{user_id}/jobs")
async def get_user_jobs(user_id: str, limit: int = 50):
    """Get all jobs for a user"""
    try:
        jobs = DatabaseService.get_user_jobs(user_id, limit)
        
        # Convert to dict format for JSON response
        jobs_data = []
        for job in jobs:
            job_dict = {
                "job_id": job.job_id,
                "job_title": job.job_title,
                "company_name": job.company_name,
                "location": job.location,
                "work_type": job.work_type,
                "employment_type": job.employment_type,
                "salary_range": job.salary_range,
                "application_status": job.application_status,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "priority": job.priority,
                "notes": job.notes,
                "jd_analysis_data": job.parsed_jd_data,
                "keywords": job.keywords
            }
            jobs_data.append(job_dict)
        
        return {"jobs": jobs_data}
        
    except Exception as e:
        print(f"Error getting user jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get jobs: {str(e)}")

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job_details(job_id: str):
    """Get detailed job information"""
    job = DatabaseService.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobResponse(
        job_id=job.job_id,
        user_id=job.user_id,
        job_title=job.job_title,
        company_name=job.company_name,
        job_description=job.job_description,
        job_url=job.job_url,
        location=job.location,
        work_type=job.work_type,
        employment_type=job.employment_type,
        salary_range=job.salary_range,
        application_status=job.application_status,
        jd_analysis_data=job.parsed_jd_data,
        keywords=job.keywords,
        priority=job.priority,
        notes=job.notes,
        created_at=job.created_at.isoformat() if job.created_at else datetime.utcnow().isoformat(),
        updated_at=job.updated_at.isoformat() if job.updated_at else datetime.utcnow().isoformat(),
        status=job.status
    )

# Job Delete Endpoints
@app.delete("/api/jobs/{job_id}")
async def soft_delete_job(job_id: str):
    """Soft delete a single job"""
    success = DatabaseService.soft_delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully", "job_id": job_id}

@app.post("/api/jobs/delete-multiple")
async def soft_delete_multiple_jobs(request: DeleteJobsRequest):
    """Soft delete multiple jobs"""
    if not request.job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided")
    
    results = DatabaseService.soft_delete_jobs(request.job_ids)
    return {
        "message": f"Processed {len(request.job_ids)} jobs",
        "results": results
    }

@app.post("/api/jobs/{job_id}/restore")
async def restore_job(job_id: str):
    """Restore a soft-deleted job"""
    success = DatabaseService.restore_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or not deleted")
    
    return {"message": "Job restored successfully", "job_id": job_id}

# ============================
# File-based JD endpoints (agent output)
# ============================

@app.get("/api/jd-files")
async def list_jd_files():
    """List parsed JD JSON files saved by the agent in backend/data."""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        files = sorted(glob.glob(os.path.join(data_dir, "jd_*.json")))
        items = []
        for fp in files:
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    data = json.load(f)
                analysis = (data or {}).get("analysis", {})
                meta = (data or {}).get("metadata", {})
                file_id = os.path.splitext(os.path.basename(fp))[0]
                items.append({
                    "id": file_id,
                    "job_title": analysis.get("job_title") or meta.get("job_title"),
                    "company_name": analysis.get("company_name") or meta.get("company"),
                    "employment_type": analysis.get("employment_type"),
                    "work_location": analysis.get("work_location"),
                    "location_details": analysis.get("location_details"),
                    "industry": analysis.get("industry"),
                })
            except Exception:
                continue
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jd-files/{file_id}")
async def get_jd_file(file_id: str):
    """Return one parsed JD JSON file by id. Accepts 'jd_008' or '008'."""
    try:
        norm = file_id
        if not norm.startswith("jd_"):
            norm = f"jd_{file_id}"
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        fp = os.path.join(data_dir, f"{norm}.json")
        if not os.path.exists(fp):
            raise HTTPException(status_code=404, detail="JD file not found")
        with open(fp, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# WORKFLOW 2: RESUME MANAGEMENT
# ========================================

@app.post("/api/resumes", response_model=ResumeResponse)
async def create_resume(
    file: UploadFile = File(...),
    user_id: str = None,
    resume_name: str = None
):
    """
    Workflow 2: Upload and analyze a resume
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Validate file type
        allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
        file_extension = file.filename.lower().split('.')[-1] if file.filename else ''
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Extract text from file
        try:
            resume_text = extract_text_from_file(file.filename, file_content)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")
        
        # Analyze the resume with AI
        print(f"🤖 Analyzing resume for user {user_id}...")
        resume_analysis = await analyze_resume(resume_text)
        
        # Create base resume entry in database
        base_resume = DatabaseService.create_base_resume(
            user_id=user_id,
            resume_name=resume_name or file.filename or "My Resume",
            file_url=f"temp/{file.filename}",  # TODO: Implement S3 upload
            file_type=file_extension,
            original_filename=file.filename,
            file_size=len(file_content),
            parsed_content=resume_analysis.dict()
        )
        
        print(f"✅ Resume created successfully: {base_resume.base_resume_id}")
        
        return ResumeResponse(
            base_resume_id=base_resume.base_resume_id,
            user_id=base_resume.user_id,
            resume_name=base_resume.resume_name,
            file_url=base_resume.file_url,
            file_type=base_resume.file_type,
            original_filename=base_resume.original_filename,
            file_size=base_resume.file_size,
            upload_date=base_resume.upload_date.isoformat() if base_resume.upload_date else datetime.utcnow().isoformat(),
            is_primary=base_resume.is_primary,
            parsed_content=base_resume.parsed_content,
            version=base_resume.version,
            status=base_resume.status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create resume: {str(e)}")

@app.get("/api/users/{user_id}/resumes")
async def get_user_resumes(user_id: str):
    """Get all resumes for a user"""
    try:
        resumes = DatabaseService.get_user_base_resumes(user_id)
        
        # Convert to dict format for JSON response
        resumes_data = []
        for resume in resumes:
            resume_dict = {
                "base_resume_id": resume.base_resume_id,
                "resume_name": resume.resume_name,
                "file_type": resume.file_type,
                "original_filename": resume.original_filename,
                "upload_date": resume.upload_date.isoformat() if resume.upload_date else None,
                "is_primary": resume.is_primary,
                "version": resume.version,
                "status": resume.status,
                "parsed_content": resume.parsed_content
            }
            resumes_data.append(resume_dict)
        
        return {"resumes": resumes_data}
        
    except Exception as e:
        print(f"Error getting user resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get resumes: {str(e)}")

# ============================
# Enhanced Resume Management Endpoints
# ============================

@app.get("/api/users/{user_id}/resumes/uploaded")
async def get_user_uploaded_resumes(user_id: str):
    """Get all uploaded (base) resumes for a user"""
    try:
        resumes = DatabaseService.get_user_base_resumes(user_id)
        
        resumes_data = []
        for resume in resumes:
            resume_dict = {
                "id": resume.base_resume_id,
                "name": resume.resume_name,
                "type": "uploaded",
                "file_type": resume.file_type,
                "original_filename": resume.original_filename,
                "upload_date": resume.upload_date.isoformat() if resume.upload_date else None,
                "is_primary": resume.is_primary,
                "version": resume.version,
                "status": resume.status,
                "file_size": getattr(resume, 'file_size', 0),
                "parsed_content": resume.parsed_content
            }
            resumes_data.append(resume_dict)
        
        return {"resumes": resumes_data}
    except Exception as e:
        print(f"❌ Error getting uploaded resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get uploaded resumes: {str(e)}")

@app.get("/api/users/{user_id}/resumes/generated")
async def get_user_generated_resumes(user_id: str):
    """Get all AI-generated resumes for a user"""
    try:
        generated_resumes = DatabaseService.get_user_generated_resumes(user_id)
        
        resumes_data = []
        for resume in generated_resumes:
            # Get associated job details if available
            job = None
            if hasattr(resume, 'job_id') and resume.job_id:
                try:
                    job = DatabaseService.get_job(resume.job_id)
                except:
                    pass
            
            resume_dict = {
                "id": resume.resume_id,
                "name": f"Resume for {job.company_name if job else 'Unknown Company'} - {job.job_title if job else 'Unknown Position'}",
                "type": "generated",
                "job_id": getattr(resume, 'job_id', None),
                "job_title": job.job_title if job else "Unknown Position",
                "company_name": job.company_name if job else "Unknown Company",
                "base_resume_id": resume.base_resume_id,
                "resume_type": resume.resume_type,
                "generation_method": resume.generation_method,
                "version": resume.version,
                "is_active": resume.is_active,
                "created_at": resume.created_at.isoformat() if hasattr(resume, 'created_at') and resume.created_at else None,
                "download_count": resume.download_count,
                "last_downloaded": resume.last_downloaded.isoformat() if resume.last_downloaded else None,
                "feedback_rating": resume.feedback_rating
            }
            resumes_data.append(resume_dict)
        
        return {"resumes": resumes_data}
    except Exception as e:
        print(f"❌ Error getting generated resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get generated resumes: {str(e)}")

@app.get("/api/resumes/{resume_id}")
async def get_resume_details(resume_id: str):
    """Get detailed information about a specific resume"""
    try:
        # Try base resumes first
        base_resume = DatabaseService.get_base_resume(resume_id)
        if base_resume:
            return {
                "id": base_resume.base_resume_id,
                "name": base_resume.resume_name,
                "type": "uploaded",
                "file_type": base_resume.file_type,
                "original_filename": base_resume.original_filename,
                "upload_date": base_resume.upload_date.isoformat() if base_resume.upload_date else None,
                "is_primary": base_resume.is_primary,
                "version": base_resume.version,
                "status": base_resume.status,
                "file_size": getattr(base_resume, 'file_size', 0),
                "parsed_content": base_resume.parsed_content,
                "file_url": base_resume.file_url
            }
        
        # Try generated resumes
        generated_resume = DatabaseService.get_generated_resume(resume_id)
        if generated_resume:
            job = None
            if hasattr(generated_resume, 'job_id') and generated_resume.job_id:
                try:
                    job = DatabaseService.get_job(generated_resume.job_id)
                except:
                    pass
            
            return {
                "id": generated_resume.resume_id,
                "name": f"Resume for {job.company_name if job else 'Unknown Company'} - {job.job_title if job else 'Unknown Position'}",
                "type": "generated",
                "job_id": getattr(generated_resume, 'job_id', None),
                "job_title": job.job_title if job else "Unknown Position",
                "company_name": job.company_name if job else "Unknown Company",
                "base_resume_id": generated_resume.base_resume_id,
                "resume_type": generated_resume.resume_type,
                "resume_content": generated_resume.resume_content,
                "resume_url": generated_resume.resume_url,
                "version": generated_resume.version,
                "is_active": generated_resume.is_active,
                "created_at": generated_resume.created_at.isoformat() if hasattr(generated_resume, 'created_at') and generated_resume.created_at else None,
                "download_count": generated_resume.download_count,
                "last_downloaded": generated_resume.last_downloaded.isoformat() if generated_resume.last_downloaded else None,
                "feedback_rating": generated_resume.feedback_rating
            }
        
        raise HTTPException(status_code=404, detail="Resume not found")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting resume details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get resume details: {str(e)}")

@app.post("/api/users/{user_id}/resumes/upload")
async def upload_resume_to_s3(user_id: str, file: UploadFile = File(...)):
    """Upload a resume file to S3 and save metadata to database"""
    try:
        # Get user details for folder naming
        user = DatabaseService.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        # Check file type
        allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
        file_extension = file.filename.lower().split('.')[-1] if file.filename else ''
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        print(f"📤 Uploading resume to S3 for user {user_id}...")
        
        # Upload to S3
        success, s3_url, error_msg = s3_service.upload_resume(
            file_content=file_content,
            original_filename=file.filename,
            file_type=file_extension,
            user_id=user_id,
            first_name=user.first_name or "user",
            last_name=user.last_name or "unknown"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {error_msg}")
        
        # Extract text from file for analysis
        try:
            resume_text = extract_text_from_file(file.filename, file_content)
        except ValueError as e:
            # If text extraction fails, still save the file but with empty parsed content
            print(f"⚠️ Text extraction failed: {e}")
            resume_text = ""
        
        # Analyze the resume with AI if text extraction succeeded
        parsed_content = {}
        if resume_text.strip():
            try:
                print(f"🤖 Analyzing resume content...")
                resume_analysis = await analyze_resume(resume_text)
                parsed_content = resume_analysis.model_dump() if hasattr(resume_analysis, 'model_dump') else (resume_analysis.dict() if hasattr(resume_analysis, 'dict') else {})
            except Exception as e:
                print(f"⚠️ Resume analysis failed: {e}")
                parsed_content = {"error": "Analysis failed", "raw_text": resume_text[:1000]}
        
        # Generate resume name
        resume_name = file.filename.replace(f'.{file_extension}', '') or f"Resume_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Save to database
        base_resume = DatabaseService.create_base_resume(
            user_id=user_id,
            resume_name=resume_name,
            file_url=s3_url,
            file_type=file_extension,
            original_filename=file.filename,
            file_size=file_size,
            parsed_content=parsed_content
        )
        
        print(f"✅ Resume uploaded and saved successfully: {base_resume.base_resume_id}")
        
        return {
            "message": "Resume uploaded successfully",
            "resume_id": base_resume.base_resume_id,
            "resume_name": resume_name,
            "file_url": s3_url,
            "file_size": file_size,
            "analysis_status": "completed" if parsed_content and "error" not in parsed_content else "failed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload resume: {str(e)}")

@app.get("/api/resumes/{resume_id}/download")
async def download_resume(resume_id: str):
    """Generate presigned URL for downloading a resume"""
    try:
        # Get resume details from database
        base_resume = DatabaseService.get_base_resume(resume_id)
        if not base_resume:
            # Try generated resume
            generated_resume = DatabaseService.get_generated_resume(resume_id)
            if not generated_resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            file_url = generated_resume.resume_url
        else:
            file_url = base_resume.file_url
        
        if not file_url or not file_url.startswith('s3://'):
            raise HTTPException(status_code=400, detail="Resume file not available for download")
        
        # Generate presigned URL
        download_url = s3_service.generate_presigned_download_url(file_url, expiration=3600)
        
        if not download_url:
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
        
        # Update download count for generated resumes
        if not base_resume:
            DatabaseService.increment_download_count(resume_id)
        
        return {
            "download_url": download_url,
            "expires_in": 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating download URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")

@app.get("/api/resumes/{resume_id}/preview")
async def get_resume_preview(resume_id: str):
    """Generate presigned URL for previewing a resume (optimized for viewing)"""
    try:
        # Get resume details from database
        base_resume = DatabaseService.get_base_resume(resume_id)
        if not base_resume:
            # Try generated resume
            generated_resume = DatabaseService.get_generated_resume(resume_id)
            if not generated_resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            file_url = generated_resume.resume_url
        else:
            file_url = base_resume.file_url
        
        if not file_url or not file_url.startswith('s3://'):
            raise HTTPException(status_code=400, detail="Resume file not available for preview")
        
        # Generate presigned URL with longer expiration for preview
        preview_url = s3_service.generate_presigned_download_url(file_url, expiration=7200)  # 2 hours
        
        if not preview_url:
            raise HTTPException(status_code=500, detail="Failed to generate preview URL")
        
        return {
            "preview_url": preview_url,
            "expires_in": 7200
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating preview URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate preview URL: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
