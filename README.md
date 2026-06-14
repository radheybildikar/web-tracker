# ⬡ WebTrace — Personal Browsing History Tracker

A fullstack app to privately track, visualize, and explore your daily web browsing activity.

## Stack
- **Backend:** Node.js + Express + MongoDB + JWT auth
- **Frontend:** React + Recharts dashboard
- **Chrome Extension:** Captures page visits automatically

---

## Project Structure

```
web-tracker/
├── backend/              # Express REST API
│   ├── models/
│   │   ├── User.js       # User schema (bcrypt hashed passwords)
│   │   └── Visit.js      # Visit schema (url, domain, title, favicon, duration)
│   ├── routes/
│   │   ├── auth.js       # POST /api/auth/register, /login
│   │   └── visits.js     # GET/POST/DELETE /api/visits, GET /api/visits/stats
│   ├── middleware/
│   │   └── auth.js       # JWT verification middleware
│   ├── server.js
│   └── .env.example
│
├── frontend/             # React dashboard
│   └── src/
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── AuthPage.js    # Login + Register
│       │   └── Dashboard.js   # Main dashboard with stats, history, chart
│       ├── App.js
│       └── index.css
│
└── extension/            # Chrome Extension (Manifest V3)
    ├── manifest.json
    ├── background.js     # Service worker — captures tab activity
    ├── popup.html        # Login UI in extension popup
    └── popup.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET

npm install
npm run dev   # runs on http://localhost:5000
```

> Requires MongoDB running locally or a MongoDB Atlas URI.

### 2. Frontend

```bash
cd frontend
npm install
npm start     # runs on http://localhost:3000
```

### 3. Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The ⬡ WebTrace icon will appear in your toolbar
6. Click it → sign in with your account
7. Browsing is now tracked automatically!

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/visits` | Yes | Paginated visit history |
| POST | `/api/visits` | Yes | Log a visit (used by extension) |
| GET | `/api/visits/stats` | Yes | Today count, week count, top domains, daily activity |
| DELETE | `/api/visits/:id` | Yes | Delete a single visit |

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/webtracker
JWT_SECRET=your_super_secret_key
```

---

## Deploying to Production

1. Deploy backend to **Railway / Render / Fly.io**
2. Deploy frontend to **Vercel / Netlify** with `REACT_APP_API_URL=https://your-api.com/api`
3. Update `extension/manifest.json` → add your API domain to `host_permissions`
4. Update `extension/background.js` → change `API_BASE` to your production URL
5. Update `extension/popup.js` → change `API_BASE` to your production URL
