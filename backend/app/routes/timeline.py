from fastapi import APIRouter
from app.models.schemas import HealthEventCreate
import uuid
from datetime import datetime

router = APIRouter()

in_memory_timeline = [
    {
        "id": "evt-01",
        "userId": "user-101",
        "type": "report",
        "title": "Complete Blood Count (CBC)",
        "description": "AI summary generated: 3 tests within range, 3 slightly below baseline.",
        "date": "2026-10-08",
        "time": "10:15 AM",
        "tag": "Lab Report",
        "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": "evt-02",
        "userId": "user-101",
        "type": "appointment",
        "title": "Campus Health Clinic Visit",
        "description": "Routine health checkup & fatigue discussion.",
        "date": "2026-10-02",
        "time": "02:30 PM",
        "tag": "Doctor Visit",
        "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": "evt-03",
        "userId": "user-101",
        "type": "medicine",
        "title": "Vitamin D3 Started",
        "description": "2000 IU daily morning softgel with meal.",
        "date": "2026-09-25",
        "time": "08:00 AM",
        "tag": "Medicine",
        "createdAt": datetime.utcnow().isoformat(),
    },
]

@router.get("/")
def get_timeline():
    return in_memory_timeline

@router.post("/")
def add_timeline_event(payload: HealthEventCreate):
    new_event = {
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "userId": payload.userId,
        "type": payload.type,
        "title": payload.title,
        "description": payload.description,
        "date": payload.date,
        "time": payload.time or "12:00 PM",
        "tag": payload.tag or "General",
        "createdAt": datetime.utcnow().isoformat(),
    }
    in_memory_timeline.insert(0, new_event)
    return new_event
