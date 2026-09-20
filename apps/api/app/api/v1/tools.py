from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.tool_service import ToolService
from app.schemas.tool import ToolOut, ToolExecuteRequest, ToolExecuteResponse
from app.models.tool import Tool

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.get("", response_model=List[ToolOut])
def list_tools(category: Optional[str] = Query(None), db: Session = Depends(get_db)):
    tools = ToolService.get_tools(db, category)
    return tools

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
