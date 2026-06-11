export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  notes: string;
  createdBy: string;
}

export interface Consultation {
  id: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  title: string;
  consultationDate: string;
  consultationType: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  description: string;
  notes: string;
  createdBy: string;
}

export interface Recording {
  id: string;
  consultationId: string;
  consultationTitle?: string;
  clientName?: string;
  title: string;
  fileUrl: string;
  description: string;
  tags: string[];
  uploadDate: string;
  duration: number; // in seconds
}

export interface Note {
  id: string;
  consultationId: string;
  consultationTitle?: string;
  clientName?: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AISummary {
  transcription: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  nextSteps: string;
}
