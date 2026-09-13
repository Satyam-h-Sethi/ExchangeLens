"use client";

import React, { useState } from "react";
import { SnapshotDataset, diffSnapshots } from "../logic/temporal-engine";

interface TemporalHistoryViewProps {
  snapshots: SnapshotDataset[];
}

export function TemporalHistoryView({ snapshots }: TemporalHistoryViewProps) {
  const [baseSnapId, setBaseSnapId] = useState<string>(snapshots[0]?.metadata.id || "");
  const [targetSnapId, setTargetSnapId] = useState<string>(
    snapshots[2]?.metadata.id || snapshots[1]?.metadata.id || ""
  );

  const baseSnapshot = snapshots.find((s) => s.metadata.id === baseSnapId) || snapshots[0];
  const targetSnapshot =
    snapshots.find((s) => s.metadata.id === targetSnapId) || snapshots[snapshots.length - 1];

  const diffReport = diffSnapshots(baseSnapshot, targetSnapshot);

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Temporal Point-in-Time History & Snapshot Diff</h2>
          <p className="cp-view-subheading">
            Bidirectional snapshot diffing and audit comparison between Start-of-Day (SOD) Baselines, Intraday Marks (14:00 ET), and End-of-Day (EOD) Final Settlements.
          </p>
        </div>
      </div>

      {/* Snapshot Selector Bar */}
      <div className="cp-card cp-filter-bar">
        <div className="cp-filter-item">
          <label className="cp-filter-label">Base Snapshot (T0):</label>
          <select
            className="cp-select"
            value={baseSnapId}
            onChange={(e) => setBaseSnapId(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.metadata.id} value={s.metadata.id}>
                {s.metadata.label} ({new Date(s.metadata.timestamp).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>

        <div className="cp-temporal-arrow">➔</div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Target Snapshot (T1):</label>
          <select
            className="cp-select"
            value={targetSnapId}
            onChange={(e) => setTargetSnapId(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.metadata.id} value={s.metadata.id}>
                {s.metadata.label} ({new Date(s.metadata.timestamp).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diff High-Level Metrics */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Modified Contracts</span>
            <span className="cp-status-pill pass">{diffReport.modifiedRecordsCount} UPDATES</span>
          </div>
          <div className="cp-kpi-value">{diffReport.modifiedRecordsCount}</div>
          <div className="cp-kpi-subtext">Contracts with price/volume updates between snapshots</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Quality Score Trajectory</span>
            <span
              className={`cp-status-pill ${
                diffReport.qualityScoreDelta >= 0 ? "pass" : "warning"
              }`}
            >
              {diffReport.qualityScoreDelta >= 0 ? "+" : ""}
              {diffReport.qualityScoreDelta.toFixed(1)}%
            </span>
          </div>
          <div className="cp-kpi-value">
            {diffReport.baseQualityScore.toFixed(1)}% ➔ {diffReport.targetQualityScore.toFixed(1)}%
          </div>
          <div className="cp-kpi-subtext">Baseline vs Target overall quality score</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Added / Removed</span>
            <span className="cp-status-pill pass">0 DRIFT</span>
          </div>
          <div className="cp-kpi-value">
            +{diffReport.addedRecordsCount} / -{diffReport.removedRecordsCount}
          </div>
          <div className="cp-kpi-subtext">Contract additions or delistings in timeframe</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Time Elapsed</span>
            <span className="cp-status-pill pass">TIMELINE</span>
          </div>
          <div className="cp-kpi-value cp-mono" style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
            {new Date(baseSnapshot.metadata.timestamp).toLocaleTimeString()} ➔{" "}
            {new Date(targetSnapshot.metadata.timestamp).toLocaleTimeString()}
          </div>
          <div className="cp-kpi-subtext">Trading day evolution</div>
        </div>
      </div>

      {/* Snapshot Diff Breakdown Table */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">Point-in-Time Field Changes Breakdown</h3>
            <p className="cp-card-subtitle">
              Detailed record-level diff comparing settlement price, volume, and open interest
            </p>
          </div>
        </div>

        <div className="cp-table-container">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Instrument Name</th>
                <th>Exchange</th>
                <th>Base Settlement (T0)</th>
                <th>Target Settlement (T1)</th>
                <th>Price Change</th>
                <th>Volume (T1)</th>
              </tr>
            </thead>
            <tbody>
              {diffReport.recordDiffs.map((diff) => {
                const baseRec = baseSnapshot.records.find((r) => r.id === diff.entityId);
                const targetRec = targetSnapshot.records.find((r) => r.id === diff.entityId);
                const basePx = baseRec?.lastSettlementPrice ?? 0;
                const targetPx = targetRec?.lastSettlementPrice ?? 0;
                const pxDiff = targetPx - basePx;
                const pxPct = basePx > 0 ? (pxDiff / basePx) * 100 : 0;

                return (
                  <tr key={diff.entityId}>
                    <td>
                      <span className="cp-badge-symbol cp-mono">{diff.symbol}</span>
                    </td>
                    <td className="cp-text-semibold">{targetRec?.name || baseRec?.name}</td>
                    <td>
                      <span className="cp-tag">{targetRec?.exchange || baseRec?.exchange}</span>
                    </td>
                    <td className="cp-mono">{basePx.toFixed(2)}</td>
                    <td className="cp-mono cp-text-bold">{targetPx.toFixed(2)}</td>
                    <td className="cp-mono">
                      <span className={pxDiff >= 0 ? "cp-text-pass" : "cp-text-critical"}>
                        {pxDiff >= 0 ? "+" : ""}
                        {pxDiff.toFixed(2)} ({pxDiff >= 0 ? "+" : ""}
                        {pxPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="cp-mono">{targetRec?.volume24h?.toLocaleString() ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
