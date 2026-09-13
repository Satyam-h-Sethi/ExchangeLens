/**
 * Market Data Control Plane — Core Domain Type Definitions
 *
 * Strict TypeScript types modeling financial market data sources, canonical instruments,
 * deterministic quality rules, cross-source reconciliation, schema drift, temporal versioning,
 * lineage graphs, incident management, and pipeline replay.
 */

// ============================================================================
// 1. DATA SOURCES & REGISTRY
// ============================================================================

export type SourceType =
  | "DIRECT_EXCHANGE"
  | "VENDOR_CONSOLIDATED"
  | "INTERNAL_REFERENCE_MASTER"
  | "SETTLEMENT_CLEARING"
  | "HISTORICAL_ARCHIVE";

export type TransportProtocol =
  | "ITCH_TCP"
  | "FAST_FIX"
  | "REST_JSON"
  | "SFTP_CSV"
  | "WEBSOCKET_JSON"
  | "SQL_MIRROR";

export type FreshnessStatus = "HEALTHY" | "DEGRADED" | "CRITICAL" | "OFFLINE";

export interface DataSource {
  id: string;
  name: string;
  code: string; // e.g. "CME_DIRECT", "ICE_REF", "EUREX_FEED", "BLOOMBERG_BPIPE", "IDS_REF_MASTER"
  type: SourceType;
  exchange: "CME" | "ICE" | "EUREX" | "MULTI" | "INTERNAL";
  protocol: TransportProtocol;
  endpoint: string;
  expectedCadenceMs: number;
  lastIngestTimestamp: string;
  currentFreshness: FreshnessStatus;
  slaUptimePercent: number;
  reliabilityScore: number; // 0-100
  activeSchemaVersion: string;
  upstreamProvider: string;
  description: string;
  activeContractsCount: number;
}

// ============================================================================
// 2. CANONICAL INSTRUMENT MODEL
// ============================================================================

export type AssetClass = "COMMODITY" | "EQUITY_INDEX" | "INTEREST_RATE" | "FX" | "ENERGY" | "METALS";
export type ExchangeCode = "CME" | "ICE" | "EUREX" | "CBOT" | "NYMEX";

export interface ContractSpecification {
  contractSize: number;
  contractUnit: string;
  currency: string;
  tickSize: number;
  tickValue: number;
  settlementMethod: "PHYSICAL" | "CASH" | "AUCTION";
  tradingHours: string;
  priceQuotation: string;
  dailyPriceLimit?: string;
  initialMarginApproxUSD?: number;
  firstNoticeDate?: string;
  lastTradingDate: string;
}

export interface CanonicalInstrument {
  id: string; // e.g. "CME_ES_202612"
  symbol: string; // "ESZ6"
  rootSymbol: string; // "ES"
  name: string; // "E-mini S&P 500 Futures"
  exchange: ExchangeCode;
  assetClass: AssetClass;
  isin?: string;
  ric?: string;
  bloombergTicker?: string;
  specs: ContractSpecification;
  lastSettlementPrice: number;
  settlementDate: string;
  openInterest: number;
  volume24h: number;
  updatedAt: string;
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED";
}

// Multi-source raw payload record for a given instrument
export interface SourcePayloadRecord {
  sourceId: string;
  sourceCode: string;
  sourceName: string;
  timestamp: string;
  symbol: string;
  fields: Record<string, string | number | boolean | null>;
  rawSnippet?: string;
}

// ============================================================================
// 3. DATA QUALITY ENGINE
// ============================================================================

export type QualityRuleCategory =
  | "COMPLETENESS"
  | "VALIDITY"
  | "CONSISTENCY"
  | "TIMELINESS"
  | "UNIQUENESS"
  | "REFERENTIAL_INTEGRITY"
  | "BUSINESS_RULE"
  | "SCHEMA";

export type SeverityLevel = "PASS" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface QualityRule {
  id: string;
  name: string;
  category: QualityRuleCategory;
  description: string;
  targetField: string;
  targetEntity: "INSTRUMENT" | "TICK" | "SETTLEMENT" | "SCHEMA" | "FEED";
  severityOnFailure: SeverityLevel;
  expression: string;
  evaluatorFnKey: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  category: QualityRuleCategory;
  targetEntityId: string;
  symbol: string;
  targetField: string;
  severity: SeverityLevel;
  passed: boolean;
  actualValue: string | number | boolean | null | undefined;
  expectedValue: string;
  message: string;
  remediationHint: string;
  evaluatedAt: string;
}

export interface DimensionScore {
  category: QualityRuleCategory;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  scorePercent: number;
  status: "EXCELLENT" | "DEGRADED" | "FAILING";
}

export interface QualityScorecard {
  overallScore: number; // 0 - 100
  totalRulesEvaluated: number;
  totalEvaluations: number;
  passedCount: number;
  passedEvaluations: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  categoryScores?: Record<string, number>;
  dimensionScores: Record<QualityRuleCategory, DimensionScore>;
  generatedAt: string;
}

