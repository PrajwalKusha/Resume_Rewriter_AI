import asyncio
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from strands import Agent
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import PyPDF2
import docx
import io

load_dotenv()

class WorkExperience(BaseModel):
    company_name: str = Field(description="Name of the company")
    position: str = Field(description="Job title or position")
    start_date: str = Field(description="Start date of the role")
    end_date: str = Field(description="End date of the role")
    location: str = Field(description="Location of the role")
    description: str = Field(description="Description of the role")
    achievements: str = Field(description="Achievements of the role")
    technologies: str = Field(description="Technologies used in the role")
    methodologies: str = Field(description="Methodologies used in the role")
    business_impact: str = Field(description="Business impact of the role")
    team_size: int = Field(description="Size of the team")
    client_management: str = Field(description="Client management of the role")

class ResumeData(BaseModel):
    """Comprehensive resume data structure preserving ALL details for AI Resume Rewriter"""
    
    # Contact Information (required)
    full_name: str = Field(description="Full name of the candidate")
    email: str = Field(description="Email address")
    phone: str = Field(description="Phone number")
    
    # Contact Information (optional)
    linkedin: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    github: Optional[str] = Field(default=None, description="GitHub profile URL")
    portfolio: Optional[str] = Field(default=None, description="Portfolio website URL")
    location: Optional[str] = Field(default=None, description="Complete location (city, state, country)")
    
    # Professional Summary
    professional_summary: str = Field(description="Complete professional summary or objective statement")
    
    # Skills - Comprehensive
    technical_skills_detailed: str = Field(description="ALL technical skills categorized: programming languages, frameworks, libraries, cloud platforms, databases, tools, AI/ML technologies, and methodologies mentioned anywhere in the resume")
    
    # Work Experience - Complete Details
    # work_experience_detailed: str = Field(description="COMPLETE work experience with ALL job details: company names, positions, dates, locations, and EVERY bullet point with responsibilities, achievements, metrics, technologies, methodologies, and business impact preserved exactly as written with specific numbers and percentages")
    
    work_experience_detailed: List[WorkExperience] = Field(description="COMPLETE work experience with ALL job details: company names, positions, dates, locations, and EVERY bullet point with responsibilities, achievements, metrics, technologies, methodologies, and business impact preserved exactly as written with specific numbers and percentages")
    
    # Education - Complete Details  
    education_detailed: str = Field(description="Complete education information: institution names, degrees, dates, locations, GPA, relevant coursework, and academic achievements")
    
    # Projects - Full Descriptions
    projects_detailed: str = Field(description="COMPLETE project descriptions with ALL technical details: project names, technologies used, implementation specifics, achievements, outcomes, URLs, and every bullet point preserved exactly as written")
    
    # Professional Impact & Achievements
    quantified_achievements: str = Field(description="ALL quantified achievements with specific numbers, percentages, dollar amounts, team sizes, client numbers, and metrics mentioned throughout the resume")
    
    # Professional Context
    professional_context: str = Field(description="Industry expertise, consulting experience, leadership roles, client management, system architecture work, data analytics experience, and process optimization initiatives")
    
    # Career Summary
    career_summary: str = Field(description="Career progression, total experience, key competencies, and professional strengths demonstrated across all experiences")
    
    # Additional Information (optional)
    additional_info: Optional[str] = Field(default=None, description="Certifications, publications, awards, languages, volunteer experience, and other professional elements")
    
    # Raw content for reference
    raw_text: Optional[str] = Field(default=None, description="Original resume text for reference")

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        docx_file = io.BytesIO(file_content)
        doc = docx.Document(docx_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error reading DOCX: {str(e)}")

def extract_text_from_file(filename: str, file_content: bytes) -> str:
    """Extract text from uploaded file based on extension"""
    file_extension = filename.lower().split('.')[-1]
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_content)
    elif file_extension in ['docx', 'doc']:
        return extract_text_from_docx(file_content)
    elif file_extension == 'txt':
        return file_content.decode('utf-8')
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

