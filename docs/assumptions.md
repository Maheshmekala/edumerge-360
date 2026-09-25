# Documented Business & Technical Assumptions

In compliance with the assignment instructions, all core assumptions made during product engineering are transparently documented below.

---

## 1. Business & Institutional Domain Assumptions
1. **Academic Terms & Hierarchy:** The institution operates on Academic Years (e.g. `2025-2026`) and Semesters (`Semester 1` through `Semester 8`). An invoice or attendance session is always uniquely anchored to a Semester and Section.
2. **Statutory Attendance Threshold:** In accordance with national accreditation standards (such as AICTE / UGC), `75.00%` is assumed to be the minimum statutory attendance required to sit for final examinations. A student with `<65%` is classified as `CRITICAL_DEFAULTER` (automatic hall ticket hold), and `65% - 74.9%` is classified as `AT_RISK`.
3. **Date-Locking Cutoff:** All attendance sessions lock automatically at `23:59:59` on the calendar date of the session. Edits after this time require a formal on-duty / medical waiver approved by the Academic Dean.
4. **Waterfall Partial Fee Allocation:** When a student makes a partial payment against a multi-head invoice (e.g. Tuition + Lab + Hostel), funds are liquidated in strict priority order:
   * Priority 1: Mandatory Academic Tuition
   * Priority 2: Examination & Evaluation
   * Priority 3: Lab & Technical Computing
   * Priority 4: Hostel & Auxiliary Transport
5. **Maker-Checker Protocol for Financial Reversals:** Cashiers and accountants can initiate fee refunds or cheque bounce reversals, but only a Senior Finance Officer / Bursar can execute the approval that reverses ledger dues.

---

## 2. Technical & Architecture Assumptions
1. **Currency Representation:** All financial amounts are represented in integer minor units (paise/cents). No IEEE-754 floating-point types (`Float` or `Double`) are permitted in the database or accounting calculation logic.
2. **Pluggable Payment Gateway Simulator:** For local testing and pre-drive evaluation, payment gateway processing (Razorpay/Stripe) is simulated with synthetic UTRs, cryptographically signed receipts, and realistic order verification workflows.
3. **Bank Statement Ingestion:** Real-world institutions ingest bank settlement data via standardized CSV export files provided by partner banks (HDFC, ICICI, Axis, SBI). The 3-way matcher assumes CSV records contain `Transaction Date`, `Bank UTR / Reference`, `Description`, and `Credit Amount`.
4. **JWT Session Model:** JWT tokens with standard claims (`userId`, `role`, `email`) are passed via HTTP-only secure cookies and Bearer authorization headers, permitting stateless role-based access control (RBAC).
5. **Database Portability:** The Prisma ORM schema is designed to work seamlessly with SQLite for zero-setup local demonstration, and with PostgreSQL in Docker containers for production deployments.
