from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base
from .api.endpoints import public, admin, creators, users 

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Moodboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(public.router, prefix="/api", tags=["public"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(creators.router, prefix="/api/creators", tags=["creators"])
app.include_router(users.router, prefix="/api/users", tags=["users"])  # new

@app.get("/")
def read_root():
    return {
        "message": "Moodboard API",
        "docs": "/docs",
        "public_api": "/api/frames",
        "admin_api": "/api/admin",
        "creators_api": "/api/creators",
        "users_api": "/api/users",
    }