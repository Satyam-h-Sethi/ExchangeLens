/**
 * API Contract Intelligence — Full Domain Type System
 * All types are immutable value objects; no classes, no side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitive Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export type CompatibilityClass =
  | "BREAKING"
  | "POTENTIALLY_BREAKING"
  | "NON_BREAKING"
  | "INFORMATIONAL";

export type ChangeKind =
  | "ENDPOINT_ADDED"
  | "ENDPOINT_REMOVED"
  | "FIELD_ADDED"
  | "FIELD_REMOVED"
  | "TYPE_CHANGED"
  | "REQUIREDNESS_ADDED"    // field became required
  | "REQUIREDNESS_REMOVED"  // field became optional
  | "NULLABLE_ADDED"        // field became nullable
  | "NULLABLE_REMOVED"      // null removed (stricter)
  | "ENUM_VALUE_ADDED"
  | "ENUM_VALUE_REMOVED"
  | "FORMAT_CHANGED"
  | "CONSTRAINT_ADDED"
  | "CONSTRAINT_REMOVED"
  | "DEFAULT_CHANGED"
  | "DEFAULT_ADDED"
  | "DEFAULT_REMOVED"
  | "PARAMETER_ADDED"
  | "PARAMETER_REMOVED"
  | "RESPONSE_CODE_ADDED"
  | "RESPONSE_CODE_REMOVED"
  | "DESCRIPTION_CHANGED"
  | "DEPRECATION_ADDED"
  | "DEPRECATION_REMOVED";

export type ChangeLocation = "REQUEST" | "RESPONSE" | "PATH_PARAM" | "QUERY_PARAM" | "HEADER";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type ImpactLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type ReleaseDecision = "ALLOW" | "WARN" | "BLOCK";

export type TestOutcome = "PASS" | "FAIL" | "WARNING";

export type TestScenarioKind =
  | "VALID_REQUEST"
  | "MISSING_REQUIRED_FIELD"
  | "WRONG_TYPE"
  | "NULL_VALUE"
  | "INVALID_ENUM"
  | "OUT_OF_RANGE"
  | "LEGACY_CLIENT_NEW_API"
  | "NEW_CLIENT_OLD_API"
  | "EXTRA_UNKNOWN_FIELD";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type FieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null"
  | "date"
  | "datetime"
  | "uuid"
  | "decimal"
  | "enum";

export type ApiDomain =
  | "MARKET_DATA"
  | "REFERENCE_DATA"
  | "SETTLEMENT"
  | "RISK";

export type ConsumerToleranceBehavior =
  | "STRICT"          // any field change breaks the consumer
  | "LENIENT"         // consumer ignores unknown fields
  | "VERSION_LOCKED"; // consumer pins to a specific version

// ─────────────────────────────────────────────────────────────────────────────
// Schema Field & Parameter Models
// ─────────────────────────────────────────────────────────────────────────────

export interface FieldConstraints {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly minItems?: number;
  readonly maxItems?: number;
}

export interface ApiField {
  readonly name: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly nullable: boolean;
  readonly description?: string;
  readonly format?: string;               // e.g. "date-time", "decimal128"
  readonly enumValues?: readonly string[];
  readonly defaultValue?: unknown;
  readonly deprecated?: boolean;
  readonly constraints?: FieldConstraints;
  readonly items?: ApiField;              // for array types
  readonly properties?: readonly ApiField[]; // for object types
}

export interface ApiParameter {
  readonly name: string;
  readonly in: "path" | "query" | "header";
  readonly required: boolean;
  readonly type: FieldType;
  readonly description?: string;
  readonly format?: string;
  readonly defaultValue?: unknown;
  readonly enumValues?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestSchema {
  readonly contentType: string;
  readonly fields: readonly ApiField[];
}

export interface ResponseSchema {
  readonly statusCode: number;
  readonly description: string;
  readonly contentType: string;
  readonly fields: readonly ApiField[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint Model
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiEndpoint {
  readonly id: string;                // stable id: "GET /instruments/{id}"
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
  readonly deprecated?: boolean;
  readonly parameters: readonly ApiParameter[];
  readonly requestSchema?: RequestSchema;
  readonly responses: readonly ResponseSchema[];
  readonly tags?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract Version
// ─────────────────────────────────────────────────────────────────────────────

export interface ContractVersion {
  readonly version: string;           // semver, e.g. "2.0.0"
  readonly publishedDate: string;     // ISO date
  readonly deprecated?: boolean;
  readonly sunsetDate?: string;        // ISO date
  readonly endpoints: readonly ApiEndpoint[];
  readonly changelogSummary?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Contract (top-level entity)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiContract {
  readonly id: string;
  readonly name: string;
  readonly domain: ApiDomain;
  readonly description: string;
  readonly owner: string;
  readonly baseUrl: string;
  readonly versions: readonly ContractVersion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Structural Diff (from contract-diff engine)
// ─────────────────────────────────────────────────────────────────────────────

export interface FieldPath {
  readonly endpointId: string;
  readonly location: ChangeLocation;
  readonly statusCode?: number;        // for response fields
  readonly fieldPath: string;          // e.g. "instrument.price.value"
}

export interface ContractChange {
  readonly id: string;                 // deterministic: hash of path+kind
  readonly kind: ChangeKind;
  readonly location: ChangeLocation;
  readonly endpointId: string;
  readonly fieldPath?: FieldPath;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
  readonly description: string;
}

export interface ContractDiff {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly apiId: string;
  readonly changes: readonly ContractChange[];
  readonly endpointsAdded: readonly string[];
  readonly endpointsRemoved: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility Finding (from compatibility engine)
// ─────────────────────────────────────────────────────────────────────────────

export interface CompatibilityFinding {
  readonly changeId: string;
  readonly ruleId: string;            // e.g. "COMPAT-RESP-003"
  readonly ruleTitle: string;
  readonly compatibility: CompatibilityClass;
  readonly severity: SeverityLevel;
  readonly endpointId: string;
  readonly location: ChangeLocation;
  readonly description: string;
  readonly rationale: string;         // why this classification
  readonly migrationHint?: string;
}

export interface CompatibilityReport {
  readonly apiId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly findings: readonly CompatibilityFinding[];
  readonly breakingCount: number;
  readonly potentiallyBreakingCount: number;
  readonly nonBreakingCount: number;
  readonly overallCompatibility: CompatibilityClass;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsumerEndpointDependency {
  readonly endpointId: string;
  readonly consumedFields: readonly string[];  // field paths it reads
  readonly writtenFields?: readonly string[];  // fields it writes (for POST/PUT)
  readonly criticalForOperation: boolean;
}

export interface ConsumerApiDependency {
  readonly apiId: string;
  readonly pinnedVersion: string;              // version the consumer currently uses
  readonly toleranceBehavior: ConsumerToleranceBehavior;
  readonly endpoints: readonly ConsumerEndpointDependency[];
}

export interface ApiConsumer {
  readonly id: string;
  readonly name: string;
  readonly team: string;
  readonly description: string;
  readonly dependencies: readonly ConsumerApiDependency[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Impact Analysis (from consumer-impact engine)
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsumerFieldImpact {
  readonly changeId: string;
  readonly fieldPath: string;
  readonly compatibility: CompatibilityClass;
  readonly detail: string;
}

export interface ConsumerApiImpact {
  readonly apiId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly impactLevel: ImpactLevel;
  readonly affectedEndpoints: readonly string[];
  readonly fieldImpacts: readonly ConsumerFieldImpact[];
  readonly riskSummary: string;
}

export interface ConsumerImpactReport {
  readonly consumerId: string;
  readonly consumerName: string;
  readonly apiImpacts: readonly ConsumerApiImpact[];
  readonly overallImpact: ImpactLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract Test Simulator
// ─────────────────────────────────────────────────────────────────────────────

export interface TestInput {
  readonly [field: string]: unknown;
}

export interface ContractTestCase {
  readonly id: string;
  readonly apiId: string;
  readonly endpointId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly scenario: TestScenarioKind;
  readonly description: string;
  readonly input: TestInput;
  readonly expectedOutcome: TestOutcome;
}

export interface ContractTestResult {
  readonly testCaseId: string;
  readonly scenario: TestScenarioKind;
  readonly description: string;
  readonly outcome: TestOutcome;
  readonly actualOutcome: TestOutcome;
  readonly passed: boolean;
  readonly detail: string;
  readonly affectedField?: string;
  readonly ruleViolated?: string;
}

export interface ContractTestSuiteResult {
  readonly apiId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly warningTests: number;
  readonly results: readonly ContractTestResult[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration Plan
// ─────────────────────────────────────────────────────────────────────────────

export type MigrationEffort = "XS" | "S" | "M" | "L" | "XL";

export type MigrationActionKind =
  | "UPDATE_FIELD_TYPE"
  | "ADD_REQUIRED_FIELD"
  | "REMOVE_FIELD_REFERENCE"
  | "UPDATE_ENUM_HANDLING"
  | "UPDATE_ENDPOINT_PATH"
  | "ADD_NULL_GUARD"
  | "UPDATE_VERSION_HEADER"
  | "REMAP_RESPONSE_CODE"
  | "ADD_FALLBACK_DEFAULT"
  | "DEPRECATION_NOTICE";

export interface MigrationAction {
  readonly id: string;
  readonly kind: MigrationActionKind;
  readonly priority: 1 | 2 | 3 | 4;
  readonly endpointId: string;
  readonly fieldPath?: string;
  readonly description: string;
  readonly estimatedEffort: MigrationEffort;
  readonly automatable: boolean;
  readonly automationHint?: string;
  readonly codeSnippet?: string;
}

export interface ConsumerMigrationPlan {
  readonly consumerId: string;
  readonly consumerName: string;
  readonly apiId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly actions: readonly MigrationAction[];
  readonly estimatedTotalEffort: MigrationEffort;
  readonly blockedBy?: readonly string[]; // changeIds that block release
}

// ─────────────────────────────────────────────────────────────────────────────
// Release Gate
// ─────────────────────────────────────────────────────────────────────────────

export interface ReleaseGateRule {
  readonly id: string;
  readonly description: string;
  readonly weight: number;           // 0–100
}

export interface ReleaseGateRuleEvaluation {
  readonly ruleId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly score: number;            // 0–100
  readonly detail: string;
}

export interface ReleaseGateResult {
  readonly apiId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly decision: ReleaseDecision;
  readonly riskScore: number;
  readonly breakingCount: number;
  readonly potentiallyBreakingCount: number;
  readonly affectedConsumerCount: number;
  readonly criticalConsumerCount: number;
  readonly blockingRuleIds: readonly string[];
  readonly narrative: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Version History & Timeline
// ─────────────────────────────────────────────────────────────────────────────

export interface VersionTransition {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly publishedDate: string;
  readonly breakingChanges: number;
  readonly nonBreakingChanges: number;
  readonly releaseDecision: ReleaseDecision;
  readonly changelogSummary: string;
}

export interface ApiVersionHistory {
  readonly apiId: string;
  readonly transitions: readonly VersionTransition[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail
// ─────────────────────────────────────────────────────────────────────────────

export type AuditActor =
  | "CONTRACT_ENGINE"
  | "COMPATIBILITY_ENGINE"
  | "RELEASE_GATE"
  | "CONSUMER_IMPACT_ENGINE"
  | "TEST_RUNNER"
  | "MIGRATION_PLANNER";

export interface AuditEvent {
  readonly id: string;
  readonly timestamp: string;         // ISO datetime
  readonly actor: AuditActor;
  readonly apiId: string;
  readonly fromVersion?: string;
  readonly toVersion?: string;
  readonly action: string;
  readonly detail: string;
  readonly severity: SeverityLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Navigation
// ─────────────────────────────────────────────────────────────────────────────

export type AciTab =
  | "OVERVIEW"
  | "CONTRACTS"
  | "COMPARE"
  | "COMPATIBILITY"
  | "CONSUMERS"
  | "CONTRACT_TESTS"
  | "RELEASE_GATE"
  | "HISTORY";
