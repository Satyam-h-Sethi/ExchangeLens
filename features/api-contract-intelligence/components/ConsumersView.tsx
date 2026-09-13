"use client";

/**
 * ConsumersView — Consumer blast radius and dependency drill-down.
 * Flow: CHANGE → FIELD/ENDPOINT → AFFECTED CONSUMERS → IMPACT
 * Sibling <tr> implementation — no nested <tr> inside <tr>!
 */

import React, { useState, useMemo } from "react";
import {
  ApiContract,
  ApiConsumer,
  ImpactLevel,
  CompatibilityClass,
} from "@/features/api-contract-intelligence/types";
import { diffContractVersions } from "@/features/api-contract-intelligence/logic/contract-diff";
import { classifyCompatibility } from "@/features/api-contract-intelligence/logic/compatibility-engine";
import { analyzeAllConsumerImpacts } from "@/features/api-contract-intelligence/logic/consumer-impact";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function impactBadge(level: ImpactLevel) {
  if (level === "CRITICAL") return <span className="aci-badge breaking">CRITICAL</span>;
  if (level === "HIGH")     return <span className="aci-badge breaking">HIGH</span>;
  if (level === "MEDIUM")   return <span className="aci-badge potentially">MEDIUM</span>;
  if (level === "LOW")      return <span className="aci-badge nonbreaking">LOW</span>;
  return <span className="aci-badge informational">NONE</span>;
}

function compatClassToBadge(c: CompatibilityClass) {
  if (c === "BREAKING")             return "breaking";
  if (c === "POTENTIALLY_BREAKING") return "potentially";
  if (c === "NON_BREAKING")         return "nonbreaking";
  return "informational";
}

