# Testing Strategy & QA Verification Report

## 1. Automated Vitest Test Suite Report
The automated test suite verifies all critical business engines, edge cases, and arithmetic invariants across 5 test suites (17 automated tests passing):

```
 RUN  v3.2.7 C:/Users/HDEV072/edumerge-360

 ✓ tests/lead-router.test.ts (3 tests)
   - should prioritize course specialist when matching lead course
   - should route to lowest workload generalist when no course specialist exists
   - should identify overdue lead follow-ups

 ✓ tests/sla-calculator.test.ts (3 tests)
   - should calculate active hours remaining for open tickets
   - should flag SLA breach and trigger auto-escalation when deadline has passed
   - should freeze SLA calculation when ticket is marked RESOLVED

 ✓ tests/attendance-radar.test.ts (4 tests)
   - should categorize 80% attendance as COMPLIANT with zero classes needed
   - should categorize 70% attendance as AT_RISK and calculate exact classes needed to cross 75%
   - should categorize 50% attendance as CRITICAL_DEFAULTER
   - should lock attendance sessions from prior dates and enforce formal correction flow

 ✓ tests/reconciliation.test.ts (4 tests)
   - should correctly identify an exact 3-way match
   - should flag AMOUNT_DISCREPANCY when bank statement amount differs from ERP expected amount
   - should flag UNRECOGNIZED_IN_ERP when bank statement contains unknown inward credit
   - should flag MISSING_IN_BANK when ERP payment marked SUCCESS has not settled in bank

 ✓ tests/timetable-csp.test.ts (3 tests)
   - should successfully generate a collision-free timetable satisfying all hard constraints
   - should detect and diagnose impossible schedule when hours exceed total slots
   - should diagnose room capacity deficit constraint

 Test Files  5 passed (5)
      Tests  17 passed (17)
   Duration  1.58s
```

---

## 2. Manual QA Verification Checklist

### Module 1: Smart Attendance Management
- [x] Session Date Locking: Open a session from a previous date. Verify badge shows `Locked at 23:59`. Verify status buttons are disabled and a banner alerts the user.
- [x] Maker-Checker Workflow: Click "Request Correction" as faculty. Submit waiver reason. Switch role to `ACADEMIC_ADMIN` (Dean). Approve request. Verify attendance record is atomically updated.
- [x] Radar Recovery Target: Check Rohit Verma or Devendra Pandey in `<75%` Warning Radar. Verify consecutive classes needed target is mathematically computed.

### Module 2: Fee Collection & 3-Way Reconciliation
- [x] Idempotency: Trigger multiple payments with the same idempotency key; verify only one payment record is generated.
- [x] Waterfall Allocation: Make a partial payment of $3,000 on a $5,850 invoice. Verify $3,000 is credited to Tuition fee head and remainder stays unpaid.
- [x] 3-Way Reconciliation: Ingest HDFC bank settlement CSV. Run matcher algorithm. Verify exact matches, $15 wire fee discrepancy, and unclaimed inward credits are flagged with visual badges.
- [x] Maker-Checker Refunds: Initiate a refund as staff. Verify request enters `PENDING` queue. Switch to `SUPER_ADMIN`, approve refund, and verify invoice balance is restored.

### Module 3: Intelligent Timetable Generator (CSP Solver)
- [x] Zero Collision: Run CSP generator. Verify schedule renders in weekly grid with zero professor or room conflicts.
- [x] Impossible Constraint Explainer: Check "Simulate Impossible Constraints" box. Click "Run CSP Solver". Verify engine catches the bottleneck and outputs structured conflict diagnostics with suggested resolutions.

### Module 4: Student Support & SLA Helpdesk
- [x] SLA Countdown: Inspect ticket queue. Verify live countdown indicator updates urgency level (`HIGH`, `CRITICAL`, `BREACHED`).
- [x] Managerial Escalation: Click "Escalate to Director". Verify ticket receives escalated flag and Dean audit event.

### Module 5: Admission Lead CRM
- [x] Inbound Lead Routing: Submit a new B.Tech CSE lead. Verify weighted round-robin assigns lead to course specialist Priya Singh and balances active workload.
- [x] Ageing Tracker: Verify leads with scheduled follow-ups in the past display exact hours overdue.

### Forensic Compliance & Audit Trail
- [x] State Diff Inspector: Open `/audit`. Select any event. Verify previous and new state JSON diffs are inspectable.
