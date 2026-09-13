"use client";

import { useState, useMemo } from "react";
import {
  ApiContract,
  CompatibilityClass,
  CompatibilityFinding,
  CompatibilityReport,
} from "../types";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";

interface CompatibilityViewProps {
  contracts: readonly ApiContract[];
}

interface TransitionEntry {
  apiId: string;
  fromVersion: string;
  toVersion: string;
  compatReport: CompatibilityReport;
}

interface FlatFinding {
  apiId: string;
  fromVersion: string;
  toVersion: string;
  finding: CompatibilityFinding;
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

const ALL_FILTER = "ALL";

export function CompatibilityView({ contracts }: CompatibilityViewProps) {
  const [filterClass, setFilterClass] = useState<string>(ALL_FILTER);
  const [filterApiId, setFilterApiId] = useState<string>(ALL_FILTER);

  // Pre-compute all consecutive version transitions (v[i] → v[i+1]) for every contract
  const transitions = useMemo<TransitionEntry[]>(() => {
    const list: TransitionEntry[] = [];
    for (const contract of contracts) {
      for (let i = 0; i < contract.versions.length - 1; i++) {
        const fromVersion = contract.versions[i];
        const toVersion = contract.versions[i + 1];
        if (fromVersion && toVersion) {
          const diff = diffContractVersions(contract.id, fromVersion, toVersion);
          const compatReport = classifyCompatibility(diff);
          list.push({
            apiId: contract.id,
            fromVersion: fromVersion.version,
            toVersion: toVersion.version,
            compatReport,
          });
        }
      }
    }
    return list;
  }, [contracts]);

  // Build a flat list of findings across all transitions
  const allFindings = useMemo<FlatFinding[]>(() => {
    const list: FlatFinding[] = [];
    for (const t of transitions) {
      for (const finding of t.compatReport.findings) {
        list.push({
          apiId: t.apiId,
          fromVersion: t.fromVersion,
          toVersion: t.toVersion,
          finding,
        });
      }
    }
    return list;
  }, [transitions]);

  // Filtered findings
  const filteredFindings = useMemo<FlatFinding[]>(() => {
    return allFindings.filter((item) => {
      const matchClass =
        filterClass === ALL_FILTER || item.finding.compatibility === filterClass;
      const matchApi = filterApiId === ALL_FILTER || item.apiId === filterApiId;
      return matchClass && matchApi;
    });
  }, [allFindings, filterClass, filterApiId]);

  // Summary stats computed across all findings
  const totalFindings = allFindings.length;
  const breakingCount = useMemo(
    () => allFindings.filter((item) => item.finding.compatibility === "BREAKING").length,
    [allFindings]
  );
  const potentiallyBreakingCount = useMemo(
    () => allFindings.filter((item) => item.finding.compatibility === "POTENTIALLY_BREAKING").length,
    [allFindings]
  );
  const nonBreakingCount = useMemo(
    () => allFindings.filter((item) => item.finding.compatibility === "NON_BREAKING").length,
    [allFindings]
  );

  // Rule coverage: unique ruleIds and occurrence counts
  const ruleCoverage = useMemo<{ ruleId: string; ruleTitle: string; count: number }[]>(() => {
    const map = new Map<string, { ruleTitle: string; count: number }>();
    for (const item of allFindings) {
      const existing = map.get(item.finding.ruleId);
      if (existing) {
        map.set(item.finding.ruleId, { ruleTitle: existing.ruleTitle, count: existing.count + 1 });
      } else {
        map.set(item.finding.ruleId, { ruleTitle: item.finding.ruleTitle, count: 1 });
      }
    }
    return Array.from(map.entries())
      .map(([ruleId, { ruleTitle, count }]) => ({ ruleId, ruleTitle, count }))
      .sort((a, b) => b.count - a.count);
  }, [allFindings]);

  function handleClassFilterChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFilterClass(e.target.value);
  }

  function handleApiFilterChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFilterApiId(e.target.value);
  }

  return (
    <div className="aci-compatibility-view">
      {/* 1. Filter row */}
      <div className="aci-filter-row">
        <label className="aci-filter-label" htmlFor="aci-compat-class-filter">
          Compatibility Class:
        </label>
        <select
          id="aci-compat-class-filter"
          className="aci-select"
          value={filterClass}
          onChange={handleClassFilterChange}
        >
          <option value={ALL_FILTER}>All</option>
          <option value="BREAKING">BREAKING</option>
          <option value="POTENTIALLY_BREAKING">POTENTIALLY_BREAKING</option>
          <option value="NON_BREAKING">NON_BREAKING</option>
          <option value="INFORMATIONAL">INFORMATIONAL</option>
        </select>

        <label className="aci-filter-label" htmlFor="aci-compat-api-filter">
          API:
        </label>
        <select
          id="aci-compat-api-filter"
          className="aci-select"
          value={filterApiId}
          onChange={handleApiFilterChange}
        >
          <option value={ALL_FILTER}>All</option>
          {contracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Summary stat tiles */}
      <div className="aci-stat-grid">
        <div className="aci-stat">
          <div className="aci-stat-label">Total Findings</div>
          <div className="aci-stat-value">{totalFindings}</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-label">Breaking</div>
          <div className="aci-stat-value breaking">{breakingCount}</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-label">Potentially Breaking</div>
          <div className="aci-stat-value warn">{potentiallyBreakingCount}</div>
        </div>
        <div className="aci-stat">
          <div className="aci-stat-label">Non-Breaking</div>
          <div className="aci-stat-value ok">{nonBreakingCount}</div>
        </div>
      </div>

      {/* 3. Main findings table */}
      <section className="aci-section">
        <div className="aci-section-header">
          <h3 className="aci-section-title">Compatibility Findings</h3>
        </div>
        {filteredFindings.length === 0 ? (
          <div className="aci-empty">
            <div className="aci-empty-title">No compatibility findings match the selected filters.</div>
          </div>
        ) : (
          <div className="aci-table-wrap">
            <table className="aci-table">
              <thead>
                <tr>
                  <th>API</th>
                  <th>Transition</th>
                  <th>Rule ID</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Compat</th>
                  <th>Severity</th>
                  <th>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((item, idx) => (
                  <tr key={`${item.apiId}-${item.fromVersion}-${item.toVersion}-${item.finding.changeId}-${idx}`}>
                    <td>{item.apiId}</td>
                    <td className="aci-table-mono">
                      {item.fromVersion} → {item.toVersion}
                    </td>
                    <td className="aci-table-mono">{item.finding.ruleId}</td>
                    <td>{item.finding.ruleTitle}</td>
                    <td>{item.finding.location}</td>
                    <td>
                      <span className={`aci-badge ${compatBadgeClass(item.finding.compatibility)}`}>
                        {item.finding.compatibility}
                      </span>
                    </td>
                    <td>{item.finding.severity}</td>
                    <td className="aci-table-mono">{item.finding.endpointId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Rule Coverage section */}
      <section className="aci-section">
        <div className="aci-section-header">
          <h3 className="aci-section-title">Rule Coverage</h3>
        </div>
        {ruleCoverage.length === 0 ? (
          <div className="aci-empty">
            <div className="aci-empty-title">No rule coverage data available.</div>
          </div>
        ) : (
          <div className="aci-table-wrap">
            <table className="aci-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Title</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {ruleCoverage.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td className="aci-table-mono">{rule.ruleId}</td>
                    <td>{rule.ruleTitle}</td>
                    <td className="aci-table-mono">{rule.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
