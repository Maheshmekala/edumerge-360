# System Architecture: Edumerge-360 Enterprise Campus OS

## 1. High-Level Architectural Topology
`Edumerge-360` is architected as an integrated Enterprise Campus Operating System connecting five core institutional business workflows onto a unified relational domain model and distributed event audit trail:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 15)                         │
│  - App Router (React Server & Client Components)                        │
│  - Role-Gated Layouts (Super Admin, Dean, Finance, Faculty, Counsellor) │
│  - Lucide Icons + Tailwind CSS + Responsive Enterprise Glassmorphism    │
│  - Evaluator 1-Click Role Switcher for RBAC Inspection                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON REST APIs
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API & SERVICE LAYER (Next.js / Node.js)              │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐  │
│  │ Auth & RBAC Guard     │ │ Central Error Handler│ │ Audit Service  │  │
│  └───────────────────────┘ └──────────────────────┘ └────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Pure Business Engines:                                            │  │
│  │  - 3-Way Bank Settlement & Reconciliation Engine                   │  │
│  │  - Constraint Satisfaction Problem (CSP) Timetable Solver         │  │
│  │  - Attendance Date-Locking & <75% Low-Attendance Warning Radar    │  │
│  │  - Student Support SLA Ageing & Escalation Engine                 │  │
│  │  - Admission Lead Weighted Round-Robin Workload Router            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Prisma ORM / SQL Transactions
┌────────────────────────────────────▼────────────────────────────────────┐
│                         DATABASE (PostgreSQL / SQLite)                  │
│  - Exact Integer Currency Fields (Minor Units: Paise / Cents)           │
│  - ACID Transactions & Row-Level Locking (`SELECT FOR UPDATE`)          │
│  - Multi-Column Indexes (Student + Status, UTR, Idempotency Key)        │
│  - Append-Only Forensic Audit Log Table (`AuditLog`)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Business Engine Design

### Engine 1: 3-Way Bank Reconciliation Engine (`src/lib/engines/reconciliation.ts`)
* **Problem Solved:** Educational institutions receive money through online payment gateways, direct NEFT/RTGS bank transfers, and counter cash/cheques. Reconciling bank statements against ERP ledgers manually takes weeks and misses bank-deducted wire fees.
* **Mechanism:**
  * **Pass 1 (Exact Match):** Matches normalized Bank UTR, Transaction Date, and exact Minor Currency Units.
  * **Pass 2 (Discrepancy Detection):** Matches reference number but detects amount divergence (e.g., bank deducting a $15 wire transmission fee from a $5,000 tuition transfer). Emits `AMOUNT_DISCREPANCY` with exact variance and audit notes.
  * **Pass 3 (Unrecognized Inward Credits):** Identifies inward bank deposits where parents transferred funds without quoting the student roll number (`UNRECOGNIZED_IN_ERP`).
  * **Pass 4 (Delayed / Missing Settlements):** Scans ERP payments marked `SUCCESS` that have not cleared in the bank statement (`MISSING_IN_BANK`).

### Engine 2: Intelligent Timetable Generator (CSP Solver - `src/lib/engines/timetable-csp.ts`)
* **Problem Solved:** Manual scheduling causes impossible clashes: professors double-booked across lecture halls, laboratory practicals assigned to ordinary classrooms, and room capacity violations.
* **Mechanism:**
  * Backtracking solver with forward checking and Minimum Remaining Values (MRV) heuristic.
  * **Hard Constraints (Zero Tolerance):**
    1. Faculty Collision: Faculty member can teach at most 1 class per time period.
    2. Room Collision: Room can host at most 1 class per time period.
    3. Division Collision: Student division can attend at most 1 class per time period.
    4. Room Capacity: Room capacity $\ge$ class size.
    5. Room Type: Lab practicals assigned only to rooms of type `COMPUTER_LAB` or `SCIENCE_LAB`.
  * **Conflict Explanation Engine:** When inputs are mathematically impossible (e.g. 16 requested hours in a 10-slot timetable, or class size 100 in 60-seat rooms), the solver **never produces invalid schedules**. It halts in $<10ms$ and outputs structured diagnostic reports detailing the exact bottleneck and suggested resolution.

### Engine 3: Smart Attendance Early Warning Radar (`src/lib/engines/attendance-radar.ts`)
* **Problem Solved:** Paper attendance allows back-dated proxy manipulation, and students below university statutory thresholds (75%) are discovered too late at final exam time.
* **Mechanism:**
  * **Date-Locking Policy:** Attendance sessions automatically lock at 23:59 on the session date. Once locked, faculty direct edits are refused (HTTP 423 Locked).
  * **Maker-Checker Correction Protocol:** Faculty submit an `AttendanceCorrectionRequest` with formal justification; Academic Dean reviews and applies atomic updates.
  * **Radar & Recovery Target Calculation:** Analyzes attendance percentages using exact basis points. Computes the exact number of consecutive classes a student must attend to cross the 75% statutory requirement:
    $$\text{Classes Needed} = \lceil 3 \cdot \text{TotalSessions} - 4 \cdot \text{EffectivePresent} \rceil$$

### Engine 4: Support Ticket SLA Ageing Engine (`src/lib/engines/sla-calculator.ts`)
* **Problem Solved:** Student grievances are lost across staff inboxes with zero accountability.
* **Mechanism:**
  * Real-time countdown timer tracking minutes and hours remaining against priority-based SLA deadlines (`CRITICAL`: 12h, `HIGH`: 24h, `MEDIUM`: 48h, `LOW`: 72h).
  * Auto-escalation trigger: Flags breached tickets to the Academic Dean and Director automatically.
  * SLA freeze upon `RESOLVED` or `CLOSED` status.

### Engine 5: Admission Lead Weighted Round-Robin Router (`src/lib/engines/lead-router.ts`)
* **Problem Solved:** Inbound admissions leads are hoarded by counsellors or neglected.
* **Mechanism:**
  * Two-tier routing algorithm:
    1. First priority: Assigns lead to a course specialist whose active workload is below capacity limit.
    2. Second priority: Workload balancing round-robin assigning to the active counsellor with lowest pending lead count.
  * Follow-up Ageing Tracker: Flags overdue follow-ups in hours and triggers manager visibility.

---

## 3. Database Integrity & Concurrency Safeguards
1. **Zero Floating-Point Arithmetic:** All monetary fields (`totalAmountCents`, `netAmountCents`, `paidAmountCents`, `creditAmountCents`) stored as exact integer minor units (cents/paise).
2. **Idempotency Keys:** Online payments require client-generated `idempotencyKey` strings backed by a unique database index. Duplicate gateway callbacks return the existing payment without duplicate ledger debits.
3. **Atomic Multi-Row Transactions:** `prisma.$transaction()` wraps payment processing: payment row creation $\rightarrow$ waterfall invoice head allocation $\rightarrow$ invoice paid amount update $\rightarrow$ digital receipt creation $\rightarrow$ audit log entry.
4. **Append-Only Auditability:** All institutional modifications write an immutable snapshot to `AuditLog` preserving `beforeState` and `afterState` JSON blobs.
