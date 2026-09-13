"use client";

import React, { useMemo, useState } from "react";
import {
  ApiContract,
  ApiConsumer,
  ConsumerMigrationPlan,
  MigrationAction,
  MigrationActionKind,
  MigrationEffort,
} from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";
import { analyzeAllConsumerImpacts } from "../logic/consumer-impact";
import { buildAllMigrationPlans } from "../logic/migration-planner";

interface MigrationPlanViewProps {
  contracts: readonly ApiContract[];
  consumers: readonly ApiConsumer[];
}

const PRIORITY_BADGE_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "P1 - Critical", className: "aci-badge-critical" },
  2: { label: "P2 - High", className: "aci-badge-high" },
  3: { label: "P3 - Medium", className: "aci-badge-medium" },
  4: { label: "P4 - Low", className: "aci-badge-low" },
};

const EFFORT_BADGE_MAP: Record<MigrationEffort, { label: string; className: string }> = {
  XS: { label: "Effort: XS", className: "aci-badge-neutral" },
  S: { label: "Effort: S", className: "aci-badge-neutral" },
  M: { label: "Effort: M", className: "aci-badge-neutral" },
  L: { label: "Effort: L", className: "aci-badge-potentially" },
  XL: { label: "Effort: XL", className: "aci-badge-breaking" },
};

