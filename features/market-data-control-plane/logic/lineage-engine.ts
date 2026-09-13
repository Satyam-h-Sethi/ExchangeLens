/**
 * Market Data Control Plane — Lineage & Impact Engine
 *
 * Models directed acyclic graph (DAG) of financial data pipelines:
 * Source Feed -> Ingestion -> Normalization -> Master -> Validation -> Bus -> Downstream Consumers.
 * Computes upstream provenance and downstream blast-radius impact traversal.
 */

import {
  DownstreamImpactAnalysis,
  LineageEdge,
  LineageGraph,
  LineageNode,
  SeverityLevel,
} from "../types";

export const DEFAULT_LINEAGE_NODES: LineageNode[] = [
  // 1. External Sources
  {
    id: "SRC_CME_DIRECT",
    label: "CME Direct ITCH/FAST",
    sublabel: "Chicago Mercantile Exchange",
    type: "SOURCE_FEED",
    owner: "Market Connectivity Team",
    slaMs: 50,
    health: "HEALTHY",
    latencyMs: 14.2,
    throughputPerSec: 42000,
  },
  {
    id: "SRC_ICE_DIRECT",
    label: "ICE FIX Feed",
    sublabel: "Intercontinental Exchange",
    type: "SOURCE_FEED",
    owner: "Market Connectivity Team",
    slaMs: 100,
    health: "DEGRADED",
    latencyMs: 88.5,
    throughputPerSec: 18500,
  },
  {
    id: "SRC_EUREX_FEED",
    label: "EUREX T7 Feed",
    sublabel: "Deutsche Börse Group",
    type: "SOURCE_FEED",
    owner: "European Connectivity",
    slaMs: 50,
    health: "HEALTHY",
    latencyMs: 22.1,
    throughputPerSec: 29000,
  },
  {
    id: "SRC_BLOOMBERG_BPIPE",
    label: "Bloomberg B-PIPE",
    sublabel: "Consolidated Multi-Venue",
    type: "SOURCE_FEED",
    owner: "Vendor Feeds Desk",
    slaMs: 250,
    health: "HEALTHY",
    latencyMs: 110.0,
    throughputPerSec: 65000,
  },

  // 2. Ingestion Connectors
  {
    id: "INGEST_FEED_GATEWAY",
    label: "Low-Latency Ingest Gateway",
    sublabel: "Packet Capture & Frame Decoder",
    type: "INGESTION_CONNECTOR",
    owner: "Infrastructure Core",
    slaMs: 10,
    health: "HEALTHY",
    latencyMs: 3.8,
    throughputPerSec: 154500,
  },

  // 3. Normalization Pipeline
  {
    id: "NORM_PIPELINE",
    label: "Canonical Normalization Pipeline",
    sublabel: "Payload Standardizer & Schema Mapper",
    type: "NORMALIZATION_PIPELINE",
    owner: "Core Data Engineering",
    slaMs: 25,
    health: "HEALTHY",
    latencyMs: 12.4,
    throughputPerSec: 140000,
  },

  // 4. Reference Master & Storage
  {
    id: "MASTER_IDS_REF",
    label: "IDS Reference Master",
    sublabel: "Golden Record Contract Store",
    type: "REFERENCE_MASTER",
    owner: "Enterprise Data Systems",
    slaMs: 100,
    health: "HEALTHY",
    latencyMs: 28.0,
    throughputPerSec: 45000,
  },

  // 5. Validation Suite
  {
    id: "VAL_DETERMINISTIC_ENGINE",
    label: "Data Quality & Recon Suite",
    sublabel: "Deterministic Quality & Cross-Source Assertions",
    type: "VALIDATION_SUITE",
    owner: "Data Quality & Operations",
    slaMs: 50,
    health: "HEALTHY",
    latencyMs: 16.5,
    throughputPerSec: 45000,
  },

  // 6. Distribution Bus
  {
    id: "BUS_ENTERPRISE_DIST",
    label: "Enterprise Distribution Bus",
    sublabel: "Kafka / Aeron High-Throughput Pub-Sub",
    type: "DISTRIBUTION_BUS",
    owner: "Enterprise Messaging",
    slaMs: 15,
    health: "HEALTHY",
    latencyMs: 4.2,
    throughputPerSec: 125000,
  },

  // 7. Downstream Systems
  {
    id: "DOWN_INTRA_MARGIN",
    label: "Intraday Initial & Variation Margin",
    sublabel: "SPAN / SIMM Margin Calculator",
    type: "DOWNSTREAM_MARGIN",
    owner: "Clearing & Margin Desk",
    slaMs: 200,
    health: "HEALTHY",
    latencyMs: 45.0,
    throughputPerSec: 12000,
  },
  {
    id: "DOWN_RISK_ENGINE",
    label: "Enterprise Real-Time Risk Engine",
    sublabel: "VaR, Greeks, Stress Testing",
    type: "DOWNSTREAM_RISK",
    owner: "Risk Management Systems",
    slaMs: 500,
    health: "HEALTHY",
    latencyMs: 120.0,
    throughputPerSec: 8500,
  },
  {
    id: "DOWN_EOD_SETTLEMENT",
    label: "EOD Settlement & Cash Accounting",
    sublabel: "Clearinghouse Ledger Posting",
    type: "DOWNSTREAM_SETTLEMENT",
    owner: "Clearing Operations",
    slaMs: 1000,
    health: "HEALTHY",
    latencyMs: 210.0,
    throughputPerSec: 3200,
  },
  {
    id: "DOWN_REG_REPORTING",
    label: "Regulatory Reporting Engine",
    sublabel: "CFTC Part 45 / EMIR / MiFID II",
    type: "DOWNSTREAM_REGULATORY",
    owner: "Regulatory Compliance Tech",
    slaMs: 2000,
    health: "HEALTHY",
    latencyMs: 340.0,
    throughputPerSec: 1500,
  },
  {
    id: "DOWN_ORDER_ROUTING",
    label: "Smart Order Router (SOR)",
    sublabel: "Execution Price Bounding Check",
    type: "DOWNSTREAM_ORDER_ROUTING",
    owner: "Electronic Trading Tech",
    slaMs: 5,
    health: "HEALTHY",
    latencyMs: 1.2,
    throughputPerSec: 85000,
  },
];

