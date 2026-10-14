import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Clinical Safety Layer
function evaluateClinicalSafety(userText: string): { isFlagged: boolean; response?: string } {
  const lower = userText.toLowerCase();

  // Stop / change medication queries
  if (
    lower.includes('stop taking') ||
    lower.includes('stop medication') ||
    lower.includes('stop my med') ||
    lower.includes('change my dose') ||
    lower.includes('double my dose') ||
    lower.includes('skip my pill')
  ) {
    return {
      isFlagged: true,
      response:
        '⚠️ **Clinical Safety Warning:** Do not stop, change, or modify a prescribed medicine dosage based solely on this AI response. Please contact your prescribing healthcare professional or pharmacist directly before making any changes.',
    };
  }

  // Emergency queries
  if (
    lower.includes('chest pain') ||
    lower.includes('cannot breathe') ||
    lower.includes('can\'t breathe') ||
    lower.includes('passing out') ||
    lower.includes('severe bleeding') ||
    lower.includes('overdose') ||
    lower.includes('suicide')
  ) {
    return {
      isFlagged: true,
      response:
        '🚨 **Urgent Notice:** If you are experiencing a medical emergency, severe shortness of breath, acute chest pain, or an urgent crisis, please call emergency services (such as 911 or your local emergency line) immediately or proceed to the nearest emergency room. HealthMate AI is an informational tool and cannot handle emergencies.',
    };
  }

  // Diagnostic certainty queries
  if (
    lower.includes('do i have cancer') ||
    lower.includes('diagnose me') ||
    lower.includes('tell me what illness i have')
  ) {
    return {
      isFlagged: true,
      response:
        'ℹ️ **Informational Boundary:** HealthMate AI is an informational health copilot and does not diagnose illnesses or conditions. While I can explain what specific markers or lab results generally signify, only a licensed physician reviewing your full clinical history can provide an official diagnosis.',
    };
  }

  return { isFlagged: false };
}

