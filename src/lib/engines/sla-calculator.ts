/**
 * Student Support SLA Ageing & Escalation Engine
 */

export interface TicketSlaStatus {
  ticketId: string;
  isBreached: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  humanCountdown: string;
  urgencyLevel: "CRITICAL" | "HIGH" | "NORMAL" | "BREACHED";
  shouldAutoEscalate: boolean;
}

export function calculateTicketSla(
  ticketId: string,
  slaDueAt: Date | string,
  ticketStatus: string,
  isEscalated: boolean
): TicketSlaStatus {
  // If already resolved or closed, SLA is frozen
  if (ticketStatus === "RESOLVED" || ticketStatus === "CLOSED") {
    return {
      ticketId,
      isBreached: false,
      hoursRemaining: 0,
      minutesRemaining: 0,
      humanCountdown: "Resolved within SLA",
      urgencyLevel: "NORMAL",
      shouldAutoEscalate: false,
    };
  }

  const now = new Date().getTime();
  const due = new Date(slaDueAt).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      ticketId,
      isBreached: true,
      hoursRemaining: 0,
      minutesRemaining: 0,
      humanCountdown: `Breached by ${overdueHours}h ${overdueMins}m`,
      urgencyLevel: "BREACHED",
      shouldAutoEscalate: !isEscalated, // Auto-escalate if not already escalated
    };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let urgencyLevel: "CRITICAL" | "HIGH" | "NORMAL" = "NORMAL";
  if (hoursRemaining < 4) {
    urgencyLevel = "CRITICAL";
  } else if (hoursRemaining < 12) {
    urgencyLevel = "HIGH";
  }

  return {
    ticketId,
    isBreached: false,
    hoursRemaining,
    minutesRemaining,
    humanCountdown: `${hoursRemaining}h ${minutesRemaining}m remaining`,
    urgencyLevel,
    shouldAutoEscalate: false,
  };
}
