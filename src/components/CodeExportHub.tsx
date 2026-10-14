import React, { useState } from 'react';
import { Code2, Copy, Check, FileCode, FolderTree, Cpu } from 'lucide-react';

export const CodeExportHub: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<'flutter_main' | 'fastapi_main' | 'safety_service' | 'firestore_rules'>('flutter_main');

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const files = {
    flutter_main: {
      name: 'flutter_app/lib/main.dart',
      lang: 'dart',
      description: 'Flutter mobile application entrypoint and MaterialApp theme config.',
      code: `import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HealthMateApp());
}

class HealthMateApp extends StatelessWidget {
  const HealthMateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HealthMate AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488), // Medical Teal
          primary: const Color(0xFF0D9488),
          secondary: const Color(0xFF0284C7),
          surface: Colors.white,
        ),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}`,
    },
    fastapi_main: {
      name: 'backend/app/main.py',
      lang: 'python',
      description: 'FastAPI application with routers for reports, timeline, medicines, and assistant.',
      code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import reports, timeline, medicines, appointments, assistant, auth

app = FastAPI(
    title="HealthMate AI API",
    description="Backend microservice for medical report normalization and clinical guardrails",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/reports", tags=["Medical Reports & OCR"])
app.include_router(timeline.router, prefix="/timeline", tags=["Health Timeline"])
app.include_router(medicines.router, prefix="/medicines", tags=["Medicines"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(assistant.router, prefix="/assistant", tags=["AI Assistant"])`,
    },
    safety_service: {
      name: 'backend/app/services/safety_service.py',
      lang: 'python',
      description: 'Clinical safety guardrail enforcing no diagnosis, no prescription, and emergency diversion.',
      code: `import re
from typing import Tuple

class ClinicalSafetyService:
    @staticmethod
    def evaluate_prompt_safety(text: str) -> Tuple[bool, str]:
        text_lower = text.lower()

        # Rule 1: Stopping or modifying prescribed medications
        if re.search(r"stop (taking )?(my )?(medicine|medication|dose)", text_lower):
            return (
                True,
                "⚠️ Clinical Safety: Do not stop or alter a prescribed medicine based on an AI response. Contact your doctor immediately."
            )

        # Rule 2: Acute emergency symptoms
        if any(w in text_lower for w in ["chest pain", "cannot breathe", "passed out", "severe bleeding"]):
            return (
                True,
                "🚨 Urgent: For severe symptoms or medical emergencies, call 911 or visit the nearest emergency room immediately."
            )

        # Rule 3: Diagnostic certainty
        if any(w in text_lower for w in ["diagnose me", "do i have cancer"]):
            return (
                True,
                "ℹ️ HealthMate AI is an informational tool and does not provide clinical diagnoses. Consult your doctor."
            )

        return False, ""`,
    },
    firestore_rules: {
      name: 'backend/firestore.rules',
      lang: 'javascript',
      description: 'Firebase Firestore security rules ensuring strict user-level data isolation.',
      code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /health_reports/{reportId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    match /health_events/{eventId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    match /medicines/{medicineId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    match /appointments/{appointmentId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}`,
    },
  };

  const current = files[activeFile];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">Codebase & Architecture Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Flutter Mobile App (Dart) + Python (FastAPI) Backend + Firestore Rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          {Object.entries(files).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveFile(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFile === key
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.name.split('/').pop()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-slate-800 border-b-0 text-xs">
        <span className="font-mono text-teal-300 font-semibold">{current.name}</span>
        <button
          onClick={() => handleCopy(current.code, activeFile)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          {copiedKey === activeFile ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <pre className="bg-slate-950 p-4 rounded-b-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 scrollbar-thin">
        {current.code}
      </pre>

      <p className="mt-3 text-xs text-slate-400">
        ℹ️ <strong className="text-slate-300">{current.name}:</strong> {current.description}
      </p>
    </div>
  );
};