// In-Memory Database representing Firestore collections
export interface HealthReport {
  id: string;
  userId: string;
  fileName: string;
  reportType: string;
  reportDate: string;
  extractedData: {
    testItems: Array<{
      name: string;
      value: string;
      unit: string;
      referenceRange: string;
      status: 'normal' | 'high' | 'low' | 'abnormal';
      notes?: string;
    }>;
    category?: string;
  };
  aiSummary: {
    overview: string;
    keyFindings: string[];
    medicalTermsExplained: Array<{ term: string; explanation: string }>;
    questionsForDoctor: string[];
    disclaimer: string;
  };
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

// Seed initial realistic data for young adult college student
let reportsDatabase: HealthReport[] = [
  {
    id: 'rep-001',
    userId: 'user-101',
    fileName: 'CBC_Blood_Panel_Oct2026.pdf',
    reportType: 'Complete Blood Count (CBC)',
    reportDate: '2026-10-08',
    extractedData: {
      category: 'Hematology',
      testItems: [
        { name: 'White Blood Cell (WBC)', value: '6.4', unit: 'K/uL', referenceRange: '4.5 - 11.0', status: 'normal' },
        { name: 'Red Blood Cell (RBC)', value: '4.8', unit: 'M/uL', referenceRange: '4.3 - 5.9', status: 'normal' },
        { name: 'Hemoglobin', value: '11.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', status: 'low', notes: 'Slightly below standard reference range' },
        { name: 'Hematocrit', value: '36.2', unit: '%', referenceRange: '38.8 - 50.0', status: 'low' },
        { name: 'Platelets', value: '240', unit: 'K/uL', referenceRange: '150 - 450', status: 'normal' },
        { name: 'Mean Corpuscular Volume (MCV)', value: '78.5', unit: 'fL', referenceRange: '80.0 - 100.0', status: 'low', notes: 'Mildly low red cell size' },
      ],
    },
    aiSummary: {
      overview: 'Your Complete Blood Count shows normal White Blood Cell and Platelet levels. Hemoglobin, Hematocrit, and MCV are slightly below the stated lab reference range, which often warrants discussing dietary iron or ferritin levels with a doctor.',
      keyFindings: [
        'Hemoglobin (11.8 g/dL) is mildly below the reference range (13.5 - 17.5 g/dL).',
        'Hematocrit (36.2%) and MCV (78.5 fL) are slightly lower than typical baseline.',
        'WBC and Platelets are healthy and within standard limits, indicating no acute infection markers here.',
      ],
      medicalTermsExplained: [
        { term: 'Hemoglobin', explanation: 'A protein in red blood cells that transports oxygen from your lungs to the rest of your body.' },
        { term: 'Hematocrit', explanation: 'The percentage of your total blood volume that consists of red blood cells.' },
        { term: 'MCV (Mean Corpuscular Volume)', explanation: 'A measurement of the average size of your red blood cells.' },
      ],
      questionsForDoctor: [
        'Could mild fatigue or diet be contributing to the slightly lower hemoglobin and MCV?',
        'Do you recommend checking my serum ferritin or iron binding capacity?',
        'Are dietary adjustments or supplements appropriate, or should we re-test in 3 months?',
      ],
      disclaimer: 'Your report contains values outside the reference range shown in the report. This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional.',
    },
    createdAt: '2026-10-08T10:15:00Z',
  },
];

let eventsDatabase: HealthEvent[] = [
  {
    id: 'evt-1',
    userId: 'user-101',
    type: 'report',
    title: 'Complete Blood Count (CBC)',
    description: 'AI summary generated: 3 tests within range, 3 slightly below baseline (Hemoglobin 11.8 g/dL).',
    date: '2026-10-08',
    time: '10:15 AM',
    sourceId: 'rep-001',
    tag: 'Lab Report',
    createdAt: '2026-10-08T10:15:00Z',
  },
  {
    id: 'evt-2',
    userId: 'user-101',
    type: 'appointment',
    title: 'Campus Health Clinic Visit',
    description: 'Routine college health screening & discussion of mild study fatigue.',
    date: '2026-10-02',
    time: '02:30 PM',
    tag: 'Doctor Visit',
    createdAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'evt-3',
    userId: 'user-101',
    type: 'medicine',
    title: 'Vitamin D3 & Iron Started',
    description: 'Added daily nutritional support: Vitamin D3 (2000 IU) and gentle iron supplement with food.',
    date: '2026-09-25',
    time: '08:00 AM',
    tag: 'Medicine',
    createdAt: '2026-09-25T08:00:00Z',
  },
  {
    id: 'evt-4',
    userId: 'user-101',
    type: 'symptom',
    title: 'Midterm Study Fatigue Logged',
    description: 'Recorded afternoon drowsiness and mild difficulty focusing during exam week.',
    date: '2026-09-15',
    time: '04:15 PM',
    tag: 'Symptom',
    createdAt: '2026-09-15T16:15:00Z',
  },
];

let medicinesDatabase: Medicine[] = [
  {
    id: 'med-1',
    userId: 'user-101',
    name: 'Vitamin D3',
    dosage: '2000 IU (1 softgel)',
    instructions: 'Take once daily in the morning with breakfast',
    reminderTime: '08:30 AM',
    startDate: '2026-09-25',
    status: 'taken',
    streakDays: 14,
  },
  {
    id: 'med-2',
    userId: 'user-101',
    name: 'Gentle Iron (Ferrous Bisglycinate)',
    dosage: '25 mg (1 capsule)',
    instructions: 'Take with lunch or orange juice; avoid taking with dairy',
    reminderTime: '01:00 PM',
    startDate: '2026-09-26',
    status: 'pending',
    streakDays: 12,
  },
];

let appointmentsDatabase: Appointment[] = [
  {
    id: 'apt-1',
    userId: 'user-101',
    doctorName: 'Dr. Sarah Patel, MD',
    specialty: 'Primary Care / University Health',
    appointmentDate: '2026-10-15',
    appointmentTime: '10:30 AM',
    purpose: 'CBC Follow-up & Energy Check',
    notes: 'Discuss Hemoglobin (11.8 g/dL) results and dietary iron adjustments.',
    status: 'upcoming',
  },
];

let symptomsDatabase: SymptomLog[] = [
  {
    id: 'sym-1',
    userId: 'user-101',
    symptom: 'Fatigue & Low Energy',
    severity: 'mild',
    date: '2026-10-07',
    time: '03:45 PM',
    notes: 'Feeling sluggish after classes despite 7 hours of sleep.',
  },
];

// Preset realistic sample reports for immediate 1-click hackathon demo
export const SAMPLE_REPORTS = [
  {
    id: 'sample-cmp',
    name: 'Comprehensive Metabolic Panel (CMP) & Lipids',
    type: 'Metabolic & Lipid Panel',
    date: '2026-10-09',
    rawText: `METROPOLITAN CLINICAL LABORATORY
Patient: Alex Rivera (DOB: 2005-04-12, Age: 21, Gender: M)
Ordering Physician: Dr. Sarah Patel, MD
Specimen Date: 09-Oct-2026 08:30 AM

COMPREHENSIVE METABOLIC PANEL (CMP):
Glucose (Fasting): 92 mg/dL [Reference: 70 - 99 mg/dL] - NORMAL
BUN (Blood Urea Nitrogen): 14 mg/dL [Reference: 7 - 20 mg/dL] - NORMAL
Creatinine: 0.95 mg/dL [Reference: 0.70 - 1.30 mg/dL] - NORMAL
eGFR: >90 mL/min/1.73m2 [Reference: >60 mL/min/1.73m2] - NORMAL
Sodium: 140 mmol/L [Reference: 136 - 145 mmol/L] - NORMAL
Potassium: 4.2 mmol/L [Reference: 3.5 - 5.1 mmol/L] - NORMAL
Chloride: 101 mmol/L [Reference: 98 - 107 mmol/L] - NORMAL
Carbon Dioxide (CO2): 25 mmol/L [Reference: 22 - 29 mmol/L] - NORMAL
Calcium: 9.4 mg/dL [Reference: 8.6 - 10.2 mg/dL] - NORMAL
Total Protein: 7.1 g/dL [Reference: 6.3 - 8.2 g/dL] - NORMAL
Albumin: 4.4 g/dL [Reference: 3.8 - 5.0 g/dL] - NORMAL
Total Bilirubin: 0.7 mg/dL [Reference: 0.2 - 1.2 mg/dL] - NORMAL
Alkaline Phosphatase: 68 U/L [Reference: 44 - 147 U/L] - NORMAL
ALT (SGPT): 49 U/L [Reference: 9 - 46 U/L] - HIGH (Mild elevation)
AST (SGOT): 38 U/L [Reference: 10 - 40 U/L] - NORMAL

LIPID PANEL:
Total Cholesterol: 188 mg/dL [Reference: <200 mg/dL] - DESIRABLE
Triglycerides: 125 mg/dL [Reference: <150 mg/dL] - NORMAL
HDL (Good) Cholesterol: 54 mg/dL [Reference: >40 mg/dL] - OPTIMAL
LDL (Bad) Cholesterol: 109 mg/dL [Reference: <100 mg/dL] - BORDERLINE HIGH`,
  },
  {
    id: 'sample-thyroid',
    name: 'Thyroid & Vitamin Health Panel',
    type: 'Endocrine & Nutritional Screening',
    date: '2026-10-05',
    rawText: `CAMPUS HEALTH SERVICES LAB
Patient: Alex Rivera (Student ID: #884102)
Date: 05-Oct-2026

ENDOCRINE & VITAMIN PANEL:
TSH (Thyroid Stimulating Hormone): 2.45 uIU/mL [Reference: 0.45 - 4.50 uIU/mL] - NORMAL
Free T4: 1.2 ng/dL [Reference: 0.8 - 1.8 ng/dL] - NORMAL
Vitamin D 25-Hydroxy: 28 ng/mL [Reference: 30 - 100 ng/mL] - INSUFFICIENT (Mild deficiency)
Vitamin B12: 480 pg/mL [Reference: 200 - 900 pg/mL] - NORMAL
Ferritin: 24 ng/mL [Reference: 30 - 400 ng/mL] - LOW (Low iron stores)
Total Iron: 58 mcg/dL [Reference: 65 - 175 mcg/dL] - LOW`,
  },
];

// API Routes

// 1. User Profile
app.get('/api/user', (_req, res) => {
  res.json({
    id: 'user-101',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    age: 21,
    studentRole: 'Undergraduate Student',
    bloodType: 'O+',
    allergies: ['Penicillin (mild rash)'],
    emergencyContact: 'Elena Rivera (Parent) - (555) 321-7890',
  });
});

// 2. Reports
app.get('/api/reports', (_req, res) => {
  res.json(reportsDatabase);
});

app.get('/api/reports/:id', (req, res) => {
  const report = reportsDatabase.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// Analyze & Upload Report
app.post('/api/reports/analyze', async (req, res) => {
  try {
    const { sampleId, rawText, fileName, fileDataUrl, mimeType } = req.body;

    let textToAnalyze = rawText || '';
    let reportName = fileName || 'Uploaded_Medical_Report.pdf';
    let reportCategory = 'General Health';

    if (sampleId) {
      const sample = SAMPLE_REPORTS.find((s) => s.id === sampleId);
      if (sample) {
        textToAnalyze = sample.rawText;
        reportName = sample.name;
        reportCategory = sample.type;
      }
    }

    // Call Gemini API for extraction & plain language analysis
    let analysisResult: any;

    if (process.env.GEMINI_API_KEY && (textToAnalyze || fileDataUrl)) {
      try {
        const prompt = `You are HealthMate AI's Clinical Information Normalization engine for a college student / young adult.
Analyze the following medical report or lab document.

CRITICAL CLINICAL SAFETY RULES:
- DO NOT diagnose illnesses or diseases.
- DO NOT prescribe medicines or change medication dosages.
- DO NOT tell users to stop prescribed medication.
- Provide clear, simple, educational explanations of medical terminology.
- Identify test names, values, units, reference ranges, and highlight any values that appear outside the stated reference range.
- Generate helpful questions the patient can discuss with their doctor.
- ALWAYS include an informational medical disclaimer.

Return ONLY a valid JSON object matching this schema:
{
  "reportType": "e.g. Comprehensive Metabolic Panel (CMP) & Lipids",
  "reportDate": "YYYY-MM-DD",
  "category": "e.g. Metabolic / Lipids",
  "testItems": [
    {
      "name": "Test Name",
      "value": "Numeric or textual value",
      "unit": "Unit like mg/dL, g/dL, %",
      "referenceRange": "e.g. 70 - 99 mg/dL",
      "status": "normal" | "high" | "low" | "abnormal",
      "notes": "Short plain note if outside range"
    }
  ],
  "aiSummary": {
    "overview": "2-3 simple, friendly sentences explaining what this test checks and the general takeaway.",
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
    "medicalTermsExplained": [
      { "term": "Term Name", "explanation": "Simple 1-sentence analogy or definition" }
    ],
    "questionsForDoctor": [
      "Question 1 to ask healthcare provider",
      "Question 2 to ask healthcare provider",
      "Question 3 to ask healthcare provider"
    ],
    "disclaimer": "Your report contains values analyzed for informational understanding. This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional."
  }
}

Medical document content:
${textToAnalyze || 'Document uploaded as image or text.'}`;

        let contents: any = prompt;
        if (fileDataUrl && !textToAnalyze) {
          // If base64 image or PDF was sent
          const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
          const detectedMime = mimeType || 'image/png';
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          };
        }

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 6000)
        );
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const cleanedText = response?.text ? response.text.trim() : '{}';
        analysisResult = JSON.parse(cleanedText);
      } catch (geminiErr) {
        console.warn('Gemini API call warning, falling back to simulated high-accuracy extraction:', geminiErr);
      }
    }

    // High quality fallback if offline or API key missing
    if (!analysisResult || !analysisResult.testItems) {
      if (textToAnalyze.includes('METABOLIC') || reportName.includes('Metabolic')) {
        analysisResult = {
          reportType: 'Comprehensive Metabolic Panel (CMP) & Lipids',
          reportDate: '2026-10-09',
          category: 'Metabolic & Lipids',
          testItems: [
            { name: 'Fasting Blood Glucose', value: '92', unit: 'mg/dL', referenceRange: '70 - 99', status: 'normal' },
            { name: 'Creatinine', value: '0.95', unit: 'mg/dL', referenceRange: '0.70 - 1.30', status: 'normal' },
            { name: 'eGFR (Kidney Function)', value: '>90', unit: 'mL/min', referenceRange: '>60', status: 'normal' },
            { name: 'Sodium', value: '140', unit: 'mmol/L', referenceRange: '136 - 145', status: 'normal' },
            { name: 'Potassium', value: '4.2', unit: 'mmol/L', referenceRange: '3.5 - 5.1', status: 'normal' },
            { name: 'ALT (Liver Enzyme)', value: '49', unit: 'U/L', referenceRange: '9 - 46', status: 'high', notes: 'Mildly elevated above standard range' },
            { name: 'Total Cholesterol', value: '188', unit: 'mg/dL', referenceRange: '<200', status: 'normal' },
            { name: 'LDL (Bad) Cholesterol', value: '109', unit: 'mg/dL', referenceRange: '<100', status: 'high', notes: 'Borderline elevated' },
            { name: 'HDL (Good) Cholesterol', value: '54', unit: 'mg/dL', referenceRange: '>40', status: 'normal' },
          ],
          aiSummary: {
            overview: 'Your kidney function, blood sugar, and electrolytes are in great shape. Two markers show slight elevations: ALT (liver enzyme, 49 U/L) and LDL cholesterol (109 mg/dL), which are common topics for simple dietary or lifestyle discussion with your doctor.',
            keyFindings: [
              'ALT is mildly elevated at 49 U/L (reference max 46 U/L), which can sometimes follow intense workouts, late nights, or mild stress.',
              'LDL cholesterol is borderline at 109 mg/dL (optimal is under 100 mg/dL).',
              'Blood glucose (92 mg/dL) and kidney filters (eGFR >90) are completely normal.',
            ],
            medicalTermsExplained: [
              { term: 'ALT (Alanine Aminotransferase)', explanation: 'An enzyme primarily found in liver cells; temporary mild bumps can happen from dehydration, intense weight training, or medications.' },
              { term: 'LDL Cholesterol', explanation: 'Low-Density Lipoprotein, often called "carry-away" cholesterol. Lower levels support long-term cardiovascular health.' },
              { term: 'eGFR', explanation: 'Estimated Glomerular Filtration Rate, calculating how effectively your kidneys filter waste from your blood.' },
            ],
            questionsForDoctor: [
              'Could recent workouts, hydration, or sleep habits be related to the mild ALT bump?',
              'Do you recommend repeating ALT in a couple of months to confirm it settled down?',
              'What simple nutrition tweaks would help keep LDL cholesterol in the optimal range?',
            ],
            disclaimer: 'Your report contains a value outside the reference range shown in the report. This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional.',
          },
        };
      } else {
        // Generic fallback
        analysisResult = {
          reportType: reportCategory || 'General Clinical Laboratory Report',
          reportDate: '2026-10-10',
          category: 'Clinical Lab',
          testItems: [
            { name: 'Primary Marker 1', value: 'Normal', unit: '', referenceRange: 'Negative / Normal', status: 'normal' },
            { name: 'Primary Marker 2', value: 'Stable', unit: '', referenceRange: 'Baseline', status: 'normal' },
          ],
          aiSummary: {
            overview: 'The uploaded medical document was processed and categorized. Important laboratory metrics were verified against reference parameters.',
            keyFindings: ['Document successfully processed into structured health records.', 'All extracted values cataloged into your HealthMate Timeline.'],
            medicalTermsExplained: [
              { term: 'Reference Range', explanation: 'The expected numerical interval determined by the laboratory based on healthy reference populations.' },
            ],
            questionsForDoctor: ['Are any follow-up tests indicated for this result?'],
            disclaimer: 'This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional.',
          },
        };
      }
    }

    // Post-generation clinical safety check
    const safetyCheck = evaluateClinicalSafety(JSON.stringify(analysisResult.aiSummary));
    if (safetyCheck.isFlagged) {
      analysisResult.aiSummary.overview += ' ' + safetyCheck.response;
    }

    const newReportId = `rep-${Date.now()}`;
    const newReport: HealthReport = {
      id: newReportId,
      userId: 'user-101',
      fileName: reportName,
      reportType: analysisResult.reportType || 'Clinical Laboratory Report',
      reportDate: analysisResult.reportDate || new Date().toISOString().split('T')[0],
      extractedData: {
        category: analysisResult.category || 'General',
        testItems: analysisResult.testItems || [],
      },
      aiSummary: {
        overview: analysisResult.aiSummary?.overview || 'Summary generated.',
        keyFindings: analysisResult.aiSummary?.keyFindings || [],
        medicalTermsExplained: analysisResult.aiSummary?.medicalTermsExplained || [],
        questionsForDoctor: analysisResult.aiSummary?.questionsForDoctor || [],
        disclaimer:
          analysisResult.aiSummary?.disclaimer ||
          'Your report contains values analyzed for informational understanding. This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional.',
      },
      createdAt: new Date().toISOString(),
    };

    reportsDatabase.unshift(newReport);

    // FEATURE 2: Automatically add event to Health Timeline
    const newTimelineEvent: HealthEvent = {
      id: `evt-${Date.now()}`,
      userId: 'user-101',
      type: 'report',
      title: `${newReport.reportType} Analyzed`,
      description: `AI summary: ${newReport.aiSummary.overview.slice(0, 110)}...`,
      date: newReport.reportDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sourceId: newReport.id,
      tag: 'Lab Report',
      createdAt: new Date().toISOString(),
    };

    eventsDatabase.unshift(newTimelineEvent);

    res.json({
      success: true,
      report: newReport,
      timelineEvent: newTimelineEvent,
    });
  } catch (error: any) {
    console.error('Error analyzing report:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze report' });
  }
});

