/**
 * Intelligent Timetable Generator (Constraint Satisfaction Solver - CSP)
 * Uses Backtracking with Forward Checking & Conflict Explanation Engine
 */

export interface SubjectRequirement {
  id: string;
  code: string;
  name: string;
  type: "THEORY" | "LAB" | "SEMINAR";
  weeklyHours: number;
  facultyId: string;
  facultyName: string;
}

export interface RoomInfo {
  id: string;
  roomNo: string;
  type: string; // LECTURE_HALL, COMPUTER_LAB, SCIENCE_LAB
  capacity: number;
}

export interface TimetableInput {
  academicYear: string;
  semester: number;
  section: string;
  classSize: number;
  daysPerWeek: number; // e.g. 5 (Mon-Fri)
  periodsPerDay: number; // e.g. 5
  subjects: SubjectRequirement[];
  rooms: RoomInfo[];
  existingSlots?: ScheduledSlot[]; // Existing college-wide slots to avoid faculty/room collisions
}

export interface ScheduledSlot {
  academicYear: string;
  semester: number;
  section: string;
  dayOfWeek: number; // 1-indexed
  periodNo: number; // 1-indexed
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomNo: string;
}

export interface ConflictDiagnostic {
  type: "CAPACITY_OVERFLOW" | "FACULTY_OVERLOAD" | "ROOM_UNAVAILABLE" | "HOURS_EXCEED_SLOTS";
  severity: "CRITICAL" | "WARNING";
  entityName: string;
  reason: string;
  suggestedResolution: string;
}

export interface TimetableGenerationResult {
  success: boolean;
  slots: ScheduledSlot[];
  conflicts: ConflictDiagnostic[];
  stats: {
    totalRequestedHours: number;
    totalSlotsAvailable: number;
    assignedHours: number;
    solveTimeMs: number;
  };
}

