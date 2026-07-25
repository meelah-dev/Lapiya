# Lapia (Lafiya) — Offline-First Dual-Engine Maternal Health Companion

Lapia (Lafiya, meaning *health/well-being* in Hausa) is a hybrid offline-first maternal health application designed for pregnant mothers in remote and low-connectivity regions of Northern Nigeria. It provides localized pregnancy guidelines, medical alarm checklists, clinics routing, and voice-enabled consultations in both English and simple Hausa.

The project was built for the **Build with Gemma Hackathon**, utilizing Google's Gemma models for both on-device local inference and remote cloud generation.

---

## The Problem
Maternal mortality remains high in rural regions due to delayed access to verified pregnancy care and localized health guidance. In these areas, unstable cellular connectivity prevents users from relying on cloud-based AI tools. Pregnant mothers need an application that functions entirely offline without internet, yet dynamically connects to high-fidelity medical guidance when a network signal is available.

---

## Architecture (Dual-Engine Gemma)

Lapia operates a hybrid routing mechanism that shifts between local and cloud intelligence depending on network state:

```
                  +---------------------------------------+
                  |            Lapia App UI               |
                  +---------------------------------------+
                                      |
                                      v
                          Is Offline Toggle Active?
                               /             \
                             YES              NO
                             /                 \
                            v                   v
                +---------------------+   +--------------------------+
                |   LiteRT Engine     |   |    Gemma Cloud Engine    |
                | (Quantized Gemma2B) |   |    (With Context RAG)    |
                |  Runs 100% Local    |   |    Chroma DB Vector Store|
                +---------------------+   +--------------------------+
```

### 1. Offline Engine (On-Device Gemma-2B-IT)
- **Framework**: LiteRT (TensorFlow Lite LLM Inference) running locally on the user's mobile processor.
- **Model**: A 4-bit quantized `Gemma-2B-IT` model.
- **Utility**: Users can download the model within their settings when connected to Wi-Fi. Once downloaded, they can toggle **Fully Offline Mode**, enabling direct, local symptoms parsing and care guidelines without consuming data.

### 2. Online Engine (Cloud Gemma + Local RAG)
- **Model**: `Gemma-2B-IT` (or supported remote model) for fast, low-latency text and vision generation.
- **RAG System**: Grounded in localized medical guidelines written in English and Hausa. ChromaDB is queried using semantic text embeddings to inject primary local medical context into the prompt, mitigating hallucinations.

---

## Key Features

- **Hands-Free Voice Companion**: An interactive in-modal voice consultation overlay. Users speak their symptoms (simulated/manual dictation) and Lafiya reads responses aloud using a high-fidelity streaming audio engine (falling back to device TTS when offline).
- **PaliGemma Visual Photo Triage**: Allows users to load or capture photos of diagnostic strips (Urine test strips, Malaria RDTs, or skin rashes) for immediate visual classification and clinical hazard triage.
- **Urgent Clinical Routing**: Automatically parses conversations for high-risk obstetric symptoms (e.g., severe headache, high fever, visual blur, leg swelling) and maps the user to their nearest Primary Health Center (PHC) using local LGA database boundaries.
- **Maternal Timeline Dashboard**: Customized pregnancy trackers displaying trimester-specific nutrition suggestions, physical routines, vaccine milestones, and checkable daily medical alarms.

---

## Tech Stack

### Mobile Frontend
- **Framework**: React Native with Expo (SDK 54)
- **Audio Output**: Expo AV (streaming high-fidelity TTS voice output)
- **Navigation**: React Navigation Stack & Bottom Tabs
- **Storage**: AsyncStorage (local on-device state management)

### Server Backend
- **Framework**: Node.js, Express (TypeScript)
- **Database**: PostgreSQL (relational storage for user logs, chat messages, and health clinic maps)
- **ORM**: Drizzle ORM
- **Generative AI**: Google Generative AI SDK / Ollama local Gemma server
- **Vector Database**: ChromaDB (semantic vector similarity search for context retrieval)

---

## Directory Structure

```
├── backend/                  # Node.js backend server
│   ├── src/
│   │   ├── db/               # Drizzle schemas, connection, & seed files
│   │   ├── services/         # Gemma and RAG services
│   │   └── index.ts          # Express routes and server entry point
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/                 # React Native client app
    ├── src/
    │   ├── navigation/       # App Navigator configs
    │   ├── screens/          # App UI screens (Home, Chat, Clinics, Settings)
    │   └── services/         # Networking API and offline LiteRT services
    ├── app.json
    └── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database instance
- Google AI Studio API Key (Gemma model access)

---

### 1. Server Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure Environment Variables:
Create a `.env` file in the `backend` root:
```env
DATABASE_URL=postgres://<user>:<password>@localhost:5432/lafiya
GOOGLE_GENAI_API_KEY=your_google_ai_studio_api_key_here
GEMINI_API_KEY=your_google_ai_studio_api_key_here
PORT=3000
```

Run migrations and seed clinic data:
```bash
npm run db:push
npm run db:seed
```

Start the development server:
```bash
npm run dev
```

---

### 2. Frontend Mobile Setup

Navigate to the `frontend` directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Configure Frontend Environment Variables:
Create a `.env` file in the `frontend` root. Set the active LAN IP of your computer running the backend server so the physical mobile client can connect:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LAN_IP>:3000
```

Start the Metro Bundler with cleared cache:
```bash
npx expo start -c --offline
```

*Scan the resulting QR code on the Expo Go app (iOS or Android) on a phone connected to the same local network.*

---

## Verification & Build Checks
The application compiles cleanly under strict TypeScript configurations:
- Frontend: `npx tsc --noEmit` -> 0 errors.
- Backend: `npx tsc --noEmit` -> 0 errors.
