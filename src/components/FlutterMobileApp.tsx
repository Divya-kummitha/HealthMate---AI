import React, { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  Clock,
  MessageSquareHeart,
  Pill,
  Calendar,
  Plus,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  User,
  ShieldCheck,
  Send,
  Sparkles,
  Search,
  Bell,
  Check,
  HelpCircle,
  ExternalLink,
  Flame,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import {
  HealthReport,
  HealthEvent,
  Medicine,
  Appointment,
  SymptomLog,
  UserProfile,
} from '../types';
import {
  analyzeReport,
  sendAssistantMessage,
  createMedicine,
  updateMedicineStatus,
  createAppointment,
  createSymptom,
} from '../services/api';

interface FlutterMobileAppProps {
  user: UserProfile;
  reports: HealthReport[];
  timeline: HealthEvent[];
  medicines: Medicine[];
  appointments: Appointment[];
  symptoms: SymptomLog[];
  onRefreshData: () => void;
  activeDemoStep: number;
  onStepCompleted?: (step: number) => void;
}

export type ScreenType =
  | 'welcome'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'reports'
  | 'upload'
  | 'processing'
  | 'report-result'
  | 'timeline'
  | 'assistant'
  | 'medicines'
  | 'add-medicine'
  | 'appointments'
  | 'add-appointment'
  | 'profile'
  | 'add-symptom';

export const FlutterMobileApp: React.FC<FlutterMobileAppProps> = ({
  user,
  reports,
  timeline,
  medicines,
  appointments,
  symptoms,
  onRefreshData,
  activeDemoStep,
  onStepCompleted,
}) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  
  // Selected Report for Result View
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(reports[0] || null);

  // Processing state for Report Upload
  const [uploadStage, setUploadStage] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // AI Assistant Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; safetyFlag?: boolean; context?: string[] }>>([
    {
      sender: 'ai',
      text: "Hello Alex! 👋 I'm HealthMate AI, your personal health information copilot.\n\nI have access to your authorized lab reports, active medicines, and upcoming appointments. How can I help you today?",
      context: ['Authorized Health Context Active'],
    },
  ]);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);

  // Add Medicine Form
  const [medName, setMedName] = useState<string>('Melatonin Sleep Support');
  const [medDosage, setMedDosage] = useState<string>('3 mg (1 gummy)');
  const [medTime, setMedTime] = useState<string>('10:00 PM');
  const [medInstructions, setMedInstructions] = useState<string>('Take 30 minutes before sleep');

  // Add Appointment Form
  const [aptDoctor, setAptDoctor] = useState<string>('Dr. Sarah Patel, MD');
  const [aptSpecialty, setAptSpecialty] = useState<string>('Primary Care / University Clinic');
  const [aptDate, setAptDate] = useState<string>('2026-10-15');
  const [aptTime, setAptTime] = useState<string>('10:30 AM');
  const [aptPurpose, setAptPurpose] = useState<string>('Review CBC & Fatigue');

  // Log Symptom Form
  const [symptomName, setSymptomName] = useState<string>('Afternoon Fatigue');
  const [symptomSeverity, setSymptomSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [symptomNotes, setSymptomNotes] = useState<string>('Sluggish after chemistry lecture');

  // Update selected report if reports change
  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  // Handle Demo Step Jump synchronization
  useEffect(() => {
    if (activeDemoStep === 1) {
      setIsLoggedIn(false);
      setCurrentScreen('login');
    } else if (activeDemoStep === 2) {
      setIsLoggedIn(true);
      setCurrentScreen('dashboard');
    } else if (activeDemoStep === 3) {
      setCurrentScreen('upload');
    } else if (activeDemoStep === 4) {
      setCurrentScreen('processing');
    } else if (activeDemoStep === 5) {
      if (reports[0]) setSelectedReport(reports[0]);
      setCurrentScreen('report-result');
    } else if (activeDemoStep === 6) {
      setCurrentScreen('timeline');
    } else if (activeDemoStep === 7) {
      setCurrentScreen('assistant');
    } else if (activeDemoStep === 8) {
      setCurrentScreen('add-medicine');
    } else if (activeDemoStep === 9) {
      setCurrentScreen('medicines');
    } else if (activeDemoStep === 10) {
      setCurrentScreen('add-appointment');
    } else if (activeDemoStep === 11) {
      setCurrentScreen('timeline');
    }
  }, [activeDemoStep]);

  // Trigger Report Analysis with Multi-Stage Animation
  const handleStartAnalysis = async (sampleId: string = 'sample-cmp') => {
    setCurrentScreen('processing');
    setIsAnalyzing(true);
    setUploadStage(1); // Document received

    setTimeout(() => {
      setUploadStage(2); // Text extracted
    }, 900);

    setTimeout(() => {
      setUploadStage(3); // Medical values identified
    }, 1800);

    setTimeout(async () => {
      setUploadStage(4); // Summary ready
      try {
        const result = await analyzeReport({ sampleId });
        if (result && result.report) {
          setSelectedReport(result.report);
          onRefreshData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => {
          setIsAnalyzing(false);
          setCurrentScreen('report-result');
          if (onStepCompleted) onStepCompleted(5);
        }, 800);
      }
    }, 2800);
  };

  // Chat message submit
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || assistantInput.trim();
    if (!text) return;

    setAssistantInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setIsAssistantTyping(true);

    try {
      const response = await sendAssistantMessage(text);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.reply,
          safetyFlag: response.safetyFlag,
          context: response.authorizedContextUsed,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I couldn't reach the health copilot server at the moment. Please verify your connection.",
        },
      ]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  // Add Medicine Submit
  const handleAddMedicineSubmit = async () => {
    if (!medName) return;
    try {
      await createMedicine({
        name: medName,
        dosage: medDosage,
        reminderTime: medTime,
        instructions: medInstructions,
        startDate: '2026-10-10',
      });
      onRefreshData();
      setCurrentScreen('medicines');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Appointment Submit
  const handleAddAppointmentSubmit = async () => {
    if (!aptDoctor) return;
    try {
      await createAppointment({
        doctorName: aptDoctor,
        specialty: aptSpecialty,
        appointmentDate: aptDate,
        appointmentTime: aptTime,
        purpose: aptPurpose,
        notes: 'Follow up with physician on lab trends',
      });
      onRefreshData();
      setCurrentScreen('appointments');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Symptom Submit
  const handleAddSymptomSubmit = async () => {
    if (!symptomName) return;
    try {
      await createSymptom({
        symptom: symptomName,
        severity: symptomSeverity,
        notes: symptomNotes,
      });
      onRefreshData();
      setCurrentScreen('timeline');
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle medicine status
  const handleToggleMedStatus = async (med: Medicine) => {
    const nextStatus = med.status === 'taken' ? 'pending' : 'taken';
    try {
      await updateMedicineStatus(med.id, nextStatus);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Render Screens
  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Top Mobile App Bar (for screens other than splash/welcome/login) */}
      {isLoggedIn && currentScreen !== 'welcome' && (
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {currentScreen !== 'dashboard' && (
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="p-1 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                H
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">HealthMate AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('appointments')}
              className="p-1.5 rounded-full text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors relative"
              title="Appointments"
            >
              <Calendar className="w-4 h-4" />
              {appointments.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500"></span>
              )}
            </button>
            <button
              onClick={() => setCurrentScreen('profile')}
              className="w-7 h-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 text-xs font-bold"
            >
              AR
            </button>
          </div>
        </div>
      )}

      {/* Screen Body */}
      <div className="flex-1 overflow-y-auto pb-20 p-4 scrollbar-thin">

        {/* 1. Splash / Welcome Screen */}
        {currentScreen === 'welcome' && (
          <div className="h-full flex flex-col justify-between py-8 px-2 text-center">
            <div className="space-y-4 pt-10">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-600 text-white flex items-center justify-center shadow-xl shadow-teal-700/20">
                <HeartPulse className="w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                HealthMate AI
              </h1>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your AI-powered personal health copilot. Convert fragmented medical reports, medicines, and appointments into one organized journey.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentScreen('login')}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-transform active:scale-95"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentScreen('register')}
                className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* 2. Login Screen */}
        {currentScreen === 'login' && (
          <div className="pt-6 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-xs text-slate-500">Sign in to your HealthMate account</p>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Student / User Email</label>
                <input
                  type="email"
                  defaultValue="alex.rivera@university.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Password</label>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsLoggedIn(true);
                    setCurrentScreen('dashboard');
                    if (onStepCompleted) onStepCompleted(2);
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sign In as Alex Rivera</span>
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-500">
              Demo Access: Preloaded with authentic student lab data & timeline.
            </p>
          </div>
        )}

        {/* 3. Register Screen */}
        {currentScreen === 'register' && (
          <div className="pt-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create Profile</h2>
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue="Alex Rivera"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">University / College</label>
                <input
                  type="text"
                  defaultValue="State University"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(true);
                  setCurrentScreen('dashboard');
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs mt-2"
              >
                Complete Registration
              </button>
            </div>
          </div>
        )}

        {/* 4. Home Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <div className="space-y-4">
            {/* Header Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                  Good Morning 👋
                </h1>
                <p className="text-xs text-slate-500 font-medium">Your Health Journey</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Oct 2026
              </span>
            </div>

            {/* Metric Counters Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCurrentScreen('reports')}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-left hover:border-teal-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reports</span>
                <span className="text-xl font-black text-teal-700 block mt-0.5">[{reports.length}]</span>
                <span className="text-[10px] text-teal-600 font-medium mt-0.5 block flex items-center gap-0.5">
                  View <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('medicines')}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-left hover:border-teal-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Meds</span>
                <span className="text-xl font-black text-emerald-700 block mt-0.5">[{medicines.length}]</span>
                <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block flex items-center gap-0.5">
                  Doses <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('appointments')}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-left hover:border-teal-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visits</span>
                <span className="text-xl font-black text-sky-700 block mt-0.5">[{appointments.length}]</span>
                <span className="text-[10px] text-sky-600 font-medium mt-0.5 block flex items-center gap-0.5">
                  Upcoming <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Quick Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentScreen('upload')}
                  className="p-2.5 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/60 text-teal-900 text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>Upload Report</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('add-medicine')}
                  className="p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-900 text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>Add Medicine</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('add-appointment')}
                  className="p-2.5 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/60 text-sky-900 text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Add Visit</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('add-symptom')}
                  className="p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/60 text-purple-900 text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95"
                >
                  <HeartPulse className="w-4 h-4 text-purple-600" />
                  <span>Log Symptom</span>
                </button>
              </div>
            </div>

            {/* Ask AI Banner */}
            <div className="bg-linear-to-r from-teal-700 to-indigo-800 rounded-2xl p-4 text-white shadow-md shadow-teal-950/10 space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-teal-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI Health Assistant</span>
              </div>
              <h3 className="font-bold text-sm text-white leading-snug">
                "What does my latest report mean?"
              </h3>
              <p className="text-[11px] text-teal-100 leading-relaxed">
                Ask questions backed by your verified clinical labs with strict safety guardrails.
              </p>
              <button
                onClick={() => setCurrentScreen('assistant')}
                className="mt-1 px-3.5 py-1.5 rounded-lg bg-white text-teal-900 text-xs font-bold hover:bg-teal-50 transition-colors shadow-xs flex items-center gap-1"
              >
                <span>Ask AI Copilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recent Health Activity Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Recent Health Activity</span>
                <button
                  onClick={() => setCurrentScreen('timeline')}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                >
                  Full Timeline →
                </button>
              </div>

              <div className="space-y-2">
                {timeline.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentScreen('timeline')}
                    className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs flex items-start gap-2.5 hover:border-teal-200 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center text-xs shrink-0 font-bold">
                      {item.type === 'report' ? '🧪' : item.type === 'appointment' ? '🩺' : item.type === 'medicine' ? '💊' : '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">{item.date.slice(5)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Medical Reports List Screen */}
        {currentScreen === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Medical Reports</h2>
                <p className="text-xs text-slate-500">{reports.length} reports on file</p>
              </div>
              <button
                onClick={() => setCurrentScreen('upload')}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report);
                    setCurrentScreen('report-result');
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{report.reportType}</h4>
                        <span className="text-[10px] text-slate-400">{report.fileName} • {report.reportDate}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      AI Verified
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg">
                    {report.aiSummary.overview}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{report.extractedData.testItems.length} test markers extracted</span>
                    <span className="text-teal-600 font-semibold flex items-center gap-0.5">
                      Review Findings <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Upload Report Screen */}
        {currentScreen === 'upload' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Medical Report</h2>
              <p className="text-xs text-slate-500">PDF, JPG, PNG lab reports or prescriptions</p>
            </div>

            {/* Dropzone container */}
            <div className="border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Upload document or drop file here</p>
                <p className="text-[11px] text-slate-500 mt-0.5">PDF or image of clinical test</p>
              </div>
              <button
                onClick={() => handleStartAnalysis('sample-cmp')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow-xs hover:bg-teal-700 transition-transform active:scale-95"
              >
                Select & Analyze Document
              </button>
            </div>

            {/* Quick Demo Lab Selector */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Or Analyze Realistic Student Lab Preset:
              </span>

              <div
                onClick={() => handleStartAnalysis('sample-cmp')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer shadow-xs transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">1. Metabolic Panel (CMP) & Lipids</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Slight ALT Elevation
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Glucose, eGFR, Creatinine, Electrolytes, ALT, Cholesterol
                </p>
              </div>

              <div
                onClick={() => handleStartAnalysis('sample-thyroid')}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer shadow-xs transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">2. Thyroid & Vitamin Health Panel</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Low Ferritin Stores
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  TSH, Free T4, Vitamin D, Ferritin & Total Iron screening
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7. Processing Screen with Required Multi-Stage Animation */}
        {currentScreen === 'processing' && (
          <div className="h-full flex flex-col justify-center py-10 px-4 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-700/20">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Processing Document</h3>
              <p className="text-xs text-slate-500 mt-0.5">Vision OCR & Clinical Normalization</p>
            </div>

            {/* Multi-stage animation steps as specified in user brief */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 text-left text-xs max-w-xs mx-auto w-full">
              
              {/* Step 1 */}
              <div className="flex items-center justify-between">
                <span className={uploadStage >= 1 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                  Uploading...
                </span>
                {uploadStage >= 1 && (
                  <span className="text-teal-600 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Document received
                  </span>
                )}
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between">
                <span className={uploadStage >= 2 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                  Extracting information...
                </span>
                {uploadStage >= 2 && (
                  <span className="text-teal-600 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Text extracted
                  </span>
                )}
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between">
                <span className={uploadStage >= 3 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                  Analyzing report...
                </span>
                {uploadStage >= 3 && (
                  <span className="text-teal-600 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Medical values identified
                  </span>
                )}
              </div>

              {/* Step 4 */}
              <div className="flex items-center justify-between">
                <span className={uploadStage >= 4 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                  Generating summary...
                </span>
                {uploadStage >= 4 && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Summary ready
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. AI Report Result Screen */}
        {currentScreen === 'report-result' && selectedReport && (
          <div className="space-y-4">
            {/* Report Header Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                    {selectedReport.extractedData.category || 'Clinical Lab'}
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-900 mt-1">
                    {selectedReport.reportType}
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedReport.reportDate}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">File: {selectedReport.fileName}</p>
            </div>

            {/* Key Findings Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Key Findings
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedReport.aiSummary.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5"></span>
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Extracted Lab Items Table */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Extracted Test Values ({selectedReport.extractedData.testItems.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedReport.extractedData.testItems.map((item, idx) => {
                  const isOutside = item.status !== 'normal';
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isOutside
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Ref: {item.referenceRange} {item.unit}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold">
                          {item.value} <span className="text-[10px] font-normal">{item.unit}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isOutside
                              ? 'bg-amber-200/80 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Summary / Simple Explanation */}
            <div className="bg-teal-900 text-white p-4 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                Simple Health Explanation
              </h3>
              <p className="text-xs text-teal-50 leading-relaxed">
                {selectedReport.aiSummary.overview}
              </p>
            </div>

            {/* Medical Terms Explained */}
            {selectedReport.aiSummary.medicalTermsExplained.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  Medical Terms Explained
                </h3>
                <div className="space-y-1.5 text-xs">
                  {selectedReport.aiSummary.medicalTermsExplained.map((termObj, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{termObj.term}: </span>
                      <span className="text-slate-600">{termObj.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions to Discuss With Your Doctor */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Questions to Discuss With Your Doctor
              </h3>
              <div className="space-y-1.5 text-xs">
                {selectedReport.aiSummary.questionsForDoctor.map((q, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-950 font-medium">
                    "{q}"
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-[11px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Informational Disclaimer</span>
              </div>
              <p className="leading-relaxed">
                {selectedReport.aiSummary.disclaimer}
              </p>
            </div>

            {/* Next Action Button */}
            <button
              onClick={() => {
                setCurrentScreen('timeline');
                if (onStepCompleted) onStepCompleted(6);
              }}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span>View in Health Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 9. Health Timeline Screen */}
        {currentScreen === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Health Timeline</h2>
                <p className="text-xs text-slate-500">Chronological health journey</p>
              </div>
              <button
                onClick={() => setCurrentScreen('add-symptom')}
                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold"
              >
                + Log Event
              </button>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
              {timeline.map((evt, idx) => (
                <div key={evt.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                  </div>

                  {/* Event Card */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 hover:border-teal-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        {evt.tag || evt.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{evt.date} {evt.time}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. AI Health Assistant Screen */}
        {currentScreen === 'assistant' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Assistant Header Banner */}
            <div className="bg-linear-to-r from-teal-700 to-indigo-800 text-white p-3.5 rounded-2xl shadow-sm space-y-1 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
                  <h3 className="font-bold text-xs tracking-tight">HealthMate AI</h3>
                </div>
                <span className="text-[9px] bg-teal-500/30 px-2 py-0.5 rounded-full border border-teal-400/30 font-semibold">
                  Authorized Context Active
                </span>
              </div>
              <p className="text-[10px] text-teal-100">
                Your personal health information assistant
              </p>
            </div>

            {/* Suggested Question Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {[
                'Explain my latest report',
                'What should I ask my doctor?',
                'Show my recent health events',
                'What is my upcoming appointment?',
                'What medicines have I added?',
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(pill)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-teal-200 text-teal-900 hover:bg-teal-50 text-[10px] font-medium shadow-2xs transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                        : msg.safetyFlag
                        ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-bl-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line text-xs">{msg.text}</div>
                  </div>

                  {msg.context && msg.context.length > 0 && msg.sender === 'ai' && (
                    <span className="text-[9px] text-slate-400 mt-1 pl-1">
                      Retrieved: {msg.context.join(' • ')}
                    </span>
                  )}
                </div>
              ))}

              {isAssistantTyping && (
                <div className="flex items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs w-28">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-xs shrink-0">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask HealthMate about your health data..."
                className="flex-1 text-xs px-2 py-1.5 focus:outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!assistantInput.trim()}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 11. Medicines Screen */}
        {currentScreen === 'medicines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Medicines & Reminders</h2>
                <p className="text-xs text-slate-500">Track prescribed intake & reminders</p>
              </div>
              <button
                onClick={() => setCurrentScreen('add-medicine')}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Med</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {medicines.map((med) => {
                const isTaken = med.status === 'taken';
                return (
                  <div
                    key={med.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          💊
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{med.name}</h4>
                          <span className="text-[10px] text-slate-500">{med.dosage}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleMedStatus(med)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          isTaken
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isTaken ? <Check className="w-3 h-3" /> : null}
                        <span>{isTaken ? 'Taken' : 'Pending'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600">
                      <p>{med.instructions}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-teal-700 font-semibold">
                        <Clock className="w-3 h-3" /> Reminder: {med.reminderTime}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Flame className="w-3 h-3" /> {med.streakDays} Day Streak
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-[10px] text-teal-900">
              ℹ️ <strong>Safety Notice:</strong> HealthMate AI does not prescribe medicines or modify dosages. Take only as prescribed by your doctor.
            </div>
          </div>
        )}

        {/* 12. Add Medicine Screen */}
        {currentScreen === 'add-medicine' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Medicine</h2>
              <p className="text-xs text-slate-500">Record prescribed medicine or supplement</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Vitamin D3, Gentle Iron, Amoxicillin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dosage as Prescribed</label>
                <input
                  type="text"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  placeholder="e.g. 2000 IU, 25 mg, 1 tablet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Daily Reminder Time</label>
                <input
                  type="text"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  placeholder="e.g. 08:30 AM, 08:00 PM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructions / Meal Notes</label>
                <input
                  type="text"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  placeholder="e.g. Take with food, avoid dairy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={handleAddMedicineSubmit}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs mt-2 shadow-xs transition-transform active:scale-95"
              >
                Save Medicine & Reminder
              </button>
            </div>
          </div>
        )}

        {/* 13. Appointments Screen */}
        {currentScreen === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Doctor Appointments</h2>
                <p className="text-xs text-slate-500">Upcoming clinical visits</p>
              </div>
              <button
                onClick={() => setCurrentScreen('add-appointment')}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Visit</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{apt.doctorName}</h4>
                      <span className="text-[10px] text-teal-700 font-semibold">{apt.specialty}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Confirmed
                    </span>
                  </div>

                  <div className="bg-sky-50/60 p-2.5 rounded-xl text-xs space-y-1 text-slate-700">
                    <div className="flex items-center justify-between font-bold text-sky-950">
                      <span>📅 {apt.appointmentDate}</span>
                      <span>⏰ {apt.appointmentTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-600"><strong>Purpose:</strong> {apt.purpose}</p>
                    {apt.notes && <p className="text-[10px] text-slate-500">Note: {apt.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 14. Add Appointment Screen */}
        {currentScreen === 'add-appointment' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Schedule Appointment</h2>
              <p className="text-xs text-slate-500">Track doctor visits & lab reviews</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Doctor / Provider Name</label>
                <input
                  type="text"
                  value={aptDoctor}
                  onChange={(e) => setAptDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specialty / Clinic</label>
                <input
                  type="text"
                  value={aptSpecialty}
                  onChange={(e) => setAptSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={aptPurpose}
                  onChange={(e) => setAptPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <button
                onClick={handleAddAppointmentSubmit}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs mt-2"
              >
                Save Doctor Appointment
              </button>
            </div>
          </div>
        )}

        {/* 15. Add Symptom Screen */}
        {currentScreen === 'add-symptom' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Log Health Symptom</h2>
              <p className="text-xs text-slate-500">Record how you are feeling for your timeline</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Symptom Name</label>
                <input
                  type="text"
                  value={symptomName}
                  onChange={(e) => setSymptomName(e.target.value)}
                  placeholder="e.g. Afternoon Fatigue, Mild Headache, Acid Reflux"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSymptomSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                        symptomSeverity === sev
                          ? sev === 'mild'
                            ? 'bg-teal-600 text-white'
                            : sev === 'moderate'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Context / Notes</label>
                <textarea
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="e.g. Midterm exam week stress, lack of sleep"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50"
                />
              </div>

              <button
                onClick={handleAddSymptomSubmit}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs mt-2"
              >
                Log Symptom to Timeline
              </button>
            </div>
          </div>
        )}

        {/* 16. Profile & Privacy Screen */}
        {currentScreen === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-800 border-2 border-teal-300 flex items-center justify-center font-black text-xl mx-auto">
                AR
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                <p className="text-[11px] text-teal-700 font-medium mt-0.5">{user.studentRole} • Age {user.age}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
                Health Profile Details
              </span>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Blood Type:</span>
                  <span className="font-bold text-slate-800">{user.bloodType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Documented Allergies:</span>
                  <span className="font-bold text-amber-700">{user.allergies.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Emergency Contact:</span>
                  <span className="font-bold text-slate-800">{user.emergencyContact}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
                Security & Isolation
              </span>
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[11px]">Firestore Security Rules: Scoped strictly to authenticated user UID.</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentScreen('login');
              }}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom Flutter Navigation Bar (Visible when logged in) */}
      {isLoggedIn && currentScreen !== 'welcome' && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 flex items-center justify-around z-40 shadow-lg">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
              currentScreen === 'dashboard' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setCurrentScreen('reports')}
            className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
              currentScreen === 'reports' || currentScreen === 'upload' || currentScreen === 'report-result'
                ? 'text-teal-600 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px]">Reports</span>
          </button>

          <button
            onClick={() => setCurrentScreen('timeline')}
            className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
              currentScreen === 'timeline' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px]">Timeline</span>
          </button>

          <button
            onClick={() => setCurrentScreen('assistant')}
            className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
              currentScreen === 'assistant' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span className="text-[10px]">AI Assist</span>
          </button>

          <button
            onClick={() => setCurrentScreen('medicines')}
            className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
              currentScreen === 'medicines' || currentScreen === 'add-medicine'
                ? 'text-teal-600 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span className="text-[10px]">Meds</span>
          </button>
        </div>
      )}
    </div>
  );
};
