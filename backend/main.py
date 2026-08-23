from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from database import connect_to_mongo, close_mongo_connection
from routes import (
    auth_routes,
    prediction_routes,
    appointment_routes,
    lab_routes,
    patient_routes,
    faq_routes,
    admin_routes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    try:
        from seed_data import seed
        await seed()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Unified AI-assisted Healthcare Coordination Platform connecting Patients, Doctors, and Labs.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configured CORS Middleware
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_routes.router, prefix=settings.API_V1_STR)
app.include_router(prediction_routes.router, prefix=settings.API_V1_STR)
app.include_router(appointment_routes.router, prefix=settings.API_V1_STR)
app.include_router(lab_routes.router, prefix=settings.API_V1_STR)
app.include_router(patient_routes.router, prefix=settings.API_V1_STR)
app.include_router(faq_routes.router, prefix=settings.API_V1_STR)
app.include_router(admin_routes.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "disclaimer": settings.MEDICAL_DISCLAIMER,
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
