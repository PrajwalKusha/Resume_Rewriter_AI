# 🎯 ResumeForge - AI-Powered Resume Rewriter Platform

> **Transform your resume for every job opportunity with AI-powered analysis and optimization**

ResumeForge is a full-stack AI resume rewriting platform that analyzes job descriptions and creates perfectly tailored resumes using advanced AI agents and LaTeX typesetting.

## ✨ Features

### 🔍 **Job Description Analysis**
- **AI-Powered JD Analysis**: Uses AWS Strands + Claude 3.5 Sonnet to extract comprehensive job details
- **Skills Extraction**: Automatically identifies required vs preferred technical skills
- **Salary & Benefits Parsing**: Extracts compensation ranges and benefit packages
- **Smart Categorization**: Organizes responsibilities, requirements, and company culture

### 📄 **Resume Management**  
- **Multi-Format Upload**: Support for PDF, DOCX, and TXT resume files
- **AI Resume Analysis**: Comprehensive extraction of experience, skills, and achievements
- **S3 Storage**: Secure cloud storage with user-specific folders
- **Preview & Download**: In-browser PDF preview and download functionality

### 🎨 **Modern UI/UX**
- **Dashboard**: Clean job management interface with search and filtering
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Analysis**: Live feedback during job and resume analysis
- **Lazy Loading**: Optimized performance with smart resource loading

## 🏗️ Architecture

### **Backend (FastAPI + Python)**
```
backend/
├── agent_jd_strands.py          # Job description analysis agent
├── agent_resume_strands.py      # Resume analysis agent
├── main_job_workflow.py         # Main API server
├── models/
│   └── dynamodb_models.py       # Database models
├── services/
│   ├── database_service.py      # Database operations
│   └── s3_service.py           # File storage operations
└── data/                       # AI analysis backups (JSON)
```

### **Frontend (Next.js + React)**
```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard (jobs view)
│   │   ├── add-job/           # Job creation page
│   │   ├── job/[id]/          # Job details page
│   │   └── resumes/           # Resume management page
│   ├── components/            # Reusable UI components
│   │   ├── resumes/          # Resume-specific components
│   │   └── ui/               # Shadcn UI components
│   └── services/             # API integration services
└── public/                   # Static assets
```

### **Database Schema (DynamoDB)**
- `resume-users` - User accounts and profiles
- `resume-jobs` - Job postings and AI analysis
- `resume-base-resumes` - Uploaded resume files and metadata
- `resume-generated-resumes` - AI-generated resume versions
- `resume-analysis` - Detailed analysis results

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** 18+ and npm
- **Python** 3.9+ with pip
- **AWS Account** with configured credentials
- **AWS Bedrock** access for Claude 3.5 Sonnet

### **AWS Setup**
1. **Configure AWS CLI:**
   ```bash
   aws configure
   # Enter your Access Key, Secret Key, and Region (us-east-1)
   ```

2. **Enable AWS Bedrock Models:**
   - Go to AWS Bedrock Console
   - Navigate to "Model access"
   - Enable "Claude 3.5 Sonnet v2" model

3. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://resume-resumes --region us-east-1
   ```

### **Backend Setup**
1. **Clone and setup Python environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Install required packages:**
   ```bash
   pip install fastapi uvicorn strands pynamodb boto3 python-multipart
   pip install PyPDF2 python-docx python-dotenv
   ```

3. **Start the backend server:**
   ```bash
   uvicorn main_job_workflow:app --host 0.0.0.0 --port 8000 --reload
   ```

### **Frontend Setup**
1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

### **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 Current Workflow

### **Job-First Workflow**
1. **Add Job**: Paste job description → AI analyzes and extracts details
2. **Upload Resume**: Upload your current resume → AI analyzes content
3. **View Analysis**: Review extracted job requirements and resume content
4. **Generate Resume**: *(Coming Soon)* AI creates tailored resume

### **Resume Management**
- **Uploaded Resumes**: View and manage your original resume files
- **AI Generated Resumes**: *(Coming Soon)* Collection of tailored resumes
- **Preview & Download**: In-browser PDF viewing and download options

## 🛠️ Technology Stack

### **AI & Machine Learning**
- **AWS Strands**: Agentic framework for structured AI outputs
- **Claude 3.5 Sonnet v2**: Advanced language model via AWS Bedrock
- **Pydantic**: Data validation and structured output parsing

### **Backend**
- **FastAPI**: High-performance Python web framework
- **PynamoDB**: DynamoDB ORM for Python
- **Boto3**: AWS SDK for Python
- **PyPDF2 & python-docx**: Document parsing libraries

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern React component library
- **Lucide Icons**: Beautiful icon library

### **Infrastructure**
- **AWS DynamoDB**: NoSQL database for scalable data storage
- **AWS S3**: Object storage for resume files
- **AWS Bedrock**: Managed AI service for Claude access

## 📊 API Endpoints

### **User Management**
- `GET /api/users/{user_id}` - Get user profile
- `GET /api/users/{user_id}/dashboard` - Get dashboard data

### **Job Management**
- `POST /api/jobs` - Create and analyze new job
- `GET /api/users/{user_id}/jobs` - Get user's jobs
- `GET /api/jobs/{job_id}` - Get job details
- `DELETE /api/jobs/{job_id}` - Soft delete job

### **Resume Management**
- `POST /api/users/{user_id}/resumes/upload` - Upload resume file
- `GET /api/users/{user_id}/resumes/uploaded` - Get uploaded resumes
- `GET /api/resumes/{resume_id}/preview` - Get resume preview URL
- `GET /api/resumes/{resume_id}/download` - Get download URL

## 🔮 Upcoming Features

### **🎨 LaTeX Resume Generator** *(Next Sprint)*
- **Professional Templates**: Multiple LaTeX resume styles (Modern, Professional, Academic)
- **AI-Powered Rewriting**: Claude generates optimized resume content
- **PDF Compilation**: Server-side LaTeX → PDF generation
- **ATS Optimization**: Ensure resumes pass Applicant Tracking Systems

### **🤖 Advanced AI Features**
- **Resume-Job Matching**: AI compatibility scoring
- **Gap Analysis**: Identify missing skills and experience
- **Content Optimization**: AI suggestions for better phrasing
- **Multi-Version Management**: Track different resume versions

### **🎯 Enhanced User Experience**
- **Wizard Flow**: Step-by-step resume generation process
- **Real-time Collaboration**: Share and get feedback on resumes
- **Analytics Dashboard**: Track application success rates
- **Integration APIs**: Connect with job boards and ATS systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS Strands** for the powerful agentic framework
- **Anthropic Claude** for advanced language understanding
- **Shadcn/ui** for beautiful React components
- **Next.js** team for the excellent framework

## 📧 Contact

**Project Maintainer**: Prajwal Kusha  
**Email**: [p.kusha@gwu.edu]  
**LinkedIn**: [[your-linkedin-profile](https://www.linkedin.com/in/prajwal-kusha/)]

---

⭐ **Star this repo if you find it helpful!** ⭐
