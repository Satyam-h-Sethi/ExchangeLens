"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import "./control-plane.css";

// Canonical Synthetic Datasets
import {
  SYNTHETIC_INSTRUMENTS,
  SYNTHETIC_SOURCE_PAYLOADS,
} from "@/features/market-data-control-plane/data/canonical-instruments";
import { SYNTHETIC_SOURCES } from "@/features/market-data-control-plane/data/sources";
import { SYNTHETIC_SCHEMAS } from "@/features/market-data-control-plane/data/schemas";
import { ALL_SNAPSHOTS } from "@/features/market-data-control-plane/data/snapshots";
import { SYNTHETIC_INCIDENTS } from "@/features/market-data-control-plane/data/incidents";
import { SYNTHETIC_REPLAY_SCENARIOS } from "@/features/market-data-control-plane/data/replays";

// Domain Logic & Engines
import {
  DEFAULT_QUALITY_RULES,
  computeQualityScorecard,
  evaluateInstrumentQuality,
} from "@/features/market-data-control-plane/logic/quality-engine";
import {
  ControlPlaneSubsystemTab,
  Incident,
} from "@/features/market-data-control-plane/types";

// Subsystem View Components
import { ControlTowerOverview } from "@/features/market-data-control-plane/components/ControlTowerOverview";
import { QualityEngineView } from "@/features/market-data-control-plane/components/QualityEngineView";
import { ReconciliationView } from "@/features/market-data-control-plane/components/ReconciliationView";
import { SchemaDriftView } from "@/features/market-data-control-plane/components/SchemaDriftView";
import { LineageGraphView } from "@/features/market-data-control-plane/components/LineageGraphView";
import { TemporalHistoryView } from "@/features/market-data-control-plane/components/TemporalHistoryView";
import { SourceRegistryView } from "@/features/market-data-control-plane/components/SourceRegistryView";
import { IncidentManagerView } from "@/features/market-data-control-plane/components/IncidentManagerView";
import { ReplayInvestigationView } from "@/features/market-data-control-plane/components/ReplayInvestigationView";
import { DataExplorerView } from "@/features/market-data-control-plane/components/DataExplorerView";
import { ControlPlaneDemoBanner } from "@/features/market-data-control-plane/components/ControlPlaneDemoBanner";

