"use client";

import { useState, useMemo, ReactElement } from "react";
import {
  ApiContract,
  ApiConsumer,
  ConsumerImpactReport,
  ConsumerToleranceBehavior,
  ImpactLevel,
  CompatibilityClass,
  ContractDiff,
  CompatibilityReport,
} from "../types";
import { analyzeAllConsumerImpacts } from "../logic/consumer-impact";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";
import { SYNTHETIC_CONSUMERS } from "../data/consumers";

interface ConsumersViewProps {
  contracts: readonly ApiContract[];
  consumers: readonly ApiConsumer[];
}

function toleranceBadgeClass(tolerance: ConsumerToleranceBehavior): string {
  switch (tolerance) {
    case "STRICT":
      return "aci-badge-breaking";
    case "LENIENT":
      return "aci-badge-nonbreaking";
    case "VERSION_LOCKED":
      return "aci-badge-critical";
  }
}

function impactBadgeClass(impact: ImpactLevel): string {
  switch (impact) {
    case "CRITICAL":
      return "aci-badge-critical";
    case "HIGH":
      return "aci-badge-high";
    case "MEDIUM":
      return "aci-badge-medium";
    case "LOW":
      return "aci-badge-low";
    case "NONE":
      return "aci-badge-none";
  }
}

function compatBadgeClass(compat: CompatibilityClass): string {
  switch (compat) {
    case "BREAKING":
      return "aci-badge-breaking";
    case "POTENTIALLY_BREAKING":
      return "aci-badge-potentially";
    case "NON_BREAKING":
      return "aci-badge-nonbreaking";
    case "INFORMATIONAL":
      return "aci-badge-informational";
  }
}

