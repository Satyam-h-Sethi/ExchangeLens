"use client";

import { useMemo } from "react";
import {
  ApiContract,
  ApiConsumer,
  ApiDomain,
  ConsumerToleranceBehavior,
} from "../types";

interface OverviewViewProps {
  contracts: readonly ApiContract[];
  consumers: readonly ApiConsumer[];
}

const DOMAIN_LABELS: Record<ApiDomain, string> = {
  MARKET_DATA: "Market Data",
  REFERENCE_DATA: "Ref Data",
  SETTLEMENT: "Settlement",
  RISK: "Risk",
};

const TOLERANCE_BADGE_CLASS: Record<ConsumerToleranceBehavior, string> = {
  STRICT: "aci-badge-breaking",
  LENIENT: "aci-badge-nonbreaking",
  VERSION_LOCKED: "aci-badge-critical",
};

export function OverviewView({ contracts, consumers }: OverviewViewProps) {
  const totalVersions = useMemo(
    () => contracts.reduce((sum, c) => sum + c.versions.length, 0),
    [contracts]
  );

  const totalEndpoints = useMemo(
    () =>
      contracts.reduce((sum, c) => {
        const latest = c.versions[c.versions.length - 1];
        return sum + (latest ? latest.endpoints.length : 0);
      }, 0),
    [contracts]
  );

  return (
    <div className="aci-overview">
      {/* ── Stat tiles ─────────────────────────────────────────────────────── */}
      <div className="aci-stat-grid">
        <div className="aci-stat-tile">
          <span className="aci-stat-value">{contracts.length}</span>
          <span className="aci-stat-label">APIs Tracked</span>
        </div>
        <div className="aci-stat-tile">
          <span className="aci-stat-value">{totalVersions}</span>
          <span className="aci-stat-label">Contract Versions</span>
        </div>
        <div className="aci-stat-tile">
          <span className="aci-stat-value">{consumers.length}</span>
          <span className="aci-stat-label">Registered Consumers</span>
        </div>
        <div className="aci-stat-tile">
          <span className="aci-stat-value">{totalEndpoints}</span>
          <span className="aci-stat-label">Total Endpoints (latest)</span>
        </div>
      </div>

      {/* ── Two-column grid ─────────────────────────────────────────────────── */}
      <div className="aci-overview-grid">
        {/* Left: Registered APIs */}
        <section className="aci-panel">
          <h2 className="aci-panel-title">Registered APIs</h2>
          <div className="aci-card-list">
            {contracts.map((contract) => (
              <div key={contract.id} className="aci-card">
                <div className="aci-card-header">
                  <span className="aci-card-name">{contract.name}</span>
                  <span className="aci-badge aci-badge-neutral">
                    {DOMAIN_LABELS[contract.domain]}
                  </span>
                </div>
                <p className="aci-card-description">{contract.description}</p>
                <div className="aci-card-meta">
                  <span className="aci-meta-item">
                    {contract.versions.length}{" "}
                    {contract.versions.length === 1 ? "version" : "versions"}
                  </span>
                  <span className="aci-meta-item aci-meta-owner">
                    {contract.owner}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Consumer Registry */}
        <section className="aci-panel">
          <h2 className="aci-panel-title">Consumer Registry</h2>
          <div className="aci-consumer-list">
            {consumers.map((consumer) => (
              <div key={consumer.id} className="aci-consumer-row">
                <div className="aci-consumer-header">
                  <span className="aci-consumer-name">{consumer.name}</span>
                  <span className="aci-consumer-team">{consumer.team}</span>
                </div>
                <div className="aci-consumer-deps">
                  {consumer.dependencies.map((dep) => (
                    <div key={dep.apiId} className="aci-dep-item">
                      <span className="aci-dep-api">{dep.apiId}</span>
                      <span className="aci-dep-version">
                        v{dep.pinnedVersion}
                      </span>
                      <span
                        className={`aci-badge ${TOLERANCE_BADGE_CLASS[dep.toleranceBehavior]}`}
                      >
                        {dep.toleranceBehavior.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Quick Reference ─────────────────────────────────────────────────── */}
      <section className="aci-quick-reference">
        <h2 className="aci-panel-title">Quick Reference</h2>
        <div className="aci-info-boxes">
          <div className="aci-info-box">
            <h3 className="aci-info-box-title">Structural Diffing</h3>
            <p className="aci-info-box-body">
              The contract engine performs field-level structural diffing between
              any two API versions. It identifies added, removed, and modified
              endpoints, request fields, response fields, parameters, and enum
              values — producing a deterministic, reproducible change record with
              stable change IDs derived from path and kind.
            </p>
          </div>
          <div className="aci-info-box">
            <h3 className="aci-info-box-title">Compatibility Classification</h3>
            <p className="aci-info-box-body">
              Each detected change is classified using a rules engine:
              BREAKING, POTENTIALLY_BREAKING, NON_BREAKING, or INFORMATIONAL.
              Rules cover type coercion, requiredness changes, enum mutations,
              field removal, and response code additions — grounded in
              forward/backward compatibility semantics for fintech APIs.
            </p>
          </div>
          <div className="aci-info-box">
            <h3 className="aci-info-box-title">Release Gate</h3>
            <p className="aci-info-box-body">
              Before a new version is promoted, the Release Gate scores it
              against weighted rules: breaking change count, impacted consumer
              count, contract test pass rate, and migration plan completeness.
              The gate issues an ALLOW, WARN, or BLOCK decision with a
              structured rationale — preventing regressions at the source.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
