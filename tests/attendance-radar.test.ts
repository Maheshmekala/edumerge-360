import { describe, it, expect } from "vitest";
import {
  calculateStudentAttendanceRadar,
  isAttendanceSessionLocked,
} from "../src/lib/engines/attendance-radar";

describe("Smart Attendance Engine (Radar & Date Locking)", () => {
  const dummyStudent = {
    id: "stud-1",
    name: "Aarav Gupta",
    enrollmentNo: "ENR-2023-CS-001",
    rollNo: "23CS01",
  };

  it("should categorize 80% attendance as COMPLIANT with zero classes needed", () => {
    // 8 Present out of 10
    const records = [
      ...Array(8).fill({ status: "PRESENT" }),
      ...Array(2).fill({ status: "ABSENT" }),
    ];

    const radar = calculateStudentAttendanceRadar(dummyStudent, records);

    expect(radar.totalSessions).toBe(10);
    expect(radar.percentage).toBe(80);
    expect(radar.status).toBe("COMPLIANT");
    expect(radar.classesNeededFor75).toBe(0);
  });

  it("should categorize 70% attendance as AT_RISK and calculate exact classes needed to cross 75%", () => {
    // 7 Present out of 10
    const records = [
      ...Array(7).fill({ status: "PRESENT" }),
      ...Array(3).fill({ status: "ABSENT" }),
    ];

    const radar = calculateStudentAttendanceRadar(dummyStudent, records);

    expect(radar.percentage).toBe(70);
    expect(radar.status).toBe("AT_RISK");
    // (7 + X) / (10 + X) >= 0.75 => 7 + X >= 7.5 + 0.75X => 0.25X >= 0.5 => X >= 2 classes
    expect(radar.classesNeededFor75).toBe(2);
  });

  it("should categorize 50% attendance as CRITICAL_DEFAULTER", () => {
    const records = [
      ...Array(5).fill({ status: "PRESENT" }),
      ...Array(5).fill({ status: "ABSENT" }),
    ];

    const radar = calculateStudentAttendanceRadar(dummyStudent, records);

    expect(radar.percentage).toBe(50);
    expect(radar.status).toBe("CRITICAL_DEFAULTER");
  });

  it("should lock attendance sessions from prior dates and enforce formal correction flow", () => {
    const lockCheck = isAttendanceSessionLocked("2026-09-01");
    expect(lockCheck.isLocked).toBe(true);
    expect(lockCheck.reason).toContain("automatically locked at 23:59");
  });
});
