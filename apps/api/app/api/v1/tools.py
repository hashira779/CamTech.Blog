import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
import httpx
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.common.ssrf import validate_url_safe
from app.services.tool_service import ToolService
from app.schemas.tool import ToolOut, ToolExecuteRequest, ToolExecuteResponse
from app.models.tool import Tool

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.get("", response_model=List[ToolOut])
def list_tools(category: Optional[str] = Query(None), db: Session = Depends(get_db)):
    tools = ToolService.get_tools(db, category)
    return tools

@router.get("/download-stream")
async def download_media_stream(
    url: str = Query(..., description="Target media stream URL"),
    filename: Optional[str] = Query("download.mp4", description="Output filename for user download"),
    format: Optional[str] = Query("mp4", description="Format extension"),
):
    """
    Stream video/audio file with Content-Disposition attachment so the browser saves it directly.
    Guarded by SSRF security validation.
    """
    is_safe, reason = validate_url_safe(url)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Disallowed URL: {reason}")

    clean_filename = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', filename or "media_download")
    ext = (format or "mp4").lower().strip(".")
    if not clean_filename.lower().endswith(f".{ext}"):
        clean_filename += f".{ext}"

    mime_type = "audio/mpeg" if ext == "mp3" else "video/mp4"

    async def stream_generator():
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "*/*",
        }
        async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
            async with client.stream("GET", url, headers=headers) as resp:
                if resp.status_code >= 400:
                    yield b""
                    return
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk

    return StreamingResponse(
        stream_generator(),
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"',
            "Cache-Control": "public, max-age=3600",
        }
    )

@router.get("/{slug}", response_model=ToolOut)
def get_tool(slug: str, db: Session = Depends(get_db)):
    tool = ToolService.get_tool_by_slug(db, slug)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    ToolService.record_tool_usage(db, slug)
    return tool

@router.post("/execute", response_model=ToolExecuteResponse)
def execute_tool(req: ToolExecuteRequest, db: Session = Depends(get_db)):
    ToolService.record_tool_usage(db, req.tool_slug)
    result = ToolService.execute_tool(req.tool_slug, req.action, req.parameters)
    if "error" in result:
        return ToolExecuteResponse(success=False, result=None, error=result["error"])
    return ToolExecuteResponse(success=True, result=result)
