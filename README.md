# Consultation Recording Manager (CRM.ai)

A centralized, responsive full-stack platform where professionals (consultants, doctors, counselors, lawyers, astrologers) can manage client files, record audio parameters, schedule meetings, and generate instant, high-fidelity AI summaries of their consultations.

## Core Features

- 👤 **Professional User Onboarding**: Instant registration & JWT credentials authentication.
- 🗃️ **Comprehensive Client CRM**: Complete database logs, demographics (age, gender), searching query filtration, and dynamic profile panels.
- 📅 **Session Schedulers**: Status codes (Scheduled, Completed, Cancelled), meeting notes, and direct links to recording archives.
- 🎙️ **Rich Audio Player**: Browser-based audio tracker, timeline slide-bars, physical file downloads, and click/drag-and-drop file uploaders.
- 🧠 **Gemini AI Summary Engine**: Automated summaries, key actions, highlight points, transcription snapshots, and future step transits.
- 📊 **Dashboard Visualizer**: Dynamic visual area flow charts and monthly analytics trackers using Recharts.

---

## Architectural Layout

```bash
├── backend/
│   ├── config/
│   │   └── db.ts             # File DB engine with pre-seeded professionals details
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── clientController.ts
│   │   ├── consultationController.ts
│   │   ├── noteController.ts
│   │   └── recordingController.ts
│   ├── middleware/
│   │   └── auth.ts           # Bearer JWT Authentication checks
│   ├── models/               # Multi-tenant secured models
│   │   ├── client.ts
│   │   ├── consultation.ts
│   │   ├── note.ts
│   │   ├── recording.ts
│   │   └── user.ts
│   └── routes/
│       └── index.ts          # Express REST Endpoints mapping
├── src/
│   ├── components/           # Isolated views
│   │   ├── AuthLayout.tsx
│   │   ├── ClientsView.tsx
│   │   ├── ConsultationsView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── NotesView.tsx
│   │   ├── RecordingsView.tsx
│   │   └── SettingsView.tsx
│   ├── context/
│   │   └── AuthContext.tsx  # Dynamic token preservation
│   ├── services/
│   │   └── api.ts            # Axios configuration
│   ├── App.tsx
│   ├── index.css
│   └── types.ts
├── server.ts                 # Full-stack master express server
└── package.json
```

---

## REST API Specifications

All endpoints (except auth) expect a `Authorization: Bearer <JWT_TOKEN>` header.

### Onboarding
- `POST /api/auth/register` - Registers a standard professional user.
- `POST /api/auth/login` - Signs in preseeded accounts or custom credentials.

### Client CRM
- `GET /api/clients` - Queries current clients.
- `POST /api/clients` - Submits client dossier profiles.
- `PUT /api/clients/:id` - Updates specific details.
- `DELETE /api/clients/:id` - Cascades client profile deletions.

### Sessions
- `GET /api/consultations` - Lists scheduled meetings.
- `POST /api/consultations` - Schedules a meeting timestamp.
- `DELETE /api/consultations/:id` - Cancels meeting records.

### Audio Catalog & summaries
- `POST /api/recordings` - Accepts Audio uploads (`Multer`).
- `DELETE /api/recordings/:id` - Removes the physical file and reference.
- `POST /api/recordings/:id/ai-summary` - Triggers Gemini AI summaries.

---

## Local Setup guide

```bash
# 1. Install Node modules
npm install

# 2. Start development full-stack workspace (Port 3000)
npm run dev

# 3. Compile client bundle assets
npm run build
```