// ============================================================================
// 4. CROSS-SOURCE RECONCILIATION
// ============================================================================

export type ReconciliationStatus = "MATCH" | "WITHIN_TOLERANCE" | "WARNING" | "MISMATCH" | "MISSING_SOURCE";

export interface FieldReconciliation {
  field: string;
  displayName: string;
  goldenSourceValue: string | number | null;
  goldenSourceCode: string;
  secondaryValues: Array<{
    sourceCode: string;
    value: string | number | null;
    status: ReconciliationStatus;
    delta?: string | number;
    deltaPercent?: number;
  }>;
  status: ReconciliationStatus;
  severity: SeverityLevel;
  toleranceRule?: string;
  explanation: string;
}

export interface EntityReconciliationReport {
  entityId: string;
  symbol: string;
  name: string;
  exchange: ExchangeCode;
  evaluatedAt: string;
  overallStatus: ReconciliationStatus;
  fields: FieldReconciliation[];
  sourcesCompared: string[];
  mismatchCount: number;
  warningCount: number;
}

// ============================================================================
// 5. SCHEMA DRIFT ENGINE
// ============================================================================

export type FieldDataType = "STRING" | "NUMBER" | "DECIMAL" | "TIMESTAMP" | "DATE" | "BOOLEAN" | "ENUM" | "ARRAY";

export interface SchemaField {
  name: string;
  type: FieldDataType;
  required: boolean;
  precision?: number;
  description: string;
  enumValues?: string[];
  deprecated?: boolean;
}

export interface SchemaDefinition {
  id: string;
  sourceCode: string;
  version: string;
  publishedDate: string;
  fields: SchemaField[];
}

export type FieldChangeType =
  | "ADDED_REQUIRED"
  | "ADDED_OPTIONAL"
  | "REMOVED"
  | "TYPE_CHANGED"
  | "PRECISION_CHANGED"
  | "ENUM_EXPANDED"
  | "ENUM_CONTRACTED"
  | "REQUIREDNESS_TIGHTENED"
  | "REQUIREDNESS_RELAXED"
  | "RENAMED"
  | "UNCHANGED";

export type CompatibilityClassification = "NON_BREAKING" | "POTENTIALLY_BREAKING" | "BREAKING_CHANGE";

export interface SchemaFieldDiff {
  fieldName: string;
  changeType: FieldChangeType;
  oldField?: SchemaField;
  newField?: SchemaField;
  compatibility: CompatibilityClassification;
  impactExplanation: string;
  affectedConsumers: string[];
}

export interface SchemaDriftReport {
  sourceCode: string;
  sourceName: string;
  baseVersion: string;
  targetVersion: string;
  detectedAt: string;
  overallCompatibility: CompatibilityClassification;
  compatibilityScore: CompatibilityClassification;
  diffs: SchemaFieldDiff[];
  mutations: SchemaFieldDiff[];
  breakingCount: number;
  nonBreakingCount: number;
  breakingChangesCount: number;
  affectedConsumers: string[];
  recommendedAction: string;
}

// ============================================================================
// 6. TEMPORAL CHANGE ENGINE & SNAPSHOT DIFFING
// ============================================================================

export type RecordChangeType = "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED";

export interface FieldTemporalDelta {
  fieldName: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  deltaPercent?: number;
  isSignificant: boolean;
}

export interface RecordTemporalDelta {
  entityId: string;
  symbol: string;
  changeType: RecordChangeType;
  fieldDeltas: FieldTemporalDelta[];
}

export interface SnapshotMetadata {
  id: string;
  timestamp: string;
  label: string; // e.g. "SOD Ingest", "Intraday Mark 14:00", "EOD Settlement"
  sourceCode: string;
  recordCount: number;
  overallQualityScore: number;
  schemaVersion: string;
  checksum: string;
}

export interface SnapshotDiffReport {
  snapshotAId: string;
  snapshotBId: string;
  timestampA: string;
  timestampB: string;
  sourceCode: string;
  totalRecordsA: number;
  totalRecordsB: number;
  addedRecords: number;
  addedRecordsCount: number;
  removedRecords: number;
  removedRecordsCount: number;
  modifiedRecords: number;
  modifiedRecordsCount: number;
  unchangedRecords: number;
  recordDeltas: RecordTemporalDelta[];
  recordDiffs: RecordTemporalDelta[];
  qualityScoreDrift: number;
  qualityScoreDelta: number;
  baseQualityScore: number;
  targetQualityScore: number;
}

// ============================================================================
// 7. LINEAGE & IMPACT GRAPH
// ============================================================================

export type LineageNodeType =
  | "SOURCE_FEED"
  | "INGESTION_CONNECTOR"
  | "NORMALIZATION_PIPELINE"
  | "REFERENCE_MASTER"
  | "VALIDATION_SUITE"
  | "DISTRIBUTION_BUS"
  | "DOWNSTREAM_MARGIN"
  | "DOWNSTREAM_RISK"
  | "DOWNSTREAM_SETTLEMENT"
  | "DOWNSTREAM_REGULATORY"
  | "DOWNSTREAM_ORDER_ROUTING";

