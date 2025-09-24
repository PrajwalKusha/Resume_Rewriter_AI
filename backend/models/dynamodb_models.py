"""
DynamoDB Models using PynamoDB for Resume AI Application
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pynamodb.models import Model
from pynamodb.attributes import (
    UnicodeAttribute, 
    NumberAttribute, 
    BooleanAttribute, 
    UTCDateTimeAttribute,
    MapAttribute,
    ListAttribute,
    JSONAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
import os
from dotenv import load_dotenv

load_dotenv()

# AWS Region - can be configured via environment variable
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

class UserJobsIndex(GlobalSecondaryIndex):
    """GSI for querying user's jobs"""
    class Meta:
        index_name = 'user_id-created_at-index'
        projection = AllProjection()
        region = AWS_REGION
        read_capacity_units = 5
        write_capacity_units = 5
    
    user_id = UnicodeAttribute(hash_key=True)
    created_at = UTCDateTimeAttribute(range_key=True)

class UserAnalysesIndex(GlobalSecondaryIndex):
    """GSI for querying user's resume analyses"""
    class Meta:
        index_name = 'user_id-created_at-index'
        projection = AllProjection()
        region = AWS_REGION
        read_capacity_units = 5
        write_capacity_units = 5
    
    user_id = UnicodeAttribute(hash_key=True)
    created_at = UTCDateTimeAttribute(range_key=True)

class JobAnalysesIndex(GlobalSecondaryIndex):
    """GSI for querying analyses by job"""
    class Meta:
        index_name = 'job_id-analysis_id-index'
        projection = AllProjection()
        region = AWS_REGION
        read_capacity_units = 5
        write_capacity_units = 5
    
    job_id = UnicodeAttribute(hash_key=True)
    analysis_id = UnicodeAttribute(range_key=True)

class UserApplicationStatusIndex(GlobalSecondaryIndex):
    """GSI for querying user's applications by status"""
    class Meta:
        index_name = 'user_id-application_status-index'
        projection = AllProjection()
        region = AWS_REGION
        read_capacity_units = 5
        write_capacity_units = 5
    
    user_id = UnicodeAttribute(hash_key=True)
    application_status = UnicodeAttribute(range_key=True)

class UserPrimaryResumeIndex(GlobalSecondaryIndex):
    """GSI for getting user's primary resume"""
    class Meta:
        index_name = 'user_id-is_primary-index'
        projection = AllProjection()
        region = AWS_REGION
        read_capacity_units = 5
        write_capacity_units = 5
    
    user_id = UnicodeAttribute(hash_key=True)
    is_primary = BooleanAttribute(range_key=True)

# Main Models

class User(Model):
    """User table model - using existing resume-users table"""
    class Meta:
        table_name = 'resume-users'
        region = AWS_REGION
        
    user_id = UnicodeAttribute(hash_key=True)  # UUID
    email = UnicodeAttribute()
    first_name = UnicodeAttribute(null=True)
    last_name = UnicodeAttribute(null=True)
    profile_picture_url = UnicodeAttribute(null=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)
    last_login = UTCDateTimeAttribute(null=True)
    subscription_tier = UnicodeAttribute(default='free')  # free/premium
    preferences = JSONAttribute(default=dict)  # UI preferences, settings
    total_applications = NumberAttribute(default=0)
    total_interviews = NumberAttribute(default=0)

