# AI Assitant Usage Records & Engineering Logs

This document tracks the engineering decisions, AI-guided generations, and human orchestration choices applied to construct the **Consultation Recording Manager**.

## AI Tools Used
- **Primary Architect**: Antigravity agent powered by Google DeepMind Gemini models inside AI Studio.
- **AI Libraries**: `@google/genai` TypeScript SDK for secure server-side summary compilation.

---

## Technical Generation Frameworks

### 1. Automated Codebases
- **Backend Controllers**: Express handler functions for Client CRM, Consultation Scheduling, Note Archives, Audio Uploads, and AI Summarization.
- **Frontend Views**: Tailored single-screen tab panels for client lists, responsive layout sidebar panels, and customized HTML5 progress bars.

### 2. Mock transcript & Fallbacks
- Predefined mock audio transcription templates that represent conversational dialogue scripts (e.g., astrological horoscopes, counseling advice) with automated fallback triggers when no `GEMINI_API_KEY` is present.

---

## Human Engineering & Architectural Decisions

### 1. Secure Full-Stack Proxy Pattern
- Configured Express rather than Client-side wrappers to process the Gemini SDK. This ensures sensitive secret API keys are never leaked to client browsers.

### 2. Multi-Tenant Partitioning
- Enforced strict authorization scoping: users can ONLY view, edit, or search client lists, schedule blocks, recording logs, or notes matching their authenticated `userId`.

### 3. Cascade Data Sanitization
- Configured model-level cascade behaviors. Deleting a client profile forces automatic cleanup of associated consultation datums and removes physical uploaded audio files on disk.

### 4. Interactive State Contexts
- Injected immediate redirection parameters: clicking "Confidential Notes" inside cards automatically transitions active sidebar views and pre-populates specific consultation link values.
