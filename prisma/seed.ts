import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Edumerge-360 Comprehensive Database Seed...");

  // 1. Clean existing records in correct dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.ticketActivity.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.refundReversalRequest.deleteMany({});
  await prisma.bankSettlementRecord.deleteMany({});
  await prisma.bankSettlementBatch.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.studentConcession.deleteMany({});
  await prisma.feeHead.deleteMany({});
  await prisma.attendanceCorrection.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.facultyProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned existing tables.");

  // 2. Departments
  const cseDept = await prisma.department.create({
    data: {
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of Computer Science, Software Engineering & AI",
    },
  });

  const eceDept = await prisma.department.create({
    data: {
      code: "ECE",
      name: "Electronics & Communication Engineering",
      description: "Department of VLSI, Embedded Systems and Telecom",
    },
  });

  const mgmtDept = await prisma.department.create({
    data: {
      code: "SOM",
      name: "School of Management",
      description: "Department of Business Analytics, Finance and Strategy",
    },
  });

  // 3. Courses
  const btechCse = await prisma.course.create({
    data: {
      code: "BTECH-CSE",
      name: "Bachelor of Technology in Computer Science",
      departmentId: cseDept.id,
      durationSem: 8,
    },
  });

  const mba = await prisma.course.create({
    data: {
      code: "MBA-FIN",
      name: "Master of Business Administration (Finance)",
      departmentId: mgmtDept.id,
      durationSem: 4,
    },
  });

  // 4. Subjects
  const subDsa = await prisma.subject.create({
    data: {
      code: "CS501",
      name: "Data Structures & Algorithmic Analysis",
      courseId: btechCse.id,
      semester: 5,
      credits: 4,
      type: "THEORY",
    },
  });

  const subOs = await prisma.subject.create({
    data: {
      code: "CS502",
      name: "Distributed & Operating Systems",
      courseId: btechCse.id,
      semester: 5,
      credits: 3,
      type: "THEORY",
    },
  });

  const subDb = await prisma.subject.create({
    data: {
      code: "CS503",
      name: "Database Systems & Transaction Processing",
      courseId: btechCse.id,
      semester: 5,
      credits: 3,
      type: "THEORY",
    },
  });

  const subLab = await prisma.subject.create({
    data: {
      code: "CS504L",
      name: "Cloud Computing & Systems Architecture Lab",
      courseId: btechCse.id,
      semester: 5,
      credits: 2,
      type: "LAB",
    },
  });

  // 5. Rooms
  const lh101 = await prisma.room.create({
    data: {
      roomNo: "LH-101",
      building: "Academic Block A",
      type: "LECTURE_HALL",
      capacity: 65,
      departmentId: cseDept.id,
    },
  });

  const lh102 = await prisma.room.create({
    data: {
      roomNo: "LH-102",
      building: "Academic Block A",
      type: "LECTURE_HALL",
      capacity: 80,
      departmentId: cseDept.id,
    },
  });

  const cl301 = await prisma.room.create({
    data: {
      roomNo: "CL-301",
      building: "Tech Annex",
      type: "COMPUTER_LAB",
      capacity: 45,
      departmentId: cseDept.id,
    },
  });

  // 6. Users & Roles (Hashed passwords)
  const defaultPasswordHash = await bcrypt.hash("Admin@123", 10);
  const deanPasswordHash = await bcrypt.hash("Dean@123", 10);
  const financePasswordHash = await bcrypt.hash("Finance@123", 10);
  const facultyPasswordHash = await bcrypt.hash("Faculty@123", 10);
  const leadPasswordHash = await bcrypt.hash("Lead@123", 10);
  const studentPasswordHash = await bcrypt.hash("Student@123", 10);

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@edumerge.com",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      firstName: "Dr. Rajesh",
      lastName: "Sharma",
      phone: "+91 98765 00001",
    },
  });

  // Academic Admin (Dean)
  const deanUser = await prisma.user.create({
    data: {
      email: "dean@edumerge.com",
      passwordHash: deanPasswordHash,
      role: "ACADEMIC_ADMIN",
      firstName: "Prof. Anita",
      lastName: "Roy",
      phone: "+91 98765 00002",
    },
  });

  // Finance Officer (Bursar)
  const financeUser = await prisma.user.create({
    data: {
      email: "finance@edumerge.com",
      passwordHash: financePasswordHash,
      role: "FINANCE_OFFICER",
      firstName: "Suresh",
      lastName: "Patel",
      phone: "+91 98765 00003",
    },
  });

  // Faculty User & Profile
  const facultyUser = await prisma.user.create({
    data: {
      email: "faculty@edumerge.com",
      passwordHash: facultyPasswordHash,
      role: "FACULTY",
      firstName: "Dr. Vikram",
      lastName: "Rao",
      phone: "+91 98765 00004",
    },
  });

  const facultyProfile = await prisma.facultyProfile.create({
    data: {
      userId: facultyUser.id,
      employeeId: "FAC-CSE-042",
      department: "Computer Science & Engineering",
      designation: "Associate Professor",
      specialization: "Operating Systems & High-Performance Computing",
      maxWeeklyHours: 18,
    },
  });

  // Counsellor User
  const counsellorUser = await prisma.user.create({
    data: {
      email: "counsellor@edumerge.com",
      passwordHash: leadPasswordHash,
      role: "COUNSELLOR",
      firstName: "Priya",
      lastName: "Singh",
      phone: "+91 98765 00005",
    },
  });

  // Primary Student User & Profile
  const studentUser1 = await prisma.user.create({
    data: {
      email: "student@edumerge.com",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      firstName: "Aarav",
      lastName: "Gupta",
      phone: "+91 98765 10001",
    },
  });

  const student1 = await prisma.studentProfile.create({
    data: {
      userId: studentUser1.id,
      enrollmentNo: "ENR-2023-CS-001",
      rollNo: "23CS01",
      courseId: btechCse.id,
      currentSemester: 5,
      section: "A",
      admissionYear: 2023,
      category: "MERIT_SCHOLAR",
    },
  });

  // Cohort Students for realistic attendance & low-attendance radar
  const cohortData = [
    { name: "Rohit Verma", email: "rohit.v@edumerge.com", roll: "23CS02", enr: "ENR-2023-CS-002", cat: "GENERAL" },
    { name: "Ananya Iyer", email: "ananya.i@edumerge.com", roll: "23CS03", enr: "ENR-2023-CS-003", cat: "GENERAL" },
    { name: "Siddharth Nair", email: "siddharth.n@edumerge.com", roll: "23CS04", enr: "ENR-2023-CS-004", cat: "SPORTS" },
    { name: "Sneha Kulkarni", email: "sneha.k@edumerge.com", roll: "23CS05", enr: "ENR-2023-CS-005", cat: "GENERAL" },
    { name: "Devendra Pandey", email: "devendra.p@edumerge.com", roll: "23CS06", enr: "ENR-2023-CS-006", cat: "NEED_BASED" },
    { name: "Kavya Menon", email: "kavya.m@edumerge.com", roll: "23CS07", enr: "ENR-2023-CS-007", cat: "GENERAL" },
  ];

  const cohortProfiles: any[] = [student1];

  for (const c of cohortData) {
    const [firstName, lastName] = c.name.split(" ");
    const u = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: studentPasswordHash,
        role: "STUDENT",
        firstName,
        lastName,
        phone: "+91 98765 2" + Math.floor(1000 + Math.random() * 9000),
      },
    });

    const sp = await prisma.studentProfile.create({
      data: {
        userId: u.id,
        enrollmentNo: c.enr,
        rollNo: c.roll,
        courseId: btechCse.id,
        currentSemester: 5,
        section: "A",
        admissionYear: 2023,
        category: c.cat,
      },
    });
    cohortProfiles.push(sp);
  }

  // 7. MODULE 2: Fee Heads & Concessions
  const headTuition = await prisma.feeHead.create({
    data: {
      code: "TUITION",
      name: "Academic Tuition & Instruction Fee",
      isRefundable: false,
      priorityOrder: 1,
      defaultAmountCents: 450000, // $4,500.00
    },
  });

  const headExam = await prisma.feeHead.create({
    data: {
      code: "EXAM",
      name: "Examination & Evaluation Fee",
      isRefundable: false,
      priorityOrder: 2,
      defaultAmountCents: 25000, // $250.00
    },
  });

  const headLab = await prisma.feeHead.create({
    data: {
      code: "LAB",
      name: "Advanced Computing & Cloud Lab Fee",
      isRefundable: false,
      priorityOrder: 3,
      defaultAmountCents: 35000, // $350.00
    },
  });

  const headHostel = await prisma.feeHead.create({
    data: {
      code: "HOSTEL",
      name: "Hostel Accommodation & Facilities",
      isRefundable: true,
      priorityOrder: 4,
      defaultAmountCents: 120000, // $1,200.00
    },
  });

  // Concession for Aarav Gupta (Merit Scholarship 10% on Tuition = $450)
  const concession = await prisma.studentConcession.create({
    data: {
      studentId: student1.id,
      name: "Dean's Merit Scholarship (10%)",
      type: "PERCENTAGE",
      value: 10,
      amountCents: 45000, // $450.00
      reason: "Rank 1 in 4th Semester with 9.6 CGPA",
      approvedBy: adminUser.id,
      academicYear: "2025-2026",
      semester: 5,
    },
  });

  // Invoices
  // Invoice 1 for Aarav Gupta (Partially Paid)
  const inv1Gross = 450000 + 25000 + 35000 + 120000; // 630000 ($6,300.00)
  const inv1Net = inv1Gross - 45000; // 585000 ($5,850.00)
  const inv1Paid = 300000; // $3,000 paid

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0001",
      studentId: student1.id,
      academicYear: "2025-2026",
      semester: 5,
      dueDate: "2026-10-15",
      totalAmountCents: inv1Gross,
      concessionCents: 45000,
      netAmountCents: inv1Net,
      paidAmountCents: inv1Paid,
      status: "PARTIALLY_PAID",
      items: {
        create: [
          { feeHeadId: headTuition.id, amountCents: 450000 - 45000, paidCents: 300000 },
          { feeHeadId: headExam.id, amountCents: 25000, paidCents: 0 },
          { feeHeadId: headLab.id, amountCents: 35000, paidCents: 0 },
          { feeHeadId: headHostel.id, amountCents: 120000, paidCents: 0 },
        ],
      },
    },
  });

  // Payment 1 for Invoice 1 (Online Gateway Success)
  const p1Hash = crypto.createHash("sha256").update("PAY-2026-0001-" + Date.now()).digest("hex");
  const payment1 = await prisma.payment.create({
    data: {
      paymentNo: "PAY-2026-0001",
      invoiceId: invoice1.id,
      amountCents: 300000,
      method: "ONLINE_GATEWAY",
      status: "SUCCESS",
      idempotencyKey: "idemp_order_2026_001_aarav",
      gatewayOrderId: "order_rzp_9941a8e1",
      gatewayPaymentId: "pay_rzp_884210f",
      bankUtr: "HDFC9982410884",
      reconciliationStatus: "MATCHED",
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receipt: {
        create: {
          receiptNo: "RCPT-2026-0001",
          verificationHash: p1Hash,
        },
      },
    },
  });

  // Invoice 2 for Rohit Verma (OVERDUE)
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0002",
      studentId: cohortProfiles[1].id,
      academicYear: "2025-2026",
      semester: 5,
      dueDate: "2026-08-30", // In the past -> Overdue!
      totalAmountCents: 510000,
      concessionCents: 0,
      netAmountCents: 510000,
      paidAmountCents: 0,
      status: "OVERDUE",
      items: {
        create: [
          { feeHeadId: headTuition.id, amountCents: 450000, paidCents: 0 },
          { feeHeadId: headExam.id, amountCents: 25000, paidCents: 0 },
          { feeHeadId: headLab.id, amountCents: 35000, paidCents: 0 },
        ],
      },
    },
  });

  // Invoice 3 for Ananya Iyer (Fully PAID)
  const p3Hash = crypto.createHash("sha256").update("PAY-2026-0003-" + Date.now()).digest("hex");
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0003",
      studentId: cohortProfiles[2].id,
      academicYear: "2025-2026",
      semester: 5,
      dueDate: "2026-10-15",
      totalAmountCents: 510000,
      concessionCents: 0,
      netAmountCents: 510000,
      paidAmountCents: 510000,
      status: "PAID",
      items: {
        create: [
          { feeHeadId: headTuition.id, amountCents: 450000, paidCents: 450000 },
          { feeHeadId: headExam.id, amountCents: 25000, paidCents: 25000 },
          { feeHeadId: headLab.id, amountCents: 35000, paidCents: 35000 },
        ],
      },
      payments: {
        create: {
          paymentNo: "PAY-2026-0003",
          amountCents: 510000,
          method: "BANK_TRANSFER",
          status: "SUCCESS",
          bankUtr: "ICIC8847192004",
          reconciliationStatus: "MATCHED",
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          receipt: {
            create: {
              receiptNo: "RCPT-2026-0003",
              verificationHash: p3Hash,
            },
          },
        },
      },
    },
  });

  // Invoice 4 with a Cheque deposited (Awaiting clearance / bounce)
  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0004",
      studentId: cohortProfiles[3].id,
      academicYear: "2025-2026",
      semester: 5,
      dueDate: "2026-10-15",
      totalAmountCents: 510000,
      concessionCents: 0,
      netAmountCents: 510000,
      paidAmountCents: 0,
      status: "ISSUED",
      items: {
        create: [
          { feeHeadId: headTuition.id, amountCents: 450000, paidCents: 0 },
          { feeHeadId: headExam.id, amountCents: 25000, paidCents: 0 },
          { feeHeadId: headLab.id, amountCents: 35000, paidCents: 0 },
        ],
      },
      payments: {
        create: {
          paymentNo: "PAY-2026-0004",
          amountCents: 510000,
          method: "CHEQUE",
          status: "PENDING",
          chequeNo: "CHQ-894102",
          chequeBank: "State Bank of India",
          chequeDate: "2026-09-22",
          chequeStatus: "DEPOSITED",
          reconciliationStatus: "UNRECONCILED",
        },
      },
    },
  });

  // Bank Settlement Batch & Reconciliation Records
  const settlementBatch = await prisma.bankSettlementBatch.create({
    data: {
      filename: "HDFC_Settlement_Sep2026_Batch01.csv",
      uploadedBy: financeUser.id,
      totalRows: 3,
      matchedRows: 1,
      discrepantRows: 2,
    },
  });

  await prisma.bankSettlementRecord.createMany({
    data: [
      {
        batchId: settlementBatch.id,
        transactionDate: "2026-09-22",
        bankUtr: "HDFC9982410884",
        description: "CMS E-COLLECT Aarav Gupta INV-2026-0001",
        creditAmountCents: 300000,
        matchedPaymentId: payment1.id,
        matchStatus: "MATCHED",
        discrepancyNote: "Exact 3-way match: UTR, Amount ($3,000.00), Date",
      },
      {
        batchId: settlementBatch.id,
        transactionDate: "2026-09-23",
        bankUtr: "AXIS9931847110",
        description: "CMS E-COLLECT INV-2026-0002 Verma",
        creditAmountCents: 508500, // $15 bank fee deducted by remitter
        matchStatus: "AMOUNT_DISCREPANCY",
        discrepancyNote: "Expected $5,100.00, received $5,085.00 ($15.00 bank wire discrepancy)",
      },
      {
        batchId: settlementBatch.id,
        transactionDate: "2026-09-24",
        bankUtr: "KOTK1948201948",
        description: "NEFT INWARD UNIDENTIFIED ROLL NO MISSING",
        creditAmountCents: 200000,
        matchStatus: "UNRECOGNIZED_IN_ERP",
        discrepancyNote: "Direct bank credit with no matching student invoice reference in ERP",
      },
    ],
  });

  // 8. MODULE 1: Attendance Sessions & Records (Over past 5 days)
  const sessionDates = ["2026-09-18", "2026-09-19", "2026-09-22", "2026-09-23", "2026-09-24"];

  for (let i = 0; i < sessionDates.length; i++) {
    const sDate = sessionDates[i];
    const isLocked = i < 3; // Lock older sessions

    const sessDsa = await prisma.attendanceSession.create({
      data: {
        subjectId: subDsa.id,
        facultyId: facultyProfile.id,
        semester: 5,
        section: "A",
        sessionDate: sDate,
        periodNumber: 1,
        isLocked,
        lockedAt: isLocked ? new Date(sDate + "T23:59:59Z") : null,
      },
    });

    // Populate records for all students
    for (const [idx, sp] of cohortProfiles.entries()) {
      let status = "PRESENT";
      // Intentionally make Rohit Verma and Devendra Pandey low attendance
      if (idx === 1 && i % 2 !== 0) status = "ABSENT"; // Rohit absent often
      if (idx === 5 && i >= 1) status = "ABSENT"; // Devendra absent 4 out of 5 days -> 20% attendance (Warning radar!)

      await prisma.attendanceRecord.create({
        data: {
          sessionId: sessDsa.id,
          studentId: sp.id,
          status,
          remarks: status === "ABSENT" ? "Absent without prior leave notice" : null,
        },
      });
    }

    // Also a session for Operating Systems
    const sessOs = await prisma.attendanceSession.create({
      data: {
        subjectId: subOs.id,
        facultyId: facultyProfile.id,
        semester: 5,
        section: "A",
        sessionDate: sDate,
        periodNumber: 2,
        isLocked,
        lockedAt: isLocked ? new Date(sDate + "T23:59:59Z") : null,
      },
    });

    for (const [idx, sp] of cohortProfiles.entries()) {
      let status = "PRESENT";
      if (idx === 5 && i >= 2) status = "ABSENT";
      await prisma.attendanceRecord.create({
        data: {
          sessionId: sessOs.id,
          studentId: sp.id,
          status,
        },
      });
    }
  }

  // Pending Attendance Correction Request (Maker: Dr. Vikram Rao, Checker: Dean Anita Roy)
  const firstSession = await prisma.attendanceSession.findFirst({
    where: { isLocked: true },
  });

  if (firstSession) {
    await prisma.attendanceCorrection.create({
      data: {
        sessionId: firstSession.id,
        studentId: student1.id,
        requestedStatus: "PRESENT",
        reason: "Student Aarav Gupta was representing college at Smart India Hackathon finals with Dean prior approval",
        status: "PENDING",
        requestedBy: facultyUser.id,
      },
    });
  }

  // 9. MODULE 3: Timetable Slots (Constraint-validated schedule)
  const timetableEntries = [
    { day: 1, period: 1, sub: subDsa.id, room: lh101.id },
    { day: 1, period: 2, sub: subOs.id, room: lh101.id },
    { day: 1, period: 3, sub: subDb.id, room: lh102.id },
    { day: 1, period: 4, sub: subLab.id, room: cl301.id },

    { day: 2, period: 1, sub: subOs.id, room: lh101.id },
    { day: 2, period: 2, sub: subDsa.id, room: lh101.id },
    { day: 2, period: 3, sub: subDb.id, room: lh102.id },

    { day: 3, period: 1, sub: subDsa.id, room: lh101.id },
    { day: 3, period: 2, sub: subOs.id, room: lh101.id },
    { day: 3, period: 3, sub: subLab.id, room: cl301.id },

    { day: 4, period: 1, sub: subDb.id, room: lh102.id },
    { day: 4, period: 2, sub: subDsa.id, room: lh101.id },
    { day: 4, period: 3, sub: subOs.id, room: lh101.id },

    { day: 5, period: 1, sub: subDsa.id, room: lh101.id },
    { day: 5, period: 2, sub: subDb.id, room: lh102.id },
    { day: 5, period: 3, sub: subLab.id, room: cl301.id },
  ];

  for (const t of timetableEntries) {
    await prisma.timetableSlot.create({
      data: {
        academicYear: "2025-2026",
        semester: 5,
        section: "A",
        dayOfWeek: t.day,
        periodNo: t.period,
        subjectId: t.sub,
        facultyId: facultyProfile.id,
        roomId: t.room,
      },
    });
  }

  // 10. MODULE 4: Student Support Tickets with SLA
  const now = new Date();
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNo: "TICK-2026-0001",
      studentId: student1.id,
      category: "FINANCE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      title: "Fee Receipt verification discrepancy for 5th Semester installment",
      description: "My online payment of $3,000 was debited from HDFC Bank, but the receipt PDF took 20 minutes to generate and shows partially paid status.",
      assignedTo: financeUser.id,
      slaHours: 24,
      slaDueAt: new Date(now.getTime() + 14 * 60 * 60 * 1000), // 14 hours remaining
      isEscalated: false,
      comments: {
        create: [
          {
            authorId: financeUser.id,
            message: "We have verified your UTR HDFC9982410884 in the morning bank settlement file. Your $3,000 credit is confirmed against Invoice INV-2026-0001.",
            isInternal: false,
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: financeUser.id,
            action: "STATUS_CHANGE",
            fromState: "OPEN",
            toState: "IN_PROGRESS",
            remarks: "Accountant verified settlement batch match",
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNo: "TICK-2026-0002",
      studentId: cohortProfiles[1].id,
      category: "ACADEMICS",
      priority: "CRITICAL",
      status: "OPEN",
      title: "Attendance marked Absent during University Debate Tournament",
      description: "Dean office issued an on-duty attendance waiver letter for Sep 19, but my portal still shows Absent for DSA and OS classes.",
      assignedTo: deanUser.id,
      slaHours: 12,
      slaDueAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Only 2 hours remaining!
      isEscalated: true,
      escalatedAt: new Date(),
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNo: "TICK-2026-0003",
      studentId: cohortProfiles[2].id,
      category: "HOSTEL",
      priority: "MEDIUM",
      status: "RESOLVED",
      title: "Wi-Fi connectivity drop in Block C Room 304",
      description: "Network router on 3rd floor kept restarting intermittently during online lab submission.",
      assignedTo: adminUser.id,
      slaHours: 48,
      slaDueAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  // 11. MODULE 5: Admission Leads CRM
  const lead1 = await prisma.lead.create({
    data: {
      leadNo: "LEAD-2026-0001",
      fullName: "Rohan Mehra",
      email: "rohan.mehra@gmail.com",
      phone: "+91 98111 22334",
      city: "Bangalore",
      source: "WEBSITE",
      interestedCourse: "BTECH-CSE",
      status: "QUALIFIED",
      score: 85,
      assignedTo: counsellorUser.id,
      nextFollowUpAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
      notes: "Scored 94% in JEE Mains. Interested in Cloud and AI specialization. Parents inquired about hostel facilities.",
      activities: {
        create: [
          {
            counsellorId: counsellorUser.id,
            activityType: "CALL",
            notes: "Initial discovery call. Shared syllabus curriculum brochure and placement statistics.",
            outcome: "POSITIVE",
          },
        ],
      },
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      leadNo: "LEAD-2026-0002",
      fullName: "Ishita Deshmukh",
      email: "ishita.deshmukh@yahoo.com",
      phone: "+91 98222 33445",
      city: "Pune",
      source: "EDUCATION_FAIR",
      interestedCourse: "MBA-FIN",
      status: "NEW",
      score: 60,
      assignedTo: counsellorUser.id,
      nextFollowUpAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Overdue by 4 hours!
      notes: "Met at World Education Expo Bangalore. Cat score 89 percentile. Needs callback.",
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      leadNo: "LEAD-2026-0003",
      fullName: "Tanmay Bhattacharya",
      email: "tanmay.b@outlook.com",
      phone: "+91 98333 44556",
      city: "Kolkata",
      source: "WALK_IN",
      interestedCourse: "BTECH-CSE",
      status: "ENROLLED",
      score: 100,
      assignedTo: counsellorUser.id,
      notes: "Application accepted, tuition deposit paid at campus counter.",
    },
  });

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        entity: "PAYMENT",
        entityId: payment1.id,
        action: "CREATE",
        performedBy: studentUser1.id,
        afterState: JSON.stringify({ amountCents: 300000, method: "ONLINE_GATEWAY", status: "SUCCESS" }),
        ipAddress: "192.168.1.45",
      },
      {
        entity: "INVOICE",
        entityId: invoice1.id,
        action: "UPDATE",
        performedBy: financeUser.id,
        beforeState: JSON.stringify({ paidAmountCents: 0, status: "ISSUED" }),
        afterState: JSON.stringify({ paidAmountCents: 300000, status: "PARTIALLY_PAID" }),
        ipAddress: "192.168.1.10",
      },
      {
        entity: "ATTENDANCE",
        entityId: firstSession?.id || "sess-01",
        action: "LOCK",
        performedBy: adminUser.id,
        afterState: JSON.stringify({ isLocked: true, lockedAt: new Date() }),
        ipAddress: "192.168.1.1",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("---------------------------------------------------------");
  console.log("DEMO ACCOUNTS READY:");
  console.log("👑 Super Admin:       admin@edumerge.com      / Admin@123");
  console.log("🎓 Academic Dean:     dean@edumerge.com       / Dean@123");
  console.log("💰 Finance Officer:   finance@edumerge.com    / Finance@123");
  console.log("👨‍🏫 Faculty Member:    faculty@edumerge.com    / Faculty@123");
  console.log("🎯 Counsellor:        counsellor@edumerge.com / Lead@123");
  console.log("🎒 Student:           student@edumerge.com    / Student@123");
  console.log("---------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
