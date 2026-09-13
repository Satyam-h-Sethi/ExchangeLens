/**
 * Market Data Control Plane — Incident & Audit Manager
 *
 * Provides deterministic incident state transitions, audit logging,
 * mitigation workflow execution, and operational queue filtering.
 */

import {
  ActorType,
  AuditLogEntry,
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types";

export interface IncidentFilterOptions {
  status?: IncidentStatus | "ALL";
  severity?: IncidentSeverity | "ALL";
  category?: IncidentCategory | "ALL";
  searchQuery?: string;
}

export function filterIncidents(
  incidents: Incident[],
  filters: IncidentFilterOptions
): Incident[] {
  return incidents.filter((inc) => {
    if (filters.status && filters.status !== "ALL" && inc.status !== filters.status) {
      return false;
    }
    if (filters.severity && filters.severity !== "ALL" && inc.severity !== filters.severity) {
      return false;
    }
    if (filters.category && filters.category !== "ALL" && inc.category !== filters.category) {
      return false;
    }
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchesSearch =
        inc.ticketNumber.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q) ||
        inc.affectedSource.toLowerCase().includes(q) ||
        inc.affectedSymbols.some((s) => s.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    return true;
  });
}

/**
 * Transitions an incident to a new status and appends an audit trail entry.
 */
export function transitionIncidentStatus(
  incident: Incident,
  newStatus: IncidentStatus,
  actor: ActorType = "OPERATIONS_USER",
  actorName: string = "SecOps Engineer",
  notes: string = "Status updated via Control Tower"
): Incident {
  if (incident.status === newStatus) return incident;

  const timestamp = new Date().toISOString();
  const previousState = incident.status;

  const newAuditEntry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    actor,
    actorName,
    action: `STATUS_CHANGE_${newStatus}`,
    details: `${notes} (Transitioned from ${previousState} to ${newStatus})`,
    previousState,
    newState: newStatus,
  };

  const updatedAuditTrail = [newAuditEntry, ...incident.auditTrail];

  let resolvedAt = incident.resolvedAt;
  let resolutionSummary = incident.resolutionSummary;

  if (newStatus === "RESOLVED") {
    resolvedAt = timestamp;
    resolutionSummary = notes || "Resolved after root-cause mitigation and downstream feed verification.";
  }

  return {
    ...incident,
    status: newStatus,
    auditTrail: updatedAuditTrail,
    resolvedAt,
    resolutionSummary,
  };
}
