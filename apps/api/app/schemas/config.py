from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class NavigationItemOut(BaseModel):
    id: str
    label: str
    label_key: str
    route: str
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    position: int
    enabled: bool
    visibility: str
    language: str
    required_permission: Optional[str] = None

    class Config:
        from_attributes = True

class HomepageSectionOut(BaseModel):
    id: str
    section_type: str
    title: str
    title_key: Optional[str] = None
    position: int
    layout: str
    query_config: str
    max_items: int
    enabled: bool
    device_visibility: str

    class Config:
        from_attributes = True

class FeatureFlagOut(BaseModel):
    id: str
    name: str
    enabled: bool
    environment: str
    rollout_percentage: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SiteConfigResponse(BaseModel):
    navigation: List[NavigationItemOut]
    homepage_sections: List[HomepageSectionOut]
    feature_flags: Dict[str, bool]
