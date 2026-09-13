"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ControlPlaneSubsystemTab,
  Incident,
} from "../types";
import { SYNTHETIC_INCIDENTS } from "../data/incidents";

interface Props {
  onNavigateTab?: (tabKey: ControlPlaneSubsystemTab) => void;
  onInspectIncident?: (incident: Incident) => void;
}

interface StageInfo {
  num: string;
  name: string;
  shortDesc: string;
  detail: string;
  badge?: string;
  badgeType?: "pass" | "warn" | "fail" | "info";
}

export function ControlPlaneDemoBanner({ onNavigateTab, onInspectIncident }: Props) {
  const [pipelineState, setPipelineState] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [activeStageIdx, setActiveStageIdx] = useState<number>(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const targetIncident = SYNTHETIC_INCIDENTS[0]; // INC-2026-0913-001 (BRENTZ6 Discrepancy)

  const stages: StageInfo[] = React.useMemo(() => {
    return [
      {
        num: "01",
        name: "FEED INGEST",
        shortDesc: "Multi-exchange polling",
        detail: "Ingested 4 market data streams: CME FIX/FAST, ICE Direct, Eurex T7, and Bloomberg B-PIPE.",
        badge: "4 Active Feeds",
        badgeType: "info",
      },
      {
        num: "02",
        name: "NORMALIZE",
        shortDesc: "Symbology translation",
        detail: "Mapped vendor identifiers (LCOZ6, BRENT Dec26, RIC: LCOZ6) into canonical instrument BRENTZ6.",
        badge: "Canonical Model",
        badgeType: "pass",
      },
      {
        num: "03",
        name: "QUALITY GATES",
        shortDesc: "Rule assertions",
        detail: "Evaluated 12 quality rules: Zero-tolerance settlement range, stale tick timestamps, null check passed.",
        badge: "12 Rules OK",
        badgeType: "pass",
      },
      {
        num: "04",
        name: "RECONCILE",
        shortDesc: "Cross-source diffing",
        detail: "Reconciled Bloomberg B-PIPE payload against ICE Direct Golden Reference Master (IDS_REF_MASTER).",
        badge: "Diff Computed",
        badgeType: "info",
      },
      {
        num: "05",
        name: "DETECT MISMATCH",
        shortDesc: "Discrepancy alert",
        detail: "DISCREPANCY: Bloomberg B-PIPE published settlementMethod 'PHYSICAL' vs Golden 'CASH', settlement delta $0.28 (0.36%).",
        badge: "CRITICAL MISMATCH",
        badgeType: "fail",
      },
      {
        num: "06",
        name: "TRACE LINEAGE",
        shortDesc: "DAG traversal",
        detail: "Traversed dependency DAG from Bloomberg feed node: 4 downstream analytical models flagged.",
        badge: "DAG Traversed",
        badgeType: "warn",
      },
      {
        num: "07",
        name: "CALCULATE IMPACT",
        shortDesc: "Blast radius scoring",
        detail: "Downstream systems affected: VaR Risk Engine, Margin Collateral Optimizer, Settlement Clearing. Blast Score: 84.5/100.",
        badge: "Blast Score 84.5",
        badgeType: "fail",
      },
      {
        num: "08",
        name: "CREATE INCIDENT",
        shortDesc: "Automated triage",
        detail: `Auto-generated incident ticket #${targetIncident.ticketNumber} [CRITICAL] with suggested mitigation playbook.`,
        badge: targetIncident.ticketNumber,
        badgeType: "fail",
      },
      {
        num: "09",
        name: "AUDIT TRAIL",
        shortDesc: "Cryptographic lineage",
        detail: "Deterministic audit event sealed: feed quarantined, automated notification dispatched to Risk Officer.",
        badge: "Audit Sealed",
        badgeType: "pass",
      },
    ];
  }, [targetIncident]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const runDemo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stepDelay = prefersReducedMotion ? 50 : 340;

    setPipelineState("RUNNING");
    setActiveStageIdx(0);
    setCompletedStages([]);

    const executeStage = (stageIdx: number) => {
      if (stageIdx >= stages.length) {
        setPipelineState("COMPLETED");
        setActiveStageIdx(-1);
        setCompletedStages([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        return;
      }

      setActiveStageIdx(stageIdx);
      setCompletedStages((prev) => (prev.includes(stageIdx) ? prev : [...prev, stageIdx]));

      timerRef.current = setTimeout(() => {
        executeStage(stageIdx + 1);
      }, stepDelay);
    };

    executeStage(0);
  }, [stages.length]);

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPipelineState("IDLE");
    setActiveStageIdx(-1);
    setCompletedStages([]);
  };

  const handleInspectIncidentAction = () => {
    if (onInspectIncident) {
      onInspectIncident(targetIncident);
    } else if (onNavigateTab) {
      onNavigateTab("INCIDENT_MANAGER");
    }
  };

  return (
    <div className="cp-demo-banner" aria-label="Interactive Automation Demonstration">
      {/* ── Top Row: WHAT / WHY / RUN CONTROLS ── */}
      <div className="cp-demo-top-row">
        <div className="cp-demo-context">
          <div className="cp-demo-tagline">
            <span className="cp-demo-pill">INTERACTIVE INCIDENT INVESTIGATION DEMO</span>
            <span className="cp-demo-subtle-hint">End-to-End Pipeline Execution (9 Stages)</span>
          </div>

          <div className="cp-demo-what-why-grid">
            <div className="cp-demo-what">
              <span className="cp-demo-label">WHAT IT DOES:</span>
              <span className="cp-demo-text">
                Continuously ingests multi-exchange market data, normalizes symbology, runs deterministic data quality gates, reconciles vendor feeds, traces directed lineage, and dispatches automated incident triage.
              </span>
            </div>
            <div className="cp-demo-why">
              <span className="cp-demo-label">WHY IT MATTERS:</span>
              <span className="cp-demo-text">
                Silent cross-feed discrepancies (e.g. cash vs physical settlement flags or stale settlement prices) corrupt downstream VaR risk models, causing multimillion-dollar margin miscalculations and regulatory breaches.
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="cp-demo-controls">
          {pipelineState === "IDLE" && (
            <button
              className="cp-demo-btn primary"
              onClick={runDemo}
              aria-label="Run automated incident investigation demo"
            >
              <span className="cp-demo-btn-icon">▶</span> RUN DEMO INVESTIGATION
            </button>
          )}

          {pipelineState === "RUNNING" && (
            <button className="cp-demo-btn running" disabled aria-label="Incident pipeline executing">
              <span className="cp-demo-spinner" /> EXECUTING STAGE {activeStageIdx + 1}/9...
            </button>
          )}

          {pipelineState === "COMPLETED" && (
            <div className="cp-demo-btn-group">
              <button
                className="cp-demo-btn primary"
                onClick={runDemo}
                aria-label="Replay incident investigation demo"
              >
                <span className="cp-demo-btn-icon">↺</span> REPLAY
              </button>
              <button
                className="cp-demo-btn secondary"
                onClick={handleReset}
                aria-label="Reset demo to idle state"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 9-Stage Pipeline Visualizer ── */}
      <div className="cp-demo-stages-container">
        <div className="cp-demo-stages-header">
          <span className="cp-demo-stages-title">DETERMINISTIC CONTROL PIPELINE (9 STAGES)</span>
          <span className="cp-demo-stages-status">
            {pipelineState === "IDLE" && "Status: Ready to execute automated investigation"}
            {pipelineState === "RUNNING" && `Executing: ${stages[activeStageIdx]?.name ?? "..."}`}
            {pipelineState === "COMPLETED" && "Status: Anomaly isolated · Incident triage created · Lineage sealed"}
          </span>
        </div>

        <div className="cp-demo-stages-grid">
          {stages.map((st, idx) => {
            const isActive = activeStageIdx === idx;
            const isDone = completedStages.includes(idx) && !isActive;
            const isPending = !isActive && !isDone;

            return (
              <div
                key={st.num}
                className={`cp-demo-stage-card ${
                  isActive ? "active" : isDone ? "done" : "pending"
                }`}
              >
                <div className="cp-demo-stage-header">
                  <span className="cp-demo-stage-num">{st.num}</span>
                  <span className="cp-demo-stage-indicator">
                    {isActive && <span className="cp-stage-pulse" />}
                    {isDone && <span className="cp-stage-check">✓</span>}
                    {isPending && <span className="cp-stage-dot" />}
                  </span>
                </div>
                <div className="cp-demo-stage-name">{st.name}</div>
                <div className="cp-demo-stage-desc">{st.shortDesc}</div>

                {isDone && st.badge && (
                  <div className="cp-demo-stage-badge-wrap">
                    <span className={`cp-demo-badge ${st.badgeType ?? "info"}`}>
                      {st.badge}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Stage Log Output */}
        {(pipelineState === "RUNNING" || pipelineState === "COMPLETED") && (
          <div className="cp-demo-live-log">
            <div className="cp-demo-log-title">
              <span className="cp-log-prompt">CONTROL PLANE LOG &gt;</span>
              {activeStageIdx >= 0 ? stages[activeStageIdx]?.name : "INCIDENT INVESTIGATION COMPLETED"}
            </div>
            <div className="cp-demo-log-content">
              {completedStages.map((sIdx) => (
                <div key={sIdx} className="cp-demo-log-line">
                  <span className="cp-log-tick">✓</span>
                  <span className="cp-log-num">[{stages[sIdx].num}]</span>
                  <strong className="cp-log-name">{stages[sIdx].name}:</strong>
                  <span className="cp-log-detail">{stages[sIdx].detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Final Finding & Deep Inspection Triggers (When Completed) ── */}
      {pipelineState === "COMPLETED" && (
        <div className="cp-demo-outcome-card" role="region" aria-label="Incident findings and technical inspection">
          <div className="cp-demo-outcome-header">
            <div className="cp-demo-outcome-badge-row">
              <span className="cp-demo-outcome-tag critical">
                CRITICAL INCIDENT DETECTED · TICKET #{targetIncident.ticketNumber}
              </span>
              <span className="cp-demo-outcome-meta">
                Instrument: <code className="cp-mono">BRENTZ6</code> · Blast Radius: <strong style={{ color: "var(--cp-critical)" }}>84.5% (High Impact)</strong>
              </span>
            </div>

            <h3 className="cp-demo-outcome-title">
              {targetIncident.title}
            </h3>

            <p className="cp-demo-outcome-desc">
              Feed <strong>BLOOMBERG_BPIPE</strong> published settlement convention <strong>&quot;PHYSICAL&quot;</strong> and price <strong>$76.54</strong> for contract <strong>BRENTZ6</strong>, conflicting with authoritative ICE Direct master (<strong>&quot;CASH&quot; / $76.82</strong>). Directed lineage confirms <strong>4 downstream analytical systems</strong> (VaR Risk Engine, Margin Collateral Optimizer, Settlement Clearing, Portfolio Valuation) were at risk of mark-to-market miscalculation. Payload automatically quarantined.
            </p>
          </div>

          {/* Deep Technical Inspection Triggers */}
          <div className="cp-demo-inspect-actions">
            <span className="cp-demo-inspect-label">TECHNICAL INSPECTION:</span>
            <button
              className="cp-demo-inspect-btn highlight"
              onClick={handleInspectIncidentAction}
            >
              Inspect Incident #{targetIncident.ticketNumber} in Manager →
            </button>
            {onNavigateTab && (
              <>
                <button
                  className="cp-demo-inspect-btn"
                  onClick={() => onNavigateTab("RECONCILIATION")}
                >
                  View Multi-Source Reconciliation Table →
                </button>
                <button
                  className="cp-demo-inspect-btn"
                  onClick={() => onNavigateTab("LINEAGE_GRAPH")}
                >
                  View Directed Lineage Graph →
                </button>
                <button
                  className="cp-demo-inspect-btn"
                  onClick={() => onNavigateTab("QUALITY_RULES")}
                >
                  View Quality Rules Scorecard →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
