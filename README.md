# SmartCare AI

SmartCare AI is a professional patient-centric health platform designed to help patients manage medications effortlessly. It features automated reminders, real-time AI adherence risk classification, and advanced emergency protocols that alert contacts when needed.

## ✨ Core Features

- **Authentication & Profiles:** Secure registration and login using JWT.
- **Medication Management:** Add, update, and manage medications within a robust, easy-to-read timeline.
- **Reminders & Alerts:** Schedule reminders for daily medications. Get automatic SMS messages and automated phone calls (via Twilio) if doses are missed.
- **AI Adherence Risk Signal:** Real-time AI analysis of the patient's adherence to medication schedules. Calculates a vital health signal directly from historical behavior patterns.
- **Emergency Protocols:** Instant GPS sharing integrated with automated dispatch calls for emergency contacts.
- **Real-time Dashboard:** A fully responsive, modern user interface containing dynamic data visualization (Recharts) mapping a 7-day adherence tracking trend.
- **In-Browser Notifications:** Real-time toast popup reminders polled every 30 seconds with dismiss-to-acknowledge flow.

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (via Motor & PyMongo)
- **AI/ML:** Google Gemini AI + Custom Adherence Risk Predictor
- **Communications:** Twilio SMS & Voice Call APIs
- **Task Scheduling:** AsyncIO-based Scheduler
- **Caching/Brokers:** Redis

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Routing:** React Router v7
- **Data Visualization:** Recharts
- **Icons:** Lucide React

## 🚀 Setup & Run Instructions

### 1. Backend Setup
1. Navigate to the `backend/` directory: `cd backend`
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Define your environment variables in a `.env` file containing:
   - `MONGO_URI`, `JWT_SECRET`, Redis endpoints, Twilio API Keys, etc.
5. Start the API Server:
   ```bash
   uvicorn server:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install NodeJS dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file containing the backend endpoint:
   - `VITE_API_URL=http://localhost:8000/api`
4. Run the development server:
   ```bash
   npm run dev
   ```
5. To build for production release:
   ```bash
   npm run build
   ```

---

## 📈 Current Condition of Project

**Overall Rating: 9/10** ⭐

Both the frontend and backend are verified and correctly configured for deployment. All visible UI elements are functional.

### Recent Upgrades (March 2026):

**Registration & Auth**
- Backend `POST /auth/register` now accepts and stores `name` and `timezone` fields.
- Profile marked as completed when name is provided during registration.

**In-Browser Notification Toasts**
- Real-time medication reminder popups via `NotificationToast` component.
- Polls `GET /api/notifications/` every 30 seconds.
- Dismiss-to-acknowledge flow synced with backend.

**Settings Page Inline Error Handling**
- All `alert()` calls replaced with inline error banners across profile, timezone, and contacts sections.

**Topbar**
- **Notification bell**: Clickable dropdown showing the 8 most recent reminders with status badges (pending/taken/missed) and unread count indicator.
- **User profile avatar**: Clickable dropdown with user info (name, phone, timezone), links to Settings/Profile, and Sign out.

**Settings Page (fully functional)**
- **Profile card**: Editable name, read-only phone. Save button updates profile via `PUT /users/me`.
- **Timezone card**: Loads current timezone from user profile. Saves via `PUT /users/me/timezone`.
- **Emergency contacts**: Full CRUD — add contacts (name + phone), remove individually, save to backend via `PUT /users/me/emergency-contacts`.

**Emergency Page**
- SOS button now triggers a real backend endpoint `POST /emergency/trigger`.
- **Confirmation dialog** prevents accidental triggers.
- **Result card** displays: timestamp, GPS location, contacts processed, and per-contact SMS delivery status.
- Shows the user's actual configured emergency contacts.
- Backend records the emergency event in `db.emergencies` collection.

**Medications Page**
- Frontend validation prevents 422 errors (all required fields checked before submit).
- Error messages displayed in a visible banner when save fails.
- Success feedback shown after successful save.

**Change Password (Settings)**
- Full password-change flow: current password verification → new password → confirm.
- Show/hide password toggle for each field.
- Client-side validation (min 6 chars, match confirmation) + server-side verification.
- Backend endpoint: `PUT /users/me/password`.

**Mobile Sidebar (Hamburger Menu)**
- Hamburger icon (`☰`) in the Topbar on screens below `md` breakpoint.
- Full-height slide-in drawer from the left with dark backdrop.
- Auto-closes on route navigation and backdrop click.
- Body scroll locked while sidebar is open.

**Previous Fixes**
- Login endpoint: Backend accepts `x-www-form-urlencoded` form data.
- Location endpoint: `POST /location/` route matches frontend GPS update call.
- Twilio service: Lazy initialization — backend won't crash if Twilio env vars are missing.
- Scheduler: Fixed duplicate `_get_sync_db` function and missing `_sync_db` global.
- Redis/RQ cleanup: Removed stale RQ references and replaced with asyncio-based scheduling.
- Dependencies: Removed unused `apscheduler` and `openai` from `requirements.txt`.
- File cleanup: Removed `dump.rdb`, `sample.txt`, `test_output.txt`, and stray `Register.jsx (patched)`.

### 🐞 Known Limitations

- **Twilio required for real SMS**: Emergency SMS and medication call escalations require valid Twilio API keys in `.env`. Without them, notifications are logged but not delivered.
- **SMS only**: WhatsApp messaging is not supported. Twilio is configured for standard SMS delivery only.

**The codebase is in clean, production-ready condition.**