export function MigrationPlanView({ contracts, consumers }: MigrationPlanViewProps) {
  const [selectedApiId, setSelectedApiId] = useState<string>(contracts[0]?.id ?? "");
  const [fromVersionIdx, setFromVersionIdx] = useState<number>(0);
  const [toVersionIdx, setToVersionIdx] = useState<number>(1);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedApiId) ?? contracts[0],
    [contracts, selectedApiId]
  );

  const plans = useMemo<ConsumerMigrationPlan[]>(() => {
    if (!selectedContract || selectedContract.versions.length < 2) return [];
    if (fromVersionIdx === toVersionIdx) return [];

    const fromVersion = selectedContract.versions[fromVersionIdx];
    const toVersion = selectedContract.versions[toVersionIdx];
    if (!fromVersion || !toVersion) return [];

    const diff = diffContractVersions(selectedContract.id, fromVersion, toVersion);
    const compatReport = classifyCompatibility(diff);
    const impactReports = analyzeAllConsumerImpacts(consumers, diff, compatReport);

    return buildAllMigrationPlans(consumers, diff, compatReport, impactReports);
  }, [selectedContract, fromVersionIdx, toVersionIdx, consumers]);

  const allActions = useMemo(() => {
    return plans.flatMap((p) => p.actions);
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (filterPriority === "ALL") return plans;
    const pNum = parseInt(filterPriority, 10);
    return plans
      .map((plan) => ({
        ...plan,
        actions: plan.actions.filter((a) => a.priority === pNum),
      }))
      .filter((plan) => plan.actions.length > 0);
  }, [plans, filterPriority]);

  const totalActionsCount = allActions.length;
  const p1Count = allActions.filter((a) => a.priority === 1).length;
  const p2Count = allActions.filter((a) => a.priority === 2).length;

  return (
    <div className="aci-view-container">
      <div className="aci-section-header">
        <div>
          <h2 className="aci-section-title">Automated Migration Planner</h2>
          <p className="aci-section-subtitle">
            Deterministic remediation step generation & prioritized upgrade runbooks for downstream consumers
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
            <label className="aci-label">From Version</label>
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
            <label className="aci-label">To Version (Upgrade Target)</label>
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

          <div className="aci-form-group">
            <label className="aci-label">Priority Filter</label>
            <select
              className="aci-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="1">P1 - Critical Only</option>
              <option value="2">P2 - High Only</option>
              <option value="3">P3 - Medium Only</option>
              <option value="4">P4 - Low Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="aci-stat-grid">
        <div className="aci-stat-card">
          <div className="aci-stat-label">Impacted Consumers</div>
          <div className="aci-stat-value">{plans.length}</div>
          <div className="aci-stat-desc">Requiring active code/config changes</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">Total Remediation Tasks</div>
          <div className="aci-stat-value">{totalActionsCount}</div>
          <div className="aci-stat-desc">Deterministic migration items</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">P1 Blocker Actions</div>
          <div className="aci-stat-value" style={{ color: p1Count > 0 ? "var(--aci-danger)" : undefined }}>
            {p1Count}
          </div>
          <div className="aci-stat-desc">Must be completed before cutoff</div>
        </div>
        <div className="aci-stat-card">
          <div className="aci-stat-label">P2 High Priority</div>
          <div className="aci-stat-value">{p2Count}</div>
          <div className="aci-stat-desc">Should be deployed during migration window</div>
        </div>
      </div>

      {/* Migration Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="aci-empty-state">
          <div className="aci-empty-icon">✓</div>
          <div className="aci-empty-title">No Migration Actions Required</div>
          <div className="aci-empty-desc">
            No downstream consumer tasks match the selected version transition and filter criteria.
          </div>
        </div>
      ) : (
        <div className="aci-plans-stack">
          {filteredPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan.consumerId || expandedPlanId === null;
            return (
              <div key={plan.consumerId} className="aci-card aci-plan-card">
                <div
                  className="aci-plan-header"
                  onClick={() =>
                    setExpandedPlanId(expandedPlanId === plan.consumerId ? "none" : plan.consumerId)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className="aci-plan-header-info">
                    <div className="aci-plan-consumer-name">{plan.consumerName}</div>
                    <div className="aci-plan-meta">
                      <span className="aci-meta-item">
                        Target: <code>{plan.apiId}</code> (v{plan.fromVersion} → v{plan.toVersion})
                      </span>
                      <span className="aci-meta-item">
                        {plan.actions.length} action{plan.actions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="aci-plan-badges">
                    <span className="aci-badge aci-badge-neutral">
                      Est. Effort: {plan.estimatedTotalEffort}
                    </span>
                    <span className="aci-toggle-icon">{isExpanded ? "▼" : "▶"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="aci-plan-body">
                    <div className="aci-table-container">
                      <table className="aci-table">
                        <thead>
                          <tr>
                            <th>Step</th>
                            <th>Priority</th>
                            <th>Action Type</th>
                            <th>Affected Target</th>
                            <th>Remediation Instruction</th>
                            <th>Effort</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.actions.map((action, idx) => {
                            const pBadge = PRIORITY_BADGE_MAP[action.priority] || {
                              label: `P${action.priority}`,
                              className: "aci-badge-neutral",
                            };
                            const eBadge = EFFORT_BADGE_MAP[action.estimatedEffort] || {
                              label: action.estimatedEffort,
                              className: "aci-badge-neutral",
                            };
                            const targetDisplay = action.fieldPath
                              ? `${action.endpointId} (${action.fieldPath})`
                              : action.endpointId;
                            return (
                              <tr key={action.id}>
                                <td className="aci-step-num">{idx + 1}</td>
                                <td>
                                  <span className={`aci-badge ${pBadge.className}`}>{pBadge.label}</span>
                                </td>
                                <td>
                                  <code className="aci-code-tag">{action.kind}</code>
                                </td>
                                <td>
                                  <code>{targetDisplay}</code>
                                </td>
                                <td>
                                  <div className="aci-action-instruction">{action.description}</div>
                                  {action.automationHint && (
                                    <div className="aci-action-hint" style={{ marginTop: "4px", fontSize: "0.82rem", color: "var(--aci-text-muted)" }}>
                                      <em>Hint: <code>{action.automationHint}</code></em>
                                    </div>
                                  )}
                                  {action.codeSnippet && (
                                    <pre className="aci-code-snippet">
                                      <code>{action.codeSnippet}</code>
                                    </pre>
                                  )}
                                </td>
                                <td>
                                  <span className={`aci-badge ${eBadge.className}`}>{eBadge.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
