"use client";

/**
 * OverviewView — Summary health across all API contracts.
 * Shows per-API health cards, aggregate stats, and recent-activity feed.
 */

import { useMemo } from "react";
import {
  ApiContract,
  ApiConsumer,
  CompatibilityClass,
  ImpactLevel,
} from "@/features/api-contract-intelligence/types";
import { diffContractVersions } from "@/features/api-contract-intelligence/logic/contract-diff";
import { classifyCompatibility } from "@/features/api-contract-intelligence/logic/compatibility-engine";
import { analyzeAllConsumerImpacts } from "@/features/api-contract-intelligence/logic/consumer-impact";

// ─── helpers ──────────────────────────────────────────────────────────────────

function latestTwo(contract: ApiContract) {
  const sorted = [...contract.versions].sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );
  return { latest: sorted[0], prev: sorted[1] };
}

function compatBadge(c: CompatibilityClass) {
  const map: Record<CompatibilityClass, { cls: string; label: string }> = {
    BREAKING:            { cls: "aci-badge breaking",    label: "Breaking" },
    POTENTIALLY_BREAKING:{ cls: "aci-badge potentially", label: "Potentially Breaking" },
    NON_BREAKING:        { cls: "aci-badge nonbreaking", label: "Non-breaking" },
    INFORMATIONAL:       { cls: "aci-badge informational", label: "Informational" },
  };
  return map[c];
}

function impactColor(level: ImpactLevel): string {
  if (level === "CRITICAL" || level === "HIGH") return "danger";
  if (level === "MEDIUM") return "warn";
  return "ok";
}

