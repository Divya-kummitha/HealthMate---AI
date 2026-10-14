import { HealthReport, HealthEvent, Medicine, Appointment, SymptomLog, UserProfile } from '../types';

export const API_BASE = '/api';

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function fetchReports(): Promise<HealthReport[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function fetchTimeline(): Promise<HealthEvent[]> {
  const res = await fetch(`${API_BASE}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchMedicines(): Promise<Medicine[]> {
  const res = await fetch(`${API_BASE}/medicines`);
  if (!res.ok) throw new Error('Failed to fetch medicines');
  return res.json();
}

export async function updateMedicineStatus(id: string, status: 'taken' | 'pending'): Promise<Medicine> {
  const res = await fetch(`${API_BASE}/medicines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update medicine');
  return res.json();
}

export async function createMedicine(data: Partial<Medicine>): Promise<Medicine> {
  const res = await fetch(`${API_BASE}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create medicine');
  return res.json();
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${API_BASE}/appointments`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function createAppointment(data: Partial<Appointment>): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create appointment');
  return res.json();
}

export async function createSymptom(data: Partial<SymptomLog>): Promise<SymptomLog> {
  const res = await fetch(`${API_BASE}/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to log symptom');
  return res.json();
}

export async function analyzeReport(payload: {
  sampleId?: string;
  rawText?: string;
  fileName?: string;
  fileDataUrl?: string;
  mimeType?: string;
}): Promise<{ success: boolean; report: HealthReport; timelineEvent: HealthEvent }> {
  const res = await fetch(`${API_BASE}/reports/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to analyze report');
  return res.json();
}

export async function sendAssistantMessage(message: string): Promise<{
  reply: string;
  safetyFlag: boolean;
  authorizedContextUsed: string[];
}> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to communicate with AI Assistant');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
}
