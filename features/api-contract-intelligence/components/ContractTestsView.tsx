"use client";

import { useState, useMemo, ReactElement } from "react";
import {
  ApiContract,
  ContractTestCase,
  ContractTestResult,
  ContractTestSuiteResult,
  ContractDiff,
  CompatibilityReport,
  TestOutcome,
} from "../types";
import { buildTestSuite, runContractTests } from "../logic/contract-test-runner";
import { diffContractVersions } from "../logic/contract-diff";
import { classifyCompatibility } from "../logic/compatibility-engine";

interface ContractTestsViewProps {
  contracts: readonly ApiContract[];
}

function outcomeBadgeClass(outcome: TestOutcome): string {
  switch (outcome) {
    case "PASS":
      return "aci-badge-pass";
    case "FAIL":
      return "aci-badge-fail";
    case "WARNING":
      return "aci-badge-warning";
  }
}

function outcomeRowClass(outcome: TestOutcome): string {
  switch (outcome) {
    case "PASS":
      return "pass";
    case "FAIL":
      return "fail";
    case "WARNING":
      return "warning";
  }
}

export function ContractTestsView({ contracts }: ContractTestsViewProps): ReactElement {
  const [selectedApiId, setSelectedApiId] = useState<string>(
    contracts.length > 0 ? contracts[0].id : ""
  );
  const [fromVersionIdx, setFromVersionIdx] = useState<number>(0);
  const [toVersionIdx, setToVersionIdx] = useState<number>(
    contracts.length > 0 && contracts[0].versions.length > 1 ? 1 : 0
  );
  const [filterOutcome, setFilterOutcome] = useState<string>("ALL");

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedApiId) ?? null,
    [contracts, selectedApiId]
  );

  const versions = useMemo(
    () => selectedContract?.versions ?? [],
    [selectedContract]
  );

  const suiteResult = useMemo<ContractTestSuiteResult | null>(() => {
    if (selectedContract === null) return null;
    if (fromVersionIdx === toVersionIdx) return null;

    const fromVersion = selectedContract.versions[fromVersionIdx];
    const toVersion = selectedContract.versions[toVersionIdx];
    if (fromVersion === undefined || toVersion === undefined) return null;

    const diff: ContractDiff = diffContractVersions(
      selectedContract.id,
      fromVersion,
      toVersion
    );
    const compatReport: CompatibilityReport = classifyCompatibility(diff);
    const testCases: readonly ContractTestCase[] = buildTestSuite(
      selectedContract,
      diff,
      compatReport
    );

    return runContractTests(testCases, diff);
  }, [selectedContract, fromVersionIdx, toVersionIdx]);

  const filteredResults = useMemo<readonly ContractTestResult[]>(() => {
    if (suiteResult === null) return [];
    if (filterOutcome === "ALL") return suiteResult.results;
    return suiteResult.results.filter(
      (res) => res.actualOutcome === filterOutcome
    );
  }, [suiteResult, filterOutcome]);

  function handleApiChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const newApiId = e.target.value;
    setSelectedApiId(newApiId);
    setFromVersionIdx(0);
    const contract = contracts.find((c) => c.id === newApiId);
    setToVersionIdx(contract && contract.versions.length > 1 ? 1 : 0);
  }

  function handleFromChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFromVersionIdx(Number(e.target.value));
  }

  function handleToChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setToVersionIdx(Number(e.target.value));
  }

  function handleFilterOutcomeChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setFilterOutcome(e.target.value);
  }

  const passRate = useMemo(() => {
    if (!suiteResult || suiteResult.totalTests === 0) return "0%";
    const rate = Math.round((suiteResult.passedTests / suiteResult.totalTests) * 100);
    return `${rate}%`;
  }, [suiteResult]);

  return (
    <div className="aci-section">
      {/* ── Controls Row ─────────────────────────────────────────────────── */}
      <div className="aci-filter-row">
        <div>
          <label className="aci-filter-label" htmlFor="aci-test-api-select">
            API Contract:
          </label>{" "}
          <select
            id="aci-test-api-select"
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
          <label className="aci-filter-label" htmlFor="aci-test-from-select">
            From Version:
          </label>{" "}
          <select
            id="aci-test-from-select"
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
          <label className="aci-filter-label" htmlFor="aci-test-to-select">
            To Version:
          </label>{" "}
          <select
            id="aci-test-to-select"
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
          <label className="aci-filter-label" htmlFor="aci-test-filter-select">
            Outcome Filter:
          </label>{" "}
          <select
            id="aci-test-filter-select"
            className="aci-select"
            value={filterOutcome}
            onChange={handleFilterOutcomeChange}
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASS">Pass Only</option>
            <option value="FAIL">Fail Only</option>
            <option value="WARNING">Warning Only</option>
          </select>
        </div>
      </div>

      {/* ── Summary & Test Suite Results ─────────────────────────────────── */}
      {fromVersionIdx === toVersionIdx ? (
        <div className="aci-empty">
          <div className="aci-empty-icon">&#8594;</div>
          <div className="aci-empty-title">Identical Versions Selected</div>
          <div className="aci-empty-body">
            Please select two different versions to execute contract test simulations.
          </div>
        </div>
      ) : suiteResult === null || suiteResult.totalTests === 0 ? (
        <div className="aci-empty">
          <div className="aci-empty-icon">&#8505;</div>
          <div className="aci-empty-title">No Test Scenarios Available</div>
          <div className="aci-empty-body">
            No synthetic test scenarios were generated for this version transition.
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stat Grid */}
          <div className="aci-stat-grid">
            <div className="aci-stat">
              <div className="aci-stat-label">Total Tests</div>
              <div className="aci-stat-value">{suiteResult.totalTests}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Passed</div>
              <div className="aci-stat-value ok">{suiteResult.passedTests}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Failed</div>
              <div className="aci-stat-value breaking">{suiteResult.failedTests}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Warnings</div>
              <div className="aci-stat-value warn">{suiteResult.warningTests}</div>
            </div>
            <div className="aci-stat">
              <div className="aci-stat-label">Pass Rate</div>
              <div className="aci-stat-value accent">{passRate}</div>
            </div>
          </div>

          {/* Test Outcomes List */}
          {filteredResults.length === 0 ? (
            <div className="aci-empty">
              <div className="aci-empty-title">
                No test results match the outcome filter: {filterOutcome}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              {filteredResults.map((result) => (
                <div
                  key={result.testCaseId}
                  className={`aci-test-outcome ${outcomeRowClass(result.actualOutcome)}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", width: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="aci-test-scenario aci-mono">
                          {result.scenario}
                        </span>
                        <span className="aci-table-dim aci-mono">
                          {result.testCaseId}
                        </span>
                        {!result.passed && (
                          <span className="aci-badge aci-badge-breaking">
                            Expected: {result.outcome} | Got: {result.actualOutcome}
                          </span>
                        )}
                      </div>

                      <div className="aci-test-desc">
                        {result.description}
                      </div>

                      <div className="aci-test-detail">
                        {result.detail}
                      </div>

                      {(result.affectedField !== undefined || result.ruleViolated !== undefined) && (
                        <div className="aci-tag-list" style={{ marginTop: "4px" }}>
                          {result.affectedField !== undefined && (
                            <span className="aci-tag aci-mono">
                              Field: {result.affectedField}
                            </span>
                          )}
                          {result.ruleViolated !== undefined && (
                            <span className="aci-tag aci-mono">
                              Rule: {result.ruleViolated}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={`aci-badge ${outcomeBadgeClass(result.actualOutcome)}`}>
                        {result.actualOutcome}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
