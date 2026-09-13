"use client";

import React, { useState } from "react";
import {
  CanonicalInstrument,
  EntityReconciliationReport,
  SourcePayloadRecord,
} from "../types";
import { reconcileEntitySources } from "../logic/reconciliation-engine";

interface ReconciliationViewProps {
  instruments: CanonicalInstrument[];
  sourcePayloads: Record<string, SourcePayloadRecord[]>;
}

export function ReconciliationView({
  instruments,
  sourcePayloads,
}: ReconciliationViewProps) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(
    instruments[3]?.id || instruments[0].id // Default to Brent Crude to highlight discrepancy
  );

  const selectedInstrument =
    instruments.find((i) => i.id === selectedInstrumentId) || instruments[0];

  const currentPayloads = sourcePayloads[selectedInstrument.id] || [];

  const reconReport: EntityReconciliationReport = reconcileEntitySources(
    selectedInstrument,
    currentPayloads
  );

  const agreementScore = reconReport.fields.length > 0
    ? (reconReport.fields.filter((f) => f.status === "MATCH" || f.status === "WITHIN_TOLERANCE").length / reconReport.fields.length) * 100
    : 100;

  const goldenSourceCode = reconReport.fields[0]?.goldenSourceCode || "IDS_REF_MASTER";

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Cross-Source Multi-Feed Reconciliation</h2>
          <p className="cp-view-subheading">
            Field-by-field multi-source consensus comparator validating Direct Exchange feeds, Vendor Consolidated feeds (Bloomberg B-PIPE), and Internal Reference Masters.
          </p>
        </div>

        {/* Instrument Switcher */}
        <div className="cp-filter-group">
          <label className="cp-filter-label">Select Instrument:</label>
          <select
            className="cp-select"
            value={selectedInstrumentId}
            onChange={(e) => setSelectedInstrumentId(e.target.value)}
          >
            {instruments.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.symbol} ({inst.exchange}) — {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Matrix for Selected Instrument */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Reconciliation Consensus</span>
            <span className={`cp-status-pill ${reconReport.overallStatus.toLowerCase()}`}>
              {reconReport.overallStatus}
            </span>
          </div>
          <div className="cp-kpi-value">{agreementScore.toFixed(1)}%</div>
          <div className="cp-kpi-subtext">Consensus across {reconReport.sourcesCompared.length} feeds</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Golden Copy Source</span>
            <span className="cp-status-pill pass">AUTHORITATIVE</span>
          </div>
          <div className="cp-kpi-value cp-mono" style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
            {goldenSourceCode}
          </div>
          <div className="cp-kpi-subtext">ION Data Service (IDS) Reference Master</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Divergences / Mismatches</span>
            <span className={`cp-status-pill ${reconReport.mismatchCount > 0 ? "critical" : "pass"}`}>
              {reconReport.mismatchCount} CRITICAL
            </span>
          </div>
          <div className="cp-kpi-value">{reconReport.mismatchCount}</div>
          <div className="cp-kpi-subtext">Fields exceeding strict tolerance limits</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Feeds Ingested</span>
            <span className="cp-status-pill pass">ALL AVAILABLE</span>
          </div>
          <div className="cp-kpi-value">{reconReport.sourcesCompared.length} Sources</div>
          <div className="cp-kpi-subtext">{reconReport.sourcesCompared.join(", ")}</div>
        </div>
      </div>

      {/* Field Reconciliation Matrix Table */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">
              Field Comparison Matrix: {selectedInstrument.symbol} ({selectedInstrument.name})
            </h3>
            <p className="cp-card-subtitle">
              Evaluating multi-source values against golden copy tolerance rules
            </p>
          </div>
          <span className="cp-badge-symbol cp-mono">{selectedInstrument.isin}</span>
        </div>

        <div className="cp-table-container">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Field Name</th>
                <th>Golden Copy Value</th>
                <th>Tolerance Rule</th>
                <th>Feed Values & Detected Deltas</th>
              </tr>
            </thead>
            <tbody>
              {reconReport.fields.map((field) => (
                <tr key={field.field}>
                  <td>
                    <span className={`cp-status-pill ${field.status.toLowerCase()}`}>
                      {field.status}
                    </span>
                  </td>
                  <td className="cp-mono cp-text-semibold">{field.displayName}</td>
                  <td className="cp-mono cp-text-bold cp-text-golden">
                    {field.goldenSourceValue !== null && field.goldenSourceValue !== undefined ? String(field.goldenSourceValue) : "—"}
                  </td>
                  <td className="cp-text-muted" style={{ fontSize: "0.85rem" }}>
                    {field.toleranceRule || "Standard equivalence"}
                  </td>
                  <td>
                    <div className="cp-recon-sources-stack">
                      {field.secondaryValues.map((sec) => {
                        const isMatch = sec.status === "MATCH" || sec.status === "WITHIN_TOLERANCE";
                        return (
                          <div key={sec.sourceCode} className="cp-recon-source-row">
                            <span className="cp-tag cp-mono">{sec.sourceCode}:</span>
                            <span className={`cp-mono ${!isMatch ? "cp-text-critical cp-text-bold" : ""}`}>
                              {sec.value !== null && sec.value !== undefined ? String(sec.value) : "MISSING"}
                            </span>
                            {sec.delta !== undefined && (
                              <span className="cp-divergence-badge">Δ {String(sec.delta)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
