"""
VitalityX — Main App Entry Point
Run: uvicorn main:app --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.models import init_db
from routes.portfolio import router
from routes.groww_sync import sync_router

app = FastAPI(
    title="VitalityX API",
    description="Stock market for your life. Currency: Vitals (VTL).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(sync_router)


@app.on_event("startup")
def startup():
    init_db()
    print("VitalityX API running — http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "app": "VitalityX",
        "currency": "Vitals (VTL)",
        "stocks": ["HLT", "WLT", "SOC"],
        "docs": "/docs",
    }
