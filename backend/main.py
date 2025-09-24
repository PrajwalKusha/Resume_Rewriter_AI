from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from agent_jd_strands import JobDescription, analyze_job_description
from agent_resume_strands import ResumeData, analyze_resume, extract_text_from_file

app = FastAPI(title="AI Resume Rewriter API", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class JDAnalysisRequest(BaseModel):
    jd_text: str

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

@app.get("/")
async def root():
    return {"message": "AI Resume Rewriter API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

@app.options("/api/analyze-jd")
async def analyze_jd_options():
    """Handle CORS preflight request"""
    return {"message": "OK"}

@app.post("/api/analyze-jd", response_model=JDAnalysisResponse)
async def analyze_jd_endpoint(request: JDAnalysisRequest):
    """
    Analyze a job description and return structured information
    """
    try:
        if not request.jd_text.strip():
            raise HTTPException(status_code=400, detail="Job description text cannot be empty")
        
        # Call the JD analysis function
        result = await analyze_job_description(request.jd_text)
        
        # Convert the result to our response model
        response = JDAnalysisResponse(
            job_title=result.job_title,
            company_name=result.company_name,
            job_id=result.job_id,
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

@app.options("/api/analyze-resume")
async def analyze_resume_options():
    """Handle CORS preflight request for resume analysis"""
    return {"message": "OK"}

@app.post("/api/analyze-resume", response_model=ResumeData)
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    """
    Analyze an uploaded resume file (PDF, DOCX, TXT) and return structured information
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
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
