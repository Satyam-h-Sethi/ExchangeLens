"use client";

import React, { useState } from "react";
import { SchemaDefinition, SchemaDriftReport } from "../types";
import { diffSchemas } from "../logic/schema-drift-engine";

interface SchemaDriftViewProps {
  schemas: Record<string, { base: SchemaDefinition; target: SchemaDefinition }>;
}

export function SchemaDriftView({ schemas }: SchemaDriftViewProps) {
  const schemaKeys = Object.keys(schemas);
  const [selectedKey, setSelectedKey] = useState<string>(schemaKeys[1] || schemaKeys[0]); // Default to ICE FIXML which has breaking changes

  const currentPair = schemas[selectedKey];
  const driftReport: SchemaDriftReport = diffSchemas(
    currentPair.base,
    currentPair.target,
    selectedKey
  );

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Schema Drift & Protocol Evolution Analyzer</h2>
          <p className="cp-view-subheading">
            Automated schema comparison identifying field additions, deletions, precision mutations, enum domain changes, and classifying downstream breaking risks.
          </p>
        </div>

        {/* Feed Schema Selector */}
        <div className="cp-filter-group">
          <label className="cp-filter-label">Select Exchange Schema:</label>
          <select
            className="cp-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {schemaKeys.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, " ")} ({schemas[k].base.version} → {schemas[k].target.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schema Drift High-Level KPI Summary */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Compatibility Verdict</span>
            <span
              className={`cp-status-pill ${
                driftReport.compatibilityScore === "BREAKING_CHANGE"
                  ? "critical"
                  : driftReport.compatibilityScore === "POTENTIALLY_BREAKING"
                  ? "warning"
                  : "pass"
              }`}
            >
              {driftReport.compatibilityScore.replace(/_/g, " ")}
            </span>
          </div>
          <div className="cp-kpi-value">
            {driftReport.compatibilityScore === "BREAKING_CHANGE" ? "INCOMPATIBLE" : "COMPATIBLE"}
          </div>
          <div className="cp-kpi-subtext">
            {driftReport.breakingChangesCount} breaking mutations detected in target schema
          </div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Base Schema Version</span>
            <span className="cp-status-pill pass">PRODUCTION</span>
          </div>
          <div className="cp-kpi-value cp-mono" style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
            {driftReport.baseVersion}
          </div>
          <div className="cp-kpi-subtext">Published: {currentPair.base.publishedDate}</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Target Schema Version</span>
            <span className="cp-status-pill warning">CANDIDATE</span>
          </div>
          <div className="cp-kpi-value cp-mono" style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
            {driftReport.targetVersion}
          </div>
          <div className="cp-kpi-subtext">Published: {currentPair.target.publishedDate}</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Affected Downstream Systems</span>
            <span className="cp-status-pill critical">
              {driftReport.affectedConsumers.length} CONSUMERS
            </span>
          </div>
          <div className="cp-kpi-value">{driftReport.affectedConsumers.length}</div>
          <div className="cp-kpi-subtext">Pipelines requiring adapter reconfiguration</div>
        </div>
      </div>

      {/* Downstream Consumer Impact Notice */}
      {driftReport.affectedConsumers.length > 0 && (
        <div className="cp-card cp-border-critical">
          <h4 className="cp-card-title cp-text-critical">Downstream Consumer Blast Radius Warning</h4>
          <p className="cp-card-subtitle" style={{ marginBottom: "0.75rem" }}>
            The following consumer services will experience ingestion failure or precision truncation if this schema is promoted:
          </p>
          <div className="cp-tag-cloud">
            {driftReport.affectedConsumers.map((consumer) => (
              <span key={consumer} className="cp-tag critical">
                {consumer.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Schema Mutations List */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">Detailed Field Mutations & Structural Changes</h3>
            <p className="cp-card-subtitle">
              Audit log of all added, removed, type-altered, and precision-modified fields
            </p>
          </div>
          <span className="cp-tag">{driftReport.mutations.length} Mutations</span>
        </div>

        <div className="cp-table-container">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Field Name</th>
                <th>Mutation Type</th>
                <th>Previous (Base) State</th>
                <th>Proposed (Target) State</th>
                <th>Impact & Mitigation Details</th>
              </tr>
            </thead>
            <tbody>
              {driftReport.mutations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--cp-text-muted)" }}>
                    No schema mutations detected between versions.
                  </td>
                </tr>
              ) : (
                driftReport.mutations.map((mut, idx) => (
                  <tr key={idx}>
                    <td>
                      <span
                        className={`cp-status-pill ${
                          mut.compatibility === "BREAKING_CHANGE"
                            ? "critical"
                            : mut.compatibility === "POTENTIALLY_BREAKING"
                            ? "warning"
                            : "pass"
                        }`}
                      >
                        {mut.compatibility.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="cp-mono cp-text-semibold">{mut.fieldName}</td>
                    <td>
                      <span className="cp-tag">{mut.changeType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="cp-mono cp-text-muted">
                      {mut.oldField
                        ? `${mut.oldField.type} (${mut.oldField.required ? "req" : "opt"}${
                            mut.oldField.precision !== undefined ? `, prec:${mut.oldField.precision}` : ""
                          })`
                        : "—"}
                    </td>
                    <td className="cp-mono cp-text-bold">
                      {mut.newField
                        ? `${mut.newField.type} (${mut.newField.required ? "req" : "opt"}${
                            mut.newField.precision !== undefined ? `, prec:${mut.newField.precision}` : ""
                          })`
                        : "DELETED"}
                    </td>
                    <td>
                      <div className="cp-text-semibold">{mut.impactExplanation}</div>
                      {mut.affectedConsumers.length > 0 && (
                        <div className="cp-text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                          Affects: {mut.affectedConsumers.join(", ")}
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
    </div>
  );
}
