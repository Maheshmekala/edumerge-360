import { describe, it, expect } from "vitest";
import {
  routeLeadRoundRobin,
  calculateLeadAgeingStatus,
  CounsellorWorkload,
} from "../src/lib/engines/lead-router";

describe("Admission Lead CRM Router & Ageing Engine", () => {
  const counsellors: CounsellorWorkload[] = [
    {
      counsellorId: "c-1",
      counsellorName: "Priya Singh",
      activeLeadCount: 15,
      maxCapacity: 30,
      specializedCourse: "BTECH-CSE",
    },
    {
      counsellorId: "c-2",
      counsellorName: "Amitabh Sen",
      activeLeadCount: 8,
      maxCapacity: 30,
      specializedCourse: "MBA-FIN",
    },
    {
      counsellorId: "c-3",
      counsellorName: "Neha Roy",
      activeLeadCount: 5,
      maxCapacity: 30,
    },
  ];

  it("should prioritize course specialist when matching lead course", () => {
    const lead = { interestedCourse: "BTECH-CSE", source: "WEBSITE" };

    const assignment = routeLeadRoundRobin(lead, counsellors);

    expect(assignment.assignedCounsellorId).toBe("c-1");
    expect(assignment.reason).toContain("course specialist");
  });

  it("should route to lowest workload generalist when no course specialist exists", () => {
    const lead = { interestedCourse: "BA-JOURNALISM", source: "EDUCATION_FAIR" };

    const assignment = routeLeadRoundRobin(lead, counsellors);

    // Neha Roy has the lowest workload (5 leads)
    expect(assignment.assignedCounsellorId).toBe("c-3");
    expect(assignment.reason).toContain("round-robin workload balancing");
  });

  it("should identify overdue lead follow-ups", () => {
    const pastFollowUp = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    const ageing = calculateLeadAgeingStatus(pastFollowUp);

    expect(ageing.isOverdue).toBe(true);
    expect(ageing.statusLabel).toContain("Overdue by");
  });
});
