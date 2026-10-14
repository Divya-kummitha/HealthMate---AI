import React from 'react';
import { Play, RotateCcw, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export interface DemoStepInfo {
  step: number;
  title: string;
  actionText: string;
  speakerScript: string;
  targetScreen: string;
}

export const DEMO_STEPS: DemoStepInfo[] = [
  {
    step: 1,
    title: 'User Login',
    actionText: 'Authenticate User',
    speakerScript: '"HealthMate AI uses secure authentication to protect sensitive health data."',
    targetScreen: 'login',
  },
  {
    step: 2,
    title: 'Home Dashboard',
    actionText: 'Show Personalized Hub',
    speakerScript: '"This is the user\'s personalized health hub—bringing together reports, medicines, and appointments into one clear view."',
    targetScreen: 'dashboard',
  },
  {
    step: 3,
    title: 'Upload Medical Report',
    actionText: 'Select Lab Report',
    speakerScript: '"We upload an actual lab document—such as a Comprehensive Metabolic Panel or Blood Count."',
    targetScreen: 'upload',
  },
  {
    step: 4,
    title: 'Multi-Stage AI Extraction',
    actionText: 'OCR & Vision Processing',
    speakerScript: '"The backend performs OCR extraction, validates lab parameters with Python, and normalizes test values."',
    targetScreen: 'processing',
  },
  {
    step: 5,
    title: 'AI Report Summary & Findings',
    actionText: 'View Plain-Language Results',
    speakerScript: '"Here is the AI breakdown: key findings, highlighted abnormal values, plain explanations, and questions for the doctor."',
    targetScreen: 'report-result',
  },
  {
    step: 6,
    title: 'Health Timeline Sync',
    actionText: 'Show Automatic Event',
    speakerScript: '"Notice that the uploaded report was instantly recorded into the user\'s chronological health timeline."',
    targetScreen: 'timeline',
  },
  {
    step: 7,
    title: 'Contextual AI Assistant',
    actionText: 'Ask: "What does my latest report mean?"',
    speakerScript: '"The AI assistant is not a generic chatbot. It retrieves authorized health context and explains findings safely."',
    targetScreen: 'assistant',
  },
  {
    step: 8,
    title: 'Add Medicine',
    actionText: 'Log New Prescription',
    speakerScript: '"The student adds their prescribed medicine or supplement with clear dosage guidelines."',
    targetScreen: 'add-medicine',
  },
  {
    step: 9,
    title: 'Set Medicine Reminder',
    actionText: 'Configure Daily Schedule',
    speakerScript: '"A daily reminder is scheduled, and adherence is tracked with a streak counter."',
    targetScreen: 'medicines',
  },
  {
    step: 10,
    title: 'Add Doctor Appointment',
    actionText: 'Schedule Clinical Visit',
    speakerScript: '"The user logs a follow-up visit with Dr. Sarah Patel to review their lab findings."',
    targetScreen: 'add-appointment',
  },
  {
    step: 11,
    title: 'Unified Health Journey',
    actionText: 'Review Full Timeline',
    speakerScript: '"This is how HealthMate AI converts disconnected health information into one personalized health journey."',
    targetScreen: 'timeline',
  },
];

interface DemoTourGuideProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  onReset: () => void;
  onExecuteCurrentStep: () => void;
}

export const DemoTourGuide: React.FC<DemoTourGuideProps> = ({
  currentStep,
  onSelectStep,
  onReset,
  onExecuteCurrentStep,
}) => {
  const currentInfo = DEMO_STEPS.find((s) => s.step === currentStep) || DEMO_STEPS[0];

  return (
    <div className="bg-white/95 backdrop-blur-md border border-teal-200/80 rounded-2xl p-4 shadow-lg shadow-teal-900/5 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1.5 border border-teal-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            Hackathon Demo Flow: Step {currentStep} of {DEMO_STEPS.length}
          </span>
          <h3 className="font-bold text-slate-900 text-sm hidden sm:inline">
            {currentInfo.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={onExecuteCurrentStep}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {currentInfo.actionText}
          </button>

          <button
            onClick={() => onSelectStep(Math.min(DEMO_STEPS.length, currentStep + 1))}
            disabled={currentStep === DEMO_STEPS.length}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs ml-1"
            title="Reset Demo State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Speaker Pitch Script for Presenter / Judge */}
      <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-2.5 text-xs text-teal-950 flex items-start gap-2">
        <span className="font-semibold text-teal-700 shrink-0 uppercase tracking-wider text-[10px]">
          Demo Script:
        </span>
        <p className="italic text-slate-800 leading-relaxed">
          {currentInfo.speakerScript}
        </p>
      </div>

      {/* Step Pills Navigation Bar */}
      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {DEMO_STEPS.map((s) => {
          const isCurrent = s.step === currentStep;
          const isPassed = s.step < currentStep;
          return (
            <button
              key={s.step}
              onClick={() => onSelectStep(s.step)}
              className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                isCurrent
                  ? 'bg-teal-700 text-white shadow-sm'
                  : isPassed
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isPassed ? <CheckCircle2 className="w-3 h-3 text-teal-600" /> : <span>{s.step}</span>}
              <span className="hidden md:inline">{s.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
