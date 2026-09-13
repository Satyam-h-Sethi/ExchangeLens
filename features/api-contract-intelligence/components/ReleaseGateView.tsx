"use client";

import React, { useMemo, useState } from "react";
import {
  ApiContract,
  ApiConsumer,
  ReleaseGateResult,
  ReleaseDecision,
} from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";
import { analyzeAllConsumerImpacts } from "../logic/consumer-impact";
import { buildTestSuite, runContractTests } from "../logic/contract-test-runner";
import { evaluateReleaseGate } from "../logic/release-gate";

interface ReleaseGateViewProps {
  contracts: readonly ApiContract[];
  consumers: readonly ApiConsumer[];
}

const GATE_RULES_DEF = [
  { id: "GATE-001", name: "No Unmanaged Breaking Changes", category: "Compatibility", weight: 40 },
  { id: "GATE-002", name: "No Potentially-Breaking Changes Requiring Validation", category: "Compatibility", weight: 15 },
  { id: "GATE-003", name: "No Endpoint Removals Without Prior Deprecation", category: "Compatibility", weight: 40 },
  { id: "GATE-010", name: "Zero Downstream Consumers at CRITICAL Risk", category: "Consumer Impact", weight: 50 },
  { id: "GATE-011", name: "High-Impact Consumers Have Upgrade Coordination", category: "Consumer Impact", weight: 20 },
  { id: "GATE-012", name: "No Version-Locked Consumers Affected", category: "Consumer Impact", weight: 30 },
  { id: "GATE-020", name: "Contract Test Suite Produces Expected Invariants", category: "Contract Testing", weight: 10 },
  { id: "GATE-021", name: "Contract Test Pass Rate Meets ≥90% Threshold", category: "Contract Testing", weight: 15 },
];

