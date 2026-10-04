import os
import json
import uuid
import httpx
import asyncio
import logging
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException
from app.common.config import settings

from app.common.database import SessionLocal
from app.models.storage import StorageProvider

logger = logging.getLogger(__name__)

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
except ImportError:
    Credentials = None
    Request = None

class GoogleDriveService:
    def __init__(self):
        self.credentials = None
        self.folder_id = None
        self._folder_cache = {}
        
    def is_configured(self) -> bool:
        """Returns True if Google Drive credentials are ready."""
        return self._load_credentials_from_db()

    def _load_credentials_from_db(self):
        db = SessionLocal()
        try:
            provider = db.query(StorageProvider).filter(
                StorageProvider.provider_type.in_(["GOOGLE_DRIVE", "GDRIVE", "google_drive", "gdrive"])
            ).first()
            
            creds = (provider.credentials or {}) if provider else {}
            config = (provider.configuration or {}) if provider else {}
            
            client_id = creds.get("client_id") or os.getenv("GDRIVE_CLIENT_ID")
            client_secret = creds.get("client_secret") or os.getenv("GDRIVE_CLIENT_SECRET")
            refresh_token = creds.get("refresh_token") or os.getenv("GDRIVE_REFRESH_TOKEN")
            access_token = creds.get("access_token") or os.getenv("GDRIVE_ACCESS_TOKEN")
            
            # Use configured folder_id or default to 'root'
            raw_folder = config.get("folder_id") or os.getenv("GDRIVE_FOLDER_ID")
            self.folder_id = raw_folder.strip() if (raw_folder and raw_folder.strip()) else "root"
            
            if not client_id or not client_secret or not refresh_token:
                return False
                
            self.credentials = Credentials(
                token=access_token,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=["https://www.googleapis.com/auth/drive"]
            )
            return True
        except Exception as e:
            print(f"Warning: Failed to load Google Drive credentials from DB: {e}")
            return False
        finally:
            db.close()

    async def _get_valid_token(self, force_refresh: bool = False) -> str:
        if not self.credentials or force_refresh:
            self._load_credentials_from_db()
            
        if not self.credentials:
            raise HTTPException(status_code=500, detail="Google Drive credentials not configured in database")
        
        if not self.credentials.valid or force_refresh:
            request = Request()
            try:
                await asyncio.wait_for(asyncio.to_thread(self.credentials.refresh, request), timeout=10.0)
            except Exception as ref_err:
                logger.error(f"Failed to refresh Google Drive token: {ref_err}")
                raise HTTPException(status_code=500, detail=f"Google Drive token refresh failed: {ref_err}")
                
            # Update token back to DB if provider exists
            try:
                db = SessionLocal()
                provider = db.query(StorageProvider).filter(
                    StorageProvider.provider_type.in_(["GOOGLE_DRIVE", "GDRIVE", "google_drive", "gdrive"])
                ).first()
                if provider and provider.credentials:
                    creds = dict(provider.credentials)
                    creds["access_token"] = self.credentials.token
                    provider.credentials = creds
                    db.commit()
                db.close()
            except Exception:
                pass
        return self.credentials.token

    async def _request_with_retry(self, client: httpx.AsyncClient, method: str, url: str, **kwargs) -> httpx.Response:
        token = await self._get_valid_token()
        headers = dict(kwargs.pop("headers", {}))
        headers["Authorization"] = f"Bearer {token}"

        res = await client.request(method, url, headers=headers, **kwargs)
        if res.status_code == 401:
            token = await self._get_valid_token(force_refresh=True)
            headers["Authorization"] = f"Bearer {token}"
            res = await client.request(method, url, headers=headers, **kwargs)
        return res

    async def _get_or_create_folder(self, folder_name: str, parent_id: str) -> str:
        pid = parent_id.strip() if parent_id and parent_id.strip() else "root"
        cache_key = f"{pid}/{folder_name}"
        if cache_key in self._folder_cache:
            return self._folder_cache[cache_key]

        async with httpx.AsyncClient(timeout=15.0) as client:
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and '{pid}' in parents and trashed=false"
            search_res = await self._request_with_retry(
                client, "GET",
                f"https://www.googleapis.com/drive/v3/files?q={query}&fields=files(id)&supportsAllDrives=true"
            )
            search_res.raise_for_status()
            files = search_res.json().get("files", [])
            
            if files:
                folder_id = files[0]["id"]
                self._folder_cache[cache_key] = folder_id
                return folder_id
                
            metadata = {
                "name": folder_name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [pid]
            }
            create_res = await self._request_with_retry(
                client, "POST",
                "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
                json=metadata
            )
            create_res.raise_for_status()
            folder_id = create_res.json()["id"]
            self._folder_cache[cache_key] = folder_id
            return folder_id

    async def ensure_folder_path(self, path: str) -> str:
        """
        Creates a nested folder structure like 'Destinations/Phnom Penh' inside the root folder.
        Returns the ID of the deepest folder.
        """
        if not path or not path.strip():
            return self.folder_id or "root"

        clean_path = path.strip().strip("/")
        if clean_path in self._folder_cache:
            return self._folder_cache[clean_path]

        current_parent = self.folder_id or "root"
        parts = [p.strip() for p in clean_path.split('/') if p.strip()]
        for part in parts:
            current_parent = await self._get_or_create_folder(part, current_parent)
            
        self._folder_cache[clean_path] = current_parent
        return current_parent

    async def upload_file(self, file_name: str, file_content: bytes, mime_type: str, folder_path: Optional[str] = None) -> Dict[str, Any]:
        """Uploads a file directly to Google Drive, optionally inside a specific folder path."""
        self._load_credentials_from_db()
        metadata = {
            "name": f"{uuid.uuid4().hex[:8]}_{file_name}",
            "mimeType": mime_type
        }
        if folder_path:
            target_folder_id = await self.ensure_folder_path(folder_path)
            metadata["parents"] = [target_folder_id]
        elif self.folder_id and self.folder_id != "root":
            metadata["parents"] = [self.folder_id]

        async with httpx.AsyncClient(timeout=20.0) as client:
            # 1. Get resumable upload URL
            init_res = await self._request_with_retry(
                client,
                "POST",
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
                headers={
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": mime_type
                },
                json=metadata
            )
            init_res.raise_for_status()
            upload_url = init_res.headers["Location"]

            # 2. Upload file content
            upload_res = await client.put(
                upload_url,
                headers={"Content-Length": str(len(file_content))},
                content=file_content
            )
            upload_res.raise_for_status()
            
            data = upload_res.json()
            file_id = data.get("id")
            
            # Make public if possible
            try:
                await self._request_with_retry(
                    client,
                    "POST",
                    f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions",
                    json={"type": "anyone", "role": "reader"}
                )
            except Exception:
                pass
                
            return {
                "file_id": file_id,
                "url": f"/api/v1/admin/storage/{file_id}",
                "name": metadata["name"]
            }

    async def stream_file(self, file_id: str) -> Tuple[Any, str]:
        """Stream file content from Google Drive"""
        client = httpx.AsyncClient(timeout=45.0)
        
        meta_res = await self._request_with_retry(
            client,
            "GET",
            f"https://www.googleapis.com/drive/v3/files/{file_id}?fields=mimeType,name&supportsAllDrives=true"
        )
        if meta_res.status_code != 200:
            await client.aclose()
            raise HTTPException(status_code=404, detail="File not found")
            
        meta = meta_res.json()
        mime_type = meta.get("mimeType", "application/octet-stream")
        
        download_res = await self._request_with_retry(
            client,
            "GET",
            f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media&supportsAllDrives=true"
        )
        await client.aclose()
        
        if download_res.status_code != 200:
            raise HTTPException(status_code=502, detail="Download failed")
            
        async def _generator():
            yield download_res.content
            
        return _generator(), mime_type

    async def list_files(self) -> list:
        """List files from the configured Google Drive folder."""
        self._load_credentials_from_db()
        query = "trashed=false"
        if self.folder_id:
            query += f" and '{self.folder_id}' in parents"
            
        async with httpx.AsyncClient() as client:
            res = await self._request_with_retry(
                client,
                "GET",
                f"https://www.googleapis.com/drive/v3/files?q={query}&fields=files(id,name,mimeType,createdTime,size,thumbnailLink)&supportsAllDrives=true"
            )
            res.raise_for_status()
            return res.json().get("files", [])

    async def delete_file(self, file_id: str) -> bool:
        """Delete a file from Google Drive."""
        async with httpx.AsyncClient() as client:
            res = await self._request_with_retry(
                client,
                "DELETE",
                f"https://www.googleapis.com/drive/v3/files/{file_id}?supportsAllDrives=true"
            )
            return res.status_code == 204

    async def upload_file_from_url(self, file_url: str, folder_path: Optional[str] = None) -> Optional[str]:
        """Downloads a file from a URL and uploads it to Google Drive. Returns the local GDrive API URL."""
        if not file_url or not file_url.startswith("http"):
            return file_url
            
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                # Disguise as a standard browser to avoid hotlinking protection
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
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
                    
                upload_res = await self.upload_file(filename, res.content, content_type, folder_path)
                return upload_res.get("url")
            except Exception as e:
                print(f"Failed to upload image from URL {file_url}: {e}")
                return None

storage_service = GoogleDriveService()