class Job(Model):
    """Jobs table model - using resume-jobs naming convention"""
    class Meta:
        table_name = 'resume-jobs'
        region = AWS_REGION
        
    job_id = UnicodeAttribute(hash_key=True)  # UUID
    user_id = UnicodeAttribute()
    job_title = UnicodeAttribute()
    company_name = UnicodeAttribute()
    job_description = UnicodeAttribute()  # Full JD text
    job_url = UnicodeAttribute(null=True)
    location = UnicodeAttribute(null=True)
    work_type = UnicodeAttribute(null=True)  # remote/hybrid/onsite
    employment_type = UnicodeAttribute(null=True)  # full_time/part_time/contract/internship
    salary_range = UnicodeAttribute(null=True)
    application_deadline = UTCDateTimeAttribute(null=True)
    application_status = UnicodeAttribute(default='not_applied')  # not_applied/applied/interviewed/rejected/offered
    applied_at = UTCDateTimeAttribute(null=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)
    status = UnicodeAttribute(default='active')  # active/archived/deleted
    deleted_at = UTCDateTimeAttribute(null=True)  # For soft delete functionality
    parsed_jd_data = JSONAttribute(default=dict)  # Structured JD analysis results
    keywords = JSONAttribute(default=list)  # List of keywords for search
    priority = UnicodeAttribute(default='medium')  # high/medium/low
    notes = UnicodeAttribute(null=True)  # User notes
    
    # GSI - commented out for now since we created simple tables
    # user_jobs_index = UserJobsIndex()
    # user_application_status_index = UserApplicationStatusIndex()

class BaseResume(Model):
    """Base resumes table model - user's original resumes"""
    class Meta:
        table_name = 'resume-base-resumes'
        region = AWS_REGION
        
    base_resume_id = UnicodeAttribute(hash_key=True)  # UUID
    user_id = UnicodeAttribute()
    resume_name = UnicodeAttribute()  # "Software Engineer Resume v2"
    file_url = UnicodeAttribute()  # S3 path to original file
    file_type = UnicodeAttribute()  # pdf/docx/txt
    original_filename = UnicodeAttribute()
    file_size = NumberAttribute()  # bytes
    upload_date = UTCDateTimeAttribute(default=datetime.utcnow)
    is_primary = BooleanAttribute(default=False)  # default resume flag
    parsed_content = JSONAttribute(default=dict)  # Structured resume data
    version = NumberAttribute(default=1)
    status = UnicodeAttribute(default='active')  # active/archived
    
    # GSI - commented out for now since we created simple tables
    # user_primary_resume_index = UserPrimaryResumeIndex()

class ResumeAnalysis(Model):
    """Resume analyses table model - your existing table"""
    class Meta:
        table_name = 'resume-analysis'  # Your existing table name
        region = AWS_REGION
        
    analysis_id = UnicodeAttribute(hash_key=True)  # UUID - your existing PK
    user_id = UnicodeAttribute()
    job_id = UnicodeAttribute()
    base_resume_id = UnicodeAttribute(null=True)  # Reference to base resume
    original_resume_url = UnicodeAttribute(null=True)  # S3 path (for backward compatibility)
    original_filename = UnicodeAttribute(null=True)
    file_type = UnicodeAttribute(null=True)
    file_size = NumberAttribute(null=True)
    analysis_status = UnicodeAttribute(default='pending')  # pending/analyzing/completed/failed
    analysis_results = JSONAttribute(default=dict)  # Structured analysis data
    ai_suggestions = JSONAttribute(default=list)  # Improvement suggestions
    match_score = NumberAttribute(null=True)  # Percentage match
    confidence_score = NumberAttribute(null=True)  # AI confidence in analysis
    processing_time = NumberAttribute(null=True)  # seconds
    error_message = UnicodeAttribute(null=True)  # If analysis failed
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)
    
    # GSIs - commented out for now since we don't have GSIs set up
    # user_analyses_index = UserAnalysesIndex()
    # job_analyses_index = JobAnalysesIndex()

class GeneratedResume(Model):
    """Generated resumes table model"""
    class Meta:
        table_name = 'resume-generated-resumes'
        region = AWS_REGION
        
    resume_id = UnicodeAttribute(hash_key=True)  # UUID
    analysis_id = UnicodeAttribute()  # Foreign key to resume_analyses
    user_id = UnicodeAttribute()
    base_resume_id = UnicodeAttribute(null=True)  # Reference to base resume
    resume_type = UnicodeAttribute()  # complete_rewrite/step_by_step
    generation_method = UnicodeAttribute(null=True)  # Additional method details
    template_id = UnicodeAttribute(null=True)  # Which template was used
    resume_content = UnicodeAttribute()  # Formatted resume text
    resume_url = UnicodeAttribute(null=True)  # Generated PDF/doc path in S3
    version = NumberAttribute(default=1)  # For tracking iterations
    is_active = BooleanAttribute(default=True)  # Current version flag
    customizations = JSONAttribute(default=dict)  # User modifications
    download_count = NumberAttribute(default=0)
    last_downloaded = UTCDateTimeAttribute(null=True)
    feedback_rating = NumberAttribute(null=True)  # User satisfaction 1-5
    is_favorite = BooleanAttribute(default=False)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)

