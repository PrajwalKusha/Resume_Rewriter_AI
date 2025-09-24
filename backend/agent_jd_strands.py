import asyncio
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from strands import Agent
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class JobDescription(BaseModel):
    # Basic Job Information
    job_title: str = Field(description="Job title/position name")
    company_name: Optional[str] = Field(default=None, description="Company name")
    job_id: Optional[str] = Field(default=None, description="Job requisition ID or posting ID")
    
    # Job Details
    employment_type: Optional[str] = Field(default=None, description="Full time, Part time, Contract, etc.")
    work_location: Optional[str] = Field(default=None, description="Remote, On-site, Hybrid, or specific location")
    location_details: Optional[str] = Field(default=None, description="Specific city, state, country details")
    department: Optional[str] = Field(default=None, description="Department or team")
    
    # Compensation & Benefits
    salary_range: Optional[str] = Field(default=None, description="Salary range or compensation details")
    benefits: List[str] = Field(default_factory=list, description="List of benefits offered")
    
    # Job Content
    job_summary: Optional[str] = Field(default=None, description="Brief job summary or objective")
    key_responsibilities: List[str] = Field(default_factory=list, description="Main job responsibilities and duties")
    
    # Requirements
    required_education: Optional[str] = Field(default=None, description="Required education level or degree")
    required_experience: Optional[str] = Field(default=None, description="Required years and type of experience")
    required_skills: List[str] = Field(default_factory=list, description="Must-have technical and soft skills")
    
    # Preferences
    preferred_education: Optional[str] = Field(default=None, description="Preferred education background")
    preferred_experience: Optional[str] = Field(default=None, description="Preferred experience")
    preferred_skills: List[str] = Field(default_factory=list, description="Nice-to-have skills and qualifications")
    
    # Industry & Culture
    industry: Optional[str] = Field(default=None, description="Industry sector (healthcare, tech, finance, etc.)")
    company_culture: Optional[str] = Field(default=None, description="Company culture, values, or mission mentioned")
    
    # Application Details
    application_deadline: Optional[str] = Field(default=None, description="Application deadline if mentioned")
    posting_date: Optional[str] = Field(default=None, description="When the job was posted")
    
    # Technical Details
    tools_technologies: List[str] = Field(default_factory=list, description="Specific tools, software, or technologies mentioned")
    certifications: List[str] = Field(default_factory=list, description="Required or preferred certifications")
    
    # Additional Info
    travel_requirements: Optional[str] = Field(default=None, description="Travel requirements if any")
    physical_requirements: Optional[str] = Field(default=None, description="Physical demands or work environment")
    additional_notes: Optional[str] = Field(default=None, description="Any other relevant information")

