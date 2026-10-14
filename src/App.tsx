import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  LayoutDashboard,
  Code2,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  RefreshCw,
  PlayCircle,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { MobileFrame } from './components/MobileFrame';
import { FlutterMobileApp } from './components/FlutterMobileApp';
import { AdminWebDashboard } from './components/AdminWebDashboard';
import { CodeExportHub } from './components/CodeExportHub';
import { DemoTourGuide, DEMO_STEPS } from './components/DemoTourGuide';
import {
  HealthReport,
  HealthEvent,
  Medicine,
  Appointment,
  SymptomLog,
  UserProfile,
} from './types';
import {
  fetchUserProfile,
  fetchReports,
  fetchTimeline,
  fetchMedicines,
  fetchAppointments,
  resetDemoData,
} from './services/api';

export default function App() {
  const [platformView, setPlatformView] = useState<'mobile' | 'web_admin' | 'code'>('mobile');
  const [isFrameExpanded, setIsFrameExpanded] = useState<boolean>(false);
  const [currentDemoStep, setCurrentDemoStep] = useState<number>(2);

  // Application Data States
  const [user, setUser] = useState<UserProfile>({
    id: 'user-101',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    age: 21,
    studentRole: 'Undergraduate Student',
    bloodType: 'O+',
    allergies: ['Penicillin (mild rash)'],
    emergencyContact: 'Elena Rivera (Parent) - (555) 321-7890',
  });

  const [reports, setReports] = useState<HealthReport[]>([]);
  const [timeline, setTimeline] = useState<HealthEvent[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load backend data
  const loadData = async () => {
    try {
      setLoading(true);
      const [uData, rData, tData, mData, aData] = await Promise.all([
        fetchUserProfile().catch(() => user),
        fetchReports().catch(() => []),
        fetchTimeline().catch(() => []),
        fetchMedicines().catch(() => []),
        fetchAppointments().catch(() => []),
      ]);
      if (uData) setUser(uData);
      setReports(rData);
      setTimeline(tData);
      setMedicines(mData);
      setAppointments(aData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset Demo to fresh state
  const handleResetDemo = async () => {
    await resetDemoData().catch(console.error);
    await loadData();
    setCurrentDemoStep(1);
    setPlatformView('mobile');
  };

  // Execute Current Demo Step
  const handleExecuteCurrentStep = () => {
    // If user is at a step, executing it moves them to the appropriate screen or advances to next step
    if (currentDemoStep < DEMO_STEPS.length) {
      setCurrentDemoStep((prev) => prev + 1);
    } else {
      setCurrentDemoStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xs">
              <HeartPulse className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  HealthMate AI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  HACKATHON MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI-Powered Personal Health Copilot for College Students
              </p>
            </div>
          </div>

          {/* Platform / View Switcher (Mobile vs Web Admin vs Code) */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setPlatformView('mobile')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  platformView === 'mobile'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App (Flutter)</span>
              </button>

              <button
                onClick={() => setPlatformView('web_admin')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  platformView === 'web_admin'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Web Dashboard</span>
              </button>

              <button
                onClick={() => setPlatformView('code')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  platformView === 'code'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Flutter & FastAPI Code</span>
                <span className="md:hidden">Code</span>
              </button>
            </div>

            {/* Quick Demo Reset */}
            <button
              onClick={handleResetDemo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Reset Hackathon Demo Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        
        {/* View 1: Mobile App (Flutter Experience) */}
        {platformView === 'mobile' && (
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Hackathon Demo Flow Tour Guide Bar */}
            <DemoTourGuide
              currentStep={currentDemoStep}
              onSelectStep={(step) => setCurrentDemoStep(step)}
              onReset={handleResetDemo}
              onExecuteCurrentStep={handleExecuteCurrentStep}
            />

            {/* Layout: Center Phone Frame with Left/Right Supporting Information */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Demo Checklist & Flow Guidance */}
              <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-teal-400">
                    <PlayCircle className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Hackathon Demo Sequence
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {DEMO_STEPS.map((s) => {
                      const isActive = s.step === currentDemoStep;
                      return (
                        <div
                          key={s.step}
                          onClick={() => setCurrentDemoStep(s.step)}
                          className={`p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                            isActive
                              ? 'bg-teal-950/80 border border-teal-700 text-teal-200 font-bold'
                              : 'hover:bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          <span className="truncate">
                            {s.step}. {s.title}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Safety Guardrail Badge */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Clinical Guardrails Active</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Zero diagnoses, zero unauthorized prescribing, and automatic disclaimers on all medical report summaries.
                  </p>
                </div>
              </div>

              {/* Center Column: Smartphone Shell with Flutter Mobile App */}
              <div className="lg:col-span-6 flex justify-center order-1 lg:order-2">
                <MobileFrame
                  isExpanded={isFrameExpanded}
                  onToggleExpand={() => setIsFrameExpanded(!isFrameExpanded)}
                >
                  <FlutterMobileApp
                    user={user}
                    reports={reports}
                    timeline={timeline}
                    medicines={medicines}
                    appointments={appointments}
                    symptoms={symptoms}
                    onRefreshData={loadData}
                    activeDemoStep={currentDemoStep}
                    onStepCompleted={(nextStep) => setCurrentDemoStep(nextStep)}
                  />
                </MobileFrame>
              </div>

              {/* Right Column: Key Features & Active RAG Context */}
              <div className="lg:col-span-3 space-y-4 order-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-teal-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Live RAG Health Context
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When user asks questions in the AI Assistant, this active context is securely retrieved:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-teal-400 uppercase">Latest Lab Report</div>
                      <div className="font-semibold text-slate-200">
                        {reports[0]?.reportType || 'None'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {reports[0]?.extractedData.testItems.length || 0} test markers analyzed
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Active Medicines</div>
                      <div className="text-slate-300">
                        {medicines.map((m) => m.name).join(', ') || 'None'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-sky-400 uppercase">Upcoming Visit</div>
                      <div className="text-slate-300">
                        {appointments[0]?.doctorName || 'None'} ({appointments[0]?.appointmentDate})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-200">Target Users</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    College students and young adults managing their first independent health records, dorm sick visits, and routine labs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Web Dashboard (Admin & Clinical Demonstration Mode) */}
        {platformView === 'web_admin' && (
          <div className="flex-1">
            <AdminWebDashboard
              user={user}
              reports={reports}
              timeline={timeline}
              medicines={medicines}
              appointments={appointments}
              onOpenMobileView={() => setPlatformView('mobile')}
            />
          </div>
        )}

        {/* View 3: Architecture & Source Code Hub */}
        {platformView === 'code' && (
          <div className="flex-1">
            <CodeExportHub />
          </div>
        )}
      </main>
    </div>
  );
}
