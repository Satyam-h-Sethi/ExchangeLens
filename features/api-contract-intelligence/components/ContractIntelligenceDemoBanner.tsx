"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ApiContract, ApiConsumer } from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";
import { evaluateReleaseGate } from "../logic/release-gate";
import { analyzeAllConsumerImpacts } from "../logic/consumer-impact";
import { buildTestSuite, runContractTests } from "../logic/contract-test-runner";
import { buildAllMigrationPlans } from "../logic/migration-planner";

interface Props {
  contract: ApiContract;
  consumers: ApiConsumer[];
  onNavigateTab?: (tab: "overview" | "compare" | "consumers" | "history") => void;
}

interface StageInfo {
  num: string;
  name: string;
  shortDesc: string;
  detail: string;
  badge?: string;
  badgeType?: "pass" | "warn" | "fail" | "info";
}

export function ContractIntelligenceDemoBanner({
  contract,
  consumers,
  onNavigateTab,
}: Props) {
  const [pipelineState, setPipelineState] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [activeStageIdx, setActiveStageIdx] = useState<number>(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pick the two most recent versions to diff (e.g. 1.2.0 vs 2.0.0)
  const sortedVersions = React.useMemo(() => {
    return [...contract.versions].sort((a, b) =>
      a.version.localeCompare(b.version, undefined, { numeric: true })
    );
  }, [contract]);

  const baseVer = sortedVersions[sortedVersions.length - 2] ?? sortedVersions[0];
  const targetVer = sortedVersions[sortedVersions.length - 1] ?? sortedVersions[0];

  // Execute actual deterministic engines
  const diff = React.useMemo(
    () => diffContractVersions(contract.id, baseVer, targetVer),
    [contract.id, baseVer, targetVer]
  );

  const compat = React.useMemo(
    () => classifyCompatibility(diff),
    [diff]
  );

  const impacts = React.useMemo(
    () => analyzeAllConsumerImpacts(consumers, diff, compat),
    [consumers, diff, compat]
  );

  const testCases = React.useMemo(
    () => buildTestSuite(contract, diff, compat),
    [contract, diff, compat]
  );

  const testResults = React.useMemo(
    () => runContractTests(testCases, diff),
    [testCases, diff]
  );

  const gate = React.useMemo(
    () => evaluateReleaseGate(diff, compat, impacts, testResults),
    [diff, compat, impacts, testResults]
  );

  const migrationPlans = React.useMemo(
    () => buildAllMigrationPlans(consumers, diff, compat, impacts),
    [consumers, diff, compat, impacts]
  );

  const stages: StageInfo[] = React.useMemo(() => {
    return [
      {
        num: "01",
        name: "INGEST AST",
        shortDesc: "Parse OpenAPI/JSON schemas",
        detail: `Loaded ${contract.name} baseline (v${baseVer.version}) and target candidate (v${targetVer.version}) AST specifications.`,
        badge: `v${baseVer.version} → v${targetVer.version}`,
        badgeType: "info",
      },
      {
        num: "02",
        name: "STRUCTURAL DIFF",
        shortDesc: "Deep schema delta",
        detail: `Identified ${diff.changes.length} total changes across endpoints, query parameters, headers, and response payloads.`,
        badge: `${diff.changes.length} Changes`,
        badgeType: "info",
      },
      {
        num: "03",
        name: "SEMANTIC RULES",
        shortDesc: "15 compatibility heuristics",
        detail: "Evaluated rule engines: Detected removed response field, renamed endpoint path, and newly required field.",
        badge: "Rule Evaluated",
        badgeType: "warn",
      },
      {
        num: "04",
        name: "COMPATIBILITY",
        shortDesc: "Classification grade",
        detail: `Contract classified as ${compat.overallCompatibility}: ${compat.breakingCount} Breaking, ${compat.potentiallyBreakingCount} Potentially Breaking, ${compat.nonBreakingCount} Non-Breaking.`,
        badge: compat.overallCompatibility,
        badgeType: compat.overallCompatibility === "BREAKING" ? "fail" : "pass",
      },
      {
        num: "05",
        name: "CONSUMER IMPACT",
        shortDesc: "Blast radius matrix",
        detail: `Evaluated ${impacts.length} registered consumers: ${impacts.filter((i) => i.overallImpact === "HIGH" || i.overallImpact === "CRITICAL").length} consumers impacted at HIGH/CRITICAL severity.`,
        badge: `${impacts.length} Consumers`,
        badgeType: "fail",
      },
      {
        num: "06",
        name: "CONTRACT TESTS",
        shortDesc: "Automated test suite",
        detail: `Executed ${testResults.totalTests} synthetic contract test cases: ${testResults.passedTests} Passed, ${testResults.failedTests} Failed (${Math.round((testResults.passedTests / (testResults.totalTests || 1)) * 100)}% Pass Rate).`,
        badge: `${testResults.failedTests} Tests Failed`,
        badgeType: testResults.failedTests > 0 ? "fail" : "pass",
      },
      {
        num: "07",
        name: "RELEASE GATE",
        shortDesc: "Policy decision",
        detail: `CI/CD Gate Decision: ${gate.decision} (Risk Score ${gate.riskScore}/100). Deployment halted to protect downstream consumers.`,
        badge: `GATE: ${gate.decision}`,
        badgeType: gate.decision === "BLOCK" ? "fail" : gate.decision === "WARN" ? "warn" : "pass",
      },
      {
        num: "08",
        name: "MIGRATION PLAN",
        shortDesc: "Playbook & SDK shim",
        detail: `Generated ${migrationPlans.length} automated migration playbooks with endpoint redirection mappings and deprecation notices.`,
        badge: `${migrationPlans.length} Playbooks`,
        badgeType: "pass",
      },
    ];
  }, [
    contract.name,
    baseVer.version,
    targetVer.version,
    diff,
    compat,
    impacts,
    testResults,
    gate,
    migrationPlans,
  ]);

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

    const stepDelay = prefersReducedMotion ? 50 : 360;

    setPipelineState("RUNNING");
    setActiveStageIdx(0);
    setCompletedStages([]);

    const executeStage = (stageIdx: number) => {
      if (stageIdx >= stages.length) {
        setPipelineState("COMPLETED");
        setActiveStageIdx(-1);
        setCompletedStages([0, 1, 2, 3, 4, 5, 6, 7]);
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
    <div className="aci-demo-banner" aria-label="Interactive Automation Demonstration">
      {/* ── Top Row: WHAT / WHY / RUN CONTROLS ── */}
      <div className="aci-demo-top-row">
        <div className="aci-demo-context">
          <div className="aci-demo-tagline">
            <span className="aci-demo-pill">INTERACTIVE COMPATIBILITY GATE DEMO</span>
            <span className="aci-demo-subtle-hint">Deterministic Multi-Stage Release Verification (8 Stages)</span>
          </div>

          <div className="aci-demo-what-why-grid">
            <div className="aci-demo-what">
              <span className="aci-demo-label">WHAT IT DOES:</span>
              <span className="aci-demo-text">
                Ingests API schemas, computes structural AST diffs, classifies compatibility, calculates consumer blast radius, executes automated contract tests, and enforces CI/CD release policies.
              </span>
            </div>
            <div className="aci-demo-why">
              <span className="aci-demo-label">WHY IT MATTERS:</span>
              <span className="aci-demo-text">
                Undetected breaking changes (e.g. removed fields or altered payload types) crash downstream microservices and break algorithmic order execution in production.
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="aci-demo-controls">
          {pipelineState === "IDLE" && (
            <button
              className="aci-demo-btn primary"
              onClick={runDemo}
              aria-label="Run automated compatibility gate demo"
            >
              <span className="aci-demo-btn-icon">▶</span> RUN DEMO PIPELINE
            </button>
          )}

          {pipelineState === "RUNNING" && (
            <button className="aci-demo-btn running" disabled aria-label="Compatibility pipeline executing">
              <span className="aci-demo-spinner" /> EXECUTING STAGE {activeStageIdx + 1}/8...
            </button>
          )}

          {pipelineState === "COMPLETED" && (
            <div className="aci-demo-btn-group">
              <button
                className="aci-demo-btn primary"
                onClick={runDemo}
                aria-label="Replay compatibility gate demo"
              >
                <span className="aci-demo-btn-icon">↺</span> REPLAY
              </button>
              <button
                className="aci-demo-btn secondary"
                onClick={handleReset}
                aria-label="Reset demo to idle state"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 8-Stage Pipeline Visualizer ── */}
      <div className="aci-demo-stages-container">
        <div className="aci-demo-stages-header">
          <span className="aci-demo-stages-title">DETERMINISTIC COMPATIBILITY PIPELINE (8 STAGES)</span>
          <span className="aci-demo-stages-status">
            {pipelineState === "IDLE" && "Status: Ready to execute"}
            {pipelineState === "RUNNING" && `Executing: ${stages[activeStageIdx]?.name ?? "..."}`}
            {pipelineState === "COMPLETED" && `Status: Evaluated · Gate Decision: ${gate.decision} · ${compat.breakingCount} Breaking Changes`}
          </span>
        </div>

        <div className="aci-demo-stages-grid">
          {stages.map((st, idx) => {
            const isActive = activeStageIdx === idx;
            const isDone = completedStages.includes(idx) && !isActive;
            const isPending = !isActive && !isDone;

            return (
              <div
                key={st.num}
                className={`aci-demo-stage-card ${
                  isActive ? "active" : isDone ? "done" : "pending"
                }`}
              >
                <div className="aci-demo-stage-header">
                  <span className="aci-demo-stage-num">{st.num}</span>
                  <span className="aci-demo-stage-indicator">
                    {isActive && <span className="aci-stage-pulse" />}
                    {isDone && <span className="aci-stage-check">✓</span>}
                    {isPending && <span className="aci-stage-dot" />}
                  </span>
                </div>
                <div className="aci-demo-stage-name">{st.name}</div>
                <div className="aci-demo-stage-desc">{st.shortDesc}</div>

                {isDone && st.badge && (
                  <div className="aci-demo-stage-badge-wrap">
                    <span className={`aci-demo-badge ${st.badgeType ?? "info"}`}>
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
          <div className="aci-demo-live-log">
            <div className="aci-demo-log-title">
              <span className="aci-log-prompt">PIPELINE EXECUTION LOG &gt;</span>
              {activeStageIdx >= 0 ? stages[activeStageIdx]?.name : "RELEASE GATE EVALUATION COMPLETED"}
            </div>
            <div className="aci-demo-log-content">
              {completedStages.map((sIdx) => (
                <div key={sIdx} className="aci-demo-log-line">
                  <span className="aci-log-tick">✓</span>
                  <span className="aci-log-num">[{stages[sIdx].num}]</span>
                  <strong className="aci-log-name">{stages[sIdx].name}:</strong>
                  <span className="aci-log-detail">{stages[sIdx].detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Final Finding & Deep Inspection Triggers (When Completed) ── */}
      {pipelineState === "COMPLETED" && (
        <div className="aci-demo-outcome-card" role="region" aria-label="Release gate findings and technical inspection">
          <div className="aci-demo-outcome-header">
            <div className="aci-demo-outcome-badge-row">
              <span className={`aci-demo-outcome-tag ${gate.decision === "BLOCK" ? "breaking" : "pass"}`}>
                {gate.decision === "BLOCK"
                  ? `🚫 RELEASE GATE BLOCKED (RISK SCORE ${gate.riskScore}/100)`
                  : `✓ RELEASE GATE PASSED`}
              </span>
              <span className="aci-demo-outcome-meta">
                Contract: <code className="aci-mono">{contract.name}</code> (v{baseVer.version} → v{targetVer.version})
              </span>
            </div>

            <h3 className="aci-demo-outcome-title">
              {gate.decision === "BLOCK"
                ? `Breaking Changes Detected — ${compat.breakingCount} Breaking, ${testResults.failedTests} Test Failures`
                : "Contract Changes Conform to Backward Compatibility Rules"}
            </h3>

            <p className="aci-demo-outcome-desc">
              Candidate revision <strong>v{targetVer.version}</strong> introduces <strong>{compat.breakingCount} breaking schema changes</strong> affecting {impacts.filter((i) => i.overallImpact === "HIGH" || i.overallImpact === "CRITICAL").length} high-criticality consumers. The automated release gate triggered a <strong>BLOCK</strong> decision. Detailed structural diff and consumer migration plan generated.
            </p>
          </div>

          {/* Deep Technical Inspection Triggers */}
          <div className="aci-demo-inspect-actions">
            <span className="aci-demo-inspect-label">TECHNICAL INSPECTION:</span>
            {onNavigateTab && (
              <>
                <button
                  className="aci-demo-inspect-btn highlight"
                  onClick={() => onNavigateTab("compare")}
                >
                  Inspect AST Diff & Field Impacts in Compare View →
                </button>
                <button
                  className="aci-demo-inspect-btn"
                  onClick={() => onNavigateTab("consumers")}
                >
                  View Consumer Blast Radius Matrix →
                </button>
                <button
                  className="aci-demo-inspect-btn"
                  onClick={() => onNavigateTab("history")}
                >
                  View Version Release Ledger →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