function decisionBadge(d: string) {
  if (d === "BLOCK") return <span className="aci-badge breaking">BLOCK</span>;
  if (d === "WARN")  return <span className="aci-badge potentially">WARN</span>;
  return <span className="aci-badge nonbreaking">ALLOW</span>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contracts: ApiContract[];
  consumers: ApiConsumer[];
  selectedApiId: string;
  onSelectApi: (id: string) => void;
  onNavigate: (tab: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewView({ contracts, consumers, onNavigate }: Props) {
  const apiSummaries = useMemo(() => {
    return contracts.map((contract) => {
      const { latest, prev } = latestTwo(contract);
      if (!prev) {
        return {
          contract,
          breakingCount: 0,
          potentiallyCount: 0,
          consumerCount: consumers.filter((c) =>
            c.dependencies.some((d) => d.apiId === contract.id)
          ).length,
          latestVersion: latest?.version ?? "—",
          overallCompat: "NON_BREAKING" as CompatibilityClass,
          affectedConsumers: 0,
          highImpact: 0,
        };
      }
      const diff = diffContractVersions(contract.id, prev, latest);
      const compat = classifyCompatibility(diff);
      const impacts = analyzeAllConsumerImpacts(consumers, diff, compat);
      return {
        contract,
        breakingCount: compat.breakingCount,
        potentiallyCount: compat.potentiallyBreakingCount,
        consumerCount: consumers.filter((c) =>
          c.dependencies.some((d) => d.apiId === contract.id)
        ).length,
        latestVersion: latest.version,
        prevVersion: prev.version,
        overallCompat: compat.overallCompatibility,
        affectedConsumers: impacts.filter((r) => r.overallImpact !== "NONE").length,
        highImpact: impacts.filter(
          (r) => r.overallImpact === "CRITICAL" || r.overallImpact === "HIGH"
        ).length,
      };
    });
  }, [contracts, consumers]);

  const totals = useMemo(
    () => ({
      apis: apiSummaries.length,
      breaking: apiSummaries.reduce((s, a) => s + a.breakingCount, 0),
      potentially: apiSummaries.reduce((s, a) => s + a.potentiallyCount, 0),
      consumers: consumers.length,
      highImpact: apiSummaries.reduce((s, a) => s + a.highImpact, 0),
    }),
    [apiSummaries, consumers]
  );

  return (
    <div>
      {/* ── Aggregate stats ─────────────────────────────────────────────── */}
      <div className="aci-stats-row" style={{ marginBottom: 24 }}>
        <div className="aci-stat">
          <div className="aci-stat-val">{totals.apis}</div>
          <div className="aci-stat-label">API Contracts</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: totals.breaking > 0 ? "var(--aci-breaking)" : "var(--aci-ok)" }}>
            {totals.breaking}
          </div>
          <div className="aci-stat-label">Breaking Changes</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: totals.potentially > 0 ? "var(--aci-warn)" : "var(--aci-ok)" }}>
            {totals.potentially}
          </div>
          <div className="aci-stat-label">Potentially Breaking</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val">{totals.consumers}</div>
          <div className="aci-stat-label">Registered Consumers</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-val" style={{ color: totals.highImpact > 0 ? "var(--aci-breaking)" : "var(--aci-ok)" }}>
            {totals.highImpact}
          </div>
          <div className="aci-stat-label">High-Risk Impact</div>
        </div>
      </div>

      {/* ── API health grid ─────────────────────────────────────────────── */}
      <h2 className="aci-section-title">API Health</h2>
      <div className="aci-health-grid">
        {apiSummaries.map(({ contract, breakingCount, potentiallyCount, consumerCount, latestVersion, prevVersion, overallCompat, affectedConsumers }) => {
          const healthClass =
            breakingCount > 0 ? "has-breaking"
            : potentiallyCount > 0 ? "has-warning"
            : "healthy";
          const badge = compatBadge(overallCompat);
          return (
            <div key={contract.id} className={`aci-api-health-card ${healthClass}`}>
              <div className="aci-api-health-name">{contract.name}</div>
              <div className="aci-api-health-id">{contract.id}</div>
              {prevVersion && (
                <div style={{ marginBottom: 8 }}>
                  <span className={badge.cls}>{badge.label}</span>
                  {" "}
                  <span className="aci-transition-chip" style={{ fontSize: 11, padding: "2px 8px" }}>
                    {prevVersion} <span className="aci-transition-arrow">→</span> {latestVersion}
                  </span>
                </div>
              )}
              <div className="aci-api-health-metrics">
                <div className="aci-api-health-metric">
                  <span className={`aci-api-health-metric-val ${breakingCount > 0 ? "danger" : "ok"}`}>
                    {breakingCount}
                  </span>
                  <span className="aci-api-health-metric-label">Breaking</span>
                </div>
                <div className="aci-api-health-metric">
                  <span className={`aci-api-health-metric-val ${potentiallyCount > 0 ? "warn" : "ok"}`}>
                    {potentiallyCount}
                  </span>
                  <span className="aci-api-health-metric-label">Potentially Breaking</span>
                </div>
                <div className="aci-api-health-metric">
                  <span className="aci-api-health-metric-val" style={{ color: "var(--aci-text)" }}>
                    {consumerCount}
                  </span>
                  <span className="aci-api-health-metric-label">Consumers</span>
                </div>
                {affectedConsumers > 0 && (
                  <div className="aci-api-health-metric">
                    <span className="aci-api-health-metric-val danger">{affectedConsumers}</span>
                    <span className="aci-api-health-metric-label">Affected</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick links ─────────────────────────────────────────────────── */}
      <h2 className="aci-section-title" style={{ marginTop: 24 }}>Quick Actions</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="aci-btn" onClick={() => onNavigate("compare")}>
          Open Diff Comparison
        </button>
        <button className="aci-btn" onClick={() => onNavigate("consumers")}>
          Consumer Impact Analysis
        </button>
        <button className="aci-btn" onClick={() => onNavigate("history")}>
          Version History
        </button>
      </div>

      {/* ── Domain legend ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <h2 className="aci-section-title">Registered APIs</h2>
        <table className="aci-table">
          <thead>
            <tr>
              <th>API</th>
              <th>Domain</th>
              <th>Owner</th>
              <th>Versions</th>
              <th>Latest</th>
              <th>Overall Change</th>
            </tr>
          </thead>
          <tbody>
            {apiSummaries.map(({ contract, latestVersion, overallCompat }) => {
              const badge = compatBadge(overallCompat);
              return (
                <tr key={contract.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--aci-text)" }}>{contract.name}</span>
                    <div style={{ fontSize: 11, fontFamily: "var(--aci-font-mono)", color: "var(--aci-text-muted)" }}>
                      {contract.id}
                    </div>
                  </td>
                  <td><span className="aci-badge informational">{contract.domain}</span></td>
                  <td style={{ fontSize: 12, color: "var(--aci-text-muted)" }}>{contract.owner}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{contract.versions.length}</td>
                  <td><code className="aci-mono">{latestVersion}</code></td>
                  <td><span className={badge.cls}>{badge.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
