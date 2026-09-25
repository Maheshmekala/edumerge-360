import { describe, it, expect } from "vitest";
import { generateTimetableCSP, TimetableInput } from "../src/lib/engines/timetable-csp";

describe("Intelligent Timetable Generator (CSP Solver)", () => {
  const baseInput: TimetableInput = {
    academicYear: "2025-2026",
    semester: 5,
    section: "A",
    classSize: 50,
    daysPerWeek: 5,
    periodsPerDay: 4, // 20 slots available
    subjects: [
      {
        id: "sub-1",
        code: "CS501",
        name: "Data Structures",
        type: "THEORY",
        weeklyHours: 4,
        facultyId: "fac-1",
        facultyName: "Dr. Vikram Rao",
      },
      {
        id: "sub-2",
        code: "CS502",
        name: "Operating Systems",
        type: "THEORY",
        weeklyHours: 4,
        facultyId: "fac-2",
        facultyName: "Prof. Sunita Mehta",
      },
      {
        id: "sub-3",
        code: "CS503L",
        name: "Cloud Lab",
        type: "LAB",
        weeklyHours: 2,
        facultyId: "fac-1",
        facultyName: "Dr. Vikram Rao",
      },
    ],
    rooms: [
      { id: "room-1", roomNo: "LH-101", type: "LECTURE_HALL", capacity: 60 },
      { id: "room-2", roomNo: "CL-201", type: "COMPUTER_LAB", capacity: 55 },
    ],
  };

  it("should successfully generate a collision-free timetable satisfying all hard constraints", () => {
    const result = generateTimetableCSP(baseInput);

    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    expect(result.slots).toHaveLength(10); // 4 + 4 + 2 = 10 hours

    // Verify Lab is scheduled in the Lab room
    const labSlots = result.slots.filter((s) => s.subjectCode === "CS503L");
    expect(labSlots).toHaveLength(2);
    labSlots.forEach((slot) => {
      expect(slot.roomNo).toBe("CL-201");
    });

    // Verify no period overlaps for the section
    const periodSet = new Set<string>();
    result.slots.forEach((s) => {
      const key = `${s.dayOfWeek}_${s.periodNo}`;
      expect(periodSet.has(key)).toBe(false);
      periodSet.add(key);
    });
  });

  it("should detect and diagnose impossible schedule when hours exceed total slots", () => {
    const impossibleInput: TimetableInput = {
      ...baseInput,
      periodsPerDay: 2, // 5 days * 2 = 10 slots
      subjects: [
        {
          id: "sub-1",
          code: "CS501",
          name: "Data Structures",
          type: "THEORY",
          weeklyHours: 8,
          facultyId: "fac-1",
          facultyName: "Dr. Rao",
        },
        {
          id: "sub-2",
          code: "CS502",
          name: "Operating Systems",
          type: "THEORY",
          weeklyHours: 8,
          facultyId: "fac-2",
          facultyName: "Prof. Mehta",
        },
      ], // 16 hours requested > 10 slots!
    };

    const result = generateTimetableCSP(impossibleInput);

    expect(result.success).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe("HOURS_EXCEED_SLOTS");
    expect(result.conflicts[0].reason).toContain("exceeds total available");
  });

  it("should diagnose room capacity deficit constraint", () => {
    const largeClassInput: TimetableInput = {
      ...baseInput,
      classSize: 100, // 100 students, but rooms only seat 60 and 55!
    };

    const result = generateTimetableCSP(largeClassInput);

    expect(result.success).toBe(false);
    expect(result.conflicts.some((c) => c.type === "CAPACITY_OVERFLOW")).toBe(true);
  });
});