export function ConsumersView({ contracts, consumers }: ConsumersViewProps): ReactElement {
  const [selectedApiId, setSelectedApiId] = useState<string>(
    contracts.length > 0 ? contracts[0].id : ""
  );
  const [fromVersionIdx, setFromVersionIdx] = useState<number>(0);
  const [toVersionIdx, setToVersionIdx] = useState<number>(
    contracts.length > 0 && contracts[0].versions.length > 1 ? 1 : 0
  );
  const [selectedConsumerId, setSelectedConsumerId] = useState<string | null>(null);
  const [expandedConsumerId, setExpandedConsumerId] = useState<string | null>(null);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedApiId) ?? null,
    [contracts, selectedApiId]
  );

  const versions = useMemo(
    () => selectedContract?.versions ?? [],
    [selectedContract]
  );

  const impactReports = useMemo<ConsumerImpactReport[]>(() => {
    if (selectedContract === null) return [];
    if (fromVersionIdx === toVersionIdx) return [];

    const fromVersion = selectedContract.versions[fromVersionIdx];
    const toVersion = selectedContract.versions[toVersionIdx];
    if (fromVersion === undefined || toVersion === undefined) return [];

    const diff: ContractDiff = diffContractVersions(
      selectedContract.id,
      fromVersion,
      toVersion
    );
    const compatReport: CompatibilityReport = classifyCompatibility(diff);

    return analyzeAllConsumerImpacts(consumers, diff, compatReport);
  }, [selectedContract, fromVersionIdx, toVersionIdx, consumers]);

  const filteredReports = useMemo(() => {
    if (selectedConsumerId === null) return impactReports;
    return impactReports.filter((r) => r.consumerId === selectedConsumerId);
  }, [impactReports, selectedConsumerId]);

  function handleApiChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const newApiId = e.target.value;
    setSelectedApiId(newApiId);
    setFromVersionIdx(0);
    const contract = contracts.find((c) => c.id === newApiId);
    setToVersionIdx(contract && contract.versions.length > 1 ? 1 : 0);
    setExpandedConsumerId(null);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFromVersionIdx(Number(e.target.value));
  }

  function handleToChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setToVersionIdx(Number(e.target.value));
  }

  function handleConsumerFilterChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const val = e.target.value;
    setSelectedConsumerId(val === "ALL" ? null : val);
  }

  function toggleExpand(consumerId: string): void {
    setExpandedConsumerId((prev) => (prev === consumerId ? null : consumerId));
  }

  const consumerToleranceMap = useMemo(() => {
    const map = new Map<string, ConsumerToleranceBehavior>();
    for (const consumer of consumers) {
      const dep = consumer.dependencies.find((d) => d.apiId === selectedApiId);
      if (dep) {
        map.set(consumer.id, dep.toleranceBehavior);
      }
    }
    return map;
  }, [consumers, selectedApiId]);

  return (
    <div className="aci-section">
      {/* ── Controls Row ─────────────────────────────────────────────────── */}
      <div className="aci-filter-row">
        <div>
          <label className="aci-filter-label" htmlFor="aci-consumer-api-select">
            API Contract:
          </label>{" "}
          <select
            id="aci-consumer-api-select"
            className="aci-select"
            value={selectedApiId}
            onChange={handleApiChange}
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="aci-filter-label" htmlFor="aci-consumer-from-select">
            From Version:
          </label>{" "}
          <select
            id="aci-consumer-from-select"
            className="aci-select"
            value={fromVersionIdx}
            onChange={handleFromChange}
          >
            {versions.map((v, idx) => (
              <option key={v.version} value={idx}>
                v{v.version}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="aci-filter-label" htmlFor="aci-consumer-to-select">
            To Version:
          </label>{" "}
          <select
            id="aci-consumer-to-select"
            className="aci-select"
            value={toVersionIdx}
            onChange={handleToChange}
          >
            {versions.map((v, idx) => (
              <option key={v.version} value={idx}>
                v{v.version}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="aci-filter-label" htmlFor="aci-consumer-filter-select">
            Consumer:
          </label>{" "}
          <select
            id="aci-consumer-filter-select"
            className="aci-select"
            value={selectedConsumerId ?? "ALL"}
            onChange={handleConsumerFilterChange}
          >
            <option value="ALL">All Consumers ({consumers.length})</option>
            {consumers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Version validation message ───────────────────────────────────── */}
      {fromVersionIdx === toVersionIdx ? (
        <div className="aci-empty">
          <div className="aci-empty-icon">&#8594;</div>
          <div className="aci-empty-title">Identical Versions Selected</div>
          <div className="aci-empty-body">
            Please select two different versions to analyze consumer impact.
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="aci-empty">
          <div className="aci-empty-icon">&#10003;</div>
          <div className="aci-empty-title">No Consumer Impact</div>
          <div className="aci-empty-body">
            No registered consumers are impacted by the transition from v
            {versions[fromVersionIdx]?.version ?? "A"} to v
            {versions[toVersionIdx]?.version ?? "B"}.
          </div>
        </div>
      ) : (
        <div className="aci-table-wrap">
          <table className="aci-table">
            <thead>
              <tr>
                <th>Consumer</th>
                <th>Tolerance</th>
                <th>Overall Impact</th>
                <th>Affected APIs</th>
                <th>Critical Fields</th>
                <th>Risk Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const tolerance =
                  consumerToleranceMap.get(report.consumerId) ?? "STRICT";
                const isExpanded = expandedConsumerId === report.consumerId;
                const affectedApis = report.apiImpacts
                  .map((a) => a.apiId)
                  .join(", ");
                const criticalFieldCount = report.apiImpacts.reduce(
                  (sum, a) =>
                    sum +
                    a.fieldImpacts.filter(
                      (f) =>
                        f.compatibility === "BREAKING" ||
                        f.compatibility === "POTENTIALLY_BREAKING"
                    ).length,
                  0
                );
                const totalFieldCount = report.apiImpacts.reduce(
                  (sum, a) => sum + a.fieldImpacts.length,
                  0
                );
                const riskSummary =
                  report.apiImpacts[0]?.riskSummary ?? "No risk details.";

                return (
                  <tr
                    key={report.consumerId}
                    style={{ display: "contents" }}
                  >
                    <tr
                      className="aci-expandable"
                      onClick={() => toggleExpand(report.consumerId)}
                    >
                      <td>
                        <strong>{report.consumerName}</strong>
                        <div className="aci-table-dim aci-mono">
                          {report.consumerId}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`aci-badge ${toleranceBadgeClass(tolerance)}`}
                        >
                          {tolerance.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`aci-badge ${impactBadgeClass(report.overallImpact)}`}
                        >
                          {report.overallImpact}
                        </span>
                      </td>
                      <td className="aci-table-mono">{affectedApis}</td>
                      <td>
                        {criticalFieldCount > 0 ? (
                          <span className="aci-badge aci-badge-critical">
                            {criticalFieldCount} critical / {totalFieldCount} total
                          </span>
                        ) : totalFieldCount > 0 ? (
                          <span className="aci-badge aci-badge-neutral">
                            {totalFieldCount} field
                            {totalFieldCount === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="aci-table-dim">—</span>
                        )}
                      </td>
                      <td className="aci-table-dim">{riskSummary}</td>
                    </tr>

                    {isExpanded && (
                      <tr className="aci-expand-detail">
                        <td colSpan={6}>
                          {report.apiImpacts.map((apiImpact) => (
                            <div
                              key={apiImpact.apiId}
                              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                            >
                              {/* Affected Endpoints */}
                              {apiImpact.affectedEndpoints.length > 0 && (
                                <div>
                                  <div className="aci-detail-key" style={{ marginBottom: "4px" }}>
                                    Affected Endpoints ({apiImpact.affectedEndpoints.length}):
                                  </div>
                                  <div className="aci-tag-list">
                                    {apiImpact.affectedEndpoints.map((ep) => (
                                      <span key={ep} className="aci-tag aci-mono">
                                        {ep}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Field Impacts Table */}
                              {apiImpact.fieldImpacts.length > 0 ? (
                                <div>
                                  <div className="aci-detail-key" style={{ marginBottom: "6px" }}>
                                    Field Impacts ({apiImpact.fieldImpacts.length}):
                                  </div>
                                  <div className="aci-table-wrap">
                                    <table className="aci-table">
                                      <thead>
                                        <tr>
                                          <th>Field Path</th>
                                          <th>Compatibility</th>
                                          <th>Detail</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {apiImpact.fieldImpacts.map((fi, fiIdx) => (
                                          <tr key={`${fi.changeId}-${fi.fieldPath}-${fiIdx}`}>
                                            <td className="aci-table-mono">
                                              {fi.fieldPath}
                                            </td>
                                            <td>
                                              <span
                                                className={`aci-badge ${compatBadgeClass(fi.compatibility)}`}
                                              >
                                                {fi.compatibility}
                                              </span>
                                            </td>
                                            <td>{fi.detail}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div className="aci-table-dim">
                                  No field-level impacts for this API dependency.
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
