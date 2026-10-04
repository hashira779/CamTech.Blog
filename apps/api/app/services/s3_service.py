import os
import uuid
import asyncio
import httpx
from typing import Optional

try:
    import boto3
    from botocore.client import Config
except ImportError:
    boto3 = None
    Config = None

from app.common.database import SessionLocal
from app.models.storage import StorageProvider

class S3Service:
    def is_configured(self) -> bool:
        """Check if S3 or Cloudflare R2 is configured and reachable."""
        client, config = self._get_client_and_config()
        return bool(client and config)

    def _get_client_and_config(self):
        db = SessionLocal()
        try:
            # 1. Check database for configured provider
            provider = db.query(StorageProvider).filter(
                StorageProvider.provider_type.in_([
                    "CLOUDFLARE_R2", "AWS_S3", "R2", "S3", "MINIO",
                    "cloudflare_r2", "r2", "minio"
                ])
            ).first()
            
            creds = (provider.credentials or {}) if provider else {}
            config = (provider.configuration or {}) if provider else {}
            
            endpoint_url = (
                config.get("endpoint") or
                os.getenv("R2_ENDPOINT") or
                os.getenv("S3_ENDPOINT_URL") or
                os.getenv("STORAGE_ENDPOINT")
            )
            access_key = (
                creds.get("access_key_id") or
                os.getenv("R2_ACCESS_KEY_ID") or
                os.getenv("S3_ACCESS_KEY") or
                os.getenv("STORAGE_ACCESS_KEY")
            )
            secret_key = (
                creds.get("secret_access_key") or
                os.getenv("R2_SECRET_ACCESS_KEY") or
                os.getenv("S3_SECRET_KEY") or
                os.getenv("STORAGE_SECRET_KEY")
            )
            bucket = (
                config.get("bucket_name") or
                os.getenv("R2_BUCKET_NAME") or
                os.getenv("S3_BUCKET") or
                os.getenv("STORAGE_BUCKET")
            )
            public_domain = (
                config.get("public_domain") or
                os.getenv("R2_PUBLIC_DOMAIN") or
                os.getenv("S3_PUBLIC_URL")
            )
            
            if not access_key or not secret_key or not bucket:
                return None, None

            # Clean and normalize public_domain
            if public_domain:
                public_domain = public_domain.strip().rstrip('/')
                if not public_domain.startswith("http://") and not public_domain.startswith("https://"):
                    public_domain = f"https://{public_domain}"

            # Auto region for Cloudflare R2
            is_r2 = bool(endpoint_url and "r2.cloudflarestorage.com" in endpoint_url.lower())
            region = "auto" if is_r2 else config.get("region", "us-east-1")
                
            s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
                config=Config(signature_version='s3v4')
            )
            return s3_client, {
                "bucket": bucket,
                "public_domain": public_domain,
                "endpoint_url": endpoint_url
            }
        except Exception as e:
            print(f"Failed to load S3/R2 credentials: {e}")
            return None, None
        finally:
            db.close()

    def _upload_sync(self, file_content: bytes, object_name: str, mime_type: str) -> str:
        s3_client, config = self._get_client_and_config()
        if not s3_client:
            raise ValueError("S3/R2 not configured")
        
        s3_client.put_object(
            Bucket=config["bucket"],
            Key=object_name,
            Body=file_content,
            ContentType=mime_type
        )
        
        public_url = config.get("public_domain")
        if public_url:
            return f"{public_url}/{object_name}"
        else:
            ep = config.get("endpoint_url", "").rstrip('/')
            return f"{ep}/{config['bucket']}/{object_name}"

    async def upload_file(self, file_name: str, file_content: bytes, mime_type: str, folder_path: str = "") -> str:
        s3_client, _ = self._get_client_and_config()
        if not s3_client:
            return ""
        object_name = f"{folder_path}/{uuid.uuid4().hex[:8]}_{file_name}".strip("/")
        return await asyncio.to_thread(self._upload_sync, file_content, object_name, mime_type)

    async def upload_file_from_url(self, file_url: str, folder_path: str = "") -> Optional[str]:
        s3_client, _ = self._get_client_and_config()
        if not file_url or not file_url.startswith("http") or not s3_client:
            return None
            
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                headers = {
                    "User-Agent": "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1",
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
                print(f"Failed to upload image from URL to S3/R2 {file_url}: {e}")
                return None

s3_service = S3Service()
