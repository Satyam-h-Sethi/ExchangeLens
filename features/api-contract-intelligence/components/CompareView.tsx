"use client";

import { useState, useMemo } from "react";
import {
  ApiContract,
  CompatibilityClass,
  CompatibilityFinding,
  ContractChange,
  ContractDiff,
  CompatibilityReport,
} from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";

interface CompareViewProps {
  contracts: readonly ApiContract[];
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

function valueToString(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return (value as unknown[]).map((v) => String(v)).join(", ");
  return JSON.stringify(value);
}

interface FindingRowProps {
  finding: CompatibilityFinding;
}

function FindingRow({ finding }: FindingRowProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <>
      <tr
        className={`aci-table-row aci-table-row-clickable ${compatBadgeClass(finding.compatibility)}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <td className="aci-table-cell aci-table-mono">{finding.ruleId}</td>
        <td className="aci-table-cell">{finding.ruleTitle}</td>
        <td className="aci-table-cell aci-table-mono">{finding.endpointId}</td>
        <td className="aci-table-cell">{finding.location}</td>
        <td className="aci-table-cell">
          <span className={`aci-badge ${compatBadgeClass(finding.compatibility)}`}>
            {finding.compatibility}
          </span>
        </td>
        <td className="aci-table-cell">{finding.severity}</td>
        <td className="aci-table-cell">{finding.description}</td>
      </tr>
      {expanded && (
        <tr className="aci-table-row-expanded">
          <td colSpan={7} className="aci-table-cell-expanded">
            <div className="aci-finding-expanded-content">
              <div className="aci-finding-rationale">
                <strong>Rationale: </strong>
                {finding.rationale}
              </div>
              {finding.migrationHint && (
                <div className="aci-finding-hint">
                  <strong>Migration Hint: </strong>
                  {finding.migrationHint}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface ChangeRowProps {
  change: ContractChange;
}

function ChangeRow({ change }: ChangeRowProps) {
  return (
    <tr className="aci-table-row">
      <td className="aci-table-cell aci-table-mono">{change.id}</td>
      <td className="aci-table-cell aci-table-mono">{change.endpointId}</td>
      <td className="aci-table-cell">{change.kind}</td>
      <td className="aci-table-cell">{change.location}</td>
      <td className="aci-table-cell aci-table-mono">{valueToString(change.oldValue)}</td>
      <td className="aci-table-cell aci-table-mono">{valueToString(change.newValue)}</td>
      <td className="aci-table-cell">{change.description}</td>
    </tr>
  );
}

export function CompareView({ contracts }: CompareViewProps) {
  const [selectedApiId, setSelectedApiId] = useState<string>(
    contracts.length > 0 ? contracts[0].id : ""
  );
  const [fromVersionIdx, setFromVersionIdx] = useState<number>(0);
  const [toVersionIdx, setToVersionIdx] = useState<number>(1);

  const selectedContract = useMemo<ApiContract | null>(
    () => contracts.find((c) => c.id === selectedApiId) ?? null,
    [contracts, selectedApiId]
  );

  const result = useMemo<{ diff: ContractDiff; report: CompatibilityReport } | null>(() => {
    if (!selectedContract) return null;
    if (fromVersionIdx === toVersionIdx) return null;
    const fromVersion = selectedContract.versions[fromVersionIdx];
    const toVersion = selectedContract.versions[toVersionIdx];
    if (!fromVersion || !toVersion) return null;
    const diff = diffContractVersions(selectedContract.id, fromVersion, toVersion);
    const report = classifyCompatibility(diff);
    return { diff, report };
  }, [selectedContract, fromVersionIdx, toVersionIdx]);

  const versions = selectedContract?.versions ?? [];

  function handleApiChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setSelectedApiId(e.target.value);
    setFromVersionIdx(0);
    setToVersionIdx(1);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFromVersionIdx(Number(e.target.value));
  }

  function handleToChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setToVersionIdx(Number(e.target.value));
  }

  return (
    <div className="aci-compare-view">
      {/* 1. Controls row */}
      <div className="aci-filter-row">
        <label className="aci-filter-label" htmlFor="aci-compare-api">
          API:
        </label>
        <select
          id="aci-compare-api"
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

        <label className="aci-filter-label" htmlFor="aci-compare-from">
          From Version:
        </label>
        <select
          id="aci-compare-from"
          className="aci-select"
          value={fromVersionIdx}
          onChange={handleFromChange}
        >
          {versions.map((v, idx) =>
            idx !== toVersionIdx ? (
              <option key={v.version} value={idx}>
                {v.version}
              </option>
            ) : null
          )}
        </select>

        <label className="aci-filter-label" htmlFor="aci-compare-to">
          To Version:
        </label>
        <select
          id="aci-compare-to"
          className="aci-select"
          value={toVersionIdx}
          onChange={handleToChange}
        >
          {versions.map((v, idx) =>
            idx !== fromVersionIdx ? (
              <option key={v.version} value={idx}>
                {v.version}
              </option>
            ) : null
          )}
        </select>
      </div>

      {result === null ? (
        <div className="aci-empty">
          <div className="aci-empty-title">
            {fromVersionIdx === toVersionIdx
              ? "Select two distinct versions to compare."
              : "No contract or version data available to compare."}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Summary bar */}
          <div className="aci-stat-grid">
            <div className="aci-stat">
              <div className="aci-stat-label">Added Endpoints</div>
              <div className="aci-stat-value">{result.diff.endpointsAdded.length}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Removed Endpoints</div>
              <div className="aci-stat-value">{result.diff.endpointsRemoved.length}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Total Changes</div>
              <div className="aci-stat-value">{result.diff.changes.length}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Breaking Changes</div>
              <div className="aci-stat-value breaking">{result.report.breakingCount}</div>
            </div>
          </div>

          {/* 3. Findings table */}
          <section className="aci-section">
            <div className="aci-section-header">
              <h3 className="aci-section-title">Findings</h3>
            </div>
            {result.report.findings.length === 0 ? (
              <div className="aci-empty">
                <div className="aci-empty-title">No compatibility findings detected.</div>
              </div>
            ) : (
              <div className="aci-table-wrap">
                <table className="aci-table">
                  <thead>
                    <tr>
                      <th>Rule ID</th>
                      <th>Title</th>
                      <th>Endpoint</th>
                      <th>Location</th>
                      <th>Compat</th>
                      <th>Severity</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.report.findings.map((finding) => (
                      <FindingRow key={finding.changeId} finding={finding} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 4. Changes detail table */}
          <section className="aci-section">
            <div className="aci-section-header">
              <h3 className="aci-section-title">Changes Detail</h3>
            </div>
            {result.diff.changes.length === 0 ? (
              <div className="aci-empty">
                <div className="aci-empty-title">No structural changes detected.</div>
              </div>
            ) : (
              <div className="aci-table-wrap">
                <table className="aci-table">
                  <thead>
                    <tr>
                      <th>Change ID</th>
                      <th>Endpoint</th>
                      <th>Kind</th>
                      <th>Location</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.diff.changes.map((change) => (
                      <ChangeRow key={change.id} change={change} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
