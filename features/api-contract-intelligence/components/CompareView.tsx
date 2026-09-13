"use client";

/**
 * CompareView — Split-panel diff centerpiece.
 * Left: change list grouped by severity with filter chips.
 * Right: per-change inspection panel with compat rule, consumer blast radius,
 *        migration actions, contract test outcomes, and embedded release gate.
 */

import { useState, useMemo } from "react";
import {
  ApiContract,
  ApiConsumer,
  CompatibilityClass,
  CompatibilityFinding,
  ContractChange,
  ContractTestResult,
  MigrationAction,
  ConsumerImpactReport,
} from "@/features/api-contract-intelligence/types";
import { diffContractVersions } from "@/features/api-contract-intelligence/logic/contract-diff";
import { classifyCompatibility } from "@/features/api-contract-intelligence/logic/compatibility-engine";
import { analyzeAllConsumerImpacts } from "@/features/api-contract-intelligence/logic/consumer-impact";
import { buildTestSuite, runContractTests } from "@/features/api-contract-intelligence/logic/contract-test-runner";
import { buildAllMigrationPlans } from "@/features/api-contract-intelligence/logic/migration-planner";
import { evaluateReleaseGate } from "@/features/api-contract-intelligence/logic/release-gate";

// ─── Types ────────────────────────────────────────────────────────────────────

type SeverityFilter = "ALL" | CompatibilityClass;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classForCompat(c: CompatibilityClass) {
  if (c === "BREAKING")             return "breaking";
  if (c === "POTENTIALLY_BREAKING") return "potentially";
  if (c === "NON_BREAKING")         return "nonbreaking";
  return "informational";
}

function labelForCompat(c: CompatibilityClass) {
  if (c === "BREAKING")             return "BREAKING";
  if (c === "POTENTIALLY_BREAKING") return "POTENTIALLY BREAKING";
  if (c === "NON_BREAKING")         return "NON-BREAKING";
  return "INFORMATIONAL";
}

function sortOrder(c: CompatibilityClass): number {
  if (c === "BREAKING")             return 0;
  if (c === "POTENTIALLY_BREAKING") return 1;
  if (c === "NON_BREAKING")         return 2;
  return 3;
}