async def analyze_resume(resume_text: str) -> ResumeData:
    """
    Analyze a resume using Strands Agent with Claude Sonnet and return structured information
    """
    
    # Create the Strands Agent with Claude Sonnet
    agent = Agent(
        model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",  # Claude 3.5 Sonnet v2
        system_prompt="""You are an expert resume analyst specializing in comprehensive data extraction for AI-powered resume rewriting. Your task is to extract and preserve EVERY detail from resumes to ensure the AI Resume Rewriter has complete information to create compelling, accurate resumes.

CRITICAL EXTRACTION REQUIREMENTS:

1. PRESERVE ALL DETAILS - Do not summarize or compress information. Extract complete sentences, bullet points, and descriptions exactly as written.

2. WORK EXPERIENCE - Extract EVERYTHING:
   - Complete job descriptions with ALL bullet points
   - Every quantified achievement (20% revenue growth, 35% operational visibility, etc.)
   - All specific technologies, methodologies, and processes mentioned
   - Complete company names, job titles, dates, and locations
   - All client management, team leadership, and strategic work details
   - Every business impact statement and efficiency improvement

3. PROJECTS - Extract COMPLETE descriptions:
   - Full project descriptions with all technical implementation details
   - Every technology, framework, and tool mentioned
   - All achievements, outcomes, and performance metrics
   - Complete architecture and system design information
   - All URLs, links, and platform details

4. SKILLS - Extract from EVERY section of the resume:
   - Read Technical Skills section completely
   - Scan ALL work experience bullet points for technologies
   - Extract ALL technologies from project descriptions
   - Find tools mentioned in education coursework
   - Capture methodologies and processes mentioned anywhere
   - Include APIs, platforms, and development tools
   - Don't miss Excel functions, CRM systems, or business tools
   - Extract AI/ML models, algorithms, and frameworks

5. QUANTIFIED ACHIEVEMENTS - Extract ALL numbers:
   - Revenue improvements, cost savings, efficiency gains
   - Team sizes, client numbers, project scales
   - Performance metrics, KPIs, and measurable outcomes
   - Growth percentages, time savings, productivity improvements

6. PROFESSIONAL CONTEXT - Extract ALL:
   - Industry expertise and domain knowledge
   - Consulting and advisory experience details
   - Leadership and management responsibilities
   - Cross-functional collaboration and strategic work
   - Process optimization and automation initiatives

EXTRACTION STRATEGY:
- Read the ENTIRE resume multiple times
- Extract information in complete sentences and detailed descriptions
- Preserve all technical context and business impact
- Maintain all quantified metrics and specific achievements
- Capture all dates, locations, and organizational details
- Include all methodologies, processes, and approaches mentioned

QUALITY REQUIREMENTS:
- Every bullet point and achievement must be captured
- All technical skills and technologies must be identified
- Complete work history with full context and details
- All projects with comprehensive technical descriptions
- Every quantified metric and business impact statement

This data will be used by an AI Resume Rewriter to create targeted, compelling resumes. Completeness and accuracy are CRITICAL for success."""
    )
    
    try:
        # Use structured output with the agent
        result = agent.structured_output(
            ResumeData,
            f"""COMPREHENSIVE RESUME ANALYSIS - Extract ALL details for AI Resume Rewriter:

{resume_text}

EXTRACTION REQUIREMENTS:

1. WORK EXPERIENCE - Extract EVERY detail:
   - Complete job descriptions with ALL bullet points exactly as written
   - Every single quantified achievement with specific numbers and percentages
   - All technologies, methodologies, and processes mentioned in each role
   - Complete company names, job titles, employment dates, and locations
   - All leadership, management, and team collaboration details
   - Every business impact statement, revenue generation, and efficiency improvement
   - All client management, consulting, and strategic work details

2. PROJECTS - Extract COMPLETE descriptions:
   - Full project descriptions with all technical implementation details
   - Every technology, framework, tool, and platform mentioned
   - All achievements, outcomes, performance improvements, and metrics
   - Complete system architecture, database design, and scalability details
   - All API integrations, development workflows, and technical processes
   - Every GitHub link, URL, and platform reference

3. TECHNICAL SKILLS - Extract from EVERYWHERE in the resume:
   - Scan EVERY section: Technical Skills, Work Experience, Projects, Education
   - Programming Languages: Python, SQL, TypeScript, JavaScript, R, Java, etc.
   - AI/ML Technologies: TensorFlow, PyTorch, Hugging Face, GPT Models, Claude API, OpenAI API, XGBoost, Random Forest, etc.
   - Frameworks/Libraries: React, FastAPI, Next.js, Django, Flask, Framer Motion, etc.
   - Cloud Platforms: AWS (Bedrock, Lambda, S3, EC2), Azure OpenAI, GCP, Docker, etc.
   - Databases: PostgreSQL, MySQL, MongoDB, SQL Server, etc.
   - Tools/Software: Git, Salesforce CRM, Power BI, Excel (INDEX-MATCH, XLOOKUP, Power Query), Cursor AI, etc.
   - Development Tools: BeautifulSoup, Selenium, PyPDF2, SendGrid, OpenRouter API, etc.
   - Methodologies: Prompt Engineering, Fine-tuning, ETL, A/B Testing, Statistical Analysis, etc.

4. QUANTIFIED ACHIEVEMENTS - Extract ALL numbers:
   - Revenue growth percentages, cost savings, efficiency improvements
   - Team sizes managed, client numbers, project scales
   - Performance improvements, productivity gains, time savings
   - Growth metrics, KPIs, and measurable business outcomes

5. PROFESSIONAL CONTEXT - Extract ALL:
   - Industry expertise, domain knowledge, and sector experience
   - Consulting, advisory, and strategic work details
   - Leadership roles, management responsibilities, team collaboration
   - Process optimization, automation, and operational improvements
   - Cross-functional work, stakeholder management, and strategic initiatives

6. EDUCATION & CERTIFICATIONS:
   - Complete education details with coursework, GPA, and academic achievements
   - All certifications, professional credentials, and training

CRITICAL SKILL EXTRACTION: 
- Read the resume 3 times to find ALL technologies
- Check Technical Skills section, Work Experience, Projects, and Education
- Look for: XGBoost, Random Forest, Cursor AI, Salesforce CRM, INDEX-MATCH, XLOOKUP, Power Query, OpenRouter API, Framer Motion, and ALL other technologies
- Don't miss any programming language, framework, tool, platform, API, or methodology mentioned ANYWHERE

CRITICAL: Preserve exact wording, specific metrics, and complete context. The AI Resume Rewriter needs ALL this information to create compelling, targeted resumes.

Return a comprehensive ResumeData object with EVERY detail and technology captured."""
        )
        
        # Add the raw text for reference
        result.raw_text = resume_text
        
        # Save the analysis to a JSON file
        save_resume_analysis(resume_text, result)
        
        return result
        
    except Exception as e:
        print(f"Error with Strands Agent: {e}")
        # Return a basic structure with required fields filled
        return ResumeData(
            full_name="Name Not Found",
            email="Email Not Found", 
            phone="Phone Not Found",
            professional_summary="Failed to analyze - please check Strands Agent configuration",
            technical_skills_detailed="Analysis Failed",
            work_experience_detailed="Analysis Failed",
            education_detailed="Analysis Failed",
            projects_detailed="Analysis Failed",
            quantified_achievements="Analysis Failed",
            professional_context="Analysis Failed",
            career_summary="Analysis Failed",
            raw_text=resume_text
        )

