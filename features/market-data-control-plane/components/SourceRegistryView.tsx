"use client";

import React, { useState } from "react";
import { DataSource } from "../types";

interface SourceRegistryViewProps {
  sources: DataSource[];
}

export function SourceRegistryView({ sources }: SourceRegistryViewProps) {
  const [selectedSource, setSelectedSource] = useState<DataSource>(sources[0]);
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredSources = sources.filter((s) => {
    if (filterType === "ALL") return true;
    return s.type === filterType;
  });

  return (
    <div className="cp-section-stack">
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Data Source Registry & Ingestion Health</h2>
          <p className="cp-view-subheading">
            Live telemetry and SLA compliance metrics across direct exchange multicasts, vendor feeds, and internal golden stores.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="cp-filter-group">
          <label className="cp-filter-label">Feed Type:</label>
          <select
            className="cp-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Source Types ({sources.length})</option>
            <option value="DIRECT_EXCHANGE">Direct Exchange Multicast</option>
            <option value="VENDOR_CONSOLIDATED">Vendor Consolidated</option>
            <option value="INTERNAL_REFERENCE_MASTER">Internal Reference Master</option>
            <option value="SETTLEMENT_CLEARING">Clearinghouse Settlement</option>
          </select>
        </div>
      </div>

      {/* Two column layout: list on left, detail on right */}
      <div className="cp-grid-master-detail">
        {/* Sources List */}
        <div className="cp-sources-list">
          {filteredSources.map((source) => {
            const isSelected = selectedSource.id === source.id;
            return (
              <div
                key={source.id}
                className={`cp-source-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedSource(source)}
              >
                <div className="cp-source-card-top">
                  <span className="cp-source-code">{source.code}</span>
                  <span className={`cp-status-pill ${source.currentFreshness.toLowerCase()}`}>
                    {source.currentFreshness}
                  </span>
                </div>
                <div className="cp-source-card-name">{source.name}</div>
                <div className="cp-source-card-meta">
                  <span>Type: {source.type.replace(/_/g, " ")}</span>
                  <span>Uptime: {source.slaUptimePercent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Source Panel */}
        <div className="cp-detail-panel cp-card">
          <div className="cp-card-header">
            <div>
              <div className="cp-source-code-badge">{selectedSource.code}</div>
              <h3 className="cp-card-title">{selectedSource.name}</h3>
              <p className="cp-card-subtitle">{selectedSource.description}</p>
            </div>
            <span className={`cp-status-pill large ${selectedSource.currentFreshness.toLowerCase()}`}>
              {selectedSource.currentFreshness} STATUS
            </span>
          </div>

          <div className="cp-detail-grid">
            <div className="cp-detail-item">
              <span className="cp-detail-label">Upstream Operator</span>
              <span className="cp-detail-value">{selectedSource.upstreamProvider}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Network Protocol</span>
              <span className="cp-detail-value cp-mono">{selectedSource.protocol}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Gateway Ingest Endpoint</span>
              <span className="cp-detail-value cp-mono">{selectedSource.endpoint}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Active Schema Specification</span>
              <span className="cp-detail-value cp-mono">{selectedSource.activeSchemaVersion}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Expected Cadence</span>
              <span className="cp-detail-value">{selectedSource.expectedCadenceMs} ms</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Last Ingest Timestamp</span>
              <span className="cp-detail-value cp-mono">
                {new Date(selectedSource.lastIngestTimestamp).toISOString()}
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">SLA Uptime Target</span>
              <span className="cp-detail-value">{selectedSource.slaUptimePercent}%</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Active Tracked Contracts</span>
              <span className="cp-detail-value">
                {selectedSource.activeContractsCount.toLocaleString()} instruments
              </span>
            </div>
          </div>

          <div className="cp-health-telemetry-box">
            <h4 className="cp-telemetry-title">Ingestion Reliability & Health Index</h4>
            <div className="cp-telemetry-metrics">
              <div className="cp-telemetry-metric">
                <span className="cp-telemetry-metric-val">{selectedSource.reliabilityScore}%</span>
                <span className="cp-telemetry-metric-lbl">Reliability Score</span>
              </div>
              <div className="cp-telemetry-metric">
                <span className="cp-telemetry-metric-val">{selectedSource.slaUptimePercent}%</span>
                <span className="cp-telemetry-metric-lbl">Uptime SLA</span>
              </div>
              <div className="cp-telemetry-metric">
                <span className="cp-telemetry-metric-val">{selectedSource.expectedCadenceMs}ms</span>
                <span className="cp-telemetry-metric-lbl">Target Cadence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
