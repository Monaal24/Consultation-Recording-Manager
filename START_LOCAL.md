# 🚀 CRM.ai - Local VS Code Startup & Database Setup Guide

Welcome! This guide outlines how to run your **Consultation Recording Manager** locally on your computer inside VS Code, how data is currently stored, and how to transition to database-backed cloud storage using Firebase.

---

## 💾 Section 1: Where is Your Data Stored?

Currently, for maximum simplicity, offline speed, and portability, the app uses a **lightweight, local file-based storage architecture**:

1. **Structured App Data**: It is stored in a JSON database file inside your project root directory at `/.data/db.json`. This tracks users, clients, consultation schedules, notes, and audio recording references.
2. **Audio Recordings**: Any audio recordings you drag & drop or upload are stored inside the `/uploads` folder on your local computer's drive.
3. **Seed Data**: When you start the app for the first time, it automatically creates the `.data/db.json` database and seeds it with demo clients (Marcus, Elena, David) and mock recordings so you can explore the dashboard immediately.

This file-based approach is completely self-contained, meaning **it requires no external database servers to be running on your system.**

---

## 🔥 Section 2: How to Set Up Firebase (Cloud Storage & Auth)

If you wish to scale this application to the cloud to support multiple simultaneous users and persistent cloud-based authentication, you can move to **Firebase** (using **Cloud Firestore** for data, **Firebase Storage** for audio files, and **Firebase Authentication**).

Here is the exact battle-plan to implement this:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompt steps.
3. In your project dashboard, enable:
   - **Authentication**: Enable **Email/Password** sign-in provider.
   - **Cloud Firestore**: Create a database in production or test mode.
   - **Cloud Storage**: Create a default bucket (this will hold your uploaded client audio recordings).

### Step 2: Install Firebase SDK Dependencies
Run the following in your terminal to install the client-side Firebase package:
```bash
npm install firebase
```
And to securely connect to Firebase matching credentials server-side, install the admin SDK:
```bash
npm install firebase-admin
```

### Step 3: Register Your Web App Configurations
In your Firebase Console, click the **Web icon (</>)** to register an app. Copy the `firebaseConfig` keys. Create variables in your local `.env` file under these keys:
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

### Step 4: Adapt Code Connectors
1. **Authentication**: Swap out your `/api/auth` JWT controllers to use Firebase Authentication client-side SDK (`signInWithEmailAndPassword` or `createUserWithEmailAndPassword`).
2. **Database Queries**: Replace the helper file `/backend/config/db.ts` file-reading rules with standard Firestore queries. For example, to read clients:
   ```typescript
   import { initializeApp } from "firebase/app";
   import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
   
   const app = initializeApp(firebaseConfig);
   const db = getFirestore(app);
   
   export async function getClients(userId: string) {
     const q = query(collection(db, "clients"), where("createdBy", "==", userId));
     const snapshot = await getDocs(q);
     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   }
   ```
3. **Audio File Uploads**: Instead of writing files locally via Multer, stream files straight to **Firebase Storage** using `@google-cloud/storage` or standard Web SDK `uploadBytesResumable` hooks, and then store the returned dynamic Public download URL in the database.

---

## ⚡ Section 3: VS Code Local Quick-Start Guide (Every Time!)

We have created two executable **click-and-run master files** for you:
- **`start-local.bat`** (for Windows)
- **`start-local.sh`** (for macOS & Linux)

These files automatically handle all system checks, copy configuration variables, install dependencies, and launch the full-stack server with one double-click!

### 🗺️ The Manual 4-Step Setup

If you prefer to start it manually in VS Code, follow these 4 simple steps:

### 1️⃣ Check Prerequisites
Ensure you have **Node.js** (Version 18 or higher) installed on your computer:
* Run `node -v` in your terminal to check. If not found, download it from [nodejs.org](https://nodejs.org/).

### 2️⃣ Open the Project in VS Code
1. Open VS Code.
2. Click **File -> Open Folder** and select this directory.
3. Open a terminal panel using **Ctrl + \`** (or `Terminal -> New Terminal` from the top menu).

### 3️⃣ Configure the Environment Variables
Before running generative AI summaries or transcribes locally, you'll need a Gemini API Key:
1. Duplicate `.env.example` and rename the new copy to `.env`.
2. Generate a free API Key on [Google AI Studio](https://aistudio.google.com/).
3. Paste it inside your `.env` file:
   ```env
   GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   ```

### 4️⃣ Start the Dev Command
Run these two quick commands in your VS Code terminal:
```bash
# Installs all required front-end & back-end libraries
npm install

# Runs the integrated Express API Backend & Vite Hot Reloading Client simultaneously
npm run dev
```

Once running successfully, pull up your web browser and open:
* 👉 **`http://localhost:3000`**

Login with the default credential:
* **Email**: `demo@consult.com`
* **Password**: `password123`

---

## 🛠️ Launchers Reference
* **Windows**: Press `Win + R`, type `cmd`, navigate to the folder, and type `start-local.bat` (or simply double-click the `start-local.bat` file in your File Explorer).
* **Mac/Linux**: Open terminal, navigate to folder, make it executable via `chmod +x start-local.sh`, and run `./start-local.sh`.
