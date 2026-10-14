"""
Clinical Safety & Guardrail Service
Enforces strict boundaries:
- Never diagnose diseases
- Never prescribe medicines
- Never change or advise stopping medications
- Handle emergency cues responsibly
"""

import re
from typing import Tuple

class ClinicalSafetyService:
    @staticmethod
    def evaluate_prompt_safety(text: str) -> Tuple[bool, str]:
        text_lower = text.lower()

        # Rule 1: Stopping or modifying prescribed medications
        med_alteration_patterns = [
            r"stop (taking )?(my )?(medicine|medication|pills|tablets|dose)",
            r"can i stop (taking)?",
            r"should i stop",
            r"double (my )?(dose|dosage)",
            r"change (my )?(dose|dosage)",
            r"skip (my )?(dose|pills)",
        ]
        for pattern in med_alteration_patterns:
            if re.search(pattern, text_lower):
                return (
                    True,
                    "⚠️ **Clinical Safety Boundary:** Do not stop, change, or modify a prescribed medicine based solely on this AI response. Please contact your prescribing healthcare professional or pharmacist directly before making any medication changes.",
                )

        # Rule 2: Acute emergency symptoms
        emergency_patterns = [
            r"chest pain",
            r"can'?t breathe",
            r"cannot breathe",
            r"shortness of breath",
            r"coughing blood",
            r"passed out",
            r"severe bleeding",
            r"overdose",
            r"suicide",
        ]
        for pattern in emergency_patterns:
            if re.search(pattern, text_lower):
                return (
                    True,
                    "🚨 **Urgent Notice:** If you are experiencing a medical emergency, severe shortness of breath, acute chest pain, or an urgent crisis, please call emergency services (911 or your local emergency line) immediately or go to the nearest emergency department.",
                )

        # Rule 3: Diagnostic certainty boundary
        diagnostic_patterns = [
            r"diagnose me",
            r"do i have (cancer|diabetes|lupus|tumor)",
            r"what disease do i have",
        ]
        for pattern in diagnostic_patterns:
            if re.search(pattern, text_lower):
                return (
                    True,
                    "ℹ️ **Informational Boundary:** HealthMate AI is an informational health copilot and does not provide clinical diagnoses. While I can explain what specific lab markers or symptoms commonly relate to, only a licensed physician reviewing your full history can diagnose a medical condition.",
                )

        return False, ""

    @staticmethod
    def attach_disclaimer(response_text: str) -> str:
        disclaimer = (
            "\n\n*Medical Disclaimer: HealthMate AI provides educational explanations and does not constitute a medical diagnosis or treatment plan. Always consult with a qualified healthcare provider.*"
        )
        if "Medical Disclaimer" not in response_text:
            return response_text + disclaimer
        return response_text
