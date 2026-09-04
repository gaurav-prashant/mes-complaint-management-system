# MES Complaint Management System 🏛️

**Management by Efficiency & Synergy**

A modern full-stack complaint registration, tracking, and management platform built for MES (Military Engineer Services) quarters and residential areas.

---

## 🚀 Key Features

- **Public Complaint Submission**:
  - Interactive multi-field complaint registration form (Full Name, Mobile Number, Quarter, Location, Complaint Type, Description).
  - Image upload support with automatic optimization.
  - Live validation and clear error/success feedback.

- **Real-Time Complaint Tracking**:
  - Public tracking by 10-digit registered mobile number or Complaint ID.
  - Visual status timeline step indicators (`Submitted` → `In Progress` / `Under Review` → `Resolved` / `Rejected`).

- **Admin Dashboard**:
  - Secure authentication (JWT + bcrypt hashing).
  - Real-time status update controls (`Submitted`, `Under Review`, `Work in Progress`, `Resolved`, `Rejected`).
  - Admin remark annotations.

- **SuperAdmin Portal**:
  - Global oversight and system management.
  - Advanced search, filtering, status updates, and complaint deletion privileges.

- **Email Notifications**:
  - Integrated transactional email updates via Resend API for password reset & complaint state notifications.

- **MongoDB Atlas Integration**:
  - Direct connection to MongoDB Atlas database (`mes_complaint_db`) and collection (`complaints`).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router, Vanilla CSS, Recharts
- **Backend**: Node.js, Express, MongoDB Node Driver, Resend API, bcryptjs, jsonwebtoken
- **Database**: MongoDB Atlas (`mes_complaint_db`)
- **Deployment Ready**: Vite SPA build (`dist`) + Serverless API handler compatible (`server.js` / Netlify Functions)

---

## 📁 Project Structure

```text
MES-Complaint-System/
├── src/
│   ├── components/         # React Components (Submit, Track, Admin, SuperAdmin)
│   ├── utils/              # API helpers (apiBase.js)
│   ├── App.jsx             # Main Application Routing
│   └── main.jsx            # Entry point
├── server.js               # Express API backend server & MongoDB connection
├── vite.config.js          # Vite server & LAN configuration (0.0.0.0:3001)
├── package.json            # Project dependencies & scripts
├── netlify.toml            # Netlify build & redirect routing configuration
└── README.md               # Documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (do NOT commit `.env` to Git):

```env
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster_host>/mes_complaint_db?appName=MES-Complaint-DB
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourAdminPassword!
SUPERADMIN_EMAIL=superadmin@example.com
SUPERADMIN_PASSWORD=YourSuperAdminPassword!
JWT_SECRET=your_long_random_jwt_secret_key
APP_URL=http://localhost:3001
RESEND_API_KEY=your_resend_api_key
```

---

## 🏃 Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Concurrent Development Server (Backend + Frontend)**:
   ```bash
   npm run dev
   ```
   - **Frontend**: `http://localhost:3001` (LAN accessible at `http://<your-lan-ip>:3001`)
   - **Backend API**: `http://localhost:5000/api`

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📜 Credits & License

Developed by **Computer Cell 17 Bihar**. All rights reserved.