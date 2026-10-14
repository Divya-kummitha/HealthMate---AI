import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Calendar,
  Pill,
  ShieldCheck,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  Database,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { HealthReport, HealthEvent, Medicine, Appointment, UserProfile } from '../types';

interface AdminWebDashboardProps {
  user: UserProfile;
  reports: HealthReport[];
  timeline: HealthEvent[];
  medicines: Medicine[];
  appointments: Appointment[];
  onOpenMobileView: () => void;
}

export const AdminWebDashboard: React.FC<AdminWebDashboardProps> = ({
  user,
  reports,
  timeline,
  medicines,
  appointments,
  onOpenMobileView,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'timeline' | 'safety' | 'fhir'>('overview');
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const outsideRangeCount = reports.reduce((acc, rep) => {
    return acc + rep.extractedData.testItems.filter((t) => t.status !== 'normal').length;
  }, 0);

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Admin Navigation Bar */}
      <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">HealthMate AI</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                CLINICAL & DEMO DASHBOARD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Web Demonstration & Administrative Health Record View
            </p>
          </div>
        </div>

        {/* Tab Switcher & Quick Launch */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs">
            {(
              [
                { id: 'overview', label: 'Patient Hub' },
                { id: 'reports', label: 'Lab Reports' },
                { id: 'timeline', label: 'Timeline Audit' },
                { id: 'safety', label: 'Safety & Guardrails' },
                { id: 'fhir', label: 'FHIR JSON' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === t.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenMobileView}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <span>Switch to Mobile View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-y-auto max-h-[750px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Patient Info</span>
                  <User className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xl font-bold text-white">{user.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {user.age} yrs • {user.studentRole} • Blood {user.bloodType}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Reports Analyzed</span>
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">{reports.length} Reports</div>
                <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{outsideRangeCount} values outside reference range</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Regimen</span>
                  <Pill className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">{medicines.length} Medicines</div>
                <div className="text-xs text-emerald-400 mt-1">
                  Daily reminders active • Adherence tracked
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Clinical Consult</span>
                  <Calendar className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {appointments.length > 0 ? appointments[0].appointmentDate : 'None'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {appointments[0]?.doctorName || 'No upcoming appointments'}
                </div>
              </div>
            </div>

            {/* Split Grid: Recent Reports & Clinical Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Lab Analysis */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <h3 className="font-semibold text-white">Latest Analyzed Lab Panel</h3>
                  </div>
                  <span className="text-xs text-slate-400">{selectedReport?.reportDate}</span>
                </div>

                {selectedReport ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/70">
                      <div className="font-semibold text-teal-300 mb-1">{selectedReport.reportType}</div>
                      <p className="text-slate-300 leading-relaxed">{selectedReport.aiSummary.overview}</p>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-300 mb-2">Extracted Parameters ({selectedReport.extractedData.testItems.length}):</div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {selectedReport.extractedData.testItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800"
                          >
                            <span className="font-medium text-slate-200">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">{item.value} {item.unit}</span>
                              <span className="text-[10px] text-slate-500">[{item.referenceRange}]</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'normal'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {item.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">No reports uploaded yet.</div>
                )}
              </div>

              {/* Chronological Health Timeline Stream */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-white">Chronological Health Timeline</h3>
                  </div>
                  <span className="text-xs text-indigo-300">{timeline.length} Events Logged</span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
                  {timeline.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-start gap-3"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                          evt.type === 'report'
                            ? 'bg-teal-950 text-teal-400 border border-teal-800'
                            : evt.type === 'appointment'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : evt.type === 'medicine'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}
                      >
                        {evt.type === 'report' ? '🧪' : evt.type === 'appointment' ? '🩺' : evt.type === 'medicine' ? '💊' : '📝'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{evt.title}</span>
                          <span className="text-[10px] text-slate-400">{evt.date}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Reports Detail */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Select Report:</span>
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedReport?.id === r.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r.fileName}
                </button>
              ))}
            </div>

            {selectedReport && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedReport.reportType}</h2>
                    <p className="text-slate-400">Date: {selectedReport.reportDate} • Category: {selectedReport.extractedData.category || 'General'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[11px] font-semibold">
                    OCR / Vision Verified
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Plain-English AI Summary</h4>
                  <p className="text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {selectedReport.aiSummary.overview}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Key Clinical Findings</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {selectedReport.aiSummary.keyFindings.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Questions Generated for Clinician</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedReport.aiSummary.questionsForDoctor.map((q, i) => (
                      <div key={i} className="p-2.5 rounded bg-slate-900/70 border border-slate-800 text-teal-200">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-amber-200 text-[11px]">
                  <strong>Mandatory Disclaimer:</strong> {selectedReport.aiSummary.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Timeline Audit */}
        {activeTab === 'timeline' && (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm">Automated Event Pipeline Log</h3>
            <p className="text-xs text-slate-400">
              Every document uploaded, medicine created, or symptom recorded is automatically synchronized into the user's Firestore timeline.
            </p>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Event Title</th>
                    <th className="p-3">Source / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {timeline.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold capitalize text-teal-400">{evt.type}</td>
                      <td className="p-3 text-slate-400">{evt.date}</td>
                      <td className="p-3 font-medium text-white">{evt.title}</td>
                      <td className="p-3 text-slate-400">{evt.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Safety Guardrails */}
        {activeTab === 'safety' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Clinical Guardrails & Disclaimers Engine</h3>
              </div>
              <p className="text-slate-300 leading-relaxed">
                HealthMate AI strictly adheres to clinical safety constraints designed to protect users:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-rose-900/50">
                  <span className="font-bold text-rose-400">🚫 Strictly Prohibited Actions</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li>Diagnosing diseases or clinical conditions</li>
                    <li>Prescribing medicines or suggesting dosing changes</li>
                    <li>Instructing users to stop prescription medication</li>
                    <li>Triaging urgent clinical emergencies without directing to 911</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-900/50">
                  <span className="font-bold text-emerald-400">✅ Permitted Copilot Actions</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li>Extracting laboratory values, units & reference intervals</li>
                    <li>Highlighting values outside standard laboratory ranges</li>
                    <li>Translating confusing medical jargon into simple language</li>
                    <li>Formulating proactive questions for user's physician</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: FHIR JSON */}
        {activeTab === 'fhir' && (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">HL7 FHIR R4 Bundle (Interoperability Demo)</h3>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono">Standard: DiagnosticReport & Observation</span>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 scrollbar-thin">
              {JSON.stringify(
                {
                  resourceType: 'Bundle',
                  type: 'collection',
                  entry: [
                    {
                      resource: {
                        resourceType: 'Patient',
                        id: user.id,
                        name: [{ use: 'official', family: 'Rivera', given: ['Alex'] }],
                        gender: 'other',
                      },
                    },
                    ...reports.map((r) => ({
                      resource: {
                        resourceType: 'DiagnosticReport',
                        id: r.id,
                        status: 'final',
                        code: { text: r.reportType },
                        issued: r.reportDate,
                        conclusion: r.aiSummary.overview,
                      },
                    })),
                  ],
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
