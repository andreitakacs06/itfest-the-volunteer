# 📱 The Volunteer


![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-0ea5e9)
![Status](https://img.shields.io/badge/Status-In%20Development-f59e0b)
![License](https://img.shields.io/badge/License-MIT-22c55e)

---

## 📖 Description

The Volunteer este o aplicatie mobila care functioneaza ca un middleman pentru voluntariat.

Aplicatia este facuta pentru oamenii care vor sa faca voluntariat, dar nu vor sa se inscrie intr-o organizatie nonguvernamentala.

Cu ajutorul aplicatiei, utilizatorii pot:

- gasi task-uri de voluntariat disponibile
- vedea durata fiecarui task in ore
- aduna ore de voluntariat dupa finalizarea task-urilor

Dupa ce strangi un anumit numar de ore, poti genera un certificat cu orele tale de voluntariat.

---

## 🖼️ Screenshots

### Login / Signup

<p align="center">
  <img src="screenshots/login.png" width="280" alt="Login screen">
  <img src="screenshots/signup.png" width="280" alt="Signup screen">
</p>

### Home (Map)

<p align="center">
  <img src="screenshots/map.png" width="280" alt="Home map screen">
</p>

### Create Task

<p align="center">
  <img src="screenshots/createtask.gif" width="280" alt="Create task screen">
</p>

### Tasks Created / Active / History

<p align="center">
  <img src="screenshots/tasks-created.png" width="31%" alt="Tasks created screen">
  <img src="screenshots/tasks-active.png" width="31%" alt="Tasks active screen">
  <img src="screenshots/tasks-history.png" width="31%" alt="Tasks history screen">
</p>

### Profile

<p align="center">
  <img src="screenshots/profile.png" width="280" alt="Profile screen">
</p>

### Admin Dashboard

<p align="center">
  <img src="screenshots/admindash.gif" width="280" alt="Admin dashboard screen">
</p>

---

## ⚙️ Tech Stack

- Language: TypeScript
- Mobile Framework: React Native with Expo
- Backend: Firebase Cloud Functions with Node.js
- Database: Cloud Firestore
- Authentication: Firebase Authentication
- Navigation: React Navigation
- UI: React Native Paper
- Maps & Location: React Native Maps, Expo Location
- Notifications: Expo Notifications, Firebase Cloud Messaging

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js installed
- npm installed
- Expo Go on phone or Android Studio / Xcode for emulator
- A Firebase project configured for Authentication, Firestore, and Cloud Functions

### 2. Clone Repository

```bash
git clone <repository-url>
cd itfest-the-volunteer
cd the-volunteer
```

### 3. Install Dependencies

```bash
npm install
npm run functions:install
```

### 4. Configure Environment Variables

Create a `.env` file and add:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

For Cloud Functions, configure the admin secret in the functions environment:

```bash
ADMIN_SECRET_PASSWORD=
```

### 5. Build Cloud Functions

```bash
npm run functions:build
```

### 6. Run the App

```bash
npm start
```

You can also run:

```bash
npm run android
npm run ios
npm run web
```

After the Expo server starts, scan the QR code with Expo Go or open the app in an emulator.

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## 🔐 Security & Configuration

- Do not commit `.env` files.
- Keep API keys in secure environment variables.
- Use separate configs for development and production.

---

## 👥 Team

- **Takacs Andrei** - Fullstack Developer
- **Raul Precup** - Fullstack Developer
- **David Maries** - Frontend Developer
- **Edy Petcovici** - Frontend Developer
- **Mircea Stamatin** - Backend Developer

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
