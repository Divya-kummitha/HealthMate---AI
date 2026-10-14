from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class TestItem(BaseModel):
    name: str
    value: str
    unit: str = ""
    referenceRange: str = ""
    status: Literal["normal", "high", "low", "abnormal"] = "normal"
    notes: Optional[str] = None

class AISummary(BaseModel):
    overview: str
    keyFindings: List[str] = []
    medicalTermsExplained: List[dict] = []
    questionsForDoctor: List[str] = []
    disclaimer: str = (
        "Your report contains values analyzed for informational understanding. "
        "This is an informational explanation and does not constitute a medical diagnosis. "
        "Please discuss your results with a qualified healthcare professional."
    )

class HealthReportCreate(BaseModel):
    userId: str
    fileName: str
    reportType: str
    rawText: Optional[str] = None
    fileBase64: Optional[str] = None
    mimeType: Optional[str] = "application/pdf"

class HealthReportResponse(BaseModel):
    id: str
    userId: str
    fileName: str
    reportType: str
    reportDate: str
    extractedData: dict
    aiSummary: AISummary
    createdAt: str

class HealthEventCreate(BaseModel):
    userId: str
    type: Literal["report", "appointment", "medicine", "symptom", "milestone"]
    title: str
    description: str
    date: str
    time: Optional[str] = None
    sourceId: Optional[str] = None
    tag: Optional[str] = None

class MedicineCreate(BaseModel):
    userId: str
    name: str
    dosage: str
    instructions: str
    reminderTime: str
    startDate: str
    endDate: Optional[str] = None

class AppointmentCreate(BaseModel):
    userId: str
    doctorName: str
    specialty: str = "General Physician"
    appointmentDate: str
    appointmentTime: str
    purpose: str
    notes: Optional[str] = ""

class SymptomCreate(BaseModel):
    userId: str
    symptom: str
    severity: Literal["mild", "moderate", "severe"]
    notes: Optional[str] = ""

class AssistantChatRequest(BaseModel):
    userId: str
    message: str
    history: Optional[List[dict]] = []

class AssistantChatResponse(BaseModel):
    reply: str
    safetyFlag: bool
    authorizedContextUsed: List[str] = []
