import os
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
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

logging.basicConfig(level=logging.INFO)

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
    allow_credentials=False,  # bearer tokens, never cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    if request.url.path.startswith("/uploads/"):
        # Uploaded images are content-sniffed on the way in; still never let one run as a page
        response.headers["Content-Security-Policy"] = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox"
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response

from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(wedding_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
