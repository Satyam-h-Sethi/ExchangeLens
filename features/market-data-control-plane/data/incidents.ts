/**
 * Market Data Control Plane — Synthetic Incidents Registry
 *
 * Pre-seeded realistic operational incidents across data reconciliation,
 * schema drift, quality anomalies, and exchange feed timeliness.
 */

import { Incident } from "../types";

export const SYNTHETIC_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-0913-001",
    ticketNumber: "INC-94821",
    title: "ICE Brent Crude Cash/Physical Settlement Specification Discrepancy",
    summary:
      "Bloomberg B-PIPE consolidated feed published settlementMethod as 'PHYSICAL' with stale settlement price 76.54 USD for contract BRENTZ6, conflicting with ICE Direct authoritative specification (CASH, 76.82 USD).",
    severity: "CRITICAL",
    category: "RECONCILIATION_MISMATCH",
    status: "OPEN",
    detectedAt: "2026-09-13T11:40:12Z",
    affectedSource: "BLOOMBERG_BPIPE",
    affectedSymbols: ["BRENTZ6", "LCOZ6"],
    affectedConsumers: [
      "RISK_ENGINE_VAR",
      "MARGIN_COLLATERAL_OPTIMIZER",
      "SETTLEMENT_CLEARING_LEDGER",
      "PORTFOLIO_VALUATION_SERVICE",
    ],
    blastRadiusScore: 84.5,
    rootCauseAnalysis:
      "Vendor feed upstream symbology transformation failed to update delivery specification flag following contract expiration rollover. Fallback mechanism pulled stale physical delivery terms from obsolete prompt contract.",
    suggestedMitigation:
      "1. Activate upstream vendor payload quarantine for ICE Energy products.\n2. Fall back to Direct ICE FIXML authoritative broadcast (SRC_ICE_DIRECT).\n3. Trigger automated risk recalculation for all Brent portfolio positions.",
    auditTrail: [
      {
        id: "aud-001-a",
        timestamp: "2026-09-13T11:40:12Z",
        actor: "RECON_ENGINE",
        actorName: "Reconciliation Engine v4.2",
        action: "INCIDENT_DISPATCHED",
        details:
          "Cross-source comparator detected settlementMethod conflict (CASH vs PHYSICAL) and 28 cent price divergence exceeding 0.05% threshold.",
        newState: "OPEN",
      },
      {
        id: "aud-001-b",
        timestamp: "2026-09-13T11:41:00Z",
        actor: "SYSTEM",
        actorName: "Alert Router",
        action: "PAGER_TRIGGERED",
        details: "Critical alert routed to Core Market Data On-Call and Energy Desk Risk Officer.",
        previousState: "OPEN",
        newState: "OPEN",
      },
    ],
  },
  {
    id: "INC-2026-0913-002",
    ticketNumber: "INC-94818",
    title: "ICE FIXML Breaking Schema Mutation: Precision Truncation & Field Deprecation",
    summary:
      "Target schema ice-fixml-spec-v4.2.0-rc2 introduced a breaking change by truncating PxUnit decimal precision (6 -> 4), dropping mandatory DailyCapLimit, and adding required ClearingVenueCode without backward compatibility shim.",
    severity: "ERROR",
    category: "SCHEMA_DRIFT",
    status: "INVESTIGATING",
    detectedAt: "2026-09-13T10:15:30Z",
    affectedSource: "ICE_REF",
    affectedSymbols: ["BRENTZ6", "GASOILZ6", "NGZ6"],
    affectedConsumers: [
      "NORMALIZATION_GATEWAY",
      "REFERENCE_MASTER_IDS",
      "RISK_ENGINE_VAR",
    ],
    blastRadiusScore: 68.0,
    rootCauseAnalysis:
      "Exchange published draft release candidate spec directly into staging feed parser registry prior to official clearing migration window.",
    suggestedMitigation:
      "Hold schema activation lock on production pipelines. Restrict schema parser to v4.1.0 until clearinghouse migration weekend.",
    auditTrail: [
      {
        id: "aud-002-a",
        timestamp: "2026-09-13T10:15:30Z",
        actor: "SCHEMA_ENGINE",
        actorName: "Schema Compatibility Engine",
        action: "BREAKING_CHANGE_DETECTED",
        details: "Detected 3 breaking mutations in feed ice-fixml-spec-v4.2.0-rc2.",
        newState: "OPEN",
      },
      {
        id: "aud-002-b",
        timestamp: "2026-09-13T10:30:00Z",
        actor: "OPERATIONS_USER",
        actorName: "Data Architect",
        action: "INVESTIGATION_STARTED",
        details: "Reviewed schema diff with ICE exchange technical liaison.",
        previousState: "OPEN",
        newState: "INVESTIGATING",
      },
    ],
  },
  {
    id: "INC-2026-0913-003",
    ticketNumber: "INC-94795",
    title: "EUREX Bund Futures Tick Multiplier Anomaly in Vendor Feed",
    summary:
      "Bloomberg B-PIPE broadcast FGBLZ6 tickSize as 0.005 EUR with tickValue 5.0 EUR instead of canonical Eurex standard 0.01 EUR / 10.0 EUR, threatening algorithmic order routing execution errors.",
    severity: "WARNING",
    category: "QUALITY_RULE_FAILURE",
    status: "MITIGATED",
    detectedAt: "2026-09-13T08:45:00Z",
    resolvedAt: "2026-09-13T09:30:00Z",
    affectedSource: "BLOOMBERG_BPIPE",
    affectedSymbols: ["FGBLZ6"],
    affectedConsumers: [
      "ALGO_EXECUTION_SMART_ROUTER",
      "RISK_ENGINE_VAR",
    ],
    blastRadiusScore: 42.0,
    rootCauseAnalysis:
      "Vendor incorrectly mapped half-tick tier pricing rule designed for calendar spreads onto outright futures prompt contract.",
    suggestedMitigation:
      "Enforce deterministic Business Rule rule-008 override: outright German Federal Bond futures (FGBL) maintain hard invariant tickSize = 0.01.",
    resolutionSummary:
      "Applied authoritative Golden Copy override from IDS Reference Master. Quarantined vendor tick fields for German sovereign debt.",
    auditTrail: [
      {
        id: "aud-003-a",
        timestamp: "2026-09-13T08:45:00Z",
        actor: "QUALITY_ENGINE",
        actorName: "Quality Rules Evaluator",
        action: "RULE_FAILED_RULE_008",
        details: "FGBLZ6 tick value 5.0 EUR did not match formula contractSize * tickSize = 1000 EUR.",
        newState: "OPEN",
      },
      {
        id: "aud-003-b",
        timestamp: "2026-09-13T09:05:00Z",
        actor: "OPERATIONS_USER",
        actorName: "SecOps Lead",
        action: "OVERRIDE_APPLIED",
        details: "Applied golden copy patch and updated rule exception registry.",
        previousState: "OPEN",
        newState: "MITIGATED",
      },
    ],
  },
  {
    id: "INC-2026-0912-004",
    ticketNumber: "INC-94610",
    title: "CME Globex Ingest Cadence Jitter & Timeliness Degradation",
    summary:
      "Ingest gateway experienced 340ms heartbeat jitter across CME equity index multicast group during cash market open volatility spike.",
    severity: "INFO",
    category: "FEED_TIMELINESS_STALE",
    status: "RESOLVED",
    detectedAt: "2026-09-12T13:30:00Z",
    resolvedAt: "2026-09-12T14:05:00Z",
    affectedSource: "CME_DIRECT",
    affectedSymbols: ["ESZ6", "NQZ6"],
    affectedConsumers: ["FEED_DISTRIBUTION_BUS"],
    blastRadiusScore: 18.0,
    rootCauseAnalysis:
      "Kernel UDP socket buffer overfill during microsecond burst. NIC packet drops avoided via secondary fiber failover.",
    suggestedMitigation: "Increase kernel socket ring buffer sizes to 64MB on edge ingestion nodes.",
    resolutionSummary:
      "Ingestion gateway rebalanced multicast feed slices across dual Solarflare NIC interfaces. Latency stabilized below 50 microseconds.",
    auditTrail: [
      {
        id: "aud-004-a",
        timestamp: "2026-09-12T13:30:00Z",
        actor: "SYSTEM",
        actorName: "Heartbeat Monitor",
        action: "SLA_DEVIATION_ALERT",
        details: "Cadence exceeded 200ms threshold.",
        newState: "OPEN",
      },
      {
        id: "aud-004-b",
        timestamp: "2026-09-12T14:05:00Z",
        actor: "OPERATIONS_USER",
        actorName: "Infrastructure Team",
        action: "RESOLVED",
        details: "NIC ring buffer tuned, failover verified.",
        previousState: "OPEN",
        newState: "RESOLVED",
      },
    ],
  },
];
