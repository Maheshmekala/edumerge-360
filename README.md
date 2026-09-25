# Edumerge-360: Enterprise Campus Operating System
### Pre-Drive Product Engineering Assignment — Complete 5-in-1 Unified Solution

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18.svg)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

---

## 1. Executive Summary & Problem Understanding
`Edumerge-360` is an integrated, enterprise-grade Higher Education Campus Operating System built to address all five pre-drive business challenges under a single relational domain model:

1. **Smart Attendance Management (Module 1):** Class marking, date-locking at 23:59, formal maker-checker correction workflows with Dean approvals, and a statutory `<75%` low-attendance early warning radar.
2. **Fee Collection & 3-Way Reconciliation (Module 2):** Exact integer minor currency arithmetic, idempotent online checkouts, waterfall partial fee head allocation, automated 3-way bank statement CSV reconciliation, and maker-checker refunds.
3. **Intelligent Timetable Generator (Module 3):** Constraint Satisfaction Problem (CSP) solver enforcing hard collision constraints (faculty, room, division, capacity, lab type) and an explainer engine diagnosing impossible schedules.
4. **Student Support & SLA Helpdesk (Module 4):** Departmental category routing, live countdown SLA timers with urgency indicators, and automated managerial escalation triggers.
5. **Admission Lead Management CRM (Module 5):** Weighted round-robin routing balancing counsellor workloads, follow-up scheduler, overdue ageing radar, and conversion funnel analytics.
6. **Cross-Cutting Compliance & Auditability:** Append-only forensic audit trail recording actor identity, exact before/after JSON state diffs, timestamps, and IP addresses.

---

## 2. Technology Stack & Engineering Standards
* **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Responsive Enterprise Glassmorphism UI.
* **Backend:** Next.js REST API Architecture with TypeScript, centralized error handling, and transactional business engines.
* **Database & ORM:** PostgreSQL / SQLite via Prisma ORM with foreign keys, indexes, and exact minor currency units.
* **Security & Auth:** Stateless JWT session tokens, bcrypt password hashing, and role-based access control (RBAC).
* **Testing:** 17 automated tests passing in Vitest covering all core calculation engines and algorithms.

---

## 3. Quickstart & Local Setup

### Prerequisites
* **Node.js:** v18+ (tested on Node v24)
* **npm:** v9+

### Installation & Run
```bash
# 1. Clone repository
git clone <your-github-repo-url>
cd edumerge-360

# 2. Install dependencies
npm install

# 3. Initialize Database & Push Schema
npm run db:push

# 4. Seed with realistic university data
npx tsx prisma/seed.ts

# 5. Run Automated Vitest Test Suite (17 tests)
npm run test

# 6. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Demo Credentials & 1-Click Role Switcher

For seamless technical interview evaluation, a **1-Click Evaluator Role Switcher** is embedded directly into the sidebar and login screen:

| Role | Email | Password | Showcase Focus |
| :--- | :--- | :--- | :--- |
| **👑 Super Admin** | `admin@edumerge.com` | `Admin@123` | Executive 360 overview, timetable generator, refund approvals, audit trail |
| **🎓 Academic Dean** | `dean@edumerge.com` | `Dean@123` | Attendance date-locking override review, low-attendance radar, timetable verification |
| **💰 Finance Officer** | `finance@edumerge.com`| `Finance@123` | Master invoices, counter payments, 3-way bank CSV reconciliation |
| **👨‍🏫 Faculty Member** | `faculty@edumerge.com`| `Faculty@123` | Session attendance marking, on-duty correction requests, timetable view |
| **🎯 Counsellor** | `counsellor@edumerge.com`| `Lead@123` | Admission lead CRM, round-robin assignments, follow-up touchpoint logger |
| **🎒 Student** | `student@edumerge.com` | `Student@123` | Personal invoices, simulated online payment, attendance percentage, helpdesk |

---

## 5. 30-Second Interview Answer Cheat Sheet

| Question | 30-60 Second Defensible Technical Answer |
| :--- | :--- |
| **Why Next.js 15 & TypeScript?** | Eliminates API drift between client and server using shared TypeScript contracts. Next.js App Router provides server-side data fetching with low-latency API routes. |
| **How are currency and floating point drift handled?** | All monetary amounts are stored as exact integers in minor units (paise/cents). No IEEE-754 floats are used, guaranteeing zero rounding errors during fee calculations and bank reconciliation. |
| **How does the Timetable Generator work?** | It is a pure Constraint Satisfaction Problem (CSP) backtracking solver with forward checking and MRV heuristics. It enforces hard constraints (no double-booking, room capacity $\ge$ class size, lab room matching). If constraints are impossible, it never produces clashes—it halts in $<10ms$ and outputs conflict diagnostics with suggested resolutions. |
| **How does 3-Way Bank Reconciliation work?** | It matches Bank Statement CSV lines against ERP Payments and Invoices. Pass 1 identifies exact matches; Pass 2 flags amount discrepancies (e.g. bank wire fees); Pass 3 detects unrecognized inward bank deposits; and Pass 4 catches delayed settlements. |
| **How is attendance date-locking enforced?** | Sessions lock automatically at 23:59 on the session date. Once locked, the backend API rejects direct edits with HTTP 423 Locked. Corrections must follow a maker-checker workflow where faculty submit reasons and the Academic Dean approves. |
| **How does the Admission CRM route leads?** | It uses a weighted round-robin algorithm that first checks for course specialists with available capacity, and second balances active lead workloads across counsellors to eliminate hoarding. |

---

## 6. Complete Documentation Suite
* 📐 [Architecture Deep Dive](docs/architecture.md)
* 💡 [Documented Assumptions](docs/assumptions.md)
* ⚖️ [Engineering Decisions & Trade-Offs](docs/decisions.md)
* 🔌 [REST API Specification](docs/api.md)
* 🧪 [Testing & QA Report](docs/testing.md)
* 🎬 [3-Minute Interview Demo Script](docs/demo.md)
* 🤖 [Mandatory AI Usage Report](docs/ai-usage-report.md)

---

## 7. Docker Deployment
```bash
docker-compose up --build
```
Spins up a containerized PostgreSQL database and the Next.js production server on port 3000.