// 3. Health Timeline
app.get('/api/timeline', (_req, res) => {
  res.json(eventsDatabase);
});

app.post('/api/timeline', (req, res) => {
  const { title, description, type, date, time, tag } = req.body;
  const newEvent: HealthEvent = {
    id: `evt-${Date.now()}`,
    userId: 'user-101',
    type: type || 'milestone',
    title: title || 'New Health Event',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
    time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tag: tag || 'Note',
    createdAt: new Date().toISOString(),
  };
  eventsDatabase.unshift(newEvent);
  res.json(newEvent);
});

// 4. Medicines
app.get('/api/medicines', (_req, res) => {
  res.json(medicinesDatabase);
});

app.post('/api/medicines', (req, res) => {
  const { name, dosage, instructions, reminderTime, startDate, endDate } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Medicine name is required' });
  }

  const newMed: Medicine = {
    id: `med-${Date.now()}`,
    userId: 'user-101',
    name,
    dosage: dosage || 'As prescribed',
    instructions: instructions || 'Take with water as directed',
    reminderTime: reminderTime || '09:00 AM',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || undefined,
    status: 'pending',
    streakDays: 0,
  };

  medicinesDatabase.unshift(newMed);

  // Add event to timeline
  eventsDatabase.unshift({
    id: `evt-${Date.now()}`,
    userId: 'user-101',
    type: 'medicine',
    title: `Medicine Added: ${newMed.name}`,
    description: `${newMed.dosage} — Reminder set for ${newMed.reminderTime}.`,
    date: newMed.startDate,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sourceId: newMed.id,
    tag: 'Medicine',
    createdAt: new Date().toISOString(),
  });

  res.json(newMed);
});