def get_next_resume_filename() -> str:
    """Get the next available resume filename with incrementing number"""
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Find the highest existing resume number
    existing_files = list(data_dir.glob("resume_*.json"))
    if not existing_files:
        return "data/resume_001.json"
    
    # Extract numbers from existing files and find the maximum
    numbers = []
    for file in existing_files:
        try:
            # Extract number from filename like "resume_001.json"
            num_str = file.stem.split('_')[1]  # Get "001" from "resume_001"
            numbers.append(int(num_str))
        except (IndexError, ValueError):
            continue
    
    next_num = max(numbers) + 1 if numbers else 1
    return f"data/resume_{next_num:03d}.json"

def save_resume_analysis(resume_text: str, analysis: ResumeData) -> str:
    """Save resume analysis to an incrementing JSON file"""
    try:
        filename = get_next_resume_filename()
        
        # Create the data structure to save
        resume_data = {
            "timestamp": datetime.now().isoformat(),
            "original_resume_text": resume_text,
            "analysis": analysis.model_dump(),
            "metadata": {
                "candidate_name": analysis.full_name,
                "professional_context": analysis.professional_context[:100] + "..." if len(analysis.professional_context) > 100 else analysis.professional_context,
                "career_summary": analysis.career_summary[:100] + "..." if len(analysis.career_summary) > 100 else analysis.career_summary,
                "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(resume_data, f, indent=2, ensure_ascii=False)
        
        print(f"Resume analysis saved to: {filename}")
        return filename
        
    except Exception as e:
        print(f"Error saving resume analysis: {e}")
        return ""