export interface LineageNode {
  id: string;
  label: string;
  name?: string;
  sublabel: string;
  type: LineageNodeType;
  owner: string;
  slaMs: number;
  health: "HEALTHY" | "DEGRADED" | "CRITICAL";
  latencyMs: number;
  throughputPerSec: number;
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  volumePerHour: string;
  isImpacted?: boolean;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface ImpactedConsumerSystem {
  nodeId: string;
  consumerId?: string;
  systemName: string;
  name?: string;
  riskTier: "TIER_1_CRITICAL" | "TIER_2_SIGNIFICANT" | "TIER_3_OPERATIONAL";
  criticalityTier?: string;
  consumerType?: string;
  potentialConsequence: string;
  requiredAction: string;
  suggestedAction?: string;
}

export interface DownstreamImpactAnalysis {
  triggerEntityId: string;
  triggerEntityType: "SOURCE" | "INSTRUMENT" | "FIELD_MISMATCH" | "SCHEMA_DRIFT";
  impactSeverity: SeverityLevel;
  impactedNodeIds: string[];
  impactedConsumers: ImpactedConsumerSystem[];
  affectedConsumers?: ImpactedConsumerSystem[];
  blastRadiusScore: number; // 0 - 100
}

// ============================================================================
// 8. INCIDENT & AUDIT ENGINE
// ============================================================================

export type IncidentSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "ERROR" | "WARNING" | "INFO" | "PASS";
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";
export type IncidentCategory =
  | "DATA_DISCREPANCY"
  | "SCHEMA_BREAK"
  | "FEED_LATENCY"
  | "VALIDATION_FAILURE"
  | "SETTLEMENT_ANOMALY"
  | "REFERENCE_DRIFT"
  | "RECONCILIATION_MISMATCH"
  | "SCHEMA_DRIFT"
  | "QUALITY_RULE_FAILURE"
  | "FEED_TIMELINESS_STALE";

export type ActorType =
  | "QUALITY_ENGINE"
  | "RECON_ENGINE"
  | "SCHEMA_ENGINE"
  | "OPERATIONS_USER"
  | "SYSTEM_SLA"
  | "SYSTEM";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: ActorType;
  actorName: string;
  action: string;
  details: string;
  previousState?: string;
  newState?: string;
}

export interface Incident {
  id: string;
  ticketNumber: string; // e.g. "INC-2026-0941"
  title: string;
  summary: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  affectedSource: string;
  affectedSymbols: string[];
  affectedFields?: string[];
  detectedAt: string;
  assignedTeam?: string;
  slaDeadline?: string;
  blastRadius?: string;
  blastRadiusScore?: number;
  rootCauseAnalysis?: string;
  suggestedMitigation?: string;
  affectedConsumers?: string[];
  auditTrail: AuditLogEntry[];
  mitigationSteps?: string[];
  resolvedAt?: string;
  resolutionSummary?: string;
}

// ============================================================================
// 9. REPLAY / PIPELINE INVESTIGATION MODE
// ============================================================================

export interface ReplayPipelineStage {
  stageIndex?: number;
  stageId?: string;
  stageName: string;
  sequenceNumber?: number;
  status: "SUCCESS" | "WARNING" | "FAILURE" | "FAILED";
  timestamp: string;
  latencyMs?: number;
  details?: string;
  outputSummary?: string;
  inputPayloadSummary?: string;
  outputPayloadSummary?: string;
  keyAssertions?: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
  inspectorData?: Record<string, unknown>;
}

export interface PipelineReplayScenario {
  id: string;
  title: string;
  name?: string;
  description: string;
  symbol?: string;
  sourceCode?: string;
  triggerEntityId?: string;
  triggerSourceCode?: string;
  incidentRef?: string;
  stages: ReplayPipelineStage[];
}

export type ReplayScenario = PipelineReplayScenario;

// ============================================================================
// 10. CONTROL TOWER VIEW STATE
// ============================================================================

export type ControlPlaneSubsystemTab =
  | "CONTROL_TOWER"
  | "SOURCE_REGISTRY"
  | "QUALITY_RULES"
  | "RECONCILIATION"
  | "SCHEMA_DRIFT"
  | "TEMPORAL_HISTORY"
  | "LINEAGE_GRAPH"
  | "INCIDENT_MANAGER"
  | "REPLAY_INVESTIGATION"
  | "DATA_EXPLORER";

export interface ControlTowerKPIs {
  overallHealthScore: number;
  totalActiveSources: number;
  healthySourcesCount: number;
  degradedSourcesCount: number;
  totalActiveInstruments: number;
  totalRulesEvaluated24h: number;
  qualityPassRatePercent: number;
  crossSourceDiscrepanciesCount: number;
  schemaDriftEventsCount: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  slaCompliancePercent: number;
}
