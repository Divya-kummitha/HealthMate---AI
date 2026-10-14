from fastapi import APIRouter
from app.models.schemas import AppointmentCreate
import uuid

router = APIRouter()

in_memory_appointments = [
    {
        "id": "apt-01",
        "userId": "user-101",
        "doctorName": "Dr. Sarah Patel, MD",
        "specialty": "Primary Care / Campus Clinic",
        "appointmentDate": "2026-10-15",
        "appointmentTime": "10:30 AM",
        "purpose": "CBC Follow-up & Energy Check",
        "notes": "Discuss Hemoglobin (11.8 g/dL) results.",
        "status": "upcoming",
    }
]

@router.get("/")
def get_appointments():
    return in_memory_appointments

@router.post("/")
def add_appointment(payload: AppointmentCreate):
    new_apt = {
        "id": f"apt-{uuid.uuid4().hex[:8]}",
        "userId": payload.userId,
        "doctorName": payload.doctorName,
        "specialty": payload.specialty,
        "appointmentDate": payload.appointmentDate,
        "appointmentTime": payload.appointmentTime,
        "purpose": payload.purpose,
        "notes": payload.notes,
        "status": "upcoming",
    }
    in_memory_appointments.append(new_apt)
    return new_apt
