"use client";

import React from "react";
import {
  ControlPlaneSubsystemTab,
  DataSource,
  Incident,
  QualityScorecard,
} from "../types";

interface ControlTowerOverviewProps {
  scorecard: QualityScorecard;
  sources: DataSource[];
  incidents: Incident[];
  onNavigateTab: (tab: ControlPlaneSubsystemTab) => void;
  onSelectIncident: (incident: Incident) => void;
}

export function ControlTowerOverview({
  scorecard,
  sources,
  incidents,
  onNavigateTab,
  onSelectIncident,
}: ControlTowerOverviewProps) {
  const openIncidents = incidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING");
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
  const healthySources = sources.filter((s) => s.currentFreshness === "HEALTHY").length;
  const degradedSources = sources.filter((s) => s.currentFreshness !== "HEALTHY").length;

  return (
    <div className="cp-section-stack">
      {/* Top Banner Notice */}
      <div className="cp-banner">
        <div className="cp-banner-badge">SYNTHETIC ENVIRONMENT</div>
        <div className="cp-banner-text">
          Control Tower operating on simulated exchange multicast feeds (CME, ICE, EUREX, Bloomberg B-PIPE) and internal IDS Reference Master golden copies.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card" onClick={() => onNavigateTab("QUALITY_RULES")} style={{ cursor: "pointer" }}>
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Global Quality Score</span>
            <span className={`cp-status-pill ${scorecard.overallScore >= 95 ? "pass" : "warning"}`}>
              {scorecard.overallScore >= 95 ? "HEALTHY" : "DEGRADED"}
            </span>
          </div>
          <div className="cp-kpi-value">{scorecard.overallScore.toFixed(1)}%</div>
          <div className="cp-kpi-subtext">
            {scorecard.totalEvaluations} rules evaluated across 6 canonical instruments
          </div>
        </div>

        <div className="cp-kpi-card" onClick={() => onNavigateTab("SOURCE_REGISTRY")} style={{ cursor: "pointer" }}>
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Active Feeds & Ingestion</span>
            <span className={`cp-status-pill ${degradedSources === 0 ? "pass" : "warning"}`}>
              {healthySources}/{sources.length} ONLINE
            </span>
          </div>
          <div className="cp-kpi-value">{sources.length} Feeds</div>
          <div className="cp-kpi-subtext">
            {degradedSources > 0 ? `${degradedSources} feed experiencing latency or degraded cadence` : "All exchange gateways operating within SLA"}
          </div>
        </div>

        <div className="cp-kpi-card" onClick={() => onNavigateTab("INCIDENT_MANAGER")} style={{ cursor: "pointer" }}>
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Active Incidents</span>
            <span className={`cp-status-pill ${criticalCount > 0 ? "critical" : openIncidents.length > 0 ? "warning" : "pass"}`}>
              {criticalCount > 0 ? `${criticalCount} CRITICAL` : `${openIncidents.length} ACTIVE`}
            </span>
          </div>
          <div className="cp-kpi-value">{openIncidents.length}</div>
          <div className="cp-kpi-subtext">
            {criticalCount} critical discrepancy requiring mitigation action
          </div>
        </div>

        <div className="cp-kpi-card" onClick={() => onNavigateTab("RECONCILIATION")} style={{ cursor: "pointer" }}>
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Cross-Source Consensus</span>
            <span className="cp-status-pill critical">1 MISMATCH</span>
          </div>
          <div className="cp-kpi-value">94.2%</div>
          <div className="cp-kpi-subtext">
            Brent Crude settlement terms conflict in Bloomberg B-PIPE
          </div>
        </div>
      </div>

      {/* Main Control Tower Split Columns */}
      <div className="cp-grid-2col">
        {/* Left Column: Quality Dimensions Breakdown */}
        <div className="cp-card">
          <div className="cp-card-header">
            <div>
              <h3 className="cp-card-title">Data Quality Dimension Health</h3>
              <p className="cp-card-subtitle">Evaluation across 8 architectural quality dimensions</p>
            </div>
            <button className="cp-btn-secondary" onClick={() => onNavigateTab("QUALITY_RULES")}>
              View All Rules →
            </button>
          </div>

          <div className="cp-dimension-list">
            {Object.entries(scorecard.categoryScores || {}).map(([category, score]) => (
              <div key={category} className="cp-dimension-item">
                <div className="cp-dimension-info">
                  <span className="cp-dimension-name">{category.replace(/_/g, " ")}</span>
                  <span className="cp-dimension-score">{(score as number).toFixed(1)}%</span>
                </div>
                <div className="cp-progress-bar-bg">
                  <div
                    className={`cp-progress-bar-fill ${
                      (score as number) >= 95 ? "pass" : (score as number) >= 85 ? "warning" : "critical"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: High Priority Actionable Incidents */}
        <div className="cp-card">
          <div className="cp-card-header">
            <div>
              <h3 className="cp-card-title">Priority Incident Queue</h3>
              <p className="cp-card-subtitle">Active discrepancies and schema alerts requiring action</p>
            </div>
            <button className="cp-btn-secondary" onClick={() => onNavigateTab("INCIDENT_MANAGER")}>
              Open Queue →
            </button>
          </div>

          <div className="cp-incident-list">
            {incidents.slice(0, 3).map((incident) => (
              <div
                key={incident.id}
                className={`cp-incident-row cp-border-${incident.severity.toLowerCase()}`}
                onClick={() => {
                  onSelectIncident(incident);
                  onNavigateTab("INCIDENT_MANAGER");
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="cp-incident-row-header">
                  <span className="cp-ticket-code">{incident.ticketNumber}</span>
                  <span className={`cp-status-pill ${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                  <span className="cp-incident-status-tag">{incident.status}</span>
                </div>
                <div className="cp-incident-row-title">{incident.title}</div>
                <div className="cp-incident-row-footer">
                  <span>Source: {incident.affectedSource}</span>
                  <span>Blast Radius: {incident.blastRadiusScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Architecture Shortcuts */}
      <div className="cp-card">
        <h3 className="cp-card-title" style={{ marginBottom: "1rem" }}>
          Core Architectural Control Subsystems
        </h3>
        <div className="cp-quick-links-grid">
          <div className="cp-quick-link-card" onClick={() => onNavigateTab("RECONCILIATION")}>
            <div className="cp-quick-link-title">Multi-Source Reconciliation</div>
            <div className="cp-quick-link-desc">
              Compare Direct Exchange vs Vendor Consolidated vs Internal Golden Copy feeds.
            </div>
          </div>
          <div className="cp-quick-link-card" onClick={() => onNavigateTab("SCHEMA_DRIFT")}>
            <div className="cp-quick-link-title">Schema Drift Analyzer</div>
            <div className="cp-quick-link-desc">
              Detect breaking protocol changes, precision loss, and downstream consumer impacts.
            </div>
          </div>
          <div className="cp-quick-link-card" onClick={() => onNavigateTab("LINEAGE_GRAPH")}>
            <div className="cp-quick-link-title">Lineage & Blast Radius Graph</div>
            <div className="cp-quick-link-desc">
              Interactive dependency DAG tracing data provenance from source to VaR engines.
            </div>
          </div>
          <div className="cp-quick-link-card" onClick={() => onNavigateTab("REPLAY_INVESTIGATION")}>
            <div className="cp-quick-link-title">Step-by-Step Pipeline Replay</div>
            <div className="cp-quick-link-desc">
              Investigate deterministic 6-stage lifecycle execution for anomaly diagnostics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
