/**
 * Admission Lead Management CRM Router & Ageing Engine
 */

export interface CounsellorWorkload {
  counsellorId: string;
  counsellorName: string;
  activeLeadCount: number;
  maxCapacity: number;
  specializedCourse?: string;
}

export interface LeadAssignmentResult {
  assignedCounsellorId: string;
  assignedCounsellorName: string;
  reason: string;
}

export function routeLeadRoundRobin(
  lead: {
    interestedCourse: string;
    source: string;
  },
  counsellors: CounsellorWorkload[]
): LeadAssignmentResult {
  if (counsellors.length === 0) {
    throw new Error("No active counsellors available for lead assignment.");
  }

  // 1. First priority: Counsellors matching specialized course with capacity
  const matchingSpecialists = counsellors.filter(
    (c) =>
      c.specializedCourse &&
      c.specializedCourse.toLowerCase() === lead.interestedCourse.toLowerCase() &&
      c.activeLeadCount < c.maxCapacity
  );

  if (matchingSpecialists.length > 0) {
    // Pick specialist with lowest active workload
    matchingSpecialists.sort((a, b) => a.activeLeadCount - b.activeLeadCount);
    const chosen = matchingSpecialists[0];
    return {
      assignedCounsellorId: chosen.counsellorId,
      assignedCounsellorName: chosen.counsellorName,
      reason: `Assigned to course specialist (${lead.interestedCourse}) with lowest workload (${chosen.activeLeadCount} active leads)`,
    };
  }

  // 2. Second priority: Any counsellor with available capacity, lowest workload
  const availableGeneralists = counsellors.filter((c) => c.activeLeadCount < c.maxCapacity);

  if (availableGeneralists.length > 0) {
    availableGeneralists.sort((a, b) => a.activeLeadCount - b.activeLeadCount);
    const chosen = availableGeneralists[0];
    return {
      assignedCounsellorId: chosen.counsellorId,
      assignedCounsellorName: chosen.counsellorName,
      reason: `Assigned via round-robin workload balancing (${chosen.activeLeadCount}/${chosen.maxCapacity} capacity)`,
    };
  }

  // 3. Fallback: All at capacity, assign to least overloaded
  const sorted = [...counsellors].sort((a, b) => a.activeLeadCount - b.activeLeadCount);
  return {
    assignedCounsellorId: sorted[0].counsellorId,
    assignedCounsellorName: sorted[0].counsellorName,
    reason: `All counsellors at maximum capacity; assigned to least loaded counsellor.`,
  };
}

export function calculateLeadAgeingStatus(nextFollowUpAt?: Date | string | null): {
  isOverdue: boolean;
  overdueHours: number;
  statusLabel: string;
} {
  if (!nextFollowUpAt) {
    return {
      isOverdue: false,
      overdueHours: 0,
      statusLabel: "No follow-up scheduled",
    };
  }

  const now = new Date().getTime();
  const scheduled = new Date(nextFollowUpAt).getTime();
  const diffMs = now - scheduled;

  if (diffMs > 0) {
    const overdueHours = Math.floor(diffMs / (1000 * 60 * 60));
    return {
      isOverdue: true,
      overdueHours,
      statusLabel: `Overdue by ${overdueHours}h`,
    };
  }

  const hoursRemaining = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  return {
    isOverdue: false,
    overdueHours: 0,
    statusLabel: `Due in ${hoursRemaining}h`,
  };
}
