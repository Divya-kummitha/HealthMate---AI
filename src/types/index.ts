export interface TestItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'abnormal';
  notes?: string;
}

export interface AISummary {
  overview: string;
  keyFindings: string[];
  medicalTermsExplained: Array<{ term: string; explanation: string }>;
  questionsForDoctor: string[];
  disclaimer: string;
}

export interface HealthReport {
  id: string;
  userId: string;
  fileName: string;
  reportType: string;
  reportDate: string;
  extractedData: {
    category?: string;
    testItems: TestItem[];
  };
  aiSummary: AISummary;
  createdAt: string;
}

export interface HealthEvent {
  id: string;
  userId: string;
  type: 'report' | 'appointment' | 'medicine' | 'symptom' | 'milestone';
  title: string;
  description: string;
  date: string;
  time?: string;
  sourceId?: string;
  tag?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  instructions: string;
  reminderTime: string;
  startDate: string;
  endDate?: string;
  status: 'taken' | 'pending';
  streakDays: number;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  notes: string;
  status: 'upcoming' | 'completed';
}

export interface SymptomLog {
  id: string;
  userId: string;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  date: string;
  time: string;
  notes: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  studentRole: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: string;
}
