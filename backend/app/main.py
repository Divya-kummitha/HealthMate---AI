"""
HealthMate AI — FastAPI Main Application
Hackathon MVP Backend Service for Personal Health Copilot
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import reports, timeline, medicines, appointments, assistant, auth

app = FastAPI(
    title="HealthMate AI API",
    description="Backend microservice for medical report normalization, health timeline, and clinical guardrails",
    version="1.0.0",
)

# Configure CORS for Flutter mobile app and web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Medical Reports & OCR"])
app.include_router(timeline.router, prefix="/timeline", tags=["Health Timeline"])
app.include_router(medicines.router, prefix="/medicines", tags=["Medicines & Reminders"])
app.include_router(appointments.router, prefix="/appointments", tags=["Doctor Appointments"])
app.include_router(assistant.router, prefix="/assistant", tags=["Contextual AI Assistant"])

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "HealthMate AI Backend",
        "version": "1.0.0",
        "clinicalGuardrails": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