async def analyze_job_description(jd_text: str) -> JobDescription:
    """
    Analyze a job description using Strands Agent with Claude Sonnet and return structured information
    """
    
    # Create the Strands Agent with Claude Sonnet (default model)
    agent = Agent(
        model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",  # Claude 3.5 Sonnet v2
        system_prompt="""You are an expert HR analyst specializing in job description analysis. 
        Your task is to extract and categorize ALL relevant information from job descriptions with extreme precision.
        
        CRITICAL EXTRACTION REQUIREMENTS:
        
        1. SKILLS & TECHNOLOGIES - Extract EVERY mention:
           - Technical tools: SQL, Python, R, Java, JavaScript, etc.
           - Software: Excel, Tableau, Power BI, Salesforce, etc. 
           - Platforms: AWS, Azure, Google Cloud, etc.
           - Methodologies: Agile, Scrum, etc.
           - Look for skills in parentheses, bullet points, and embedded in sentences
        
        2. REQUIRED vs PREFERRED - Distinguish carefully:
           - Required: "must have", "required", "essential", "minimum", main job requirements
           - Preferred: "nice to have", "preferred", "bonus", "plus", additional qualifications
        
        3. COMPREHENSIVE DETAILS:
           - Salary ranges: Extract exact numbers mentioned
           - Location details: Extract specific cities, remote/hybrid arrangements
           - Benefits: Extract ALL benefits mentioned (401k, insurance, PTO, etc.)
           - Company info: Extract company name if mentioned
           - Job ID: Extract any reference numbers
           - Deadlines: Extract application deadlines or posting dates
        
        4. EXPERIENCE & EDUCATION:
           - Extract years of experience required/preferred
           - Extract specific degree requirements or alternatives
           - Include certifications mentioned
        
        5. RESPONSIBILITIES:
           - Extract ALL key duties and responsibilities
           - Include both primary and secondary responsibilities
        
        PARSING STRATEGY:
        - Read the ENTIRE job description carefully
        - Look for information in headers, bullet points, paragraphs, and parentheses
        - Don't miss technical skills mentioned casually in sentences
        - Pay attention to salary ranges, benefits sections, and requirements
        - Extract company culture elements if mentioned
        
        Always return a complete, accurate JSON object that captures EVERY relevant detail."""
    )
    
    try:
        # Use structured output with the agent
        result = agent.structured_output(
            JobDescription,
            f"""ANALYZE THIS JOB DESCRIPTION COMPREHENSIVELY:

{jd_text}

EXTRACTION CHECKLIST - Ensure you capture:
✓ ALL technical skills (SQL, Python, Excel, Tableau, Power BI, etc.)
✓ Salary range (exact numbers: $115,000 - $130,000)
✓ Location details (Culver City, Hybrid: 3 days office, 2 days remote)
✓ Company name (if mentioned)
✓ ALL responsibilities (every bullet point and duty)
✓ Required vs Preferred skills (distinguish carefully)
✓ Experience requirements (years, specific domains)
✓ Education requirements
✓ Benefits and perks
✓ Industry classification
✓ Tools and technologies in parentheses

Return a complete JobDescription object with ALL fields populated where information exists."""
        )
        
        # Save the analysis to a JSON file
        save_jd_analysis(jd_text, result)
        
        return result
        
    except Exception as e:
        print(f"Error with Strands Agent: {e}")
        # Return a basic structure with extracted title at minimum
        return JobDescription(
            job_title=extract_basic_title(jd_text),
            job_summary="Failed to analyze - please check Strands Agent configuration"
        )

def extract_basic_title(jd_text: str) -> str:
    """Extract job title as fallback"""
    lines = jd_text.strip().split('\n')
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if line and not line.lower().startswith(('apply', 'remote', 'location', 'time', 'posted')):
            return line
    return "Job Title Not Found"

def get_next_jd_filename() -> str:
    """Get the next available JD filename with incrementing number"""
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Find the highest existing JD number
    existing_files = list(data_dir.glob("jd_*.json"))
    if not existing_files:
        return "data/jd_001.json"
    
    # Extract numbers from existing files and find the maximum
    numbers = []
    for file in existing_files:
        try:
            # Extract number from filename like "jd_001.json"
            num_str = file.stem.split('_')[1]  # Get "001" from "jd_001"
            numbers.append(int(num_str))
        except (IndexError, ValueError):
            continue
    
    next_num = max(numbers) + 1 if numbers else 1
    return f"data/jd_{next_num:03d}.json"

def save_jd_analysis(jd_text: str, analysis: JobDescription) -> str:
    """Save JD analysis to an incrementing JSON file"""
    try:
        filename = get_next_jd_filename()
        
        # Create the data structure to save
        jd_data = {
            "timestamp": datetime.now().isoformat(),
            "original_jd_text": jd_text,
            "analysis": analysis.model_dump(),
            "metadata": {
                "job_title": analysis.job_title,
                "company": analysis.company_name,
                "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jd_data, f, indent=2, ensure_ascii=False)
        
        print(f"JD analysis saved to: {filename}")
        return filename
        
    except Exception as e:
        print(f"Error saving JD analysis: {e}")
        return ""