class ResumeTemplate(Model):
    """Resume templates table model"""
    class Meta:
        table_name = 'resume_templates'
        region = AWS_REGION
        
    template_id = UnicodeAttribute(hash_key=True)  # UUID
    template_name = UnicodeAttribute()  # "Modern Tech", "Finance Professional"
    industry = UnicodeAttribute(null=True)  # tech/finance/healthcare
    template_data = JSONAttribute(default=dict)  # CSS/styling information
    is_premium = BooleanAttribute(default=False)
    preview_image_url = UnicodeAttribute(null=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    usage_count = NumberAttribute(default=0)  # Analytics

class ApplicationTracking(Model):
    """Application tracking table model"""
    class Meta:
        table_name = 'application_tracking'
        region = AWS_REGION
        
    application_id = UnicodeAttribute(hash_key=True)  # UUID
    user_id = UnicodeAttribute()
    job_id = UnicodeAttribute()
    resume_id = UnicodeAttribute(null=True)  # Which generated resume was used
    application_date = UTCDateTimeAttribute(default=datetime.utcnow)
    status = UnicodeAttribute(default='submitted')  # submitted/under_review/interview_scheduled/rejected/offered
    status_updated_at = UTCDateTimeAttribute(default=datetime.utcnow)
    interview_dates = JSONAttribute(default=list)  # Multiple interview rounds
    notes = UnicodeAttribute(null=True)  # User notes about application progress
    follow_up_date = UTCDateTimeAttribute(null=True)  # Reminder date

class UserFeedback(Model):
    """User feedback table model"""
    class Meta:
        table_name = 'user_feedback'
        region = AWS_REGION
        
    feedback_id = UnicodeAttribute(hash_key=True)  # UUID
    user_id = UnicodeAttribute()
    analysis_id = UnicodeAttribute(null=True)
    suggestion_type = UnicodeAttribute(null=True)  # skill_improvement/experience_highlight
    was_helpful = BooleanAttribute(null=True)
    user_comment = UnicodeAttribute(null=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)

# Utility functions for database operations

def create_tables():
    """Create all tables if they don't exist"""
    tables = [
        User, Job, BaseResume, ResumeAnalysis, 
        GeneratedResume, ResumeTemplate, ApplicationTracking, UserFeedback
    ]
    
    for table in tables:
        if not table.exists():
            print(f"Creating table: {table.Meta.table_name}")
            table.create_table(read_capacity_units=5, write_capacity_units=5, wait=True)
            print(f"Table {table.Meta.table_name} created successfully")
        else:
            print(f"Table {table.Meta.table_name} already exists")

def check_connection():
    """Check if connection to DynamoDB works"""
    try:
        # Try to describe your existing resume-analysis table
        if ResumeAnalysis.exists():
            print("✅ Successfully connected to DynamoDB!")
            print(f"✅ Found existing table: {ResumeAnalysis.Meta.table_name}")
            
            # Try to get table info
            try:
                table_description = ResumeAnalysis.describe_table()
                table_info = table_description.get('Table', {})
                print(f"✅ Table status: {table_info.get('TableStatus', 'Unknown')}")
                print(f"✅ Item count: {table_info.get('ItemCount', 'Unknown')}")
            except Exception as desc_error:
                print(f"⚠️ Could not get table details: {desc_error}")
                print("✅ But connection to DynamoDB is working!")
            
            return True
        else:
            print("❌ Table 'resume-analysis' not found")
            return False
    except Exception as e:
        print(f"❌ Error connecting to DynamoDB: {e}")
        return False

if __name__ == "__main__":
    # Test connection
    print("Testing DynamoDB connection...")
    if check_connection():
        print("\n🚀 Ready to use DynamoDB models!")
    else:
        print("\n❌ Please check your AWS credentials and region settings")
