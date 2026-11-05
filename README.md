# FounderLink

FounderLink is a LinkedIn-style platform connecting startup founders with investors. Founders pitch their ventures and showcase progress; investors discover, evaluate, connect with, and monitor high-potential startups.

---

## 🏗️ Repository Architecture

This repository is organized as a monorepo containing:
- **`client/`**: Frontend built with Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui.
- **`server/`**: Backend REST API built with Node.js, Express, TypeScript, Socket.io, MongoDB (Mongoose), and Redis.

```
founderlink/
├── client/                     # Next.js frontend application
│   ├── src/app/                # App Router pages and layouts
│   ├── src/components/         # Reusable UI & shadcn components
│   ├── src/lib/                # Utility helpers
│   └── package.json
├── server/                     # Express.js backend API
│   ├── src/
│   │   ├── config/             # DB, Redis, and Environment configs
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, RBAC, error handling, rate limiting
│   │   ├── models/             # Mongoose database models
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic
│   │   ├── sockets/            # Socket.io real-time handlers
│   │   ├── utils/              # Helper utilities
│   │   ├── tests/              # Jest and Supertest unit/integration tests
│   │   ├── app.ts              # Express application setup
│   │   └── index.ts            # Server entrypoint
│   └── package.json
├── .github/workflows/ci.yml     # Automated CI for lint and test
├── .env.example                # Example environment variables
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or v22+
- **npm**
- **MongoDB**: Local instance running on port 27017 or a MongoDB Atlas connection string
- **Redis**: Local instance running on port 6379 or a Redis Cloud URL

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd founderlink
   ```

2. **Configure Environment Variables:**
   ```bash
   # Root / Server environment configuration
   cp .env.example server/.env
   ```
   Edit `server/.env` to customize your MongoDB URI, Redis URL, JWT secrets, and storage credentials.

3. **Install Dependencies:**
   - Server:
     ```bash
     cd server
     npm install
     ```
   - Client:
     ```bash
     cd ../client
     npm install
     ```

---

## 💻 Running Locally

### Start Backend API Server
```bash
cd server
npm run dev
```
- API server listens on: `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/api/health`

### Start Frontend Application
```bash
cd client
npm run dev
```
- Web application opens on: `http://localhost:3000`

---

## 🧪 Testing & Linting

### Server:
```bash
cd server
npm run test     # Run Jest & Supertest integration tests
npm run lint     # Run ESLint
npm run build    # Compile TypeScript into dist/
npm run start    # Run compiled production server
```

### Client:
```bash
cd client
npm run lint     # Run Next.js / ESLint checks
npm run build    # Build production Next.js bundle
npm run start    # Start production Next.js server
```

---

## 🛡️ Health Check Route

`GET /api/health` returns system health and connection statuses:

```json
{
  "status": "healthy",
  "timestamp": "2026-11-05T07:55:00.000Z",
  "uptime": 12.34,
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "version": "1.0.0"
}
```

