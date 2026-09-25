import { describe, it, expect } from "vitest";
import { calculateTicketSla } from "../src/lib/engines/sla-calculator";

describe("Student Support SLA Engine", () => {
  it("should calculate active hours remaining for open tickets", () => {
    const futureDue = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours in future

    const sla = calculateTicketSla("t-1", futureDue, "OPEN", false);

    expect(sla.isBreached).toBe(false);
    expect(sla.hoursRemaining).toBe(5);
    expect(sla.urgencyLevel).toBe("HIGH");
    expect(sla.shouldAutoEscalate).toBe(false);
  });

  it("should flag SLA breach and trigger auto-escalation when deadline has passed", () => {
    const pastDue = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago

    const sla = calculateTicketSla("t-2", pastDue, "IN_PROGRESS", false);

    expect(sla.isBreached).toBe(true);
    expect(sla.urgencyLevel).toBe("BREACHED");
    expect(sla.humanCountdown).toContain("Breached by");
    expect(sla.shouldAutoEscalate).toBe(true);
  });

  it("should freeze SLA calculation when ticket is marked RESOLVED", () => {
    const pastDue = new Date(Date.now() - 10 * 60 * 60 * 1000);

    const sla = calculateTicketSla("t-3", pastDue, "RESOLVED", false);

    expect(sla.isBreached).toBe(false);
    expect(sla.humanCountdown).toBe("Resolved within SLA");
  });
});
