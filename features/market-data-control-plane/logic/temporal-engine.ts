/**
 * Market Data Control Plane — Temporal Change Engine
 *
 * Compares point-in-time market data snapshots (e.g. Start of Day, Intraday Mark, End of Day Settlement).
 * Computes record-level diffs, field-level deltas, and quality score trajectories across time.
 */

import {
  CanonicalInstrument,
  FieldTemporalDelta,
  RecordTemporalDelta,
  SnapshotDiffReport,
  SnapshotMetadata,
} from "../types";

export interface SnapshotDataset {
  metadata: SnapshotMetadata;
  records: CanonicalInstrument[];
}

export function diffSnapshots(
  snapshotA: SnapshotDataset,
  snapshotB: SnapshotDataset
): SnapshotDiffReport {
  const mapA = new Map<string, CanonicalInstrument>();
  for (const r of snapshotA.records) {
    mapA.set(r.id, r);
  }

  const mapB = new Map<string, CanonicalInstrument>();
  for (const r of snapshotB.records) {
    mapB.set(r.id, r);
  }

  let addedRecords = 0;
  let removedRecords = 0;
  let modifiedRecords = 0;
  let unchangedRecords = 0;
  const recordDeltas: RecordTemporalDelta[] = [];

  // Check removed and modified
  for (const [id, recA] of mapA.entries()) {
    const recB = mapB.get(id);

    if (!recB) {
      removedRecords++;
      recordDeltas.push({
        entityId: id,
        symbol: recA.symbol,
        changeType: "REMOVED",
        fieldDeltas: [
          {
            fieldName: "STATUS",
            oldValue: recA.status,
            newValue: "DELETED/EXPIRED",
            isSignificant: true,
          },
        ],
      });
      continue;
    }

    // Compare fields between recA and recB
    const fieldDeltas: FieldTemporalDelta[] = [];

    // Settlement Price
    if (recA.lastSettlementPrice !== recB.lastSettlementPrice) {
      const pDiff = recA.lastSettlementPrice !== 0
        ? ((recB.lastSettlementPrice - recA.lastSettlementPrice) / recA.lastSettlementPrice) * 100
        : 0;
      fieldDeltas.push({
        fieldName: "lastSettlementPrice",
        oldValue: recA.lastSettlementPrice,
        newValue: recB.lastSettlementPrice,
        deltaPercent: Math.round(pDiff * 100) / 100,
        isSignificant: Math.abs(pDiff) >= 1.0,
      });
    }

    // Volume 24h
    if (recA.volume24h !== recB.volume24h) {
      const vDiff = recA.volume24h !== 0
        ? ((recB.volume24h - recA.volume24h) / recA.volume24h) * 100
        : 0;
      fieldDeltas.push({
        fieldName: "volume24h",
        oldValue: recA.volume24h,
        newValue: recB.volume24h,
        deltaPercent: Math.round(vDiff * 100) / 100,
        isSignificant: Math.abs(vDiff) >= 10.0,
      });
    }

    // Open Interest
    if (recA.openInterest !== recB.openInterest) {
      const oiDiff = recA.openInterest !== 0
        ? ((recB.openInterest - recA.openInterest) / recA.openInterest) * 100
        : 0;
      fieldDeltas.push({
        fieldName: "openInterest",
        oldValue: recA.openInterest,
        newValue: recB.openInterest,
        deltaPercent: Math.round(oiDiff * 100) / 100,
        isSignificant: Math.abs(oiDiff) >= 5.0,
      });
    }

    // Tick Size / Specs changes (Rare and critical)
    if (recA.specs.tickSize !== recB.specs.tickSize) {
      fieldDeltas.push({
        fieldName: "specs.tickSize",
        oldValue: recA.specs.tickSize,
        newValue: recB.specs.tickSize,
        isSignificant: true,
      });
    }

    if (recA.status !== recB.status) {
      fieldDeltas.push({
        fieldName: "status",
        oldValue: recA.status,
        newValue: recB.status,
        isSignificant: true,
      });
    }

    if (fieldDeltas.length > 0) {
      modifiedRecords++;
      recordDeltas.push({
        entityId: id,
        symbol: recA.symbol,
        changeType: "MODIFIED",
        fieldDeltas,
      });
    } else {
      unchangedRecords++;
    }
  }

  // Check added
  for (const [id, recB] of mapB.entries()) {
    if (!mapA.has(id)) {
      addedRecords++;
      recordDeltas.push({
        entityId: id,
        symbol: recB.symbol,
        changeType: "ADDED",
        fieldDeltas: [
          {
            fieldName: "STATUS",
            oldValue: "NEW_CONTRACT",
            newValue: recB.status,
            isSignificant: true,
          },
        ],
      });
    }
  }

  const qualityScoreDrift =
    Math.round((snapshotB.metadata.overallQualityScore - snapshotA.metadata.overallQualityScore) * 10) / 10;

  return {
    snapshotAId: snapshotA.metadata.id,
    snapshotBId: snapshotB.metadata.id,
    timestampA: snapshotA.metadata.timestamp,
    timestampB: snapshotB.metadata.timestamp,
    sourceCode: snapshotA.metadata.sourceCode,
    totalRecordsA: snapshotA.records.length,
    totalRecordsB: snapshotB.records.length,
    addedRecords,
    addedRecordsCount: addedRecords,
    removedRecords,
    removedRecordsCount: removedRecords,
    modifiedRecords,
    modifiedRecordsCount: modifiedRecords,
    unchangedRecords,
    recordDeltas,
    recordDiffs: recordDeltas,
    qualityScoreDrift,
    qualityScoreDelta: qualityScoreDrift,
    baseQualityScore: snapshotA.metadata.overallQualityScore,
    targetQualityScore: snapshotB.metadata.overallQualityScore,
  };
}
