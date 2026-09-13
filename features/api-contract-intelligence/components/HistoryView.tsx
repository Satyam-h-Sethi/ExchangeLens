"use client";

/**
 * HistoryView — Clean audit ledger and version history timeline.
 * Displays version transitions, changelog summaries, compatibility decisions,
 * and deterministic audit logs.
 */

import { useState, useMemo } from "react";
import {
  ApiContract,
  ApiConsumer,
  CompatibilityClass,
  ReleaseDecision,
} from "@/features/api-contract-intelligence/types";
import { diffContractVersions } from "@/features/api-contract-intelligence/logic/contract-diff";
import { classifyCompatibility } from "@/features/api-contract-intelligence/logic/compatibility-engine";
import { evaluateReleaseGate } from "@/features/api-contract-intelligence/logic/release-gate";
import { analyzeAllConsumerImpacts } from "@/features/api-contract-intelligence/logic/consumer-impact";
import { buildTestSuite, runContractTests } from "@/features/api-contract-intelligence/logic/contract-test-runner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decisionBadge(d: ReleaseDecision) {
  if (d === "BLOCK") return <span className="aci-badge breaking">BLOCK</span>;
  if (d === "WARN")  return <span className="aci-badge potentially">WARN</span>;
  return <span className="aci-badge nonbreaking">ALLOW</span>;
}

function compatClassToDot(c: CompatibilityClass) {
  if (c === "BREAKING")             return "breaking";
  if (c === "POTENTIALLY_BREAKING") return "potentially";
  if (c === "NON_BREAKING")         return "nonbreaking";
  return "informational";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contracts: ApiContract[];
  consumers: ApiConsumer[];
  selectedApiId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HistoryView({ contracts, consumers, selectedApiId }: Props) {
  const [selectedTransitionIdx, setSelectedTransitionIdx] = useState<number | null>(null);

  const contract =
    contracts.find((c) => c.id === selectedApiId) ?? contracts[0];

  // ── Compute all sequential transitions for the selected API ──────────────
  const transitions = useMemo(() => {
    if (!contract || contract.versions.length < 2) return [];

    const sorted = [...contract.versions].sort((a, b) =>
      a.version.localeCompare(b.version, undefined, { numeric: true })
    );

    const result = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const base = sorted[i];
      const target = sorted[i + 1];

      const diff = diffContractVersions(contract.id, base, target);
      const compat = classifyCompatibility(diff);
      const impacts = analyzeAllConsumerImpacts(consumers, diff, compat);
      const testCases = buildTestSuite(contract, diff, compat);
      const tests = runContractTests(testCases, diff);
      const gate = evaluateReleaseGate(diff, compat, impacts, tests);

      result.push({
        from: base,
        to: target,
        diff,
        compat,
        gate,
        impacts,
        tests,
      });
    }

    // Newest transitions first
    return result.reverse();
  }, [contract, consumers]);

  const selected =
    selectedTransitionIdx !== null ? transitions[selectedTransitionIdx] : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="aci-section-title" style={{ margin: 0 }}>Version Release Ledger</h2>
          <div style={{ fontSize: 12, color: "var(--aci-text-muted)", marginTop: 2 }}>
            Historical transitions, compatibility reports, and release decisions for{" "}
            <strong style={{ color: "var(--aci-text)" }}>{contract.name}</strong>
          </div>
        </div>
        <span className="aci-meta-pill">
          {contract.versions.length} versions · {transitions.length} transitions
        </span>
      </div>

      {transitions.length === 0 ? (
        <div className="aci-no-results">No historical transitions for this API.</div>
      ) : (
        <div className="aci-history-timeline">
          {transitions.map((t, idx) => {
            const isSelected = selectedTransitionIdx === idx;
            const dotClass = compatClassToDot(t.compat.overallCompatibility);
            return (
              <div key={`${t.from.version}-${t.to.version}`} className="aci-history-item">
                <span className={`aci-history-dot ${dotClass}`} />
                <div
                  className="aci-history-card"
                  style={{
                    cursor: "pointer",
                    borderLeft: isSelected ? "3px solid var(--aci-accent)" : undefined,
                    background: isSelected ? "var(--aci-surface-2)" : undefined,
                  }}
                  onClick={() => setSelectedTransitionIdx(isSelected ? null : idx)}
                >
                  <div className="aci-history-card-header">
                    <div>
                      <div className="aci-history-card-title">
                        {t.to.changelogSummary ?? `Release ${t.to.version}`}
                      </div>
                      <div className="aci-history-card-sub">
                        <span className="aci-transition-chip" style={{ fontSize: 11, padding: "2px 8px" }}>
                          {t.from.version} <span className="aci-transition-arrow">→</span> {t.to.version}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {decisionBadge(t.gate.decision)}
                      <span className="aci-history-card-date">{t.to.publishedDate}</span>
                    </div>
                  </div>

                  {/* Summary pills */}
                  <div className="aci-history-meta-pills">
                    <span className="aci-history-meta-pill">
                      Breaking: <strong style={{ color: t.compat.breakingCount > 0 ? "var(--aci-breaking)" : "inherit" }}>
                        {t.compat.breakingCount}
                      </strong>
                    </span>
                    <span className="aci-history-meta-pill">
                      Potentially: <strong style={{ color: t.compat.potentiallyBreakingCount > 0 ? "var(--aci-warn)" : "inherit" }}>
                        {t.compat.potentiallyBreakingCount}
                      </strong>
                    </span>
                    <span className="aci-history-meta-pill">
                      Non-breaking: <strong>{t.compat.nonBreakingCount}</strong>
                    </span>
                    <span className="aci-history-meta-pill">
                      Risk Score: <strong>{t.gate.riskScore}</strong>
                    </span>
                    <span className="aci-history-meta-pill">
                      Tests: <strong>{t.tests.passedTests}/{t.tests.totalTests}</strong>
                    </span>
                  </div>

                  {/* Top changes preview */}
                  <ul className="aci-history-changes-list">
                    {t.diff.changes.slice(0, 3).map((ch) => (
                      <li key={ch.id}>
                        <code className="aci-mono" style={{ fontSize: 10, color: "var(--aci-text-muted)" }}>
                          {ch.kind}
                        </code>
                        <span>{ch.description}</span>
                      </li>
                    ))}
                    {t.diff.changes.length > 3 && (
                      <li style={{ color: "var(--aci-text-muted)", fontStyle: "italic" }}>
                        + {t.diff.changes.length - 3} more change{t.diff.changes.length - 3 !== 1 ? "s" : ""} (click to expand)
                      </li>
                    )}
                  </ul>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--aci-border)" }}>
                      <div className="aci-inspect-section-title">Release Gate Narrative</div>
                      <div style={{ fontSize: 12.5, color: "var(--aci-text)", lineHeight: 1.5, marginBottom: 12 }}>
                        {t.gate.narrative}
                      </div>

                      <div className="aci-inspect-section-title">All Changes ({t.diff.changes.length})</div>
                      <table className="aci-table" style={{ fontSize: 11.5 }}>
                        <thead>
                          <tr>
                            <th>Endpoint</th>
                            <th>Kind</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.diff.changes.map((ch) => (
                            <tr key={ch.id}>
                              <td><code className="aci-mono">{ch.endpointId}</code></td>
                              <td><code className="aci-mono">{ch.kind}</code></td>
                              <td>{ch.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
