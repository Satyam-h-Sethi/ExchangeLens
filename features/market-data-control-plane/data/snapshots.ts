/**
 * Market Data Control Plane — Synthetic Historical Snapshots
 *
 * Provides point-in-time snapshot states (Start of Day, Intraday Mark 14:00, End of Day Settlement)
 * for temporal diffing and historical drift analysis.
 */

import { SnapshotDataset } from "../logic/temporal-engine";
import { SYNTHETIC_INSTRUMENTS } from "./canonical-instruments";

export const SYNTHETIC_SNAPSHOT_SOD: SnapshotDataset = {
  metadata: {
    id: "SNAP-2026-0912-SOD",
    timestamp: "2026-09-12T08:00:00Z",
    label: "Start of Day Baseline (SOD)",
    sourceCode: "IDS_REF_MASTER",
    recordCount: 6,
    overallQualityScore: 98.2,
    schemaVersion: "ids-canonical-instrument-v5.0",
    checksum: "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  records: [
    {
      ...SYNTHETIC_INSTRUMENTS[0], // ES
      lastSettlementPrice: 5850.0,
      volume24h: 0,
      openInterest: 2150000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[1], // NQ
      lastSettlementPrice: 20280.0,
      volume24h: 0,
      openInterest: 380000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[2], // CL
      lastSettlementPrice: 71.9,
      volume24h: 0,
      openInterest: 492000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[3], // BRENT
      lastSettlementPrice: 76.1,
      volume24h: 0,
      openInterest: 618000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[4], // FGBL
      lastSettlementPrice: 133.1,
      volume24h: 0,
      openInterest: 1115000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[5], // ZB
      lastSettlementPrice: 119.0,
      volume24h: 0,
      openInterest: 888000,
    },
  ],
};

export const SYNTHETIC_SNAPSHOT_INTRADAY: SnapshotDataset = {
  metadata: {
    id: "SNAP-2026-0912-INTRA",
    timestamp: "2026-09-12T14:00:00Z",
    label: "Intraday Mark (14:00 ET)",
    sourceCode: "IDS_REF_MASTER",
    recordCount: 6,
    overallQualityScore: 95.8,
    schemaVersion: "ids-canonical-instrument-v5.0",
    checksum: "sha256-4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  },
  records: [
    {
      ...SYNTHETIC_INSTRUMENTS[0],
      lastSettlementPrice: 5884.5,
      volume24h: 1120000,
      openInterest: 2150000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[1],
      lastSettlementPrice: 20390.0,
      volume24h: 480000,
      openInterest: 380000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[2],
      lastSettlementPrice: 72.3,
      volume24h: 240000,
      openInterest: 492000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[3],
      lastSettlementPrice: 76.65,
      volume24h: 210000,
      openInterest: 618000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[4],
      lastSettlementPrice: 132.9,
      volume24h: 720000,
      openInterest: 1115000,
    },
    {
      ...SYNTHETIC_INSTRUMENTS[5],
      lastSettlementPrice: 118.8125,
      volume24h: 310000,
      openInterest: 888000,
    },
  ],
};

export const SYNTHETIC_SNAPSHOT_EOD: SnapshotDataset = {
  metadata: {
    id: "SNAP-2026-0912-EOD",
    timestamp: "2026-09-12T17:15:00Z",
    label: "End of Day Final Settlement (EOD)",
    sourceCode: "IDS_REF_MASTER",
    recordCount: 6,
    overallQualityScore: 99.4,
    schemaVersion: "ids-canonical-instrument-v5.0",
    checksum: "sha256-ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
  },
  records: SYNTHETIC_INSTRUMENTS,
};

export const ALL_SNAPSHOTS: SnapshotDataset[] = [
  SYNTHETIC_SNAPSHOT_SOD,
  SYNTHETIC_SNAPSHOT_INTRADAY,
  SYNTHETIC_SNAPSHOT_EOD,
];
