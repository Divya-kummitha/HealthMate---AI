from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import HealthReportCreate, HealthReportResponse
from app.services.ai_service import AIService
import uuid
from datetime import datetime

router = APIRouter()

# Mock storage for reports
in_memory_reports = []

@router.get("/", response_model=List[dict])
def get_reports():
    return in_memory_reports

@router.post("/upload")
async def upload_and_analyze_report(payload: HealthReportCreate):
    # Process document with Vision/OCR and AI
    analysis = await AIService.analyze_medical_document(payload.rawText or "", payload.fileName)

    new_report = {
        "id": f"rep-{uuid.uuid4().hex[:8]}",
        "userId": payload.userId,
        "fileName": payload.fileName,
        "reportType": analysis["reportType"],
        "reportDate": analysis["reportDate"],
        "extractedData": {"testItems": analysis["testItems"]},
        "aiSummary": analysis["aiSummary"],
        "createdAt": datetime.utcnow().isoformat(),
    }
    in_memory_reports.insert(0, new_report)
    return {"status": "success", "report": new_report}

@router.get("/{report_id}")
def get_report_detail(report_id: str):
    for r in in_memory_reports:
        if r["id"] == report_id:
            return r
    raise HTTPException(status_code=404, detail="Report not found")
