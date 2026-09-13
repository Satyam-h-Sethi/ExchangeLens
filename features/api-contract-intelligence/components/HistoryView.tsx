"use client";

import React, { useMemo, useState } from "react";
import { ApiContract, ApiConsumer, CompatibilityReport, ContractDiff } from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";

interface HistoryViewProps {
  contracts: readonly ApiContract[];
  consumers: readonly ApiConsumer[];
}

interface TransitionHistoryItem {
  apiId: string;
  apiName: string;
  domain: string;
  fromVersion: string;
  toVersion: string;
  publishedDate: string;
  diff: ContractDiff;
  compatReport: CompatibilityReport;
}

const COMPAT_BADGE_MAP: Record<string, string> = {
  BREAKING: "aci-badge-breaking",
  POTENTIALLY_BREAKING: "aci-badge-potentially",
  NON_BREAKING: "aci-badge-nonbreaking",
  INFORMATIONAL: "aci-badge-informational",
};

export function HistoryView({ contracts }: HistoryViewProps) {
  const [filterApiId, setFilterApiId] = useState<string>("ALL");

  const transitions = useMemo<TransitionHistoryItem[]>(() => {
    const list: TransitionHistoryItem[] = [];

    for (const contract of contracts) {
      if (contract.versions.length < 2) continue;

      for (let i = 0; i < contract.versions.length - 1; i++) {
        const fromV = contract.versions[i];
        const toV = contract.versions[i + 1];
        const diff = diffContractVersions(contract.id, fromV, toV);
        const compatReport = classifyCompatibility(diff);

        list.push({
          apiId: contract.id,
          apiName: contract.name,
          domain: contract.domain,
          fromVersion: fromV.version,
          toVersion: toV.version,
          publishedDate: toV.publishedDate,
          diff,
          compatReport,
        });
      }
    }

    // Sort newest release date first
    return list.sort(
      (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }, [contracts]);

  const filteredTransitions = useMemo(() => {
    if (filterApiId === "ALL") return transitions;
    return transitions.filter((t) => t.apiId === filterApiId);
  }, [transitions, filterApiId]);

  const totalTransitions = transitions.length;
  const breakingTransitions = transitions.filter(
    (t) => t.compatReport.overallCompatibility === "BREAKING"
  ).length;
  const totalChangesTracked = transitions.reduce((acc, t) => acc + t.diff.changes.length, 0);

  return (
    <div className="aci-view-container">
      <div className="aci-section-header">
        <div>
          <h2 className="aci-section-title">Contract Evolution & Audit History</h2>
          <p className="aci-section-subtitle">
            Historical ledger of contract version migrations, structural modifications, and compatibility findings
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="aci-controls-card">
        <div className="aci-controls-row">
          <div className="aci-form-group">
            <label className="aci-label">Filter by API Contract</label>
            <select
              className="aci-select"
              value={filterApiId}
              onChange={(e) => setFilterApiId(e.target.value)}
            >
              <option value="ALL">All Contracts ({contracts.length} APIs)</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="aci-stat-grid">
        <div className="aci-stat-card">
          <div className="aci-stat-label">Version Transitions</div>
          <div className="aci-stat-value">{totalTransitions}</div>
          <div className="aci-stat-desc">Historical schema evolution pairs</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">Breaking Transitions</div>
          <div
            className="aci-stat-value"
            style={{ color: breakingTransitions > 0 ? "var(--aci-danger)" : undefined }}
          >
            {breakingTransitions}
          </div>
          <div className="aci-stat-desc">Transitions requiring consumer migration</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">Total Schema Mutations</div>
          <div className="aci-stat-value">{totalChangesTracked}</div>
          <div className="aci-stat-desc">Field, endpoint, and constraint changes</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">Tracked APIs</div>
          <div className="aci-stat-value">{contracts.length}</div>
          <div className="aci-stat-desc">Active institutional interfaces</div>
        </div>
      </div>

      {/* Timeline of Version Transitions */}
      <div className="aci-timeline">
        {filteredTransitions.map((item, idx) => {
          const compatClass = item.compatReport.overallCompatibility;
          const badgeClass = COMPAT_BADGE_MAP[compatClass] || "aci-badge-neutral";

          return (
            <div key={`${item.apiId}-${item.fromVersion}-${item.toVersion}`} className="aci-timeline-item">
              <div className="aci-timeline-marker" />
              <div className="aci-card aci-timeline-card">
                <div className="aci-timeline-header">
                  <div>
                    <div className="aci-timeline-title">
                      <strong>{item.apiName}</strong> (<code>{item.apiId}</code>)
                    </div>
                    <div className="aci-timeline-subtitle">
                      v{item.fromVersion} → v{item.toVersion} • Published on {item.publishedDate}
                    </div>
                  </div>
                  <div>
                    <span className={`aci-badge ${badgeClass}`}>{compatClass}</span>
                  </div>
                </div>

                <div className="aci-timeline-body">
                  <div className="aci-timeline-meta-row">
                    <span className="aci-meta-item">
                      Total Changes: <strong>{item.diff.changes.length}</strong>
                    </span>
                    <span className="aci-meta-item">
                      Breaking Findings:{" "}
                      <strong className={item.compatReport.breakingCount > 0 ? "aci-text-danger" : ""}>
                        {item.compatReport.breakingCount}
                      </strong>
                    </span>
                    <span className="aci-meta-item">
                      Endpoints Added: <strong>{item.diff.endpointsAdded.length}</strong>
                    </span>
                    <span className="aci-meta-item">
                      Endpoints Removed: <strong>{item.diff.endpointsRemoved.length}</strong>
                    </span>
                  </div>

                  {item.diff.changes.length > 0 && (
                    <div className="aci-timeline-changes">
                      <div className="aci-timeline-changes-title">Key Schema Modifications:</div>
                      <ul className="aci-timeline-list">
                        {item.diff.changes.slice(0, 4).map((change) => (
                          <li key={change.id}>
                            <code className="aci-code-tag">{change.kind}</code> on{" "}
                            <code>{change.endpointId}</code>: {change.description}
                          </li>
                        ))}
                        {item.diff.changes.length > 4 && (
                          <li className="aci-text-muted">
                            + {item.diff.changes.length - 4} additional schema changes
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
