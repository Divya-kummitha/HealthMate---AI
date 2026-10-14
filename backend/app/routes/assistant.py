from fastapi import APIRouter
from app.models.schemas import AssistantChatRequest, AssistantChatResponse
from app.services.ai_service import AIService
from app.services.safety_service import ClinicalSafetyService

router = APIRouter()

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(payload: AssistantChatRequest):
    # Pre-safety evaluation
    is_unsafe, safety_msg = ClinicalSafetyService.evaluate_prompt_safety(payload.message)
    if is_unsafe:
        return AssistantChatResponse(
            reply=safety_msg,
            safetyFlag=True,
            authorizedContextUsed=["Clinical Guardrail Active"]
        )

    # Simulated Context RAG
    user_context = {
        "userId": payload.userId,
        "latestReport": {
            "reportType": "Complete Blood Count (CBC)",
            "date": "2026-10-08",
            "findings": "Hemoglobin 11.8 g/dL (Mildly low)"
        }
    }

    reply = await AIService.chat_with_health_context(payload.message, user_context)

    return AssistantChatResponse(
        reply=reply,
        safetyFlag=False,
        authorizedContextUsed=["CBC Report (2026-10-08)", "Active Meds", "Dr. Patel Apt"]
    )