function CompatDotLabel({ c }: { c: CompatibilityClass }) {
  return <span className={`aci-change-item-dot ${classForCompat(c)}`} />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contract: ApiContract;
  consumers: ApiConsumer[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CompareView({ contract, consumers }: Props) {
  const versions = [...contract.versions].sort((a, b) =>
    a.version.localeCompare(b.version, undefined, { numeric: true })
  );

  const [fromVer, setFromVer] = useState(
    versions.length >= 2 ? versions[versions.length - 2].version : versions[0]?.version ?? ""
  );
  const [toVer, setToVer] = useState(
    versions[versions.length - 1]?.version ?? ""
  );
  const [filter, setFilter] = useState<SeverityFilter>("ALL");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  // ── Compute diff and all derived data ────────────────────────────────────
  const { diff, compat, impactReports, testSuite, migrationPlans, gateResult } = useMemo(() => {
    const base   = contract.versions.find((v) => v.version === fromVer);
    const target = contract.versions.find((v) => v.version === toVer);
    if (!base || !target || fromVer === toVer) return {} as never;

    const diff           = diffContractVersions(contract.id, base, target);
    const compat         = classifyCompatibility(diff);
    const impactReports  = analyzeAllConsumerImpacts(consumers, diff, compat);
    const testCases      = buildTestSuite(contract, diff, compat);
    const testSuite      = runContractTests(testCases, diff);
    const migrationPlans = buildAllMigrationPlans(consumers, diff, compat, impactReports);
    const gateResult     = evaluateReleaseGate(diff, compat, impactReports, testSuite);
    return { diff, compat, impactReports, testSuite, migrationPlans, gateResult };
  }, [contract, consumers, fromVer, toVer]);

  // ── Annotate changes with compatibility info ──────────────────────────────
  const annotatedChanges = useMemo(() => {
    if (!diff || !compat) return [];
    return diff.changes.map((ch) => {
      const finding = compat.findings.find((f) => f.changeId === ch.id);
      const compatClass: CompatibilityClass = finding?.compatibility ?? "INFORMATIONAL";
      return { change: ch, finding, compatClass };
    }).sort((a, b) => sortOrder(a.compatClass) - sortOrder(b.compatClass));
  }, [diff, compat]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return annotatedChanges;
    return annotatedChanges.filter((a) => a.compatClass === filter);
  }, [annotatedChanges, filter]);

  const countFor = (cls: SeverityFilter) =>
    cls === "ALL"
      ? annotatedChanges.length
      : annotatedChanges.filter((a) => a.compatClass === cls).length;

  // ── Selected change detail ────────────────────────────────────────────────
  const selected = useMemo(() => {
    if (!selectedChangeId) return null;
    return annotatedChanges.find((a) => a.change.id === selectedChangeId) ?? null;
  }, [selectedChangeId, annotatedChanges]);

  // ── Per-change data in right panel ───────────────────────────────────────
  const selectedImpacted = useMemo((): ConsumerImpactReport[] => {
    if (!selected || !impactReports) return [];
    return impactReports.filter((r) =>
      r.apiImpacts.some((api) =>
        api.fieldImpacts.some((fi) => fi.changeId === selected.change.id)
      )
    );
  }, [selected, impactReports]);

  const selectedMigrationActions = useMemo((): MigrationAction[] => {
    if (!selected || !migrationPlans) return [];
    const all: MigrationAction[] = [];
    for (const plan of migrationPlans) {
      for (const action of plan.actions) {
        if (action.endpointId === selected.change.endpointId) {
          all.push(action);
        }
      }
    }
    // deduplicate by id
    const seen = new Set<string>();
    return all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  }, [selected, migrationPlans]);

  const selectedTests = useMemo((): ContractTestResult[] => {
    if (!selected || !testSuite) return [];
    return testSuite.results.filter(
      (r) => !r.passed || r.actualOutcome !== "PASS"
    );
  }, [selected, testSuite]);

  const sameVersions = fromVer === toVer;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Version selectors ─────────────────────────────────────────── */}
      <div className="aci-header-selectors" style={{ marginBottom: 16 }}>
        <div className="aci-header-form-group">
          <label className="aci-header-label" htmlFor="from-ver">From Version</label>
          <select
            id="from-ver"
            className="aci-select"
            value={fromVer}
            onChange={(e) => { setFromVer(e.target.value); setSelectedChangeId(null); }}
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>{v.version}</option>
            ))}
          </select>
        </div>

        <div style={{ color: "var(--aci-text-muted)", alignSelf: "flex-end", paddingBottom: 8, fontSize: 18 }}>→</div>

        <div className="aci-header-form-group">
          <label className="aci-header-label" htmlFor="to-ver">To Version</label>
          <select
            id="to-ver"
            className="aci-select"
            value={toVer}
            onChange={(e) => { setToVer(e.target.value); setSelectedChangeId(null); }}
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>{v.version}</option>
            ))}
          </select>
        </div>

        {/* ── Inline gate badge next to selectors ── */}
        {gateResult && !sameVersions && (
          <div style={{ alignSelf: "flex-end", paddingBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <div className={`aci-gate-inline ${gateResult.decision.toLowerCase()}`}
              style={{ padding: "6px 12px", marginBottom: 0 }}>
              <span className={`aci-gate-inline-badge ${gateResult.decision.toLowerCase()}`}>
                {gateResult.decision}
              </span>
              <span className="aci-gate-inline-body" style={{ fontSize: 12 }}>
                Risk score:{" "}
                <span className={`aci-gate-inline-score ${gateResult.decision.toLowerCase()}`}
                  style={{ fontSize: 16, display: "inline" }}>
                  {gateResult.riskScore}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {sameVersions && (
        <div className="aci-no-results">Select two different versions to compare.</div>
      )}

      {!sameVersions && diff && (
        <>
          {/* ── Summary stats row ─────────────────────────────────────── */}
          <div className="aci-inline-stats" style={{ marginBottom: 14 }}>
            <div className="aci-inline-stat">
              <span className={`aci-inline-stat-val ${compat.breakingCount > 0 ? "danger" : "ok"}`}>
                {compat.breakingCount}
              </span>
              <span className="aci-inline-stat-label">Breaking</span>
            </div>
            <div className="aci-inline-stat">
              <span className={`aci-inline-stat-val ${compat.potentiallyBreakingCount > 0 ? "warn" : "ok"}`}>
                {compat.potentiallyBreakingCount}
              </span>
              <span className="aci-inline-stat-label">Potentially Breaking</span>
            </div>
            <div className="aci-inline-stat">
              <span className="aci-inline-stat-val ok">
                {compat.nonBreakingCount}
              </span>
              <span className="aci-inline-stat-label">Non-Breaking</span>
            </div>
            <div className="aci-inline-stat">
              <span className="aci-inline-stat-val" style={{ color: "var(--aci-text)" }}>
                {diff.endpointsAdded.length}
              </span>
              <span className="aci-inline-stat-label">Endpoints Added</span>
            </div>
            <div className="aci-inline-stat">
              <span className={`aci-inline-stat-val ${diff.endpointsRemoved.length > 0 ? "danger" : "ok"}`}>
                {diff.endpointsRemoved.length}
              </span>
              <span className="aci-inline-stat-label">Endpoints Removed</span>
            </div>
            <div className="aci-inline-stat">
              <span className="aci-inline-stat-val" style={{ color: "var(--aci-text)" }}>
                {impactReports.filter((r) => r.overallImpact !== "NONE").length}
              </span>
              <span className="aci-inline-stat-label">Consumers Affected</span>
            </div>
          </div>

          {/* ── Filter chips ─────────────────────────────────────────── */}
          <div className="aci-chip-row">
            {(["ALL", "BREAKING", "POTENTIALLY_BREAKING", "NON_BREAKING", "INFORMATIONAL"] as SeverityFilter[]).map((f) => {
              const chipClass =
                f === "BREAKING" ? "breaking"
                : f === "POTENTIALLY_BREAKING" ? "potentially"
                : f === "NON_BREAKING" ? "nonbreaking"
                : "";
              return (
                <button
                  key={f}
                  className={`aci-chip ${chipClass} ${filter === f ? "active" : ""}`}
                  onClick={() => { setFilter(f); setSelectedChangeId(null); }}
                >
                  {f === "ALL" ? "All" : labelForCompat(f as CompatibilityClass)}{" "}
                  <span style={{ opacity: 0.75 }}>({countFor(f)})</span>
                </button>
              );
            })}
          </div>

          {/* ── Split panel ──────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="aci-no-results">No changes match the current filter.</div>
          ) : (
            <div className="aci-split-panel">
              {/* Left: change list */}
              <div className="aci-split-left">
                <div className="aci-split-left-header">
                  <div className="aci-split-left-title">
                    {filtered.length} change{filtered.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Group by compat class */}
                {(["BREAKING", "POTENTIALLY_BREAKING", "NON_BREAKING", "INFORMATIONAL"] as CompatibilityClass[])
                  .map((cls) => {
                    const group = filtered.filter((a) => a.compatClass === cls);
                    if (group.length === 0) return null;
                    return (
                      <div key={cls}>
                        <div className="aci-severity-group-header">
                          <span className={`aci-change-item-dot ${classForCompat(cls)}`}
                            style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />
                          {labelForCompat(cls)}
                          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                            {group.length}
                          </span>
                        </div>
                        {group.map(({ change, compatClass }) => (
                          <div
                            key={change.id}
                            className={`aci-change-item ${classForCompat(compatClass)} ${selectedChangeId === change.id ? "selected" : ""}`}
                            onClick={() => setSelectedChangeId(
                              selectedChangeId === change.id ? null : change.id
                            )}
                          >
                            <CompatDotLabel c={compatClass} />
                            <div className="aci-change-item-body">
                              <div className="aci-change-item-kind">{change.kind.replace(/_/g, " ")}</div>
                              <div className="aci-change-item-desc">{change.description}</div>
                              <div className="aci-change-item-endpoint">{change.endpointId}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>

              {/* Right: inspection panel */}
              <div className="aci-split-right">
                {!selected ? (
                  <div className="aci-inspect-empty">
                    <div className="aci-inspect-empty-icon">⬅</div>
                    <div className="aci-inspect-empty-text">
                      Select a change to inspect its compatibility rule, consumer impact, and migration actions.
                    </div>
                  </div>
                ) : (
                  <div className="aci-inspect-panel">
                    {/* Change title */}
                    <div className="aci-inspect-change-title">{selected.change.description}</div>

                    <div className="aci-inspect-meta-row">
                      <span className="aci-inspect-meta-key">Endpoint</span>
                      <code className="aci-mono">{selected.change.endpointId}</code>
                    </div>
                    <div className="aci-inspect-meta-row">
                      <span className="aci-inspect-meta-key">Location</span>
                      <span className="aci-inspect-meta-val">{selected.change.location}</span>
                    </div>
                    <div className="aci-inspect-meta-row">
                      <span className="aci-inspect-meta-key">Change Kind</span>
                      <code className="aci-mono" style={{ fontSize: 11 }}>
                        {selected.change.kind}
                      </code>
                    </div>
                    {selected.change.oldValue !== undefined && (
                      <div className="aci-inspect-meta-row">
                        <span className="aci-inspect-meta-key">Before</span>
                        <code className="aci-mono" style={{ fontSize: 11 }}>
                          {JSON.stringify(selected.change.oldValue)}
                        </code>
                      </div>
                    )}
                    {selected.change.newValue !== undefined && (
                      <div className="aci-inspect-meta-row">
                        <span className="aci-inspect-meta-key">After</span>
                        <code className="aci-mono" style={{ fontSize: 11 }}>
                          {JSON.stringify(selected.change.newValue)}
                        </code>
                      </div>
                    )}

                    {/* ── Compatibility rule ─────────────────────────── */}
                    {selected.finding && (
                      <div className="aci-inspect-section" style={{ marginTop: 18 }}>
                        <div className="aci-inspect-section-title">
                          Compatibility Rule
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span className={`aci-badge ${classForCompat(selected.finding.compatibility)}`}>
                            {selected.finding.compatibility.replace(/_/g, " ")}
                          </span>
                          <code className="aci-mono" style={{ fontSize: 11, color: "var(--aci-text-muted)" }}>
                            {selected.finding.ruleId}
                          </code>
                          <span style={{ fontSize: 12, color: "var(--aci-text-muted)", marginLeft: "auto" }}>
                            Severity: <strong style={{ color: "var(--aci-text)" }}>{selected.finding.severity}</strong>
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--aci-text)", marginBottom: 6 }}>
                          <strong>{selected.finding.ruleTitle}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--aci-text-muted)", lineHeight: 1.6, marginBottom: 6 }}>
                          {selected.finding.rationale}
                        </div>
                        {selected.finding.migrationHint && (
                          <div style={{
                            fontSize: 12, background: "var(--aci-surface-2)", border: "1px solid var(--aci-border)",
                            borderRadius: "var(--aci-r)", padding: "8px 10px", color: "var(--aci-text)"
                          }}>
                            💡 {selected.finding.migrationHint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Release gate (contextual) ──────────────────── */}
                    {gateResult && (
                      <div className="aci-inspect-section">
                        <div className="aci-inspect-section-title">Release Gate</div>
                        <div className={`aci-gate-inline ${gateResult.decision.toLowerCase()}`}>
                          <span className={`aci-gate-inline-badge ${gateResult.decision.toLowerCase()}`}>
                            {gateResult.decision}
                          </span>
                          <span className="aci-gate-inline-body">{gateResult.narrative}</span>
                          <span className={`aci-gate-inline-score ${gateResult.decision.toLowerCase()}`}>
                            {gateResult.riskScore}
                          </span>
                        </div>
                        {/* Gate rule rows */}
                        <div className="aci-gate-rule-rows">
                          {/* We reconstruct from gateResult.blockingRuleIds */}
                          <div className="aci-inspect-meta-row" style={{ marginTop: 8 }}>
                            <span className="aci-inspect-meta-key">Breaking</span>
                            <span className="aci-inspect-meta-val">{gateResult.breakingCount}</span>
                          </div>
                          <div className="aci-inspect-meta-row">
                            <span className="aci-inspect-meta-key">Potentially Breaking</span>
                            <span className="aci-inspect-meta-val">{gateResult.potentiallyBreakingCount}</span>
                          </div>
                          <div className="aci-inspect-meta-row">
                            <span className="aci-inspect-meta-key">Affected Consumers</span>
                            <span className="aci-inspect-meta-val">{gateResult.affectedConsumerCount}</span>
                          </div>
                          <div className="aci-inspect-meta-row">
                            <span className="aci-inspect-meta-key">Critical Consumers</span>
                            <span className="aci-inspect-meta-val" style={{
                              color: gateResult.criticalConsumerCount > 0 ? "var(--aci-breaking)" : "var(--aci-ok)"
                            }}>
                              {gateResult.criticalConsumerCount}
                            </span>
                          </div>
                          {gateResult.blockingRuleIds.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <div className="aci-inspect-section-title">Blocking Rules</div>
                              {gateResult.blockingRuleIds.map((ruleId) => (
                                <div key={ruleId} className="aci-gate-rule-row failed">
                                  <span className="aci-gate-rule-row-id">{ruleId}</span>
                                  <span className="aci-gate-rule-row-desc" style={{ color: "var(--aci-breaking)" }}>
                                    Failed — blocks release
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Consumer blast radius ──────────────────────── */}
                    <div className="aci-inspect-section">
                      <div className="aci-inspect-section-title">
                        Consumer Blast Radius
                        {selectedImpacted.length > 0 && (
                          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums",
                            fontSize: 11, color: "var(--aci-breaking)", fontWeight: 700 }}>
                            {selectedImpacted.length} impacted
                          </span>
                        )}
                      </div>
                      {selectedImpacted.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--aci-text-muted)" }}>
                          No consumers consume fields affected by this specific change.
                        </div>
                      ) : (
                        <div className="aci-consumer-drill">
                          {selectedImpacted.map((report) => {
                            const relevantImpacts = report.apiImpacts.flatMap((a) =>
                              a.fieldImpacts.filter((fi) => fi.changeId === selected.change.id)
                            );
                            const impactLevel = report.overallImpact;
                            const impactColor =
                              impactLevel === "CRITICAL" || impactLevel === "HIGH" ? "danger"
                              : impactLevel === "MEDIUM" ? "warn"
                              : "ok";
                            return (
                              <div key={report.consumerId} className="aci-consumer-drill-row">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                  <span className="aci-consumer-drill-name">{report.consumerName}</span>
                                  <span className={`aci-badge ${impactColor === "danger" ? "breaking" : impactColor === "warn" ? "potentially" : "nonbreaking"}`}>
                                    {impactLevel}
                                  </span>
                                </div>
                                {relevantImpacts.map((fi, i) => (
                                  <div key={i} className="aci-field-impact-row" style={{ marginTop: 4 }}>
                                    <code className="aci-field-impact-path">{fi.fieldPath}</code>
                                    <span className="aci-field-impact-detail">{fi.detail}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ── Migration actions ──────────────────────────── */}
                    {selectedMigrationActions.length > 0 && (
                      <div className="aci-inspect-section">
                        <div className="aci-inspect-section-title">Migration Actions</div>
                        {selectedMigrationActions.map((action) => (
                          <div key={action.id} className="aci-action-card">
                            <div className="aci-action-card-header">
                              <span className={`aci-badge ${action.priority === 1 ? "breaking" : action.priority === 2 ? "potentially" : "nonbreaking"}`}>
                                P{action.priority}
                              </span>
                              <span className="aci-action-card-title">{action.description}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                              <span className="aci-meta-pill">Effort: {action.estimatedEffort}</span>
                              {action.automatable && (
                                <span className="aci-meta-pill aci-meta-pill-ok">Automatable</span>
                              )}
                            </div>
                            {action.codeSnippet && (
                              <pre className="aci-code-snippet">{action.codeSnippet}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Contract test outcomes ─────────────────────── */}
                    {testSuite && testSuite.results.length > 0 && (
                      <div className="aci-inspect-section">
                        <div className="aci-inspect-section-title">
                          Contract Tests
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--aci-text-muted)" }}>
                            {testSuite.passedTests}/{testSuite.totalTests} passed
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {testSuite.results.slice(0, 8).map((r) => (
                            <div key={r.testCaseId} className="aci-test-compact-row">
                              <span className={`aci-test-compact-outcome ${r.outcome.toLowerCase()}`}>
                                {r.outcome}
                              </span>
                              <span className="aci-test-compact-scenario">{r.scenario}</span>
                              <span className="aci-test-compact-detail">{r.detail}</span>
                            </div>
                          ))}
                          {testSuite.results.length > 8 && (
                            <div style={{ fontSize: 11, color: "var(--aci-text-muted)", padding: "6px 10px" }}>
                              + {testSuite.results.length - 8} more tests
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