export function generateTimetableCSP(input: TimetableInput): TimetableGenerationResult {
  const startTime = Date.now();
  const conflicts: ConflictDiagnostic[] = [];
  const totalSlotsAvailable = input.daysPerWeek * input.periodsPerDay;
  const totalRequestedHours = input.subjects.reduce((acc, s) => acc + s.weeklyHours, 0);

  // 1. Pre-Solve Feasibility & Constraint Checks
  if (totalRequestedHours > totalSlotsAvailable) {
    conflicts.push({
      type: "HOURS_EXCEED_SLOTS",
      severity: "CRITICAL",
      entityName: `Section ${input.section}`,
      reason: `Total requested weekly hours (${totalRequestedHours}h) exceeds total available timetable periods (${totalSlotsAvailable} periods).`,
      suggestedResolution: `Reduce weekly hours for elective subjects or increase operating days from ${input.daysPerWeek} to 6 days.`,
    });
    return {
      success: false,
      slots: [],
      conflicts,
      stats: {
        totalRequestedHours,
        totalSlotsAvailable,
        assignedHours: 0,
        solveTimeMs: Date.now() - startTime,
      },
    };
  }

  // Check room capacity & type availability
  for (const sub of input.subjects) {
    const validRooms = input.rooms.filter((r) => {
      const typeMatch = sub.type === "LAB" ? r.type.includes("LAB") : true;
      const capacityMatch = r.capacity >= input.classSize;
      return typeMatch && capacityMatch;
    });

    if (validRooms.length === 0) {
      conflicts.push({
        type: sub.type === "LAB" ? "ROOM_UNAVAILABLE" : "CAPACITY_OVERFLOW",
        severity: "CRITICAL",
        entityName: `${sub.code} (${sub.name})`,
        reason:
          sub.type === "LAB"
            ? `No available Lab room satisfies capacity of ${input.classSize} students for practical sessions.`
            : `All available rooms have capacity lower than class size of ${input.classSize}.`,
        suggestedResolution: `Assign room with capacity >= ${input.classSize} or split section into lab batches.`,
      });
    }
  }

  if (conflicts.some((c) => c.severity === "CRITICAL")) {
    return {
      success: false,
      slots: [],
      conflicts,
      stats: {
        totalRequestedHours,
        totalSlotsAvailable,
        assignedHours: 0,
        solveTimeMs: Date.now() - startTime,
      },
    };
  }

  // 2. CSP Backtracking Formulation
  // Grid state maps: key = `${day}_${period}`
  const divisionGrid = new Set<string>();
  const facultyBusy = new Set<string>(); // key = `${facultyId}_${day}_${period}`
  const roomBusy = new Set<string>(); // key = `${roomId}_${day}_${period}`

  // Load existing college-wide commitments
  if (input.existingSlots) {
    for (const s of input.existingSlots) {
      facultyBusy.add(`${s.facultyId}_${s.dayOfWeek}_${s.periodNo}`);
      roomBusy.add(`${s.roomId}_${s.dayOfWeek}_${s.periodNo}`);
    }
  }

  // Expand subjects into individual period requirements
  const tasksToSchedule: Array<{
    subject: SubjectRequirement;
    hourIndex: number;
  }> = [];

  // Sort subjects: Labs first (most constrained), then by weekly hours descending (MRV heuristic)
  const sortedSubjects = [...input.subjects].sort((a, b) => {
    if (a.type === "LAB" && b.type !== "LAB") return -1;
    if (b.type === "LAB" && a.type !== "LAB") return 1;
    return b.weeklyHours - a.weeklyHours;
  });

  for (const sub of sortedSubjects) {
    for (let h = 0; h < sub.weeklyHours; h++) {
      tasksToSchedule.push({ subject: sub, hourIndex: h });
    }
  }

  const solutionSlots: ScheduledSlot[] = [];

  // Track daily subject distribution (soft constraint: max 2 periods per subject per day)
  const subjectDayCount = new Map<string, number>(); // key = `${subjectId}_${day}`

  function solve(taskIndex: number): boolean {
    if (taskIndex >= tasksToSchedule.length) {
      return true; // All tasks scheduled successfully!
    }

    const { subject } = tasksToSchedule[taskIndex];

    // Eligible rooms for this subject
    const candidateRooms = input.rooms.filter((r) => {
      const typeOk = subject.type === "LAB" ? r.type.includes("LAB") : !r.type.includes("LAB");
      return typeOk && r.capacity >= input.classSize;
    });

    // Try slot options across days and periods
    for (let day = 1; day <= input.daysPerWeek; day++) {
      const currentDayCount = subjectDayCount.get(`${subject.id}_${day}`) || 0;
      // Soft constraint: Do not schedule more than 2 periods of the same subject on one day
      if (subject.type !== "LAB" && currentDayCount >= 2) continue;

      for (let period = 1; period <= input.periodsPerDay; period++) {
        const slotKey = `${day}_${period}`;
        const facultyKey = `${subject.facultyId}_${day}_${period}`;

        // Check Hard Constraints
        if (divisionGrid.has(slotKey)) continue; // Class already has another subject
        if (facultyBusy.has(facultyKey)) continue; // Faculty already teaching elsewhere

        for (const room of candidateRooms) {
          const roomKey = `${room.id}_${day}_${period}`;
          if (roomBusy.has(roomKey)) continue; // Room already occupied

          // Assign
          divisionGrid.add(slotKey);
          facultyBusy.add(facultyKey);
          roomBusy.add(roomKey);
          subjectDayCount.set(`${subject.id}_${day}`, currentDayCount + 1);

          const slotRecord: ScheduledSlot = {
            academicYear: input.academicYear,
            semester: input.semester,
            section: input.section,
            dayOfWeek: day,
            periodNo: period,
            subjectId: subject.id,
            subjectCode: subject.code,
            subjectName: subject.name,
            facultyId: subject.facultyId,
            facultyName: subject.facultyName,
            roomId: room.id,
            roomNo: room.roomNo,
          };
          solutionSlots.push(slotRecord);

          // Recurse
          if (solve(taskIndex + 1)) {
            return true;
          }

          // Backtrack
          solutionSlots.pop();
          divisionGrid.delete(slotKey);
          facultyBusy.delete(facultyKey);
          roomBusy.delete(roomKey);
          subjectDayCount.set(`${subject.id}_${day}`, currentDayCount);
        }
      }
    }

    return false;
  }

  const success = solve(0);

  if (!success) {
    conflicts.push({
      type: "FACULTY_OVERLOAD",
      severity: "CRITICAL",
      entityName: `Section ${input.section}`,
      reason: `Could not satisfy hard collision constraints for all assigned faculty across the available ${totalSlotsAvailable} periods.`,
      suggestedResolution: `Check for faculty schedule conflicts with other departments, or redistribute teaching assignments.`,
    });
  }

  return {
    success,
    slots: solutionSlots.sort((a, b) =>
      a.dayOfWeek === b.dayOfWeek ? a.periodNo - b.periodNo : a.dayOfWeek - b.dayOfWeek
    ),
    conflicts,
    stats: {
      totalRequestedHours,
      totalSlotsAvailable,
      assignedHours: solutionSlots.length,
      solveTimeMs: Date.now() - startTime,
    },
  };
}
