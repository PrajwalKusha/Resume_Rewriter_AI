"""
Test script for DynamoDB operations
"""

import asyncio
from services.database_service import DatabaseService
from models.dynamodb_models import check_connection

async def test_full_workflow():
    """Test the complete workflow"""
    print("🧪 Testing complete database workflow...\n")
    
    # 1. Test connection
    print("1. Testing database connection...")
    if not check_connection():
        print("❌ Database connection failed!")
        return
    print("✅ Database connected successfully!\n")
    
    # 2. Create a test user
    print("2. Creating test user...")
    try:
        user = DatabaseService.create_user(
            email="test@resumeforge.com",
            first_name="Test",
            last_name="User"
        )
        print(f"✅ User created: {user.user_id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.first_name} {user.last_name}\n")
    except Exception as e:
        print(f"❌ Error creating user: {e}\n")
        return
    
    # 3. Create a test job
    print("3. Creating test job...")
    try:
        job = DatabaseService.create_job(
            user_id=user.user_id,
            job_title="Senior Software Engineer",
            company_name="Tech Corp",
            job_description="Great software engineering role at a leading tech company",
            location="San Francisco, CA",
            work_type="Hybrid",
            employment_type="Full Time",
            salary_range="$150k - $200k"
        )
        print(f"✅ Job created: {job.job_id}")
        print(f"   Title: {job.job_title}")
        print(f"   Company: {job.company_name}")
        print(f"   Location: {job.location}\n")
    except Exception as e:
        print(f"❌ Error creating job: {e}\n")
        return
    
    # 4. Create a resume analysis
    print("4. Creating resume analysis...")
    try:
        analysis = DatabaseService.create_resume_analysis(
            user_id=user.user_id,
            job_id=job.job_id,
            original_filename="test_resume.pdf",
            file_type="pdf",
            file_size=12345,
            analysis_status="completed",
            analysis_results={"skills": ["Python", "FastAPI", "React"]},
            match_score=85.5
        )
        print(f"✅ Resume analysis created: {analysis.analysis_id}")
        print(f"   Status: {analysis.analysis_status}")
        print(f"   Match Score: {analysis.match_score}%\n")
    except Exception as e:
        print(f"❌ Error creating resume analysis: {e}\n")
        return
    
    # 5. Create a generated resume
    print("5. Creating generated resume...")
    try:
        generated_resume = DatabaseService.create_generated_resume(
            analysis_id=analysis.analysis_id,
            user_id=user.user_id,
            resume_type="complete_rewrite",
            resume_content="This is the generated resume content...",
            template_id="modern_tech_template"
        )
        print(f"✅ Generated resume created: {generated_resume.resume_id}")
        print(f"   Type: {generated_resume.resume_type}")
        print(f"   Version: {generated_resume.version}\n")
    except Exception as e:
        print(f"❌ Error creating generated resume: {e}\n")
        return
    
    # 6. Test queries
    print("6. Testing database queries...")
    try:
        # Get user jobs
        user_jobs = DatabaseService.get_user_jobs(user.user_id)
        print(f"✅ Found {len(user_jobs)} jobs for user")
        
        # Get user analyses
        user_analyses = DatabaseService.get_user_analyses(user.user_id)
        print(f"✅ Found {len(user_analyses)} analyses for user")
        
        # Get dashboard data
        dashboard_data = DatabaseService.get_user_dashboard_data(user.user_id)
        print(f"✅ Dashboard data: {dashboard_data['total_applications']} applications, {dashboard_data['avg_match_score']}% avg match")
        
    except Exception as e:
        print(f"❌ Error querying database: {e}\n")
        return
    
    print("🎉 All database operations completed successfully!")
    print("🚀 Your DynamoDB integration is working perfectly!")

def test_connection_only():
    """Just test the connection"""
    print("🧪 Testing DynamoDB connection only...\n")
    
    if check_connection():
        print("✅ Connection successful!")
        print("🚀 Ready to use DynamoDB!")
    else:
        print("❌ Connection failed!")
        print("Please check your AWS credentials and region settings.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--connection-only":
        test_connection_only()
    else:
        print("Choose test mode:")
        print("1. Full workflow test (creates test data)")
        print("2. Connection test only")
        
        choice = input("Enter choice (1 or 2): ").strip()
        
        if choice == "1":
            asyncio.run(test_full_workflow())
        elif choice == "2":
            test_connection_only()
        else:
            print("Invalid choice. Running connection test...")
            test_connection_only()
