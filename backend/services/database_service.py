"""
Database Service Layer for DynamoDB Operations
Provides high-level database operations for the Resume AI application
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pynamodb.exceptions import DoesNotExist, PutError, UpdateError

from models.dynamodb_models import (
    User, Job, BaseResume, ResumeAnalysis, 
    GeneratedResume, ResumeTemplate, ApplicationTracking, UserFeedback
)

class DatabaseService:
    """Service layer for database operations"""
    
    # User Operations
    @staticmethod
    def create_user(email: str, first_name: Optional[str] = None, 
                   last_name: Optional[str] = None) -> User:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        user = User(
            user_id=user_id,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.save()
        return user
    
    @staticmethod
    def get_user(user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            return User.get(user_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email (scan operation - use sparingly)"""
        users = list(User.scan(User.email == email, limit=1))
        return users[0] if users else None
    
    # Job Operations
    @staticmethod
    def create_job(user_id: str, job_title: str, company_name: str, 
                  job_description: str, **kwargs) -> Job:
        """Create a new job entry"""
        job_id = str(uuid.uuid4())
        job = Job(
            job_id=job_id,
            user_id=user_id,
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            **kwargs
        )
        job.save()
        return job
    
    @staticmethod
    def get_user_jobs(user_id: str, limit: int = 50, include_deleted: bool = False) -> List[Job]:
        """Get all jobs for a user (excluding soft-deleted by default)"""
        # Use scan instead of GSI query since we don't have GSIs set up yet
        if include_deleted:
            return list(Job.scan(Job.user_id == user_id, limit=limit))
        else:
            return list(Job.scan((Job.user_id == user_id) & (Job.status != 'deleted'), limit=limit))
    
    @staticmethod
    def get_job(job_id: str) -> Optional[Job]:
        """Get job by ID"""
        try:
            return Job.get(job_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def update_job_status(job_id: str, status: str) -> bool:
        """Update job application status"""
        try:
            job = Job.get(job_id)
            job.application_status = status
            job.updated_at = datetime.utcnow()
            if status == 'applied':
                job.applied_at = datetime.utcnow()
            job.save()
            return True
        except DoesNotExist:
            return False
    
    @staticmethod
    def soft_delete_job(job_id: str) -> bool:
        """Soft delete a job by setting status to 'deleted' and adding deleted_at timestamp"""
        try:
            job = Job.get(job_id)
            job.status = 'deleted'
            job.deleted_at = datetime.utcnow()
            job.updated_at = datetime.utcnow()
            job.save()
            return True
        except DoesNotExist:
            return False
    
    @staticmethod
    def soft_delete_jobs(job_ids: List[str]) -> dict:
        """Soft delete multiple jobs"""
        results = {"success": [], "failed": []}
        for job_id in job_ids:
            if DatabaseService.soft_delete_job(job_id):
                results["success"].append(job_id)
            else:
                results["failed"].append(job_id)
        return results
    
    @staticmethod
    def restore_job(job_id: str) -> bool:
        """Restore a soft-deleted job"""
        try:
            job = Job.get(job_id)
            if job.status == 'deleted':
                job.status = 'active'
                job.deleted_at = None
                job.updated_at = datetime.utcnow()
                job.save()
                return True
            return False
        except DoesNotExist:
            return False
    
    # Base Resume Operations
    @staticmethod
    def create_base_resume(user_id: str, resume_name: str, file_url: str,
                          file_type: str, original_filename: str, 
                          file_size: int, **kwargs) -> BaseResume:
        """Create a new base resume"""
        base_resume_id = str(uuid.uuid4())
        base_resume = BaseResume(
            base_resume_id=base_resume_id,
            user_id=user_id,
            resume_name=resume_name,
            file_url=file_url,
            file_type=file_type,
            original_filename=original_filename,
            file_size=file_size,
            **kwargs
        )
        base_resume.save()
        return base_resume
    
    @staticmethod
    def get_user_base_resumes(user_id: str) -> List[BaseResume]:
        """Get all base resumes for a user"""
        return list(BaseResume.scan(BaseResume.user_id == user_id))
    
    @staticmethod
    def get_primary_resume(user_id: str) -> Optional[BaseResume]:
        """Get user's primary resume"""
        # Use scan instead of GSI query since we don't have GSIs set up yet
        resumes = list(BaseResume.scan((BaseResume.user_id == user_id) & (BaseResume.is_primary == True), limit=1))
        return resumes[0] if resumes else None
    
    @staticmethod
    def set_primary_resume(user_id: str, base_resume_id: str) -> bool:
        """Set a resume as primary (unset others)"""
        try:
            # First, unset all primary flags for this user
            user_resumes = DatabaseService.get_user_base_resumes(user_id)
            for resume in user_resumes:
                if resume.is_primary:
                    resume.is_primary = False
                    resume.save()
            
            # Set the new primary resume
            resume = BaseResume.get(base_resume_id)
            resume.is_primary = True
            resume.save()
            return True
        except DoesNotExist:
            return False
    
    @staticmethod
    def get_base_resume(base_resume_id: str) -> Optional[BaseResume]:
        """Get base resume by ID"""
        try:
            return BaseResume.get(base_resume_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def delete_base_resume(base_resume_id: str) -> bool:
        """Delete a base resume"""
        try:
            resume = BaseResume.get(base_resume_id)
            resume.delete()
            return True
        except DoesNotExist:
            return False
    
    # Resume Analysis Operations
    @staticmethod
    def create_resume_analysis(user_id: str, job_id: str, 
                             base_resume_id: Optional[str] = None, **kwargs) -> ResumeAnalysis:
        """Create a new resume analysis"""
        analysis_id = str(uuid.uuid4())
        analysis = ResumeAnalysis(
            analysis_id=analysis_id,
            user_id=user_id,
            job_id=job_id,
            base_resume_id=base_resume_id,
            **kwargs
        )
        analysis.save()
        return analysis
    
    @staticmethod
    def get_resume_analysis(analysis_id: str) -> Optional[ResumeAnalysis]:
        """Get resume analysis by ID"""
        try:
            return ResumeAnalysis.get(analysis_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def get_user_analyses(user_id: str, limit: int = 50) -> List[ResumeAnalysis]:
        """Get all resume analyses for a user"""
        # Use scan instead of GSI query since we don't have GSIs set up yet
        return list(ResumeAnalysis.scan(ResumeAnalysis.user_id == user_id, limit=limit))
    
    @staticmethod
    def get_job_analyses(job_id: str) -> List[ResumeAnalysis]:
        """Get all analyses for a specific job"""
        # Use scan instead of GSI query since we don't have GSIs set up yet
        return list(ResumeAnalysis.scan(ResumeAnalysis.job_id == job_id))
    
    @staticmethod
    def update_analysis_status(analysis_id: str, status: str, 
                             results: Optional[Dict] = None, 
                             match_score: Optional[float] = None) -> bool:
        """Update analysis status and results"""
        try:
            analysis = ResumeAnalysis.get(analysis_id)
            analysis.analysis_status = status
            analysis.updated_at = datetime.utcnow()
            
            if results:
                analysis.analysis_results = results
            if match_score is not None:
                analysis.match_score = match_score
                
            analysis.save()
            return True
        except DoesNotExist:
            return False
    
    # Generated Resume Operations
    @staticmethod
    def create_generated_resume(analysis_id: str, user_id: str, resume_type: str,
                              resume_content: str, **kwargs) -> GeneratedResume:
        """Create a new generated resume"""
        resume_id = str(uuid.uuid4())
        generated_resume = GeneratedResume(
            resume_id=resume_id,
            analysis_id=analysis_id,
            user_id=user_id,
            resume_type=resume_type,
            resume_content=resume_content,
            **kwargs
        )
        generated_resume.save()
        return generated_resume
    
    @staticmethod
    def get_generated_resume(resume_id: str) -> Optional[GeneratedResume]:
        """Get generated resume by ID"""
        try:
            return GeneratedResume.get(resume_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def get_user_generated_resumes(user_id: str) -> List[GeneratedResume]:
        """Get all generated resumes for a user"""
        return list(GeneratedResume.scan(GeneratedResume.user_id == user_id))
    
    @staticmethod
    def get_analysis_generated_resumes(analysis_id: str) -> List[GeneratedResume]:
        """Get all generated resumes for a specific analysis"""
        return list(GeneratedResume.scan(GeneratedResume.analysis_id == analysis_id))
    
    @staticmethod
    def increment_download_count(resume_id: str) -> bool:
        """Increment download count for a generated resume"""
        try:
            resume = GeneratedResume.get(resume_id)
            resume.download_count += 1
            resume.last_downloaded = datetime.utcnow()
            resume.save()
            return True
        except DoesNotExist:
            return False
    
    @staticmethod
    def delete_generated_resume(resume_id: str) -> bool:
        """Delete a generated resume"""
        try:
            resume = GeneratedResume.get(resume_id)
            resume.delete()
            return True
        except DoesNotExist:
            return False
    
    # Template Operations
    @staticmethod
    def get_all_templates() -> List[ResumeTemplate]:
        """Get all available resume templates"""
        return list(ResumeTemplate.scan())
    
    @staticmethod
    def get_templates_by_industry(industry: str) -> List[ResumeTemplate]:
        """Get templates for a specific industry"""
        return list(ResumeTemplate.scan(ResumeTemplate.industry == industry))
    
    @staticmethod
    def get_template(template_id: str) -> Optional[ResumeTemplate]:
        """Get template by ID"""
        try:
            return ResumeTemplate.get(template_id)
        except DoesNotExist:
            return None
    
    # Application Tracking Operations
    @staticmethod
    def create_application(user_id: str, job_id: str, resume_id: Optional[str] = None) -> ApplicationTracking:
        """Create a new application tracking entry"""
        application_id = str(uuid.uuid4())
        application = ApplicationTracking(
            application_id=application_id,
            user_id=user_id,
            job_id=job_id,
            resume_id=resume_id
        )
        application.save()
        return application
    
    @staticmethod
    def update_application_status(application_id: str, status: str, notes: Optional[str] = None) -> bool:
        """Update application status"""
        try:
            application = ApplicationTracking.get(application_id)
            application.status = status
            application.status_updated_at = datetime.utcnow()
            if notes:
                application.notes = notes
            application.save()
            return True
        except DoesNotExist:
            return False
    
    # Utility Operations
    @staticmethod
    def get_user_dashboard_data(user_id: str) -> Dict[str, Any]:
        """Get dashboard data for a user"""
        jobs = DatabaseService.get_user_jobs(user_id)
        analyses = DatabaseService.get_user_analyses(user_id)
        generated_resumes = DatabaseService.get_user_generated_resumes(user_id)
        
        # Calculate stats
        total_applications = len(jobs)
        applied_jobs = len([job for job in jobs if job.application_status == 'applied'])
        interviews = len([job for job in jobs if job.application_status == 'interviewed'])
        
        # Calculate average match score
        match_scores = [analysis.match_score for analysis in analyses if analysis.match_score]
        avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0
        
        # Convert jobs and analyses to dict format for JSON serialization
        recent_jobs_data = []
        for job in jobs[:5]:
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
            recent_jobs_data.append(job_dict)
        
        recent_analyses_data = []
        for analysis in analyses[:5]:
            analysis_dict = {
                "analysis_id": analysis.analysis_id,
                "user_id": analysis.user_id,
                "job_id": analysis.job_id,
                "analysis_status": analysis.analysis_status,
                "match_score": analysis.match_score,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None
            }
            recent_analyses_data.append(analysis_dict)
        
        return {
            'total_applications': total_applications,
            'applied_jobs': applied_jobs,
            'interviews': interviews,
            'avg_match_score': round(avg_match_score, 1),
            'total_analyses': len(analyses),
            'total_generated_resumes': len(generated_resumes),
            'recent_jobs': recent_jobs_data,
            'recent_analyses': recent_analyses_data
        }

# Example usage and testing functions
def test_database_operations():
    """Test basic database operations"""
    print("Testing database operations...")
    
    # Test user creation
    print("Creating test user...")
    user = DatabaseService.create_user("test@example.com", "Test", "User")
    print(f"Created user: {user.user_id}")
    
    # Test job creation
    print("Creating test job...")
    job = DatabaseService.create_job(
        user_id=user.user_id,
        job_title="Software Engineer",
        company_name="Tech Corp",
        job_description="Great software engineering role"
    )
    print(f"Created job: {job.job_id}")
    
    # Test resume analysis creation
    print("Creating test resume analysis...")
    analysis = DatabaseService.create_resume_analysis(
        user_id=user.user_id,
        job_id=job.job_id,
        analysis_status="pending"
    )
    print(f"Created analysis: {analysis.analysis_id}")
    
    print("✅ Database operations test completed!")

if __name__ == "__main__":
    # Uncomment to test database operations
    # test_database_operations()
    print("Database service ready! 🚀")
