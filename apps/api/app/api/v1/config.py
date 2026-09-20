from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.models.config import NavigationItem, HomepageSection, FeatureFlag
from app.schemas.config import (
    NavigationItemOut,
    HomepageSectionOut,
    FeatureFlagOut,
    SiteConfigResponse,
)

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/navigation", response_model=List[NavigationItemOut])
def get_navigation_items(db: Session = Depends(get_db)):
    return (
        db.query(NavigationItem)
        .filter(NavigationItem.enabled == True)
        .order_by(NavigationItem.position)
        .all()
    )

@router.get("/homepage-sections", response_model=List[HomepageSectionOut])
def get_homepage_sections(db: Session = Depends(get_db)):
    return (
        db.query(HomepageSection)
        .filter(HomepageSection.enabled == True)
        .order_by(HomepageSection.position)
        .all()
    )

@router.get("/feature-flags", response_model=List[FeatureFlagOut])
def get_feature_flags(db: Session = Depends(get_db)):
    return db.query(FeatureFlag).all()

@router.get("/site-config", response_model=SiteConfigResponse)
def get_full_site_config(db: Session = Depends(get_db)):
    navs = (
        db.query(NavigationItem)
        .filter(NavigationItem.enabled == True)
        .order_by(NavigationItem.position)
        .all()
    )
    sections = (
        db.query(HomepageSection)
        .filter(HomepageSection.enabled == True)
        .order_by(HomepageSection.position)
        .all()
    )
    flags = db.query(FeatureFlag).all()
    flags_dict = {f.name: f.enabled for f in flags}
    return SiteConfigResponse(
        navigation=navs,
        homepage_sections=sections,
        feature_flags=flags_dict,
    )