export function ReleaseGateView({ contracts, consumers }: ReleaseGateViewProps) {
  const [selectedApiId, setSelectedApiId] = useState<string>(contracts[0]?.id ?? "");
  const [fromVersionIdx, setFromVersionIdx] = useState<number>(0);
  const [toVersionIdx, setToVersionIdx] = useState<number>(1);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedApiId) ?? contracts[0],
    [contracts, selectedApiId]
  );

  const gateResult = useMemo<ReleaseGateResult | null>(() => {
    if (!selectedContract || selectedContract.versions.length < 2) return null;
    if (fromVersionIdx === toVersionIdx) return null;

    const fromVersion = selectedContract.versions[fromVersionIdx];
    const toVersion = selectedContract.versions[toVersionIdx];
    if (!fromVersion || !toVersion) return null;

    const diff = diffContractVersions(selectedContract.id, fromVersion, toVersion);
    const compatReport = classifyCompatibility(diff);
    const impactReports = analyzeAllConsumerImpacts(consumers, diff, compatReport);
    const testCases = buildTestSuite(selectedContract, diff, compatReport);
    const testResults = runContractTests(testCases, diff);

    return evaluateReleaseGate(diff, compatReport, impactReports, testResults);
  }, [selectedContract, fromVersionIdx, toVersionIdx, consumers]);

  return (
    <div className="aci-view-container">
      <div className="aci-section-header">
        <div>
          <h2 className="aci-section-title">Automated Release Gate Evaluator</h2>
          <p className="aci-section-subtitle">
            Deterministic ALLOW / WARN / BLOCK governance engine with multi-factor risk scoring
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="aci-controls-card">
        <div className="aci-controls-row">
          <div className="aci-form-group">
            <label className="aci-label">Target API Contract</label>
            <select
              className="aci-select"
              value={selectedApiId}
              onChange={(e) => {
                setSelectedApiId(e.target.value);
                setFromVersionIdx(0);
                setToVersionIdx(1);
              }}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="aci-form-group">
            <label className="aci-label">From Version (Production)</label>
            <select
              className="aci-select"
              value={fromVersionIdx}
              onChange={(e) => setFromVersionIdx(Number(e.target.value))}
            >
              {selectedContract?.versions.map((v, i) => (
                <option key={v.version} value={i} disabled={i === toVersionIdx}>
                  v{v.version} ({v.publishedDate})
                </option>
              ))}
            </select>
          </div>

          <div className="aci-form-group">
            <label className="aci-label">To Version (Candidate Release)</label>
            <select
              className="aci-select"
              value={toVersionIdx}
              onChange={(e) => setToVersionIdx(Number(e.target.value))}
            >
              {selectedContract?.versions.map((v, i) => (
                <option key={v.version} value={i} disabled={i === fromVersionIdx}>
                  v{v.version} ({v.publishedDate})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!gateResult ? (
        <div className="aci-empty-state">
          <div className="aci-empty-title">Select Distinct Versions to Evaluate Gate</div>
        </div>
      ) : (
        <>
          {/* Decision Hero Banner */}
          <div
            className={`aci-decision-banner ${
              gateResult.decision === "ALLOW"
                ? "aci-decision-allow"
                : gateResult.decision === "WARN"
                ? "aci-decision-warn"
                : "aci-decision-block"
            }`}
          >
            <div className="aci-decision-content">
              <div className="aci-decision-badge-large">
                {gateResult.decision === "ALLOW" && "✓ ALLOW"}
                {gateResult.decision === "WARN" && "⚠ WARN"}
                {gateResult.decision === "BLOCK" && "✕ BLOCK"}
              </div>
              <div className="aci-decision-title">
                {gateResult.decision === "ALLOW" && "Clear to Release to Production"}
                {gateResult.decision === "WARN" && "Proceed with Release Caution"}
                {gateResult.decision === "BLOCK" && "Release Promotion Blocked"}
              </div>
              <div className="aci-decision-narrative">{gateResult.narrative}</div>
            </div>
            <div className="aci-decision-score-tile">
              <div className="aci-score-number">{gateResult.riskScore}</div>
              <div className="aci-score-label">Total Risk Score</div>
              <div className="aci-score-threshold">
                {gateResult.riskScore === 0
                  ? "0 pts (Zero Risk)"
                  : gateResult.riskScore < 50
                  ? "1–49 pts (Warning Tier)"
                  : "≥50 pts (Hard Block)"}
              </div>
            </div>
          </div>

          {/* KPI Stats */}
          <div className="aci-stat-grid">
            <div className="aci-stat-card">
              <div className="aci-stat-label">Breaking Changes</div>
              <div
                className="aci-stat-value"
                style={{ color: gateResult.breakingCount > 0 ? "var(--aci-danger)" : undefined }}
              >
                {gateResult.breakingCount}
              </div>
              <div className="aci-stat-desc">+40 pts risk weight each</div>
            </div>
            <div className="aci-stat-card">
              <div className="aci-stat-label">Potentially Breaking</div>
              <div className="aci-stat-value">{gateResult.potentiallyBreakingCount}</div>
              <div className="aci-stat-desc">+15 pts risk weight each</div>
            </div>
            <div className="aci-stat-card">
              <div className="aci-stat-label">Impacted Consumers</div>
              <div className="aci-stat-value">{gateResult.affectedConsumerCount}</div>
              <div className="aci-stat-desc">Downstream dependencies affected</div>
            </div>
            <div className="aci-stat-card">
              <div className="aci-stat-label">Critical Consumers</div>
              <div
                className="aci-stat-value"
                style={{ color: gateResult.criticalConsumerCount > 0 ? "var(--aci-danger)" : undefined }}
              >
                {gateResult.criticalConsumerCount}
              </div>
              <div className="aci-stat-desc">Direct deployment blocker</div>
            </div>
          </div>

          {/* Gate Rules Policy Audit */}
          <div className="aci-card" style={{ marginTop: "1.5rem" }}>
            <h3 className="aci-card-title">Release Gate Policy Evaluation Matrix</h3>
            <div className="aci-table-container">
              <table className="aci-table">
                <thead>
                  <tr>
                    <th>Rule ID</th>
                    <th>Policy Description</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Evaluation Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {GATE_RULES_DEF.map((rule) => {
                    const isFailing = gateResult.blockingRuleIds.includes(rule.id);
                    return (
                      <tr key={rule.id}>
                        <td>
                          <code>{rule.id}</code>
                        </td>
                        <td>
                          <strong>{rule.name}</strong>
                        </td>
                        <td>
                          <span className="aci-badge aci-badge-neutral">{rule.category}</span>
                        </td>
                        <td>
                          {isFailing ? (
                            <span className="aci-badge aci-badge-breaking">FAILED</span>
                          ) : (
                            <span className="aci-badge aci-badge-nonbreaking">PASSED</span>
                          )}
                        </td>
                        <td>
                          {isFailing ? (
                            <span className="aci-text-danger">
                              Policy condition violated. Contributes to blocking score.
                            </span>
                          ) : (
                            <span className="aci-text-success">
                              Compliant with deployment safety standards.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
