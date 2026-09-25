# REST API Specification: Edumerge-360

All API responses follow a standardized JSON envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Human readable error description",
    "details": null
  }
}
```

---

## 1. Authentication & Session
* `POST /api/auth/login`: Authenticates user credentials and sets secure HTTP-only cookie.
  * **Body:** `{ "email": "admin@edumerge.com", "password": "..." }`
  * **Response:** `{ "user": { "id": "...", "role": "SUPER_ADMIN" }, "token": "..." }`
* `GET /api/auth/me`: Returns current active session user profile and permissions.
* `POST /api/auth/me`: Logs out active user and clears cookie.

---

## 2. Module 1: Smart Attendance Management
* `GET /api/attendance/sessions`: List attendance sessions with date, subject, faculty, and locking status.
* `POST /api/attendance/sessions`: Create new session and auto-populate student rosters.
  * **Body:** `{ "subjectId": "...", "semester": 5, "section": "A", "sessionDate": "2026-09-25", "periodNumber": 1 }`
* `GET /api/attendance/sessions/:id`: Retrieve session details and individual student attendance records.
* `PUT /api/attendance/sessions/:id`: Atomically update attendance records. **Refused with HTTP 423 if session date is locked.**
* `GET /api/attendance/radar`: Computes campus-wide student attendance percentages and calculates classes needed to reach 75%.
* `GET /api/attendance/corrections`: List formal attendance correction requests.
* `POST /api/attendance/corrections`: Faculty submits waiver request for a locked session.
* `PATCH /api/attendance/corrections`: Academic Dean approves or rejects correction request.

---

## 3. Module 2: Fee Collection & 3-Way Reconciliation
* `GET /api/fees/invoices`: List fee invoices with multi-parameter filtering (status, student, search).
* `POST /api/fees/invoices`: Batch generate student invoice with itemized fee heads and concessions.
* `GET /api/fees/invoices/:id`: Retrieve single invoice with fee head breakdown, payment history, and receipt hashes.
* `POST /api/fees/payments`: Process payment (Cash, Cheque, Gateway) with idempotency key and waterfall fee head allocation.
* `GET /api/fees/reconciliation`: Retrieve ingested bank settlement batches and matching statuses.
* `POST /api/fees/reconciliation`: Execute 3-way matching algorithm across bank statement and ERP ledger.
* `GET /api/fees/refunds`: List maker-checker refund and reversal requests.
* `POST /api/fees/refunds`: Staff initiates refund request.
* `PATCH /api/fees/refunds`: Finance Director approves or rejects refund and adjusts invoice balances.

---

## 4. Module 3: Intelligent Timetable Generator
* `GET /api/timetable/slots`: Fetch schedule grid slots for a given semester and section.
* `POST /api/timetable/generate`: Execute Constraint Satisfaction Solver (CSP).
  * **Body:** `{ "semester": 5, "section": "A", "classSize": 55, "periodsPerDay": 4, "daysPerWeek": 5 }`
  * **Response:** Returns solved collision-free timetable slots, or detailed conflict diagnostics with explanations and suggested resolutions.

---

## 5. Module 4: Student Support & SLA Helpdesk
* `GET /api/support/tickets`: List grievance tickets with live SLA countdown indicators.
* `POST /api/support/tickets`: Student logs new ticket with priority-driven SLA calculation.
* `GET /api/support/tickets/:id`: Fetch ticket details, comments thread, and activity audit history.
* `PATCH /api/support/tickets/:id`: Post internal staff notes, update status, or escalate ticket to Dean.

---

## 6. Module 5: Admission Lead CRM
* `GET /api/admissions/leads`: List prospective student leads with counsellor assignments and ageing status.
* `POST /api/admissions/leads`: Intake new lead and execute weighted round-robin counsellor assignment.
* `PATCH /api/admissions/leads`: Log follow-up activity (Call, WhatsApp, Visit) and advance funnel stage.

---

## 7. System Compliance & Auditability
* `GET /api/audit/logs`: Retrieve append-only forensic audit trail with JSON before/after state diffs.
