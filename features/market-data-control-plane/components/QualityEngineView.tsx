"use client";

import React, { useState } from "react";
import {
  CanonicalInstrument,
  QualityRule,
  QualityRuleCategory,
  QualityScorecard,
  RuleEvaluationResult,
  SeverityLevel,
} from "../types";

interface QualityEngineViewProps {
  scorecard: QualityScorecard;
  evaluationResults: RuleEvaluationResult[];
  instruments: CanonicalInstrument[];
  rules: QualityRule[];
}

export function QualityEngineView({
  scorecard,
  evaluationResults,
  instruments,
  rules,
}: QualityEngineViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<QualityRuleCategory | "ALL">("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredResults = evaluationResults.filter((res) => {
    if (selectedCategory !== "ALL" && res.category !== selectedCategory) return false;
    if (selectedSeverity !== "ALL" && res.severity !== selectedSeverity) return false;
    if (selectedInstrumentId !== "ALL" && res.targetEntityId !== selectedInstrumentId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        res.ruleId.toLowerCase().includes(q) ||
        res.ruleName.toLowerCase().includes(q) ||
        res.message.toLowerCase().includes(q) ||
        res.symbol.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Deterministic Data Quality Engine</h2>
          <p className="cp-view-subheading">
            Rule-based multi-dimensional validation suite assessing completeness, validity, consistency, timeliness, and cross-field integrity invariants.
          </p>
        </div>
      </div>

      {/* Quality Scorecard Cards */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Overall Quality Health</span>
            <span className={`cp-status-pill ${scorecard.overallScore >= 95 ? "pass" : "warning"}`}>
              {scorecard.overallScore.toFixed(1)}%
            </span>
          </div>
          <div className="cp-kpi-value">{scorecard.overallScore.toFixed(1)}%</div>
          <div className="cp-kpi-subtext">Weighted score across 8 quality dimensions</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Evaluations Executed</span>
            <span className="cp-status-pill pass">PASSED {scorecard.passedEvaluations}</span>
          </div>
          <div className="cp-kpi-value">{scorecard.totalEvaluations}</div>
          <div className="cp-kpi-subtext">Total automated rule evaluations</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Warnings Flagged</span>
            <span className="cp-status-pill warning">{scorecard.warningCount} DETECTED</span>
          </div>
          <div className="cp-kpi-value">{scorecard.warningCount}</div>
          <div className="cp-kpi-subtext">Tolerable drift and non-critical validation notices</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Critical / Errors</span>
            <span className={`cp-status-pill ${scorecard.criticalCount + scorecard.errorCount > 0 ? "critical" : "pass"}`}>
              {scorecard.criticalCount + scorecard.errorCount} VIOLATIONS
            </span>
          </div>
          <div className="cp-kpi-value">{scorecard.criticalCount + scorecard.errorCount}</div>
          <div className="cp-kpi-subtext">Hard business rule and format anomalies</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="cp-card cp-filter-bar">
        <div className="cp-filter-item">
          <label className="cp-filter-label">Search:</label>
          <input
            type="text"
            className="cp-input"
            placeholder="Search rules, symbols, messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Category:</label>
          <select
            className="cp-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
          >
            <option value="ALL">All Categories</option>
            <option value="COMPLETENESS">Completeness</option>
            <option value="VALIDITY">Validity</option>
            <option value="CONSISTENCY">Consistency</option>
            <option value="TIMELINESS">Timeliness</option>
            <option value="UNIQUENESS">Uniqueness</option>
            <option value="REFERENTIAL_INTEGRITY">Referential Integrity</option>
            <option value="BUSINESS_RULE">Business Rule</option>
            <option value="SCHEMA">Schema</option>
          </select>
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Severity:</label>
          <select
            className="cp-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
          >
            <option value="ALL">All Severities</option>
            <option value="PASS">Pass Only</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Instrument:</label>
          <select
            className="cp-select"
            value={selectedInstrumentId}
            onChange={(e) => setSelectedInstrumentId(e.target.value)}
          >
            <option value="ALL">All Instruments ({instruments.length})</option>
            {instruments.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.symbol} — {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="cp-card cp-table-container">
        <table className="cp-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Rule ID</th>
              <th>Dimension</th>
              <th>Instrument</th>
              <th>Rule Description</th>
              <th>Evaluation Findings / Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--cp-text-muted)" }}>
                  No rule evaluations matching active filters.
                </td>
              </tr>
            ) : (
              filteredResults.map((res) => (
                <tr key={`${res.ruleId}-${res.targetEntityId}`}>
                  <td>
                    <span className={`cp-status-pill ${res.severity.toLowerCase()}`}>
                      {res.severity}
                    </span>
                  </td>
                  <td className="cp-mono cp-text-semibold">{res.ruleId}</td>
                  <td>
                    <span className="cp-tag">{res.category}</span>
                  </td>
                  <td>
                    <span className="cp-mono cp-badge-symbol">{res.symbol}</span>
                  </td>
                  <td className="cp-text-semibold">{res.ruleName}</td>
                  <td className="cp-findings-cell">
                    <div>{res.message}</div>
                    {res.actualValue !== undefined && (
                      <div className="cp-findings-meta">
                        Actual: <span className="cp-mono">{String(res.actualValue)}</span> | Expected:{" "}
                        <span className="cp-mono">{String(res.expectedValue)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
