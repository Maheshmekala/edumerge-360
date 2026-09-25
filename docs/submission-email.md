# Copy-Paste Email for tech_interview@edumerge.com

**To:** `tech_interview@edumerge.com`  
**Subject:** Submission: Pre-Drive Product Engineering Assignment — Mahesh Mekala (Edumerge-360)  

---

Dear Edumerge Technical Hiring Team,

Please find below my submission for the **Edumerge Pre-Drive Product Engineering Assignment**.

While the brief asked to choose one assignment, I recognized that in real higher-education institutions, Attendance, Fee Collection, Timetables, Student Support, and Admissions are tightly coupled. Building isolated CRUD mockups would miss the critical multi-department workflows, data consistency, and compliance needs that educational institutions face daily.

Therefore, I have built **Edumerge-360**, a complete, production-grade **Enterprise Campus Operating System** that solves **all 5 assignments** under a unified relational data model, with 17 passing automated unit tests, full RBAC, an append-only forensic audit trail, and zero-float financial arithmetic.

---

### Quick Review Links
* **Live Deployed Prototype (Zero-setup cloud link):** [https://edumerge-360.onrender.com](https://edumerge-360.onrender.com)
* **GitHub Repository:** [https://github.com/Maheshmekala/edumerge-360](https://github.com/Maheshmekala/edumerge-360)
* **Architecture & API Documentation:** Available directly in the repository `/docs` directory.

*(Tip for fast review: I built a **1-Click Role Switcher** right into the header and sidebar. You can instantly switch between Super Admin, Academic Dean, Finance Officer, Faculty, Counsellor, and Student without logging out).*

---

### What I Built Across the 5 Assignments:

1. **Smart Attendance Management (Assgn 1):**
   * **Pessimistic Date-Locking:** Sessions lock automatically at 23:59 on the session date with `HTTP 423 Locked` to prevent faculty backdating tampering.
   * **Maker-Checker Correction Flow:** Late corrections (e.g. for official on-duty hackathons) require a formal faculty justification and Academic Dean approval.
   * **Statutory `<75%` Radar:** Mathematically calculates the exact consecutive future classes a student must attend to regain exam eligibility: $\lceil 3 \cdot S - 4 \cdot P \rceil$.

2. **Fee Collection & 3-Way Reconciliation (Assgn 2):**
   * **Zero Float Drift:** All financial amounts are stored as exact integer cents/paise (no IEEE-754 rounding errors).
   * **Idempotency Safeguard:** DB-level unique index on `idempotencyKey` prevents duplicate charges during network drops or repeated clicks.
   * **Waterfall Partial Allocation:** Payments clear priority heads first (Tuition $\rightarrow$ Exam $\rightarrow$ Lab $\rightarrow$ Library).
   * **Automated 3-Way Bank Settlement Matcher:** Ingests bank settlement CSVs and identifies exact matches, intermediary wire fee deductions ($15 fee flags), and unrecognized direct bank deposits.
   * **Maker-Checker Refunds:** Cash refunds and fee reversals require Finance Director authorization.

3. **Intelligent Timetable Generator (Assgn 3):**
   * **Deterministic CSP Solver:** Backtracking with forward checking and **Minimum Remaining Values (MRV)** heuristic enforcing hard collision constraints (zero professor clashes, zero room clashes, room capacity $\ge$ class size, lab subjects strictly in lab rooms).
   * **Diagnostic Explainer:** If constraints are mathematically impossible (e.g., 120 students in 80-seat rooms, or requested hours exceed available slots), the engine halts in $<10\text{ms}$ and renders a structured conflict diagnosis with concrete remediation suggestions.

4. **Student Support & Ticket Helpdesk (Assgn 4):**
   * Departmental categorization, priority-based SLA deadlines, live urgency countdown timers, and 1-click managerial escalation to the Director with audit logging.

5. **Admission Lead Management CRM (Assgn 5):**
   * Inbound lead intake, weighted round-robin distribution balancing counsellor workloads and course specializations, overdue follow-up ageing radar, and conversion funnel analytics.

6. **Cross-Cutting Compliance & Auditability:**
   * Append-only forensic audit trail recording actor identity, exact before/after JSON state diffs, timestamps, and IP addresses.

---

### Mandatory AI Usage Report (As requested on Page 6 of the brief)

* **AI Tool Used:** Claude (Anthropic) & ChatGPT (GPT-4o)
* **What I Asked AI to Do:**
  1. Brainstorm relational schema links connecting the 5 domains into an integrated enterprise ERP.
  2. Scaffold boilerplate Next.js App Router API route handlers and initial Tailwind layouts.
  3. Draft an initial recursive backtracking solver for timetable scheduling.
  4. Generate synthetic seed data for college courses, subjects, faculty, and bank CSV lines.
* **Prompt That Was Most Useful:**
  *"Implement a pure TypeScript Constraint Satisfaction Problem (CSP) solver using backtracking and forward checking for college timetable scheduling. Hard constraints must include no professor double-booking, no classroom double-booking, room capacity >= class size, and lab subjects in lab rooms. If the constraints are mathematically impossible, do not return an invalid or partial timetable—instead, output a structured conflict diagnostic report detailing the bottleneck and concrete remediation steps."*
* **Code Generated by AI (What part?):** Initial Prisma schema draft, recursive timetable solver skeleton, initial TypeScript interfaces for bank settlement records, and UI layout components.
* **Code I Modified (What part?):**
  1. *Integer Currency:* Converted all financial calculations from AI's floating-point numbers to integer minor units (paise/cents) to eliminate float drift.
  2. *ACID Transactions:* Re-wrote fee processing using `prisma.$transaction()` to guarantee that payment records, waterfall head distributions, invoice balances, and receipt hashes update atomically.
  3. *Date-Locking Guard:* Enforced hard date-locking at the API layer (`HTTP 423 Locked`), replacing AI's naive client-side disabled buttons.
  4. *1-Click Role Switcher:* Built the evaluator role switching mechanism for seamless technical assessment.
* **AI Output That Was Wrong:**
  The AI's initial timetable solver used `Math.random()` to shuffle subjects and periods without pre-solve domain validation or forward checking sets. When tested with realistic constraints (such as 100 students in 60-seat rooms, or high lab hours with limited lab rooms), it entered unbounded recursive loops, exceeded stack depth, or returned incomplete schedules.
* **How I Identified the Problem:**
  I ran automated unit tests in Vitest (`tests/timetable-csp.test.ts`) covering tight room constraints and impossible hour requests. The test suite timed out with call stack overflows.
* **How I Fixed It:**
  1. Discarded the random-shuffle approach and implemented formal **Minimum Remaining Values (MRV)** heuristic sorting (scheduling lab subjects and high-hour core subjects first).
  2. Added an instantaneous **Pre-Solve Feasibility Check** that halts in $<5\text{ms}$ with structured diagnostics if requested hours exceed available periods.
  3. Introduced deterministic tracking sets (`facultyBusy`, `roomBusy`, `divisionGrid`) to evaluate hard constraints in $O(1)$ time during the search.

---

### Verification & Local Setup
```bash
git clone https://github.com/Maheshmekala/edumerge-360
cd edumerge-360
npm install
npm run db:push
npx tsx prisma/seed.ts
npm test        # All 17 unit tests pass
npm run dev     # Starts at http://localhost:3000
```

I look forward to discussing the architecture, engineering trade-offs, and product decisions in the technical interview.

Best regards,  
**Mahesh Mekala**  
Software Development Engineer  
GitHub: [https://github.com/Maheshmekala](https://github.com/Maheshmekala)  
