import os
import uuid
import boto3
from botocore.client import Config
import asyncio
import httpx
from typing import Optional

from app.common.database import SessionLocal
from app.models.storage import StorageProvider

class S3Service:
    def _get_client_and_config(self):
        db = SessionLocal()
        try:
            # Prefer CLOUDFLARE_R2 first, then AWS_S3
            provider = db.query(StorageProvider).filter(
                StorageProvider.provider_type.in_(["CLOUDFLARE_R2", "AWS_S3"])
            ).first()
            
            if not provider:
                return None, None
                
            creds = provider.credentials or {}
            config = provider.configuration or {}
            
            endpoint_url = config.get("endpoint")
            access_key = creds.get("access_key_id")
            secret_key = creds.get("secret_access_key")
            bucket = config.get("bucket_name")
            public_domain = config.get("public_domain")
            
            if not access_key or not secret_key or not bucket:
                return None, None
                
            s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                config=Config(signature_version='s3v4')
            )
            return s3_client, {
                "bucket": bucket,
                "public_domain": public_domain,
                "endpoint_url": endpoint_url
            }
        except Exception as e:
            print(f"Failed to load S3/R2 credentials from DB: {e}")
            return None, None
        finally:
            db.close()

    def _upload_sync(self, file_content: bytes, object_name: str, mime_type: str) -> str:
        s3_client, config = self._get_client_and_config()
        if not s3_client:
            raise ValueError("S3 not configured (missing in database)")
        
        s3_client.put_object(
            Bucket=config["bucket"],
            Key=object_name,
            Body=file_content,
            ContentType=mime_type
        )
        
        public_url = config.get("public_domain")
        if public_url:
            return f"{public_url.rstrip('/')}/{object_name}"
        else:
            ep = config.get("endpoint_url")
            return f"{ep.rstrip('/')}/{config['bucket']}/{object_name}"

    async def upload_file(self, file_name: str, file_content: bytes, mime_type: str, folder_path: str = "") -> str:
        s3_client, _ = self._get_client_and_config()
        if not s3_client:
            return ""
        object_name = f"{folder_path}/{uuid.uuid4().hex[:8]}_{file_name}".strip("/")
        return await asyncio.to_thread(self._upload_sync, file_content, object_name, mime_type)

    async def upload_file_from_url(self, file_url: str, folder_path: str = "") -> Optional[str]:
        s3_client, _ = self._get_client_and_config()
        if not file_url or not file_url.startswith("http") or not s3_client:
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
