import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models
from routes import router as wedding_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("Wedding Microservice DB Schema verified successfully.")
    except Exception as e:
        print(f"Wedding DB Init notice: {e}")
    yield

app = FastAPI(
    title="Wedding Microservice API",
    description="Dedicated Standalone Microservice for Khmer Digital Wedding Invitations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
allowed_origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "https://blog.camtech.cam",
    "https://camtech.cam"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(wedding_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
