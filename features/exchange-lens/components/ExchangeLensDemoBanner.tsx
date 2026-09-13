"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ExchangeLensScenario, ValidationResult } from "../types";
import { runValidation, summarize } from "../logic/validator";

interface Props {
  scenario: ExchangeLensScenario;
  onInspectField?: (fieldName: string) => void;
  onScrollToSection?: (sectionId: string) => void;
}

export type DemoStageStatus = "idle" | "running" | "completed";

interface StageInfo {
  num: string;
  name: string;
  shortDesc: string;
  detail: string;
  badge?: string;
  badgeType?: "pass" | "warn" | "fail" | "info";
}

export function ExchangeLensDemoBanner({
  scenario,
  onInspectField,
  onScrollToSection,
}: Props) {
  const [pipelineState, setPipelineState] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [activeStageIdx, setActiveStageIdx] = useState<number>(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute validation results for live scenario
  const validationResults: ValidationResult[] = React.useMemo(() => {
    return runValidation(scenario.extractedFields, scenario.referenceFields);
  }, [scenario]);

  const summary = React.useMemo(() => summarize(validationResults), [validationResults]);

  const mismatchedResult = React.useMemo(() => {
    return validationResults.find((r) => r.status === "MISMATCH") || validationResults.find((r) => r.status === "WARNING");
  }, [validationResults]);

  // Stage definitions mapped to scenario
  const stages: StageInfo[] = React.useMemo(() => {
    return [
      {
        num: "01",
        name: "INGEST NOTICE",
        shortDesc: "Load exchange circular",
        detail: `Ingested ${scenario.notice.exchange} notice ${scenario.notice.documentId} ("${scenario.notice.title.slice(0, 45)}...")`,
        badge: scenario.notice.exchange,
        badgeType: "info",
      },
      {
        num: "02",
        name: "EXTRACT FIELDS",
        shortDesc: "Structured parsing",
        detail: `Extracted ${scenario.extractedFields.length} specification fields with high/medium confidence scores.`,
        badge: `${scenario.extractedFields.length} Fields`,
        badgeType: "info",
      },
      {
        num: "03",
        name: "NORMALIZE",
        shortDesc: "Unit & symbol mapping",
        detail: "Standardized text formatting, numeric fractions, decimals, and settlement terminology.",
        badge: "Cleaned",
        badgeType: "pass",
      },
      {
        num: "04",
        name: "REFERENCE LOOKUP",
        shortDesc: "Master dataset match",
        detail: `Loaded golden copy reference master record (IDS_PROD_MASTER) for ${scenario.notice.affectedSymbol}.`,
        badge: "IDS_MASTER",
        badgeType: "info",
      },
      {
        num: "05",
        name: "VALIDATE",
        shortDesc: "Deterministic evaluation",
        detail: `Compared ${validationResults.length} fields: ${summary.pass} Match, ${summary.warning} Warning, ${summary.mismatch} Mismatch.`,
        badge: summary.mismatch > 0 ? `${summary.mismatch} Diff` : "Matched",
        badgeType: summary.mismatch > 0 ? "fail" : "pass",
      },
      {
        num: "06",
        name: "DETECT CHANGE",
        shortDesc: "Discrepancy discovery",
        detail: mismatchedResult
          ? `Discrepancy flagged on [${mismatchedResult.displayLabel}]: Extracted "${mismatchedResult.extractedValue}" vs Reference "${mismatchedResult.referenceValue}".`
          : "All contract specification fields conform exactly to reference master.",
        badge: summary.mismatch > 0 ? "DISCREPANCY" : "CONFORMANT",
        badgeType: summary.mismatch > 0 ? "fail" : "pass",
      },
      {
        num: "07",
        name: "EVIDENCE AUDIT",
        shortDesc: "Source snippet lineage",
        detail: `Generated verifiable citation trail linked to ${scenario.notice.documentId} with raw snippet evidence.`,
        badge: "Immutable Trail",
        badgeType: "pass",
      },
    ];
  }, [scenario, validationResults, summary, mismatchedResult]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Run pipeline step-by-step
  const runDemo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stepDelay = prefersReducedMotion ? 50 : 380;

    setPipelineState("RUNNING");
    setActiveStageIdx(0);
    setCompletedStages([]);

    const executeStage = (stageIdx: number) => {
      if (stageIdx >= stages.length) {
        setPipelineState("COMPLETED");
        setActiveStageIdx(-1);
        setCompletedStages([0, 1, 2, 3, 4, 5, 6]);
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

  return (
    <div className="el-demo-banner" aria-label="Interactive Automation Demonstration">
      {/* ── Top Explanation: WHAT / WHY / RUN ── */}
      <div className="el-demo-top-row">
        <div className="el-demo-context">
          <div className="el-demo-tagline">
            <span className="el-demo-pill">INTERACTIVE PIPELINE DEMO</span>
            <span className="el-demo-subtle-hint">Deterministic Multi-Stage Execution</span>
          </div>

          <div className="el-demo-what-why-grid">
            <div className="el-demo-what">
              <span className="el-demo-label">WHAT IT DOES:</span>
              <span className="el-demo-text">
                Ingests regulatory circulars, extracts contract specifications, and validates them against internal reference master records.
              </span>
            </div>
            <div className="el-demo-why">
              <span className="el-demo-label">WHY IT MATTERS:</span>
              <span className="el-demo-text">
                Manual review of exchange notices causes missed tick size/rule changes, leading to algo execution slippage and trade booking breaks.
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="el-demo-controls">
          {pipelineState === "IDLE" && (
            <button
              className="el-demo-btn primary"
              onClick={runDemo}
              aria-label="Run automated validation demo"
            >
              <span className="el-demo-btn-icon">▶</span> RUN DEMO PIPELINE
            </button>
          )}

          {pipelineState === "RUNNING" && (
            <button className="el-demo-btn running" disabled aria-label="Validation pipeline executing">
              <span className="el-demo-spinner" /> EXECUTING STAGE {activeStageIdx + 1}/7...
            </button>
          )}

          {pipelineState === "COMPLETED" && (
            <div className="el-demo-btn-group">
              <button
                className="el-demo-btn primary"
                onClick={runDemo}
                aria-label="Replay validation pipeline demo"
              >
                <span className="el-demo-btn-icon">↺</span> REPLAY
              </button>
              <button
                className="el-demo-btn secondary"
                onClick={handleReset}
                aria-label="Reset demo to idle state"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 7-Stage Pipeline Visualizer ── */}
      <div className="el-demo-stages-container">
        <div className="el-demo-stages-header">
          <span className="el-demo-stages-title">DETERMINISTIC PROCESSING PIPELINE (7 STAGES)</span>
          <span className="el-demo-stages-status">
            {pipelineState === "IDLE" && "Status: Ready to execute"}
            {pipelineState === "RUNNING" && `Executing: ${stages[activeStageIdx]?.name ?? "..."}`}
            {pipelineState === "COMPLETED" && "Status: Execution completed with evidence trail"}
          </span>
        </div>

        <div className="el-demo-stages-grid">
          {stages.map((st, idx) => {
            const isActive = activeStageIdx === idx;
            const isDone = completedStages.includes(idx) && !isActive;
            const isPending = !isActive && !isDone;

            return (
              <div
                key={st.num}
                className={`el-demo-stage-card ${
                  isActive ? "active" : isDone ? "done" : "pending"
                }`}
              >
                <div className="el-demo-stage-header">
                  <span className="el-demo-stage-num">{st.num}</span>
                  <span className="el-demo-stage-indicator">
                    {isActive && <span className="el-stage-pulse" />}
                    {isDone && <span className="el-stage-check">✓</span>}
                    {isPending && <span className="el-stage-dot" />}
                  </span>
                </div>
                <div className="el-demo-stage-name">{st.name}</div>
                <div className="el-demo-stage-desc">{st.shortDesc}</div>

                {isDone && st.badge && (
                  <div className="el-demo-stage-badge-wrap">
                    <span className={`el-demo-badge ${st.badgeType ?? "info"}`}>
                      {st.badge}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Stage Log / Details Output */}
        {(pipelineState === "RUNNING" || pipelineState === "COMPLETED") && (
          <div className="el-demo-live-log">
            <div className="el-demo-log-title">
              <span className="el-log-prompt">EXECUTION OUTPUT &gt;</span>
              {activeStageIdx >= 0 ? stages[activeStageIdx]?.name : "ALL STAGES PROCESSED"}
            </div>
            <div className="el-demo-log-content">
              {completedStages.map((sIdx) => (
                <div key={sIdx} className="el-demo-log-line">
                  <span className="el-log-tick">✓</span>
                  <span className="el-log-num">[{stages[sIdx].num}]</span>
                  <strong className="el-log-name">{stages[sIdx].name}:</strong>
                  <span className="el-log-detail">{stages[sIdx].detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Final Finding & Deep Inspection Triggers (When Completed) ── */}
      {pipelineState === "COMPLETED" && (
        <div className="el-demo-outcome-card" role="region" aria-label="Demo findings and technical inspection">
          <div className="el-demo-outcome-header">
            <div className="el-demo-outcome-badge-row">
              {summary.mismatch > 0 ? (
                <span className="el-demo-outcome-tag mismatch">
                  ⚠ DISCREPANCY DETECTED ({summary.mismatch} MISMATCH, {summary.warning} WARNING)
                </span>
              ) : (
                <span className="el-demo-outcome-tag pass">
                  ✓ VERIFICATION PASSED ({summary.pass} CONFORMANT FIELDS)
                </span>
              )}
              <span className="el-demo-outcome-meta">
                Deterministic Audit ID: <code className="el-mono">{scenario.notice.documentId}</code>
              </span>
            </div>

            <h3 className="el-demo-outcome-title">
              {mismatchedResult
                ? `Exchange Discrepancy Found on ${mismatchedResult.displayLabel}`
                : "All Extracted Contract Terms Match Master Reference"}
            </h3>

            <p className="el-demo-outcome-desc">
              {mismatchedResult ? (
                <>
                  Notice <strong>{scenario.notice.documentId}</strong> extracted{" "}
                  <strong style={{ color: "var(--accent)" }}>&quot;{mismatchedResult.extractedValue}&quot;</strong> for{" "}
                  <strong>{mismatchedResult.displayLabel}</strong>, differing from reference master value{" "}
                  <strong>&quot;{mismatchedResult.referenceValue}&quot;</strong> ({mismatchedResult.delta}).
                  Audit lineage and evidence verification generated.
                </>
              ) : (
                <>
                  Notice <strong>{scenario.notice.documentId}</strong> specifications verified against{" "}
                  <strong>IDS_PROD_MASTER</strong>. All {summary.pass} fields conform to current production parameters.
                </>
              )}
            </p>
          </div>

          {/* Deep Inspection Buttons */}
          <div className="el-demo-inspect-actions">
            <span className="el-demo-inspect-label">TECHNICAL INSPECTION:</span>
            {mismatchedResult && onInspectField && (
              <button
                className="el-demo-inspect-btn"
                onClick={() => onInspectField(mismatchedResult.fieldName)}
              >
                Inspect Mismatched Field in Table
              </button>
            )}
            {onScrollToSection && (
              <button
                className="el-demo-inspect-btn"
                onClick={() => onScrollToSection("workspace")}
              >
                View Full Evidence Workspace ↓
              </button>
            )}
            {onScrollToSection && (
              <button
                className="el-demo-inspect-btn"
                onClick={() => onScrollToSection("architecture")}
              >
                View Pipeline Architecture ↓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