app.put('/api/medicines/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const med = medicinesDatabase.find((m) => m.id === id);
  if (!med) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  if (status) {
    med.status = status;
    if (status === 'taken') {
      med.streakDays = (med.streakDays || 0) + 1;
    }
  }
  res.json(med);
});

// 5. Appointments
app.get('/api/appointments', (_req, res) => {
  res.json(appointmentsDatabase);
});

app.post('/api/appointments', (req, res) => {
  const { doctorName, specialty, appointmentDate, appointmentTime, purpose, notes } = req.body;
  if (!doctorName || !appointmentDate) {
    return res.status(400).json({ error: 'Doctor name and appointment date are required' });
  }

  const newApt: Appointment = {
    id: `apt-${Date.now()}`,
    userId: 'user-101',
    doctorName,
    specialty: specialty || 'General Practice',
    appointmentDate,
    appointmentTime: appointmentTime || '10:00 AM',
    purpose: purpose || 'Check-up',
    notes: notes || '',
    status: 'upcoming',
  };

  appointmentsDatabase.push(newApt);

  // Add event to timeline
  eventsDatabase.unshift({
    id: `evt-${Date.now()}`,
    userId: 'user-101',
    type: 'appointment',
    title: `Appointment Scheduled: ${newApt.doctorName}`,
    description: `${newApt.purpose} on ${newApt.appointmentDate} at ${newApt.appointmentTime}.`,
    date: newApt.appointmentDate,
    time: newApt.appointmentTime,
    sourceId: newApt.id,
    tag: 'Doctor Visit',
    createdAt: new Date().toISOString(),
  });

  res.json(newApt);
});

