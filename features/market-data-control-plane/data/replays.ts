/**
 * Market Data Control Plane — Synthetic Pipeline Replay Scenarios
 *
 * Provides step-by-step pipeline execution replays illustrating data ingestion,
 * normalization, quality scoring, cross-feed reconciliation, impact evaluation,
 * and incident dispatch.
 */

import { PipelineReplayScenario } from "../types";

export const SYNTHETIC_REPLAY_SCENARIOS: PipelineReplayScenario[] = [
  {
    id: "REPLAY_BRENT_DISCREPANCY",
    title: "Brent Crude Multi-Feed Discrepancy & Quarantine",
    description:
      "Full step-through analysis of the ICE Brent Crude (BRENTZ6) reconciliation failure between Bloomberg B-PIPE and ICE Direct, showing quarantine activation and downstream impact mitigation.",
    triggerEntityId: "ICE_BRENT_202612",
    triggerSourceCode: "BLOOMBERG_BPIPE",
    stages: [
      {
        stageIndex: 0,
        stageName: "Raw Ingestion & Protocol Unpack",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:40:08.120Z",
        details:
          "Ingested JSON tick frame from Bloomberg B-PIPE WebSocket feed (SRC_BLOOMBERG_BPIPE). Extracted raw payload with 8 fields.",
        outputSummary: "Payload parsed with symbol BRENTZ6, raw price 76.54 USD.",
      },
      {
        stageIndex: 1,
        stageName: "Symbology & Canonical Normalization",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:40:08.240Z",
        details:
          "Mapped external ticker 'COZ6 Comdty' to Canonical ID 'ICE_BRENT_202612' using ISIN GB0000494488 symbology table.",
        outputSummary: "Canonical entity matched: ICE Brent Crude Dec 2026.",
      },
      {
        stageIndex: 2,
        stageName: "Deterministic Quality Rule Evaluation",
        status: "WARNING",
        timestamp: "2026-09-13T11:40:08.410Z",
        details:
          "Evaluated 8 quality rules against incoming record. Rule 001 (Completeness) and Rule 004 (Format) PASSED. Rule 006 (ISIN Validity) PASSED.",
        outputSummary: "Record passed baseline structural validation with 92% local quality score.",
      },
      {
        stageIndex: 3,
        stageName: "Multi-Source Feed Reconciliation",
        status: "FAILED",
        timestamp: "2026-09-13T11:40:08.680Z",
        details:
          "Cross-checked against Golden Source (IDS_REF_MASTER) and Exchange Feed (SRC_ICE_DIRECT). Detected settlementMethod mismatch: 'PHYSICAL' vs 'CASH'. Settlement price delta: -0.28 USD (-0.364% deviation).",
        outputSummary: "Critical reconciliation divergence flagged. Status: MISMATCH.",
      },
      {
        stageIndex: 4,
        stageName: "Downstream Lineage & Impact Traversal",
        status: "WARNING",
        timestamp: "2026-09-13T11:40:08.920Z",
        details:
          "Traversed downstream lineage graph from 'SRC_BLOOMBERG_BPIPE'. Identified 4 at-risk consumer services: Value-at-Risk Engine, Margin Calculator, Settlement Ledger, and Portfolio Valuation.",
        outputSummary: "Blast radius calculated: 84.5 / 100 (HIGH SEVERITY IMPACT).",
      },
      {
        stageIndex: 5,
        stageName: "Incident Dispatch & Automated Quarantine",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:40:09.150Z",
        details:
          "Auto-generated Incident INC-94821 with severity CRITICAL. Activated payload quarantine isolating Bloomberg Brent feed while routing clean data from ICE Direct to downstream consumers.",
        outputSummary: "Incident dispatched, feed quarantined, failover to ICE Direct successful.",
      },
    ],
  },
  {
    id: "REPLAY_CME_ES_CLEAN_FLOW",
    title: "CME E-mini S&P 500 Golden Copy Ingestion",
    description:
      "Standard nominal end-to-end execution of CME E-mini S&P 500 Futures (ESZ6) traversing multi-feed reconciliation, quality verification, and downstream publishing with zero discrepancies.",
    triggerEntityId: "CME_ES_202612",
    triggerSourceCode: "CME_DIRECT",
    stages: [
      {
        stageIndex: 0,
        stageName: "Raw Ingestion & Protocol Unpack",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.010Z",
        details: "Decoded CME FAST/ITCH binary packet via hardware multicast gateway. Zero packet loss.",
        outputSummary: "Extracted contract ESZ6 settlement price 5892.25 USD.",
      },
      {
        stageIndex: 1,
        stageName: "Symbology & Canonical Normalization",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.045Z",
        details: "Harmonized CME contract code to Canonical ID 'CME_ES_202612'. Verified ISIN US12573E1010.",
        outputSummary: "Canonical normalization validated.",
      },
      {
        stageIndex: 2,
        stageName: "Deterministic Quality Rule Evaluation",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.120Z",
        details: "Evaluated all 8 quality rules. All rules returned PASS with zero warnings.",
        outputSummary: "Quality score: 100.0%.",
      },
      {
        stageIndex: 3,
        stageName: "Multi-Source Feed Reconciliation",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.250Z",
        details:
          "Reconciled 4 concurrent sources (CME Direct, Bloomberg B-PIPE, IDS Ref Master, Clearing Settle). Bloomberg volume lag (0.016%) within tolerance. All settlement prices exactly match 5892.25 USD.",
        outputSummary: "Consensus achieved. Status: MATCH.",
      },
      {
        stageIndex: 4,
        stageName: "Downstream Lineage & Impact Traversal",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.310Z",
        details: "Evaluated downstream consumers. All dependencies cleared for golden record release.",
        outputSummary: "Downstream health verified.",
      },
      {
        stageIndex: 5,
        stageName: "Incident Dispatch & Automated Quarantine",
        status: "SUCCESS",
        timestamp: "2026-09-13T11:45:00.350Z",
        details: "No incident created. Published Golden Copy record to Enterprise Distribution Bus.",
        outputSummary: "Published to 14 consumer applications in 340ms.",
      },
    ],
  },
];
