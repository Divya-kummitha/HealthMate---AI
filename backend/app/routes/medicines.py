from fastapi import APIRouter, HTTPException
from app.models.schemas import MedicineCreate
import uuid

router = APIRouter()

in_memory_medicines = [
    {
        "id": "med-01",
        "userId": "user-101",
        "name": "Vitamin D3",
        "dosage": "2000 IU (1 softgel)",
        "instructions": "Take daily with breakfast",
        "reminderTime": "08:30 AM",
        "startDate": "2026-09-25",
        "status": "taken",
        "streakDays": 14,
    },
    {
        "id": "med-02",
        "userId": "user-101",
        "name": "Gentle Iron",
        "dosage": "25 mg (1 capsule)",
        "instructions": "Take with lunch or orange juice",
        "reminderTime": "01:00 PM",
        "startDate": "2026-09-26",
        "status": "pending",
        "streakDays": 12,
    },
]

@router.get("/")
def get_medicines():
    return in_memory_medicines

@router.post("/")
def add_medicine(payload: MedicineCreate):
    new_med = {
        "id": f"med-{uuid.uuid4().hex[:8]}",
        "userId": payload.userId,
        "name": payload.name,
        "dosage": payload.dosage,
        "instructions": payload.instructions,
        "reminderTime": payload.reminderTime,
        "startDate": payload.startDate,
        "endDate": payload.endDate,
        "status": "pending",
        "streakDays": 0,
    }
    in_memory_medicines.insert(0, new_med)
    return new_med

@router.put("/{medicine_id}")
def update_medicine_status(medicine_id: str, status: str):
    for med in in_memory_medicines:
        if med["id"] == medicine_id:
            med["status"] = status
            return med
    raise HTTPException(status_code=404, detail="Medicine not found")