export const DEFAULT_LINEAGE_EDGES: LineageEdge[] = [
  // Sources -> Ingest Gateway
  { id: "e1", source: "SRC_CME_DIRECT", target: "INGEST_FEED_GATEWAY", protocol: "ITCH Multicast", volumePerHour: "151.2M msgs" },
  { id: "e2", source: "SRC_ICE_DIRECT", target: "INGEST_FEED_GATEWAY", protocol: "FAST FIX", volumePerHour: "66.6M msgs" },
  { id: "e3", source: "SRC_EUREX_FEED", target: "INGEST_FEED_GATEWAY", protocol: "T7 ETI TCP", volumePerHour: "104.4M msgs" },
  { id: "e4", source: "SRC_BLOOMBERG_BPIPE", target: "INGEST_FEED_GATEWAY", protocol: "TCP/SSL Socket", volumePerHour: "234.0M msgs" },

  // Ingest Gateway -> Normalization
  { id: "e5", source: "INGEST_FEED_GATEWAY", target: "NORM_PIPELINE", protocol: "Internal IPC / Shared Memory", volumePerHour: "556.2M msgs" },

  // Normalization -> Master Record
  { id: "e6", source: "NORM_PIPELINE", target: "MASTER_IDS_REF", protocol: "SQL Change Data Capture", volumePerHour: "162.0M records" },

  // Master -> Validation Suite
  { id: "e7", source: "MASTER_IDS_REF", target: "VAL_DETERMINISTIC_ENGINE", protocol: "gRPC Stream", volumePerHour: "162.0M records" },

  // Validation Suite -> Distribution Bus
  { id: "e8", source: "VAL_DETERMINISTIC_ENGINE", target: "BUS_ENTERPRISE_DIST", protocol: "Kafka Pub/Sub (Validated)", volumePerHour: "161.8M records" },

  // Distribution Bus -> Downstream Consumers
  { id: "e9", source: "BUS_ENTERPRISE_DIST", target: "DOWN_INTRA_MARGIN", protocol: "Kafka Topic: marketdata.validated.v1", volumePerHour: "43.2M msgs" },
  { id: "e10", source: "BUS_ENTERPRISE_DIST", target: "DOWN_RISK_ENGINE", protocol: "Kafka Topic: marketdata.validated.v1", volumePerHour: "30.6M msgs" },
  { id: "e11", source: "BUS_ENTERPRISE_DIST", target: "DOWN_EOD_SETTLEMENT", protocol: "Kafka Topic: marketdata.settlement.eod", volumePerHour: "11.5M msgs" },
  { id: "e12", source: "BUS_ENTERPRISE_DIST", target: "DOWN_REG_REPORTING", protocol: "Kafka Topic: marketdata.audit.v1", volumePerHour: "5.4M msgs" },
  { id: "e13", source: "BUS_ENTERPRISE_DIST", target: "DOWN_ORDER_ROUTING", protocol: "Aeron Ultra-Low Latency Bus", volumePerHour: "306.0M msgs" },
];

