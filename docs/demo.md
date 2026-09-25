# Technical Walkthrough & Interview Demonstration Script

This script provides an interviewer with a 3-minute guided tour through the core engineering achievements of `Edumerge-360`.

---

## 1. Demo Credentials & 1-Click Role Switcher
In the login screen (`/login`) or persistent sidebar dropdown:
* 👑 **Super Admin (Dr. Rajesh Sharma):** `admin@edumerge.com` / `Admin@123`
* 🎓 **Academic Dean (Prof. Anita Roy):** `dean@edumerge.com` / `Dean@123`
* 💰 **Finance Officer (Suresh Patel):** `finance@edumerge.com` / `Finance@123`
* 👨‍🏫 **Faculty (Dr. Vikram Rao):** `faculty@edumerge.com` / `Faculty@123`
* 🎯 **Admissions (Priya Singh):** `counsellor@edumerge.com` / `Lead@123`
* 🎒 **Student (Aarav Gupta):** `student@edumerge.com` / `Student@123`

---

## 2. 3-Minute Interview Walkthrough Steps

### Step 1: Executive 360 Dashboard (`/dashboard`)
* Showcase cross-module KPI cards synchronizing realized revenue, attendance percentages, SLA escalations, and lead conversion rates in real-time.

### Step 2: Smart Attendance & Date-Locking (`/attendance`)
* Click on a locked session from a previous date. Point out the `Locked at 23:59` policy badge preventing direct faculty tampering.
* Click **"Request Correction"**, enter an on-duty Hackathon justification, and submit.
* Use the sidebar **Role Switcher** to switch to **Academic Dean**. Open the **"Correction Requests"** tab and click **"Approve"**. Show that the attendance record is atomically updated in the database.
* Switch to the **"<75% Warning Radar"** tab. Show students in the danger zone and highlight the exact number of consecutive classes needed to cross statutory eligibility.

### Step 3: Fee Collection & 3-Way Bank Reconciliation (`/fees`)
* View student invoices. Highlight integer minor currency calculation and scholarship concessions.
* Click **"Collect / Pay"** on Invoice `INV-2026-0001`. Show the waterfall allocation engine crediting priority fee heads first.
* Switch to the **"3-Way Bank Reconciliation"** tab. Click **"Execute 3-Way Matcher Algorithm"**.
* Explain how the engine identifies:
  1. Exact 3-way matches.
  2. The $15 wire fee discrepancy (`AXIS9931847110`).
  3. The unrecognized direct bank deposit (`KOTK1948201948`).
* Switch to **"Maker-Checker Refunds"** to show how refunds reverse balances only upon Finance Director authorization.

### Step 4: Intelligent Timetable CSP Solver (`/timetable`)
* Show the collision-free 5-day weekly grid.
* Check the **"Simulate Impossible Constraints"** box (e.g. 120 students in 80-seat rooms, or 16 hours in 10 slots).
* Click **"Run CSP Solver Engine"**. Point out that the engine **never produces clashes**, but instead renders the **Conflict Diagnostics Report** with concrete suggested resolutions!

### Step 5: SLA Support Desk (`/support`) & Admission CRM (`/admissions`)
* Showcase live countdown timers on support tickets and 1-click managerial escalation to the Director.
* Showcase inbound lead intake triggering the weighted round-robin algorithm and overdue follow-up flags.

### Step 6: Compliance & Audit Trail (`/audit`)
* Show the immutable audit journal with JSON `beforeState` and `afterState` diffs.