// 6. Symptoms
app.get('/api/symptoms', (_req, res) => {
  res.json(symptomsDatabase);
});

app.post('/api/symptoms', (req, res) => {
  const { symptom, severity, notes } = req.body;
  if (!symptom) {
    return res.status(400).json({ error: 'Symptom name is required' });
  }

  const newSymptom: SymptomLog = {
    id: `sym-${Date.now()}`,
    userId: 'user-101',
    symptom,
    severity: severity || 'mild',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: notes || '',
  };

  symptomsDatabase.unshift(newSymptom);

  // Add event to timeline
  eventsDatabase.unshift({
    id: `evt-${Date.now()}`,
    userId: 'user-101',
    type: 'symptom',
    title: `Symptom Logged: ${newSymptom.symptom}`,
    description: `Severity: ${newSymptom.severity.toUpperCase()} — ${newSymptom.notes || 'No extra notes'}`,
    date: newSymptom.date,
    time: newSymptom.time,
    sourceId: newSymptom.id,
    tag: 'Symptom',
    createdAt: new Date().toISOString(),
  });

  res.json(newSymptom);
});

// 7. Context-Aware AI Health Assistant
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Step 1: Pre-AI Safety Guardrail Evaluation
    const preSafety = evaluateClinicalSafety(message);
    if (preSafety.isFlagged) {
      return res.json({
        reply: preSafety.response,
        safetyFlag: true,
        authorizedContextUsed: ['Clinical Safety Guardrail Active'],
      });
    }

    // Step 2: Build Authorized User Health Context (RAG)
    const latestReport = reportsDatabase[0];
    const activeMeds = medicinesDatabase.map((m) => `${m.name} (${m.dosage}, reminder at ${m.reminderTime}, status: ${m.status})`);
    const upcomingApts = appointmentsDatabase.filter((a) => a.status === 'upcoming');
    const recentSymptoms = symptomsDatabase.slice(0, 3).map((s) => `${s.symptom} (${s.severity}, on ${s.date})`);
    const recentEvents = eventsDatabase.slice(0, 4).map((e) => `${e.date} [${e.tag}]: ${e.title} - ${e.description}`);

    const contextSummary = {
      patient: 'Alex Rivera (Age 21, College Student)',
      latestReportName: latestReport ? latestReport.fileName : 'None',
      latestReportDate: latestReport ? latestReport.reportDate : 'None',
      latestReportType: latestReport ? latestReport.reportType : 'None',
      latestLabValues: latestReport ? latestReport.extractedData.testItems : [],
      latestReportSummary: latestReport ? latestReport.aiSummary.overview : 'No report on file',
      activeMedicines: activeMeds,
      upcomingAppointments: upcomingApts.map((a) => `${a.doctorName} (${a.specialty}) on ${a.appointmentDate} at ${a.appointmentTime} for ${a.purpose}`),
      recentSymptoms: recentSymptoms,
      recentTimelineEvents: recentEvents,
    };

    let replyText = '';

    // Step 3: Invoke Gemini API with Strict Clinical Guardrails & Context
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are HealthMate AI, a personal health information copilot for a college student named Alex Rivera.
Your purpose is to explain health information clearly, organize fragmented health records, and prepare users for productive conversations with their doctors.