export function getFullLineageGraph(): LineageGraph {
  return {
    nodes: DEFAULT_LINEAGE_NODES,
    edges: DEFAULT_LINEAGE_EDGES,
  };
}

export const DEFAULT_LINEAGE_GRAPH: LineageGraph = getFullLineageGraph();

/**
 * Finds all upstream nodes leading to a given target node.
 */
export function traceUpstream(nodeId: string, graph: LineageGraph = getFullLineageGraph()): string[] {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.target === curr && !visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return Array.from(visited);
}

/**
 * Finds all downstream nodes reachable from a given source node.
 */
export function traceDownstream(nodeId: string, graph: LineageGraph = getFullLineageGraph()): string[] {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.source === curr && !visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return Array.from(visited);
}

/**
 * Evaluates downstream impact blast radius when an issue occurs at a given source or validation node.
 */
export function evaluateImpactAnalysis(
  triggerNodeId: string,
  triggerType: DownstreamImpactAnalysis["triggerEntityType"],
  severity: SeverityLevel = "CRITICAL",
  graph: LineageGraph = getFullLineageGraph()
): DownstreamImpactAnalysis {
  const downstreamNodeIds = traceDownstream(triggerNodeId, graph);
  const impactedNodes = graph.nodes.filter((n) => downstreamNodeIds.includes(n.id) || n.id === triggerNodeId);

  const consumers: DownstreamImpactAnalysis["impactedConsumers"] = [];

  for (const node of impactedNodes) {
    if (node.type === "DOWNSTREAM_MARGIN") {
      consumers.push({
        nodeId: node.id,
        systemName: node.label,
        riskTier: "TIER_1_CRITICAL",
        potentialConsequence: "Distorted initial margin & variation margin calls leading to improper collateral locks or margin deficit halts.",
        requiredAction: "Lock margin calculation feed to last verified snapshot; engage clearing risk operator.",
      });
    } else if (node.type === "DOWNSTREAM_RISK") {
      consumers.push({
        nodeId: node.id,
        systemName: node.label,
        riskTier: "TIER_1_CRITICAL",
        potentialConsequence: "Erroneous portfolio VaR and Greeks spikes triggering false risk limit breaches and trading book halts.",
        requiredAction: "Apply risk model filter override; isolate contaminated instrument symbols.",
      });
    } else if (node.type === "DOWNSTREAM_SETTLEMENT") {
      consumers.push({
        nodeId: node.id,
        systemName: node.label,
        riskTier: "TIER_1_CRITICAL",
        potentialConsequence: "Incorrect cash settlement ledger credits/debits posted to member firms.",
        requiredAction: "Suspend automated settlement sweep batch until reconciliation signoff.",
      });
    } else if (node.type === "DOWNSTREAM_REGULATORY") {
      consumers.push({
        nodeId: node.id,
        systemName: node.label,
        riskTier: "TIER_2_SIGNIFICANT",
        potentialConsequence: "Inaccurate transaction reports submitted to CFTC / ESMA trade repositories resulting in compliance notices.",
        requiredAction: "Queue regulatory report generation; stamp batch with 'PENDING_RECONCILIATION'.",
      });
    } else if (node.type === "DOWNSTREAM_ORDER_ROUTING") {
      consumers.push({
        nodeId: node.id,
        systemName: node.label,
        riskTier: "TIER_1_CRITICAL",
        potentialConsequence: "Erroneous price bands causing valid client orders to be falsely rejected or mispriced executions.",
        requiredAction: "Fallback to primary exchange direct tick feed; bypass unverified consolidated master.",
      });
    }
  }

  // Blast radius score computation
  const tier1Count = consumers.filter((c) => c.riskTier === "TIER_1_CRITICAL").length;
  const tier2Count = consumers.filter((c) => c.riskTier === "TIER_2_SIGNIFICANT").length;
  const blastRadiusScore = Math.min(100, tier1Count * 25 + tier2Count * 15 + downstreamNodeIds.length * 5);

  return {
    triggerEntityId: triggerNodeId,
    triggerEntityType: triggerType,
    impactSeverity: severity,
    impactedNodeIds: downstreamNodeIds,
    impactedConsumers: consumers,
    blastRadiusScore,
  };
}
