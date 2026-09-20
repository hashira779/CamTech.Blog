from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ToolBase(BaseModel):
    slug: str
    name: str
    name_km: Optional[str] = None
    category: str
    description: str
    description_km: Optional[str] = None
    icon: Optional[str] = "Calculator"
    is_active: Optional[bool] = True
    is_popular: Optional[bool] = False

class ToolOut(ToolBase):
    id: str
    usage_count: int
    version: str

    class Config:
        from_attributes = True

class ToolExecuteRequest(BaseModel):
    tool_slug: str
    action: str
    parameters: Dict[str, Any] = {}

class ToolExecuteResponse(BaseModel):
    success: bool
    result: Any
    error: Optional[str] = None
