"""
S3 Service for handling resume file uploads and management
"""

import boto3
import uuid
import os
from datetime import datetime
from typing import Optional, Tuple
from botocore.exceptions import ClientError, NoCredentialsError
import mimetypes

class S3Service:
    def __init__(self):
        self.bucket_name = "resume-resumes"
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        
        try:
            self.s3_client = boto3.client(
                's3',
                region_name=self.region
            )
            # Test connection
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ S3 connection successful. Bucket: {self.bucket_name}")
        except NoCredentialsError:
            print("❌ AWS credentials not found. Please configure AWS credentials.")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"❌ S3 bucket '{self.bucket_name}' not found.")
            else:
                print(f"❌ S3 connection failed: {e}")
            self.s3_client = None
        except Exception as e:
            print(f"❌ Unexpected S3 error: {e}")
            self.s3_client = None

    def generate_user_folder_name(self, first_name: str, last_name: str, user_id: str) -> str:
        """
        Generate user folder name in format: first_last_userid
        Example: john_doe_123abc
        """
        # Clean and format names
        first = first_name.lower().strip().replace(' ', '_') if first_name else 'user'
        last = last_name.lower().strip().replace(' ', '_') if last_name else 'unknown'
        
        # Use first 8 characters of user_id for uniqueness
        user_suffix = user_id[:8] if user_id else str(uuid.uuid4())[:8]
        
        return f"{first}_{last}_{user_suffix}"

    def generate_file_key(self, user_folder: str, original_filename: str, file_type: str) -> str:
        """
        Generate S3 key for the file
        Format: user_folder/resumes/timestamp_original_filename
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_extension = self.get_file_extension(original_filename, file_type)
        
        # Clean filename
        clean_filename = original_filename.replace(' ', '_').replace('(', '').replace(')', '')
        
        return f"{user_folder}/resumes/{timestamp}_{clean_filename}{file_extension}"

    def get_file_extension(self, filename: str, file_type: str) -> str:
        """Get appropriate file extension"""
        if '.' in filename:
            return ''  # Filename already has extension
        
        extension_map = {
            'pdf': '.pdf',
            'docx': '.docx',
            'doc': '.doc',
            'txt': '.txt'
        }
        return extension_map.get(file_type.lower(), '.txt')

    def get_content_type(self, filename: str, file_type: str) -> str:
        """Get MIME type for the file"""
        content_type, _ = mimetypes.guess_type(filename)
        
        if content_type:
            return content_type
        
        # Fallback based on file_type
        type_map = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'txt': 'text/plain'
        }
        return type_map.get(file_type.lower(), 'application/octet-stream')

    def upload_resume(
        self, 
        file_content: bytes, 
        original_filename: str, 
        file_type: str,
        user_id: str,
        first_name: str,
        last_name: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Upload resume to S3
        Returns: (success, s3_url, error_message)
        """
        if not self.s3_client:
            return False, None, "S3 service not available"

        try:
            # Generate user folder and file key
            user_folder = self.generate_user_folder_name(first_name, last_name, user_id)
            file_key = self.generate_file_key(user_folder, original_filename, file_type)
            
            # Get content type
            content_type = self.get_content_type(original_filename, file_type)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'user_id': user_id,
                    'original_filename': original_filename,
                    'file_type': file_type,
                    'upload_timestamp': datetime.utcnow().isoformat()
                }
            )
            
            # Generate S3 URL
            s3_url = f"s3://{self.bucket_name}/{file_key}"
            
            print(f"✅ Resume uploaded successfully: {s3_url}")
            return True, s3_url, None
            
        except ClientError as e:
            error_msg = f"S3 upload failed: {e.response['Error']['Message']}"
            print(f"❌ {error_msg}")
            return False, None, error_msg
        except Exception as e:
            error_msg = f"Unexpected upload error: {str(e)}"
            print(f"❌ {error_msg}")
            return False, None, error_msg

    def delete_resume(self, s3_url: str) -> Tuple[bool, Optional[str]]:
        """
        Delete resume from S3
        Returns: (success, error_message)
        """
        if not self.s3_client:
            return False, "S3 service not available"

        try:
            # Extract key from S3 URL
            if not s3_url.startswith(f"s3://{self.bucket_name}/"):
                return False, "Invalid S3 URL format"
            
            file_key = s3_url.replace(f"s3://{self.bucket_name}/", "")
            
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            
            print(f"✅ Resume deleted successfully: {s3_url}")
            return True, None
            
        except ClientError as e:
            error_msg = f"S3 delete failed: {e.response['Error']['Message']}"
            print(f"❌ {error_msg}")
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected delete error: {str(e)}"
            print(f"❌ {error_msg}")
            return False, error_msg

    def generate_presigned_download_url(self, s3_url: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate presigned URL for downloading resume
        Returns: presigned_url or None
        """
        if not self.s3_client:
            return None

        try:
            # Extract key from S3 URL
            if not s3_url.startswith(f"s3://{self.bucket_name}/"):
                return None
            
            file_key = s3_url.replace(f"s3://{self.bucket_name}/", "")
            
            # Generate presigned URL
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            
            return presigned_url
            
        except ClientError as e:
            print(f"❌ Failed to generate presigned URL: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected presigned URL error: {e}")
            return None

    def list_user_resumes(self, user_folder: str) -> list:
        """
        List all resumes for a user
        Returns: list of file keys
        """
        if not self.s3_client:
            return []

        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{user_folder}/resumes/"
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append(obj['Key'])
            
            return files
            
        except ClientError as e:
            print(f"❌ Failed to list user resumes: {e}")
            return []
        except Exception as e:
            print(f"❌ Unexpected list error: {e}")
            return []

# Global S3 service instance
s3_service = S3Service()
