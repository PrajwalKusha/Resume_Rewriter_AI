"""
Enhanced FastAPI application with DynamoDB integration
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

# New DynamoDB imports
from services.database_service import DatabaseService
from models.dynamodb_models import check_connection

app = FastAPI(title="AI Resume Rewriter API", version="2.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Existing models
class JDAnalysisRequest(BaseModel):
    jd_text: str
    user_id: Optional[str] = None  # For saving to database

class JDAnalysisResponse(BaseModel):
    # Basic Job Information
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    job_id: Optional[str] = None
    
    # Job Details
    employment_type: Optional[str] = None
    work_location: Optional[str] = None
    location_details: Optional[str] = None
    department: Optional[str] = None
    
    # Compensation & Benefits
    salary_range: Optional[str] = None
    benefits: List[str] = []
    
    # Job Content
    job_summary: Optional[str] = None
    key_responsibilities: List[str] = []
    
    # Requirements
    required_education: Optional[str] = None
    required_experience: Optional[str] = None
    required_skills: List[str] = []
    
    # Preferences
    preferred_education: Optional[str] = None
    preferred_experience: Optional[str] = None
    preferred_skills: List[str] = []
    
    # Industry & Culture
    industry: Optional[str] = None
    company_culture: Optional[str] = None
    
    # Application Details
    application_deadline: Optional[str] = None
    posting_date: Optional[str] = None
    
    # Technical Details
    tools_technologies: List[str] = []
    certifications: List[str] = []
    
    # Additional Info
    travel_requirements: Optional[str] = None
    physical_requirements: Optional[str] = None
    additional_notes: Optional[str] = None

# New models for wizard flow
class CreateResumeRequest(BaseModel):
    user_id: str
    jd_text: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None

class ResumeAnalysisRequest(BaseModel):
    user_id: str
    job_id: str
    analysis_id: Optional[str] = None  # For updating existing analysis

class UserDashboardResponse(BaseModel):
    total_applications: int
    applied_jobs: int
    interviews: int
    avg_match_score: float
    total_analyses: int
    total_generated_resumes: int
    recent_jobs: List[Dict[str, Any]]
    recent_analyses: List[Dict[str, Any]]

class UserRequest(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# Startup event
@app.on_event("startup")
async def startup_event():
    """Check database connection on startup"""
    print("🚀 Starting AI Resume Rewriter API...")
    if check_connection():
        print("✅ Database connection verified")
    else:
        print("❌ Database connection failed - some features may not work")

# Existing endpoints
@app.get("/")
async def root():
    return {"message": "AI Resume Rewriter API v2.0 is running with DynamoDB!", "version": "2.0.0"}

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

@app.get("/api/users/{user_id}/dashboard", response_model=UserDashboardResponse)
async def get_user_dashboard(user_id: str):
    """Get dashboard data for a user"""
    try:
        dashboard_data = DatabaseService.get_user_dashboard_data(user_id)
        
        # Convert datetime objects to strings for JSON serialization
        for job in dashboard_data['recent_jobs']:
            if hasattr(job, 'created_at') and job.created_at:
                job.created_at = job.created_at.isoformat()
        
        for analysis in dashboard_data['recent_analyses']:
            if hasattr(analysis, 'created_at') and analysis.created_at:
                analysis.created_at = analysis.created_at.isoformat()
        
        return dashboard_data
    
    except Exception as e:
        print(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

# Enhanced JD Analysis with Database Integration
@app.options("/api/analyze-jd")
async def analyze_jd_options():
    """Handle CORS preflight request"""
    return {"message": "OK"}

@app.post("/api/analyze-jd", response_model=JDAnalysisResponse)
async def analyze_jd_endpoint(request: JDAnalysisRequest):
    """
    Analyze a job description and optionally save to database
    """
    try:
        if not request.jd_text.strip():
            raise HTTPException(status_code=400, detail="Job description text cannot be empty")
        
        # Call the JD analysis function
        result = await analyze_job_description(request.jd_text)
        
        # Save to database if user_id provided
        job_id = None
        if request.user_id:
            try:
                job = DatabaseService.create_job(
                    user_id=request.user_id,
                    job_title=result.job_title or "Unknown Position",
                    company_name=result.company_name or "Unknown Company",
                    job_description=request.jd_text,
                    location=result.work_location,
                    work_type=result.location_details,
                    employment_type=result.employment_type,
                    salary_range=result.salary_range,
                    parsed_jd_data=result.dict(),
                    keywords=result.required_skills + result.preferred_skills + result.tools_technologies
                )
                job_id = job.job_id
                print(f"✅ Saved job analysis to database: {job_id}")
            except Exception as db_error:
                print(f"⚠️ Failed to save to database: {db_error}")
                # Continue without failing the request
        
        # Convert the result to our response model
        response = JDAnalysisResponse(
            job_title=result.job_title,
            company_name=result.company_name,
            job_id=job_id,  # Include the database job_id if saved
            employment_type=result.employment_type,
            work_location=result.work_location,
            location_details=result.location_details,
            department=result.department,
            salary_range=result.salary_range,
            benefits=result.benefits,
            job_summary=result.job_summary,
            key_responsibilities=result.key_responsibilities,
            required_education=result.required_education,
            required_experience=result.required_experience,
            required_skills=result.required_skills,
            preferred_education=result.preferred_education,
            preferred_experience=result.preferred_experience,
            preferred_skills=result.preferred_skills,
            industry=result.industry,
            company_culture=result.company_culture,
            application_deadline=result.application_deadline,
            posting_date=result.posting_date,
            tools_technologies=result.tools_technologies,
            certifications=result.certifications,
            travel_requirements=result.travel_requirements,
            physical_requirements=result.physical_requirements,
            additional_notes=result.additional_notes
        )
        
        return response
        
    except Exception as e:
        print(f"Error analyzing JD: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze job description: {str(e)}")

# Enhanced Resume Analysis with Database Integration
@app.options("/api/analyze-resume")
async def analyze_resume_options():
    """Handle CORS preflight request for resume analysis"""
    return {"message": "OK"}

@app.post("/api/analyze-resume")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    user_id: Optional[str] = None,
    job_id: Optional[str] = None
):
    """
    Analyze an uploaded resume file and optionally save to database
    """
    try:
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
        
        # Analyze the resume
        result = await analyze_resume(resume_text)
        
        # Save to database if user_id provided
        analysis_id = None
        if user_id:
            try:
                # Create resume analysis record
                analysis = DatabaseService.create_resume_analysis(
                    user_id=user_id,
                    job_id=job_id or str(uuid.uuid4()),  # Create dummy job_id if not provided
                    original_filename=file.filename,
                    file_type=file_extension,
                    file_size=len(file_content),
                    analysis_status="completed",
                    analysis_results=result.dict(),
                    # TODO: Calculate match score if job_id provided
                )
                analysis_id = analysis.analysis_id
                print(f"✅ Saved resume analysis to database: {analysis_id}")
            except Exception as db_error:
                print(f"⚠️ Failed to save to database: {db_error}")
                # Continue without failing the request
        
        # Add analysis_id to response
        response_dict = result.dict()
        response_dict['analysis_id'] = analysis_id
        
        return response_dict
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

# New Wizard Flow Endpoints
@app.post("/api/wizard/create-job")
async def create_job_for_wizard(request: CreateResumeRequest):
    """Create a job entry for the resume wizard flow"""
    try:
        # Analyze the JD first
        jd_result = await analyze_job_description(request.jd_text)
        
        # Create job entry in database
        job = DatabaseService.create_job(
            user_id=request.user_id,
            job_title=request.job_title or jd_result.job_title or "Unknown Position",
            company_name=request.company_name or jd_result.company_name or "Unknown Company",
            job_description=request.jd_text,
            location=jd_result.work_location,
            work_type=jd_result.location_details,
            employment_type=jd_result.employment_type,
            salary_range=jd_result.salary_range,
            parsed_jd_data=jd_result.dict(),
            keywords=jd_result.required_skills + jd_result.preferred_skills + jd_result.tools_technologies
        )
        
        return {
            "job_id": job.job_id,
            "analysis": jd_result.dict(),
            "message": "Job created successfully"
        }
        
    except Exception as e:
        print(f"Error creating job for wizard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@app.post("/api/wizard/analyze-resume")
async def analyze_resume_for_wizard(
    file: UploadFile = File(...),
    user_id: str = None,
    job_id: str = None
):
    """Analyze resume for the wizard flow with job matching"""
    try:
        # Reuse the existing resume analysis logic
        response = await analyze_resume_endpoint(file, user_id, job_id)
        
        # Calculate match score if job_id provided
        match_score = None
        if job_id:
            job = DatabaseService.get_job(job_id)
            if job and job.parsed_jd_data:
                # TODO: Implement match score calculation
                # This is a placeholder - you can implement sophisticated matching logic
                match_score = 75  # Placeholder score
                
                # Update the analysis with match score
                if response.get('analysis_id'):
                    DatabaseService.update_analysis_status(
                        response['analysis_id'], 
                        "completed", 
                        match_score=match_score
                    )
        
        response['match_score'] = match_score
        return response
        
    except Exception as e:
        print(f"Error analyzing resume for wizard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

# Job Management Endpoints
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
                "notes": job.notes
            }
            jobs_data.append(job_dict)
        
        return {"jobs": jobs_data}
        
    except Exception as e:
        print(f"Error getting user jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get jobs: {str(e)}")

@app.get("/api/jobs/{job_id}")
async def get_job_details(job_id: str):
    """Get detailed job information"""
    job = DatabaseService.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.job_id,
        "user_id": job.user_id,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "job_description": job.job_description,
        "location": job.location,
        "work_type": job.work_type,
        "employment_type": job.employment_type,
        "salary_range": job.salary_range,
        "application_status": job.application_status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "parsed_jd_data": job.parsed_jd_data,
        "keywords": job.keywords,
        "priority": job.priority,
        "notes": job.notes
    }

# ============================
# File-based JD endpoints
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
                file_id = os.path.splitext(os.path.basename(fp))[0]  # e.g., jd_008
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
                # Skip corrupt/unreadable file
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
