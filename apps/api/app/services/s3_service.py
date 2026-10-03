import os
import uuid
import boto3
from botocore.client import Config
import asyncio
import httpx
from typing import Optional

class S3Service:
    def __init__(self):
        self.endpoint_url = os.getenv("S3_ENDPOINT_URL")
        self.access_key = os.getenv("S3_ACCESS_KEY")
        self.secret_key = os.getenv("S3_SECRET_KEY")
        self.bucket = os.getenv("S3_BUCKET", "dailydiscovery-media")
        
        if self.endpoint_url and self.access_key and self.secret_key:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version='s3v4')
            )
        else:
            self.s3_client = None

    def _upload_sync(self, file_content: bytes, object_name: str, mime_type: str) -> str:
        if not self.s3_client:
            raise ValueError("S3 not configured (missing env vars)")
        
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=object_name,
            Body=file_content,
            ContentType=mime_type
        )
        
        public_url = os.getenv("S3_PUBLIC_URL")
        if public_url:
            return f"{public_url.rstrip('/')}/{object_name}"
        else:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{object_name}"

    async def upload_file(self, file_name: str, file_content: bytes, mime_type: str, folder_path: str = "") -> str:
        if not self.s3_client:
            return ""
        object_name = f"{folder_path}/{uuid.uuid4().hex[:8]}_{file_name}".strip("/")
        return await asyncio.to_thread(self._upload_sync, file_content, object_name, mime_type)

    async def upload_file_from_url(self, file_url: str, folder_path: str = "") -> Optional[str]:
        if not file_url or not file_url.startswith("http") or not self.s3_client:
            return file_url
            
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept": "image/*,*/*;q=0.8"
                }
                res = await client.get(file_url, headers=headers)
                if res.status_code != 200:
                    return None
                    
                content_type = res.headers.get("Content-Type", "image/jpeg")
                import urllib.parse
                parsed = urllib.parse.urlparse(file_url)
                filename = os.path.basename(parsed.path)
                if not filename or '.' not in filename:
                    ext = ".png" if "png" in content_type else ".jpg"
                    filename = f"image{ext}"
                    
                return await self.upload_file(filename, res.content, content_type, folder_path)
            except Exception as e:
                print(f"Failed to upload image from URL to S3 {file_url}: {e}")
                return None

s3_service = S3Service()