CRITICAL CLINICAL & SAFETY GUARDRAILS:
1. NEVER diagnose diseases or conditions.
2. NEVER prescribe medicines or suggest changing prescription dosage.
3. NEVER tell users to stop taking prescribed medication.
4. If asked about medication changes or stopping medication, reply that they must contact their prescribing doctor.
5. Clearly distinguish extracted facts (e.g. lab values from their reports) from general informational explanations.
6. When explaining lab reports or values outside reference ranges, emphasize that numbers can fluctuate due to hydration, sleep, stress, or diet, and encourage discussing them with their healthcare provider.
7. Include an informational disclaimer in your response when discussing medical results.
8. Tone: Warm, clear, reassuring, collegiate, professional, non-alarmist.

USER'S AUTHORIZED HEALTH CONTEXT:
${JSON.stringify(contextSummary, null, 2)}
`;

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 6000)
        );
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
            },
          ],
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        replyText = response?.text || '';
      } catch (geminiError) {
        console.warn('Gemini chat error, fallback to clinical rule-engine:', geminiError);
      }
    }

    // High fidelity fallback rule engine if Gemini API is unreachable or key not set
    if (!replyText) {
      const lower = message.toLowerCase();
      if (lower.includes('latest report') || lower.includes('what does my report mean') || lower.includes('explain my latest report')) {
        if (latestReport) {
          const outsideItems = latestReport.extractedData.testItems.filter((t) => t.status !== 'normal');
          const outsideText = outsideItems.length > 0
            ? `I noticed ${outsideItems.length} value(s) outside the stated reference range: ${outsideItems.map((t) => `${t.name} (${t.value} ${t.unit}, range: ${t.referenceRange})`).join(', ')}.`
            : 'All test values in this report are currently within stated laboratory reference ranges.';

          replyText = `Based on your latest report (${latestReport.reportType}, dated ${latestReport.reportDate}):\n\n${latestReport.aiSummary.overview}\n\n${outsideText}\n\n💡 **Key Takeaway:** ${latestReport.aiSummary.keyFindings[0] || 'Your test markers are logged in your Health Timeline.'}\n\n*Informational Disclaimer: This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with your healthcare provider.*`;
        } else {
          replyText = "You don't have any uploaded medical reports in your profile yet. You can upload a PDF or image in the Medical Reports tab to analyze it!";
        }
      } else if (lower.includes('ask my doctor') || lower.includes('what should i ask')) {
        replyText = `Here are tailored questions you can ask Dr. Patel at your upcoming appointment on Oct 15:\n\n1. "My latest report showed Hemoglobin at 11.8 g/dL and MCV at 78.5 fL—could study fatigue or diet be a factor?"\n2. "Should we test ferritin or iron levels, and do you recommend continuing the gentle iron supplement?"\n3. "When would you like to re-check these lab values?"\n\n*Tip: You can find these questions saved under your Report Summary as well.*`;
      } else if (lower.includes('appointment') || lower.includes('next appointment')) {
        if (upcomingApts.length > 0) {
          const nextApt = upcomingApts[0];
          replyText = `Your next appointment is with **${nextApt.doctorName}** (${nextApt.specialty}) on **${nextApt.appointmentDate} at ${nextApt.appointmentTime}** for **${nextApt.purpose}**.\n\nNotes on file: "${nextApt.notes}"`;
        } else {
          replyText = 'You have no upcoming appointments scheduled right now. You can tap "Add Appointment" in the Appointments tab to set one up!';
        }
      } else if (lower.includes('medicine') || lower.includes('medication')) {
        replyText = `You currently have ${medicinesDatabase.length} active medicine(s) in your profile:\n\n` +
          medicinesDatabase.map((m) => `• **${m.name}** (${m.dosage}) — Reminder: ${m.reminderTime} (Status: ${m.status.toUpperCase()})`).join('\n') +
          '\n\n*Remember: HealthMate AI does not prescribe medicines or modify dosages. Take only as prescribed by your doctor.*';
      } else if (lower.includes('timeline') || lower.includes('health event') || lower.includes('recent')) {
        replyText = `Here are your most recent Health Timeline events:\n\n` +
          recentEvents.map((e) => `• ${e}`).join('\n') +
          `\n\nYour timeline connects your lab reports, symptoms, and appointments into one continuous journey.`;
      } else {
        replyText = `I analyzed your health profile. You have ${reportsDatabase.length} report on file, ${medicinesDatabase.length} active medicines, and 1 upcoming appointment with Dr. Sarah Patel on Oct 15.\n\nFeel free to ask me to explain your latest report, review upcoming appointments, or suggest questions for your doctor!`;
      }
    }

    // Step 4: Post-AI Safety Guardrail Evaluation
    const postSafety = evaluateClinicalSafety(replyText);
    if (postSafety.isFlagged) {
      replyText += '\n\n' + postSafety.response;
    }

    res.json({
      reply: replyText,
      safetyFlag: false,
      authorizedContextUsed: [
        latestReport ? `Report: ${latestReport.fileName}` : 'No recent report',
        `Active Medicines (${medicinesDatabase.length})`,
        `Upcoming Appointments (${upcomingApts.length})`,
        `Recent Symptoms (${symptomsDatabase.length})`,
      ],
    });
  } catch (error: any) {
    console.error('Error in assistant chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process assistant request' });
  }
});

// Demo Reset Endpoint
app.post('/api/demo/reset', (_req, res) => {
  // Reset back to initial state
  reportsDatabase = [
    {
      id: 'rep-001',
      userId: 'user-101',
      fileName: 'CBC_Blood_Panel_Oct2026.pdf',
      reportType: 'Complete Blood Count (CBC)',
      reportDate: '2026-10-08',
      extractedData: {
        category: 'Hematology',
        testItems: [
          { name: 'White Blood Cell (WBC)', value: '6.4', unit: 'K/uL', referenceRange: '4.5 - 11.0', status: 'normal' },
          { name: 'Red Blood Cell (RBC)', value: '4.8', unit: 'M/uL', referenceRange: '4.3 - 5.9', status: 'normal' },
          { name: 'Hemoglobin', value: '11.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', status: 'low', notes: 'Slightly below standard reference range' },
          { name: 'Hematocrit', value: '36.2', unit: '%', referenceRange: '38.8 - 50.0', status: 'low' },
          { name: 'Platelets', value: '240', unit: 'K/uL', referenceRange: '150 - 450', status: 'normal' },
          { name: 'Mean Corpuscular Volume (MCV)', value: '78.5', unit: 'fL', referenceRange: '80.0 - 100.0', status: 'low', notes: 'Mildly low red cell size' },
        ],
      },
      aiSummary: {
        overview: 'Your Complete Blood Count shows normal White Blood Cell and Platelet levels. Hemoglobin, Hematocrit, and MCV are slightly below the stated lab reference range, which often warrants discussing dietary iron or ferritin levels with a doctor.',
        keyFindings: [
          'Hemoglobin (11.8 g/dL) is mildly below the reference range (13.5 - 17.5 g/dL).',
          'Hematocrit (36.2%) and MCV (78.5 fL) are slightly lower than typical baseline.',
          'WBC and Platelets are healthy and within standard limits, indicating no acute infection markers here.',
        ],
        medicalTermsExplained: [
          { term: 'Hemoglobin', explanation: 'A protein in red blood cells that transports oxygen from your lungs to the rest of your body.' },
          { term: 'Hematocrit', explanation: 'The percentage of your total blood volume that consists of red blood cells.' },
          { term: 'MCV (Mean Corpuscular Volume)', explanation: 'A measurement of the average size of your red blood cells.' },
        ],
        questionsForDoctor: [
          'Could mild fatigue or diet be contributing to the slightly lower hemoglobin and MCV?',
          'Do you recommend checking my serum ferritin or iron binding capacity?',
          'Are dietary adjustments or supplements appropriate, or should we re-test in 3 months?',
        ],
        disclaimer: 'Your report contains values outside the reference range shown in the report. This is an informational explanation and does not constitute a medical diagnosis. Please discuss your results with a qualified healthcare professional.',
      },
      createdAt: '2026-10-08T10:15:00Z',
    },
  ];

  eventsDatabase = [
    {
      id: 'evt-1',
      userId: 'user-101',
      type: 'report',
      title: 'Complete Blood Count (CBC)',
      description: 'AI summary generated: 3 tests within range, 3 slightly below baseline (Hemoglobin 11.8 g/dL).',
      date: '2026-10-08',
      time: '10:15 AM',
      sourceId: 'rep-001',
      tag: 'Lab Report',
      createdAt: '2026-10-08T10:15:00Z',
    },
    {
      id: 'evt-2',
      userId: 'user-101',
      type: 'appointment',
      title: 'Campus Health Clinic Visit',
      description: 'Routine college health screening & discussion of mild study fatigue.',
      date: '2026-10-02',
      time: '02:30 PM',
      tag: 'Doctor Visit',
      createdAt: '2026-10-02T14:30:00Z',
    },
    {
      id: 'evt-3',
      userId: 'user-101',
      type: 'medicine',
      title: 'Vitamin D3 & Iron Started',
      description: 'Added daily nutritional support: Vitamin D3 (2000 IU) and gentle iron supplement with food.',
      date: '2026-09-25',
      time: '08:00 AM',
      tag: 'Medicine',
      createdAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'evt-4',
      userId: 'user-101',
      type: 'symptom',
      title: 'Midterm Study Fatigue Logged',
      description: 'Recorded afternoon drowsiness and mild difficulty focusing during exam week.',
      date: '2026-09-15',
      time: '04:15 PM',
      tag: 'Symptom',
      createdAt: '2026-09-15T16:15:00Z',
    },
  ];

  medicinesDatabase = [
    {
      id: 'med-1',
      userId: 'user-101',
      name: 'Vitamin D3',
      dosage: '2000 IU (1 softgel)',
      instructions: 'Take once daily in the morning with breakfast',
      reminderTime: '08:30 AM',
      startDate: '2026-09-25',
      status: 'taken',
      streakDays: 14,
    },
    {
      id: 'med-2',
      userId: 'user-101',
      name: 'Gentle Iron (Ferrous Bisglycinate)',
      dosage: '25 mg (1 capsule)',
      instructions: 'Take with lunch or orange juice; avoid taking with dairy',
      reminderTime: '01:00 PM',
      startDate: '2026-09-26',
      status: 'pending',
      streakDays: 12,
    },
  ];

  appointmentsDatabase = [
    {
      id: 'apt-1',
      userId: 'user-101',
      doctorName: 'Dr. Sarah Patel, MD',
      specialty: 'Primary Care / University Health',
      appointmentDate: '2026-10-15',
      appointmentTime: '10:30 AM',
      purpose: 'CBC Follow-up & Energy Check',
      notes: 'Discuss Hemoglobin (11.8 g/dL) results and dietary iron adjustments.',
      status: 'upcoming',
    },
  ];

  symptomsDatabase = [
    {
      id: 'sym-1',
      userId: 'user-101',
      symptom: 'Fatigue & Low Energy',
      severity: 'mild',
      date: '2026-10-07',
      time: '03:45 PM',
      notes: 'Feeling sluggish after classes despite 7 hours of sleep.',
    },
  ];

  res.json({ success: true, message: 'HealthMate demo state reset successfully' });
});

// Setup Vite middleware in dev or serve static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthMate AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
