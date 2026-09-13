"use client";

import { useState, useMemo } from "react";
import {
  ApiContract,
  ApiEndpoint,
  ContractVersion,
  HttpMethod,
} from "../types";

interface ContractsViewProps {
  contracts: readonly ApiContract[];
}

const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: "aci-method-get",
  POST: "aci-method-post",
  PUT: "aci-method-put",
  PATCH: "aci-method-patch",
  DELETE: "aci-method-delete",
};

function requestFieldCount(endpoint: ApiEndpoint): number {
  return endpoint.requestSchema ? endpoint.requestSchema.fields.length : 0;
}

function responseFieldCount(endpoint: ApiEndpoint): number {
  // Sum fields across all response schemas
  return endpoint.responses.reduce((sum, r) => sum + r.fields.length, 0);
}

function hasBreakingHint(version: ContractVersion): boolean {
  const summary = version.changelogSummary ?? "";
  return (
    summary.toUpperCase().includes("BREAKING") ||
    summary.toLowerCase().includes("renamed") ||
    summary.toLowerCase().includes("removed")
  );
}

export function ContractsView({ contracts }: ContractsViewProps) {
  const [selectedApiId, setSelectedApiId] = useState<string>(
    contracts[0]?.id ?? ""
  );
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<number>(-1);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedApiId) ?? null,
    [contracts, selectedApiId]
  );

  // Resolve the effective version index: -1 sentinel means "latest"
  const effectiveVersionIdx = useMemo(() => {
    if (!selectedContract) return 0;
    if (selectedVersionIdx === -1) {
      return selectedContract.versions.length - 1;
    }
    // Clamp to valid range when contract changes
    return Math.min(
      selectedVersionIdx,
      selectedContract.versions.length - 1
    );
  }, [selectedContract, selectedVersionIdx]);

  const selectedVersion: ContractVersion | null = useMemo(
    () => selectedContract?.versions[effectiveVersionIdx] ?? null,
    [selectedContract, effectiveVersionIdx]
  );

  function handleApiSelect(id: string) {
    setSelectedApiId(id);
    setSelectedVersionIdx(-1); // reset to latest when switching API
  }

  function handleVersionSelect(idx: number) {
    setSelectedVersionIdx(idx);
  }

  return (
    <div className="aci-contracts-layout">
      {/* ── Left panel: contract list ─────────────────────────────────────── */}
      <aside className="aci-contracts-sidebar">
        <h2 className="aci-panel-title">APIs</h2>
        <ul className="aci-api-list">
          {contracts.map((contract) => (
            <li key={contract.id}>
              <button
                className={`aci-api-list-item${selectedApiId === contract.id ? " aci-api-list-item--active" : ""}`}
                onClick={() => handleApiSelect(contract.id)}
                type="button"
              >
                <span className="aci-api-list-name">{contract.name}</span>
                <span className="aci-api-list-meta">
                  {contract.versions.length}v
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Right panel: contract detail ──────────────────────────────────── */}
      <div className="aci-contracts-detail">
        {selectedContract === null ? (
          <div className="aci-empty-state">Select an API to explore its contract.</div>
        ) : (
          <>
            {/* Contract header */}
            <div className="aci-contract-header">
              <div className="aci-contract-title-row">
                <h2 className="aci-contract-name">{selectedContract.name}</h2>
                <span className="aci-badge aci-badge-neutral">
                  {selectedContract.domain.replace("_", " ")}
                </span>
              </div>
              <p className="aci-contract-description">
                {selectedContract.description}
              </p>
              <p className="aci-contract-owner">
                Owner: {selectedContract.owner}
              </p>
              <p className="aci-contract-baseurl">{selectedContract.baseUrl}</p>
            </div>

            {/* Version history */}
            <section className="aci-version-history">
              <h3 className="aci-section-title">Version History</h3>
              <div className="aci-version-list">
                {selectedContract.versions.map((ver, idx) => (
                  <div
                    key={ver.version}
                    className={`aci-version-row${effectiveVersionIdx === idx ? " aci-version-row--active" : ""}`}
                  >
                    <button
                      className="aci-version-select-btn"
                      onClick={() => handleVersionSelect(idx)}
                      type="button"
                    >
                      <span className="aci-version-tag">v{ver.version}</span>
                    </button>
                    <span className="aci-version-date">{ver.publishedDate}</span>
                    {hasBreakingHint(ver) && (
                      <span className="aci-badge aci-badge-breaking">
                        BREAKING
                      </span>
                    )}
                    {ver.deprecated && (
                      <span className="aci-badge aci-badge-deprecated">
                        DEPRECATED
                      </span>
                    )}
                    <span className="aci-version-summary">
                      {ver.changelogSummary ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Version selector + endpoint table */}
            {selectedVersion !== null && (
              <section className="aci-endpoints-section">
                <div className="aci-endpoints-header">
                  <h3 className="aci-section-title">
                    Endpoints — v{selectedVersion.version}
                  </h3>
                  <select
                    className="aci-version-select"
                    value={effectiveVersionIdx}
                    onChange={(e) =>
                      handleVersionSelect(Number(e.target.value))
                    }
                  >
                    {selectedContract.versions.map((ver, idx) => (
                      <option key={ver.version} value={idx}>
                        v{ver.version}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="aci-table-wrapper">
                  <table className="aci-table">
                    <thead>
                      <tr>
                        <th className="aci-th">Method</th>
                        <th className="aci-th">Path</th>
                        <th className="aci-th">Summary</th>
                        <th className="aci-th aci-th-center">Req Fields</th>
                        <th className="aci-th aci-th-center">Res Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVersion.endpoints.map(
                        (endpoint: ApiEndpoint) => (
                          <tr key={endpoint.id} className="aci-tr">
                            <td className="aci-td">
                              <span
                                className={`aci-method-badge ${METHOD_BADGE_CLASS[endpoint.method]}`}
                              >
                                {endpoint.method}
                              </span>
                            </td>
                            <td className="aci-td aci-td-path">
                              <code className="aci-path-code">
                                {endpoint.path}
                              </code>
                              {endpoint.deprecated && (
                                <span className="aci-badge aci-badge-deprecated aci-inline-badge">
                                  deprecated
                                </span>
                              )}
                            </td>
                            <td className="aci-td aci-td-summary">
                              {endpoint.summary}
                            </td>
                            <td className="aci-td aci-td-center">
                              {requestFieldCount(endpoint) > 0 ? (
                                <span className="aci-field-count">
                                  {requestFieldCount(endpoint)} fields
                                </span>
                              ) : (
                                <span className="aci-field-count aci-field-count--none">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="aci-td aci-td-center">
                              <span className="aci-field-count">
                                {responseFieldCount(endpoint)} fields
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
