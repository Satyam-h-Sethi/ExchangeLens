"use client";

import React, { useState } from "react";
import {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types";
import { filterIncidents, transitionIncidentStatus } from "../logic/incident-manager";

interface IncidentManagerViewProps {
  incidents: Incident[];
  onUpdateIncidents: (updatedIncidents: Incident[]) => void;
  selectedIncidentFromParent?: Incident | null;
}

export function IncidentManagerView({
  incidents,
  onUpdateIncidents,
  selectedIncidentFromParent,
}: IncidentManagerViewProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    selectedIncidentFromParent?.id || incidents[0]?.id || ""
  );
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredIncidents = filterIncidents(incidents, {
    status: statusFilter,
    severity: severityFilter,
    category: categoryFilter,
    searchQuery,
  });

  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    const updated = transitionIncidentStatus(
      selectedIncident,
      newStatus,
      "OPERATIONS_USER",
      "Control Tower Operator",
      `Manually transitioned status to ${newStatus}`
    );

    const newIncidentsList = incidents.map((inc) =>
      inc.id === updated.id ? updated : inc
    );
    onUpdateIncidents(newIncidentsList);
  };

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Operational Incident & Audit Trail Manager</h2>
          <p className="cp-view-subheading">
            Live queue of automated feed anomalies, reconciliation divergences, and schema drift alerts with immutable state transitions and mitigation tracking.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="cp-card cp-filter-bar">
        <div className="cp-filter-item">
          <label className="cp-filter-label">Search:</label>
          <input
            type="text"
            className="cp-input"
            placeholder="Search ticket, symbol, source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Status:</label>
          <select
            className="cp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Severity:</label>
          <select
            className="cp-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Category:</label>
          <select
            className="cp-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
          >
            <option value="ALL">All Categories</option>
            <option value="RECONCILIATION_MISMATCH">Reconciliation Mismatch</option>
            <option value="SCHEMA_DRIFT">Schema Drift</option>
            <option value="QUALITY_RULE_FAILURE">Quality Rule Failure</option>
            <option value="FEED_TIMELINESS_STALE">Feed Stale</option>
          </select>
        </div>
      </div>

      {/* Main Master-Detail Split */}
      <div className="cp-grid-master-detail">
        {/* Incident Queue List */}
        <div className="cp-incident-queue-list">
          {filteredIncidents.length === 0 ? (
            <div className="cp-card" style={{ textAlign: "center", color: "var(--cp-text-muted)" }}>
              No incidents match active filter criteria.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              return (
                <div
                  key={incident.id}
                  className={`cp-incident-card ${isSelected ? "selected" : ""} cp-border-${incident.severity.toLowerCase()}`}
                  onClick={() => setSelectedIncidentId(incident.id)}
                >
                  <div className="cp-incident-card-top">
                    <span className="cp-ticket-code">{incident.ticketNumber}</span>
                    <span className={`cp-status-pill ${incident.severity.toLowerCase()}`}>
                      {incident.severity}
                    </span>
                    <span className="cp-incident-status-tag">{incident.status}</span>
                  </div>
                  <div className="cp-incident-card-title">{incident.title}</div>
                  <div className="cp-incident-card-meta">
                    <span>Source: {incident.affectedSource}</span>
                    <span>Blast: {incident.blastRadiusScore}/100</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Action & Detail Console */}
        {selectedIncident && (
          <div className="cp-detail-panel cp-card">
            {/* Header & Status Transition Actions */}
            <div className="cp-card-header">
              <div>
                <div className="cp-ticket-code-badge">{selectedIncident.ticketNumber}</div>
                <h3 className="cp-card-title">{selectedIncident.title}</h3>
                <p className="cp-card-subtitle">{selectedIncident.summary}</p>
              </div>
            </div>

            {/* Lifecycle Status Action Bar */}
            <div className="cp-incident-action-bar">
              <span className="cp-action-bar-label">Update Status:</span>
              <button
                className={`cp-btn-status ${selectedIncident.status === "OPEN" ? "active" : ""}`}
                onClick={() => handleStatusChange("OPEN")}
              >
                OPEN
              </button>
              <button
                className={`cp-btn-status ${selectedIncident.status === "INVESTIGATING" ? "active" : ""}`}
                onClick={() => handleStatusChange("INVESTIGATING")}
              >
                INVESTIGATING
              </button>
              <button
                className={`cp-btn-status ${selectedIncident.status === "MITIGATED" ? "active" : ""}`}
                onClick={() => handleStatusChange("MITIGATED")}
              >
                MITIGATED
              </button>
              <button
                className={`cp-btn-status ${selectedIncident.status === "RESOLVED" ? "active" : ""}`}
                onClick={() => handleStatusChange("RESOLVED")}
              >
                RESOLVED
              </button>
            </div>

            {/* Incident Metadata Grid */}
            <div className="cp-detail-grid">
              <div className="cp-detail-item">
                <span className="cp-detail-label">Detected Timestamp</span>
                <span className="cp-detail-value cp-mono">
                  {new Date(selectedIncident.detectedAt).toUTCString()}
                </span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Affected Feed Source</span>
                <span className="cp-detail-value cp-mono">{selectedIncident.affectedSource}</span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Affected Contract Symbols</span>
                <span className="cp-detail-value cp-mono">
                  {selectedIncident.affectedSymbols.join(", ")}
                </span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Calculated Blast Radius</span>
                <span className="cp-detail-value">{selectedIncident.blastRadiusScore} / 100</span>
              </div>
            </div>

            {/* Root Cause & Mitigation Instructions */}
            <div className="cp-analysis-box">
              <h4 className="cp-analysis-title">Root Cause Analysis</h4>
              <p className="cp-analysis-text">{selectedIncident.rootCauseAnalysis}</p>

              <h4 className="cp-analysis-title" style={{ marginTop: "1rem" }}>
                Prescribed Mitigation Playbook
              </h4>
              <pre className="cp-mitigation-pre">{selectedIncident.suggestedMitigation}</pre>
            </div>

            {/* Immutable Audit Trail */}
            <div className="cp-audit-trail-section">
              <h4 className="cp-audit-title">Audit Trail & Action Log</h4>
              <div className="cp-audit-list">
                {selectedIncident.auditTrail.map((entry) => (
                  <div key={entry.id} className="cp-audit-item">
                    <div className="cp-audit-header">
                      <span className="cp-audit-actor">{entry.actorName} ({entry.actor})</span>
                      <span className="cp-audit-time cp-mono">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="cp-audit-action">{entry.action}</div>
                    <div className="cp-audit-details">{entry.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
