/**
 * Smart Attendance Engine: Early Warning Radar & Date-Locking Validator
 */

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  rollNo: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  effectivePresentCount: number; // Present + Excused (or weighted late)
  percentage: number;
  status: "COMPLIANT" | "AT_RISK" | "CRITICAL_DEFAULTER";
  classesNeededFor75: number;
}

export function calculateStudentAttendanceRadar(
  student: {
    id: string;
    name: string;
    enrollmentNo: string;
    rollNo: string;
  },
  records: Array<{
    status: string; // PRESENT, ABSENT, LATE, EXCUSED
  }>
): StudentAttendanceSummary {
  const totalSessions = records.length;
  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let lateCount = 0;

  for (const r of records) {
    if (r.status === "PRESENT") presentCount++;
    else if (r.status === "ABSENT") absentCount++;
    else if (r.status === "EXCUSED") excusedCount++;
    else if (r.status === "LATE") lateCount++;
  }

  // Institutional policy: Excused counts as present for percentage; Late counts as 0.75 or full with warning
  // Using exact integer math in basis points (10000 = 100.00%)
  const effectivePresent = presentCount + excusedCount + Math.floor(lateCount * 0.75);

  const percentage =
    totalSessions > 0 ? Number(((effectivePresent / totalSessions) * 100).toFixed(2)) : 100.0;

  let status: "COMPLIANT" | "AT_RISK" | "CRITICAL_DEFAULTER" = "COMPLIANT";
  if (percentage < 65.0) {
    status = "CRITICAL_DEFAULTER";
  } else if (percentage < 75.0) {
    status = "AT_RISK";
  }

  // Calculate classes needed to reach 75%
  // (effectivePresent + X) / (totalSessions + X) >= 0.75
  // effectivePresent + X >= 0.75 * totalSessions + 0.75 * X
  // 0.25 * X >= 0.75 * totalSessions - effectivePresent
  // X >= 3 * totalSessions - 4 * effectivePresent
  let classesNeededFor75 = 0;
  if (percentage < 75.0 && totalSessions > 0) {
    const rawNeeded = 3 * totalSessions - 4 * effectivePresent;
    classesNeededFor75 = Math.max(0, Math.ceil(rawNeeded));
  }

  return {
    studentId: student.id,
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    rollNo: student.rollNo,
    totalSessions,
    presentCount,
    absentCount,
    excusedCount,
    lateCount,
    effectivePresentCount: effectivePresent,
    percentage,
    status,
    classesNeededFor75,
  };
}

export function isAttendanceSessionLocked(sessionDate: string): {
  isLocked: boolean;
  reason?: string;
} {
  const todayStr = new Date().toISOString().split("T")[0];

  // If session is from a past calendar day, it is locked
  if (sessionDate < todayStr) {
    return {
      isLocked: true,
      reason: `Session from ${sessionDate} was automatically locked at 23:59. Modifications require a formal Attendance Correction Request with Dean approval.`,
    };
  }

  return { isLocked: false };
}
