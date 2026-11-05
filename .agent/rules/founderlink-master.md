You are a senior full-stack engineer. Build "FounderLink", a LinkedIn-style 
platform where founders pitch startups and investors discover, evaluate, 
connect with, and monitor them.
TECH STACK (do not change):- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + 
Recharts- Backend: Node.js + Express + TypeScript, REST API, Socket.io for real-time- Database: MongoDB Atlas with Mongoose (use references, embed small data 
like team members)- Files: Cloudflare R2 or AWS S3 with signed URLs (store only links in 
MongoDB)- Cache/sessions: Redis- Auth: JWT (access + refresh), bcrypt, role-based access control- Meetings: Jitsi (embed via iframe API)- Tests: Jest + Supertest (backend), Vitest + React Testing Library 
(frontend), Playwright (end-to-end)
Page 1 of 18
FounderLink: Antigravity Build Prompts and Test Cases
ROLES (exactly 3): founder, investor, admin. No other roles.
CORE RULES:
1. Founders post startups with patents, legal documents, pitch deck, 
financials.
2. Each document has an access level: public, locked (request needed), or 
approved-only.
3. Investors browse the feed, view profiles, request document access, and 
send connection requests.
4. After a connection is accepted, both get private chat, a meeting room, and 
a shared monitoring dashboard.
5. Admin verifies users and startups, and can suspend accounts.
6. UI/UX must feel like LinkedIn: top navbar, left sidebar, central feed, 
profile cards, blue/white theme, mobile responsive, clean and simple.
ENGINEERING STANDARDS:- Monorepo with /client and /server folders.- Strict TypeScript, ESLint, Prettier.- Validate every input with Zod. Centralized error handling. No secrets in 
code; use .env and provide .env.example.- Write clean, commented, modular code. Add tests for everything you build.- After each task, summarize what you built, how to run it, and how to test 
it.
Work step by step. Wait for my next instruction before starting the next 
step.