export default function MarketDataControlPlanePage() {
  const [activeTab, setActiveTab] = useState<ControlPlaneSubsystemTab>("CONTROL_TOWER");
  const [incidents, setIncidents] = useState<Incident[]>(SYNTHETIC_INCIDENTS);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<Incident | null>(null);

  // Compute live quality evaluations and scorecard across all canonical instruments
  const evaluationResults = useMemo(() => {
    return SYNTHETIC_INSTRUMENTS.flatMap((inst) => evaluateInstrumentQuality(inst));
  }, []);

  const scorecard = useMemo(() => {
    return computeQualityScorecard(evaluationResults);
  }, [evaluationResults]);

  const handleSelectIncidentFromOverview = (incident: Incident) => {
    setSelectedIncidentForDetail(incident);
    setActiveTab("INCIDENT_MANAGER");
  };

  return (
    <main className="cp-root">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="cp-header">
        <div>
          <Link href="/" className="cp-back-link">
            ← Back to Portfolio Overview
          </Link>
          <div className="cp-header-title-row">
            <h1 className="cp-header-title">Market Data Control Plane</h1>
            <span className="cp-status-pill pass">LIVE SYSTEM ACTIVE</span>
          </div>
          <p className="cp-header-subtitle">
            Enterprise Golden-Copy Data Governance, Multi-Exchange Symbology, Directed Lineage & Incident Response Engine
          </p>
        </div>

        {/* Global Synthetic Data Notice Badge */}
        <div className="cp-banner" style={{ margin: 0, padding: "0.5rem 0.9rem" }}>
          <span className="cp-banner-badge">SYNTHETIC / DEMO DATA</span>
          <span className="cp-banner-text" style={{ fontSize: "0.8rem" }}>
            CME, ICE, Eurex, and Bloomberg feeds simulated for institutional testing.
          </span>
        </div>
      </div>

      {/* Interactive Automation Demonstration Banner */}
      <ControlPlaneDemoBanner
        onNavigateTab={(tabKey) => {
          setActiveTab(tabKey);
          window.scrollTo({ top: 400, behavior: "smooth" });
        }}
        onInspectIncident={(incident) => {
          setSelectedIncidentForDetail(incident);
          setActiveTab("INCIDENT_MANAGER");
          window.scrollTo({ top: 400, behavior: "smooth" });
        }}
      />

      {/* Subsystem Navigation Bar */}
      <nav className="cp-nav-tabs" aria-label="Control Plane Subsystems">
        <button
          className={`cp-tab-btn ${activeTab === "CONTROL_TOWER" ? "active" : ""}`}
          onClick={() => setActiveTab("CONTROL_TOWER")}
        >
          1. Control Tower Cockpit
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "QUALITY_RULES" ? "active" : ""}`}
          onClick={() => setActiveTab("QUALITY_RULES")}
        >
          2. Quality Rules Engine
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "RECONCILIATION" ? "active" : ""}`}
          onClick={() => setActiveTab("RECONCILIATION")}
        >
          3. Multi-Source Reconciliation
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "SCHEMA_DRIFT" ? "active" : ""}`}
          onClick={() => setActiveTab("SCHEMA_DRIFT")}
        >
          4. Schema Drift & Breaking Changes
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "LINEAGE_GRAPH" ? "active" : ""}`}
          onClick={() => setActiveTab("LINEAGE_GRAPH")}
        >
          5. Directed Lineage & Blast Radius
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "TEMPORAL_HISTORY" ? "active" : ""}`}
          onClick={() => setActiveTab("TEMPORAL_HISTORY")}
        >
          6. Temporal History Diff
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "SOURCE_REGISTRY" ? "active" : ""}`}
          onClick={() => setActiveTab("SOURCE_REGISTRY")}
        >
          7. Source Registry Health
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "INCIDENT_MANAGER" ? "active" : ""}`}
          onClick={() => setActiveTab("INCIDENT_MANAGER")}
        >
          8. Incident & Audit Manager
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "REPLAY_INVESTIGATION" ? "active" : ""}`}
          onClick={() => setActiveTab("REPLAY_INVESTIGATION")}
        >
          9. Pipeline Replay / Inspection
        </button>
        <button
          className={`cp-tab-btn ${activeTab === "DATA_EXPLORER" ? "active" : ""}`}
          onClick={() => setActiveTab("DATA_EXPLORER")}
        >
          10. Canonical Instrument Explorer
        </button>
      </nav>

      {/* Dynamic Subsystem View Render */}
      {activeTab === "CONTROL_TOWER" && (
        <ControlTowerOverview
          scorecard={scorecard}
          sources={SYNTHETIC_SOURCES}
          incidents={incidents}
          onNavigateTab={(tabKey) => setActiveTab(tabKey)}
          onSelectIncident={handleSelectIncidentFromOverview}
        />
      )}

      {activeTab === "QUALITY_RULES" && (
        <QualityEngineView
          scorecard={scorecard}
          evaluationResults={evaluationResults}
          instruments={SYNTHETIC_INSTRUMENTS}
          rules={DEFAULT_QUALITY_RULES}
        />
      )}

      {activeTab === "RECONCILIATION" && (
        <ReconciliationView
          instruments={SYNTHETIC_INSTRUMENTS}
          sourcePayloads={SYNTHETIC_SOURCE_PAYLOADS}
        />
      )}

      {activeTab === "SCHEMA_DRIFT" && (
        <SchemaDriftView schemas={SYNTHETIC_SCHEMAS} />
      )}

      {activeTab === "LINEAGE_GRAPH" && <LineageGraphView />}

      {activeTab === "TEMPORAL_HISTORY" && (
        <TemporalHistoryView snapshots={ALL_SNAPSHOTS} />
      )}

      {activeTab === "SOURCE_REGISTRY" && (
        <SourceRegistryView sources={SYNTHETIC_SOURCES} />
      )}

      {activeTab === "INCIDENT_MANAGER" && (
        <IncidentManagerView
          incidents={incidents}
          onUpdateIncidents={(updated) => setIncidents(updated)}
          selectedIncidentFromParent={selectedIncidentForDetail}
        />
      )}

      {activeTab === "REPLAY_INVESTIGATION" && (
        <ReplayInvestigationView scenarios={SYNTHETIC_REPLAY_SCENARIOS} />
      )}

      {activeTab === "DATA_EXPLORER" && (
        <DataExplorerView instruments={SYNTHETIC_INSTRUMENTS} />
      )}
    </main>
  );
}