function latestTwoVersions(contract: ApiContract) {
  const sorted = [...contract.versions].sort((a, b) =>
    a.version.localeCompare(b.version, undefined, { numeric: true })
  );
  return {
    base: sorted[sorted.length - 2] ?? sorted[0],
    target: sorted[sorted.length - 1],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contracts: ApiContract[];
  consumers: ApiConsumer[];
  selectedApiId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConsumersView({ contracts, consumers, selectedApiId }: Props) {
  const [selectedConsumerId, setSelectedConsumerId] = useState<string | null>(
    consumers[0]?.id ?? null
  );

  const contract =
    contracts.find((c) => c.id === selectedApiId) ?? contracts[0];

  // ── Compute diff & impact reports for current selected API ────────────────
  const { diff, compat, impactReports } = useMemo(() => {
    if (!contract || contract.versions.length < 2) {
      return { diff: null, compat: null, impactReports: [] };
    }
    const { base, target } = latestTwoVersions(contract);
    if (!base || !target) return { diff: null, compat: null, impactReports: [] };

    const diff = diffContractVersions(contract.id, base, target);
    const compat = classifyCompatibility(diff);
    const impactReports = analyzeAllConsumerImpacts(consumers, diff, compat);
    return { diff, compat, impactReports };
  }, [contract, consumers]);

  // Consumers depending on selected API
  const dependentConsumers = useMemo(() => {
    return consumers.filter((c) =>
      c.dependencies.some((d) => d.apiId === selectedApiId)
    );
  }, [consumers, selectedApiId]);

  // Selected consumer details
  const selectedConsumer = useMemo(() => {
    return consumers.find((c) => c.id === selectedConsumerId) ?? null;
  }, [consumers, selectedConsumerId]);

  const selectedReport = useMemo(() => {
    return impactReports.find((r) => r.consumerId === selectedConsumerId) ?? null;
  }, [impactReports, selectedConsumerId]);

  // Stats across all dependent consumers
  const stats = useMemo(() => {
    const critical = impactReports.filter((r) => r.overallImpact === "CRITICAL").length;
    const high     = impactReports.filter((r) => r.overallImpact === "HIGH").length;
    const medium   = impactReports.filter((r) => r.overallImpact === "MEDIUM").length;
    const low      = impactReports.filter((r) => r.overallImpact === "LOW").length;
    return { critical, high, medium, low, total: dependentConsumers.length };
  }, [impactReports, dependentConsumers]);

  const { base: fromVer, target: toVer } = latestTwoVersions(contract);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Transition context bar ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--aci-text-muted)" }}>Evaluating transition:</span>
        <span className="aci-transition-chip">
          {fromVer?.version} <span className="aci-transition-arrow">→</span> {toVer?.version}
        </span>
        <span style={{ fontSize: 12, color: "var(--aci-text-muted)", marginLeft: "auto" }}>
          {dependentConsumers.length} registered consumer{dependentConsumers.length !== 1 ? "s" : ""} for{" "}
          <strong style={{ color: "var(--aci-text)" }}>{contract.name}</strong>
        </span>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="aci-stats-row" style={{ marginBottom: 20 }}>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: stats.critical > 0 ? "var(--aci-breaking)" : "var(--aci-ok)" }}>
            {stats.critical}
          </div>
          <div className="aci-stat-label">Critical Impact</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: stats.high > 0 ? "var(--aci-breaking)" : "var(--aci-ok)" }}>
            {stats.high}
          </div>
          <div className="aci-stat-label">High Impact</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: stats.medium > 0 ? "var(--aci-warn)" : "var(--aci-ok)" }}>
            {stats.medium}
          </div>
          <div className="aci-stat-label">Medium Impact</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val">{stats.low}</div>
          <div className="aci-stat-label">Low Impact</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val">{stats.total}</div>
          <div className="aci-stat-label">Total Consumers</div>
        </div>
      </div>

      {/* ── Master-Detail Layout ────────────────────────────────────────── */}
      <div className="aci-consumer-grid">
        {/* Left: Consumer List */}
        <div className="aci-consumer-list-panel">
          <div className="aci-consumer-list-header">
            Consumers ({dependentConsumers.length})
          </div>
          {dependentConsumers.length === 0 ? (
            <div className="aci-no-results">No consumers depend on this API.</div>
          ) : (
            dependentConsumers.map((c) => {
              const rep = impactReports.find((r) => r.consumerId === c.id);
              const dep = c.dependencies.find((d) => d.apiId === selectedApiId);
              return (
                <div
                  key={c.id}
                  className={`aci-consumer-list-item ${selectedConsumerId === c.id ? "selected" : ""}`}
                  onClick={() => setSelectedConsumerId(c.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div className="aci-consumer-list-item-name">{c.name}</div>
                    {rep && impactBadge(rep.overallImpact)}
                  </div>
                  <div className="aci-consumer-list-item-sub">
                    {c.team} · pinned <code className="aci-mono" style={{ fontSize: 10 }}>{dep?.pinnedVersion}</code>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span className="aci-meta-pill" style={{ fontSize: 10 }}>
                      {dep?.toleranceBehavior}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Consumer Detail Drill-Down */}
        <div className="aci-consumer-detail-panel">
          {!selectedConsumer ? (
            <div className="aci-inspect-empty">
              <div className="aci-inspect-empty-icon">👥</div>
              <div className="aci-inspect-empty-text">Select a consumer to inspect its blast radius.</div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--aci-text)", margin: "0 0 4px" }}>
                    {selectedConsumer.name}
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--aci-text-muted)" }}>
                    {selectedConsumer.team} · <code className="aci-mono">{selectedConsumer.id}</code>
                  </div>
                </div>
                {selectedReport && impactBadge(selectedReport.overallImpact)}
              </div>

              <p style={{ fontSize: 12.5, color: "var(--aci-text)", lineHeight: 1.5, marginBottom: 16 }}>
                {selectedConsumer.description}
              </p>

              {/* Pinned version & tolerance */}
              {(() => {
                const dep = selectedConsumer.dependencies.find((d) => d.apiId === selectedApiId);
                if (!dep) return null;
                return (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                    <span className="aci-meta-pill">Pinned: <strong>{dep.pinnedVersion}</strong></span>
                    <span className="aci-meta-pill">Tolerance: <strong>{dep.toleranceBehavior}</strong></span>
                    <span className="aci-meta-pill">
                      Endpoints consumed: <strong>{dep.endpoints.length}</strong>
                    </span>
                  </div>
                );
              })()}

              {/* Field Impacts (Drill-Down: CHANGE → FIELD → IMPACT) */}
              <div className="aci-sub-heading">Field Impact Breakdown</div>
              {selectedReport && selectedReport.apiImpacts.length > 0 ? (
                selectedReport.apiImpacts.map((apiImpact) => (
                  <div key={apiImpact.apiId} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--aci-text-muted)", marginBottom: 8 }}>
                      {apiImpact.riskSummary}
                    </div>

                    {apiImpact.fieldImpacts.length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--aci-ok)" }}>
                        ✓ No consumed fields are affected by breaking changes.
                      </div>
                    ) : (
                      apiImpact.fieldImpacts.map((fi, i) => (
                        <div key={i} className="aci-field-impact-row">
                          <span className={`aci-badge ${compatClassToBadge(fi.compatibility)}`}>
                            {fi.compatibility.replace(/_/g, " ")}
                          </span>
                          <div style={{ flex: 1 }}>
                            <code className="aci-field-impact-path">{fi.fieldPath}</code>
                            <div className="aci-field-impact-detail">{fi.detail}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "var(--aci-text-muted)" }}>
                  No impact report available for this version transition.
                </div>
              )}

              {/* Consumed Endpoints Table (Correct Sibling <tr> Structure!) */}
              <div className="aci-sub-heading" style={{ marginTop: 20 }}>Declared Endpoints & Fields</div>
              {(() => {
                const dep = selectedConsumer.dependencies.find((d) => d.apiId === selectedApiId);
                if (!dep) return null;
                return (
                  <table className="aci-table">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Critical</th>
                        <th>Consumed Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dep.endpoints.map((ep) => (
                        <tr key={ep.endpointId}>
                          <td>
                            <code className="aci-mono" style={{ fontSize: 11 }}>
                              {ep.endpointId}
                            </code>
                          </td>
                          <td>
                            {ep.criticalForOperation ? (
                              <span className="aci-badge breaking">CRITICAL</span>
                            ) : (
                              <span className="aci-badge nonbreaking">NON-CRITICAL</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {ep.consumedFields.map((f) => (
                                <code key={f} className="aci-mono" style={{ fontSize: 10, padding: "1px 5px", background: "var(--aci-surface-3)" }}>
                                  {f}
                                </code>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
