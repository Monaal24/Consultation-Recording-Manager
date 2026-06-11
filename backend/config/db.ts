import fs from 'fs';
import path from 'path';

// Define the root storage folder
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface for Database schema
export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface IClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  notes: string;
  createdBy: string; // userId
}

export interface IConsultation {
  id: string;
  clientId: string;
  title: string;
  consultationDate: string; // ISO date string
  consultationType: string; // Video, Phone, In-Person, etc.
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  description: string;
  notes: string;
  createdBy: string; // userId
}

export interface IRecording {
  id: string;
  consultationId: string;
  title: string;
  fileUrl: string; // relative or absolute url
  description: string;
  tags: string[];
  uploadDate: string;
  duration: number; // in seconds
}

export interface INote {
  id: string;
  consultationId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface IDatabaseSchema {
  users: IUser[];
  clients: IClient[];
  consultations: IConsultation[];
  recordings: IRecording[];
  notes: INote[];
}

// Initial seed data if database file does not exist
const initialDb: IDatabaseSchema = {
  users: [
    {
      id: "u-demo",
      name: "Dr. Catherine Shaw",
      email: "demo@consult.com",
      passwordHash: "$2a$10$U.GvPj7nZkZ1D1WbUuP1Iuu8sN5tN6oF1Rpq7fT9M3hXUeB1xN9Ki" // password: "password123"
    }
  ],
  clients: [
    {
      id: "c-1",
      name: "Marcus Vance",
      email: "marcus.vance@gmail.com",
      phone: "+1 (555) 123-4567",
      age: 42,
      gender: "Male",
      address: "1482 Pine Needle Dr, Seattle, WA",
      notes: "Client requested bi-weekly astrological & career guidance sessions. Focuses heavily on planetary transitions.",
      createdBy: "u-demo"
    },
    {
      id: "c-2",
      name: "Elena Rostova",
      email: "elena.rostova@outlook.com",
      phone: "+1 (555) 987-6543",
      age: 31,
      gender: "Female",
      address: "740 Greenwich St, New York, NY",
      notes: "Consulting on structural business legal strategy and IP drafting for tech-startup venture.",
      createdBy: "u-demo"
    },
    {
      id: "c-3",
      name: "David Chen",
      email: "dchen@techventures.io",
      phone: "+1 (555) 456-7890",
      age: 28,
      gender: "Male",
      address: "244 Brannan St, San Francisco, CA",
      notes: "Counseling client for startup stress management, work-life balance, and focus workflows.",
      createdBy: "u-demo"
    }
  ],
  consultations: [
    {
      id: "con-1",
      clientId: "c-1",
      title: "Natal Chart Career Mapping",
      consultationDate: "2026-06-02T10:00:00Z",
      consultationType: "Video",
      status: "Completed",
      description: "Deep dive session regarding Saturn return and mid-career progression alignment.",
      notes: "Marcus is highly satisfied. We discussed shifting roles towards management in late Q3. Highlighted Neptune-Midheaven aspects.",
      createdBy: "u-demo"
    },
    {
      id: "con-2",
      clientId: "c-2",
      title: "SaaS IP Protection Strategy",
      consultationDate: "2026-06-05T14:30:00Z",
      consultationType: "In-Person",
      status: "Completed",
      description: "Reviewing proprietary algorithms protection and preparing patent application schemas.",
      notes: "Elena provided technical diagrams. Discussed non-disclosure forms with third party contractors and copyright strategies.",
      createdBy: "u-demo"
    },
    {
      id: "con-3",
      clientId: "c-3",
      title: "Anxiety & Hyperfocus Alignment",
      consultationDate: "2026-06-10T11:00:00Z",
      consultationType: "Phone",
      status: "Completed",
      description: "Addressing somatic tension under heavy deployment cycles and product launch pressures.",
      notes: "Introduced box breathing and physical anchors. Scheduled followup for next week.",
      createdBy: "u-demo"
    },
    {
      id: "con-4",
      clientId: "c-1",
      title: "Mid-Year Financial Eclipse Briefing",
      consultationDate: "2026-06-15T09:00:00Z",
      consultationType: "Video",
      status: "Scheduled",
      description: "Analyzing upcoming astronomical alignments on portfolio management strategies.",
      notes: "Needs prior review of planetary transits charts.",
      createdBy: "u-demo"
    }
  ],
  recordings: [
    {
      id: "r-1",
      consultationId: "con-1",
      title: "Marcus Natal Chart Deep Dive",
      fileUrl: "/uploads/marcus-natal-chart.mp3",
      description: "High fidelity audio of the astrology chart reading and career transit alignment.",
      tags: ["Astrology", "Career", "Saturn"],
      uploadDate: "2026-06-02T11:15:00Z",
      duration: 148 // 2 mins 28s
    },
    {
      id: "r-2",
      consultationId: "con-2",
      title: "Elena SaaS Legal IP Alignment",
      fileUrl: "/uploads/elena-saas-legal.mp3",
      description: "Audio session covering patent application details and corporate NDA protocols.",
      tags: ["Legal", "SaaS", "IP"],
      uploadDate: "2026-06-05T15:45:00Z",
      duration: 215 // 3 mins 35s
    },
    {
      id: "r-3",
      consultationId: "con-3",
      title: "David Stress Anchoring Session",
      fileUrl: "/uploads/david-stress-anchors.mp3",
      description: "Audio of the box-breathing somatic anchoring instruction and stress mitigation steps.",
      tags: ["Counseling", "Mental-Health", "Startup"],
      uploadDate: "2026-06-10T11:50:00Z",
      duration: 180 // 3:00
    }
  ],
  notes: [
    {
      id: "n-1",
      consultationId: "con-1",
      title: "Midheaven Aspect Notes",
      content: "Ensure to map Saturn conjunction trajectory with natal Midheaven for Marcus before next review. He shows high resonance with spiritual aspects of leadership.",
      createdAt: "2026-06-02T11:30:00Z"
    },
    {
      id: "n-2",
      consultationId: "con-2",
      title: "NDA Template To Send",
      content: "Send sample software development non-disclosure agreement to Elena by tomorrow noon. Add dynamic schedule rider specifying IP assignments.",
      createdAt: "2026-06-05T16:00:00Z"
    },
    {
      id: "n-3",
      consultationId: "con-3",
      title: "Box Breathing Visual Guide",
      content: "Email David the SVG animation or printable diagram for 4-4-4-4 box breathing to post near his workspace.",
      createdAt: "2026-06-10T12:00:00Z"
    }
  ]
};

// Make sure the data directory and db file exist
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    console.log('[DB] Database file initialized with seed data!');
  } else {
    // Read and parse to ensure it's valid
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      JSON.parse(content);
      console.log('[DB] Database loaded successfully.');
    } catch (e) {
      console.error('[DB] Database file was corrupted. Re-initializing...', e);
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    }
  }

  // Create standard uploads folder if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Low-level DB access
export function readDB(): IDatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initDB();
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[DB] Error reading from DB', error);
    return initialDb;
  }
}

export function writeDB(data: IDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[DB] Error writing to DB', error);
  }
}

// Unique string ID generator
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36).substr(-4)}`;
}
