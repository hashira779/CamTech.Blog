from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.common.database import get_db
from app.models.storage import StorageProvider, StoragePolicy
from app.models.user import User
from app.services.auth_service import require_infra_admin

router = APIRouter(prefix="/admin/storage-config", tags=["Admin Storage Config"])


def _public(provider: StorageProvider) -> Dict[str, Any]:
    """A provider row with the secret half folded away.

    `credentials` is a JSON column holding live S3 / Drive keys. The screen only needs to see
    which keys are set, so every value comes back masked to its last four characters - the same
    convention the AI provider list uses. Handing the raw ORM object out meant any newsroom role
    could read the storage keys straight back out of the API.
    """
    data = {
        column.name: getattr(provider, column.name)
        for column in provider.__table__.columns
        if column.name != "credentials"
    }
    credentials = provider.credentials or {}
    data["credentials"] = {
        key: (f"••••{str(value)[-4:]}" if value else "") for key, value in credentials.items()
    }
    data["credentials_configured"] = bool(credentials)
    return data

class ProviderCreateRequest(BaseModel):
    name: str
    provider_type: str
    is_default: bool = False
    configuration: Dict[str, Any] = {}
    credentials: Dict[str, Any] = {}

class PolicyCreateRequest(BaseModel):
    entity_type: str
    provider_id: str

@router.get("/providers")
def get_providers(db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    providers = db.query(StorageProvider).all()
    return {"items": [_public(p) for p in providers]}

@router.post("/providers")
def create_provider(req: ProviderCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    provider = StorageProvider(
        name=req.name,
        provider_type=req.provider_type,
        is_default=req.is_default,
        configuration=req.configuration,
        credentials=req.credentials
    )
    if req.is_default:
        db.query(StorageProvider).update({StorageProvider.is_default: False})
        
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return _public(provider)

@router.put("/providers/{provider_id}")
def update_provider(provider_id: str, req: ProviderCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    provider = db.query(StorageProvider).filter(StorageProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    provider.name = req.name
    provider.provider_type = req.provider_type
    provider.is_default = req.is_default
    provider.configuration = req.configuration
    # Reads come back masked, so a save that round-trips the form sends `••••wxyz` in place of
    # the real key. Treat a masked value as "unchanged" instead of writing it over the secret.
    stored = dict(provider.credentials or {})
    merged = {
        key: (stored.get(key, "") if isinstance(value, str) and value.startswith("••••") else value)
        for key, value in (req.credentials or {}).items()
    }
    for key, value in stored.items():
        merged.setdefault(key, value)
    provider.credentials = merged
    
    if req.is_default:
        db.query(StorageProvider).filter(StorageProvider.id != provider_id).update({StorageProvider.is_default: False})
        
    db.commit()
    db.refresh(provider)
    return _public(provider)

@router.delete("/providers/{provider_id}")
def delete_provider(provider_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    provider = db.query(StorageProvider).filter(StorageProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check if used in policies
    if db.query(StoragePolicy).filter(StoragePolicy.provider_id == provider_id).first():
        raise HTTPException(status_code=400, detail="Provider is used in a routing policy")
        
    db.delete(provider)
    db.commit()
    return {"status": "ok"}

@router.get("/policies")
def get_policies(db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    policies = db.query(StoragePolicy).all()
    
    # attach provider names
    results = []
    for pol in policies:
        prov = db.query(StorageProvider).filter(StorageProvider.id == pol.provider_id).first()
        results.append({
            "id": pol.id,
            "entity_type": pol.entity_type,
            "provider_id": pol.provider_id,
            "provider_name": prov.name if prov else "Unknown",
            "provider_type": prov.provider_type if prov else "UNKNOWN"
        })
        
    return {"items": results}

@router.post("/policies")
def create_policy(req: PolicyCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    pol = db.query(StoragePolicy).filter(StoragePolicy.entity_type == req.entity_type).first()
    if pol:
        pol.provider_id = req.provider_id
    else:
        pol = StoragePolicy(entity_type=req.entity_type, provider_id=req.provider_id)
        db.add(pol)
    db.commit()
    return {"status": "ok"}

@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_infra_admin)):
    pol = db.query(StoragePolicy).filter(StoragePolicy.id == policy_id).first()
    if pol:
        db.delete(pol)
        db.commit()
    return {"status": "ok"}
