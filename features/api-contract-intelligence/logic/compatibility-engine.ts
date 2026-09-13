/**
 * API Contract Intelligence — Compatibility Classification Engine
 * Maps each ContractChange to a CompatibilityFinding with an explicit rule ID,
 * compatibility class, severity, and migration hint.
 *
 * Rule ID format: COMPAT-{LOCATION}-{NNN}
 * Locations: REQ (request), RESP (response), PARAM (parameters), EP (endpoint)
 *
 * Pure function: same inputs → same output.
 */

import {
  ChangeKind,
  ChangeLocation,
  CompatibilityClass,
  CompatibilityFinding,
  CompatibilityReport,
  ContractChange,
  ContractDiff,
  SeverityLevel,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Rule table
// Each rule maps (location, kind) → { id, title, compatibility, severity, rationale, migrationHint }
// ─────────────────────────────────────────────────────────────────────────────

interface CompatRule {
  id: string;
  title: string;
  compatibility: CompatibilityClass;
  severity: SeverityLevel;
  rationale: string;
  migrationHint?: string;
}

// Request-side rules: strict — anything that requires senders to change is BREAKING
const REQUEST_RULES: Partial<Record<ChangeKind, CompatRule>> = {
  FIELD_REMOVED: {
    id: "COMPAT-REQ-001",
    title: "Required or optional request field removed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Removing a request field may cause servers to reject existing clients that continue to send it, or break server-side logic that depended on the field.",
    migrationHint: "Deprecate the field first; add a migration period before removal. Existing clients that send the field will need code changes.",
  },
  FIELD_ADDED: {
    id: "COMPAT-REQ-002",
    title: "Optional request field added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding an optional request field does not break existing clients. Clients that do not send the field continue to work.",
    migrationHint: "No action required for existing clients.",
  },
  REQUIREDNESS_ADDED: {
    id: "COMPAT-REQ-003",
    title: "Request field became required",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Existing clients that do not send this field will now receive validation errors. All callers must be updated before this change is deployed.",
    migrationHint: "Audit all consumers. Add the field with a default or make it conditionally required before enforcing.",
  },
  REQUIREDNESS_REMOVED: {
    id: "COMPAT-REQ-004",
    title: "Request field changed from required to optional",
    compatibility: "NON_BREAKING",
    severity: "LOW",
    rationale: "Relaxing field requiredness is backward-compatible; existing clients that always send the field are unaffected.",
  },
  TYPE_CHANGED: {
    id: "COMPAT-REQ-005",
    title: "Request field type changed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Changing the type of a request field will cause existing clients sending the old type to fail validation.",
    migrationHint: "Introduce a new field name alongside the old one if a transition period is needed. Version the endpoint.",
  },
  ENUM_VALUE_REMOVED: {
    id: "COMPAT-REQ-006",
    title: "Request enum value removed",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients sending the removed enum value will now receive validation errors.",
    migrationHint: "Keep old enum values alive for a full deprecation cycle. Log usage before removing.",
  },
  ENUM_VALUE_ADDED: {
    id: "COMPAT-REQ-007",
    title: "Request enum value added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding enum values on the request side allows clients to send more values; existing clients sending valid values are unaffected.",
  },
  NULLABLE_ADDED: {
    id: "COMPAT-REQ-008",
    title: "Request field became nullable",
    compatibility: "NON_BREAKING",
    severity: "LOW",
    rationale: "Relaxing nullability on the request side (now accepting null) is backward-compatible for clients that continue to send non-null values.",
  },
  NULLABLE_REMOVED: {
    id: "COMPAT-REQ-009",
    title: "Request field no longer accepts null",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients that send null for this field will now receive validation errors.",
    migrationHint: "Identify clients that send null and update them before enforcing this constraint.",
  },
  FORMAT_CHANGED: {
    id: "COMPAT-REQ-010",
    title: "Request field format changed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Format changes on request fields may cause strict parsers on the server side to reject previously-valid inputs.",
    migrationHint: "Validate that the new format is a strict superset of the old, or coordinate a migration window.",
  },
  CONSTRAINT_ADDED: {
    id: "COMPAT-REQ-011",
    title: "Request field validation constraints added or tightened",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Tightening validation constraints on request fields means payloads that were previously accepted may now be rejected.",
    migrationHint: "Audit existing traffic for values that would violate the new constraint before enforcing.",
  },
  CONSTRAINT_REMOVED: {
    id: "COMPAT-REQ-012",
    title: "Request field validation constraints relaxed",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Relaxing constraints is backward-compatible; previously-valid inputs remain valid.",
  },
  DEFAULT_ADDED: {
    id: "COMPAT-REQ-013",
    title: "Request field default value added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding a default value for an optional field does not break clients; omitting the field now has a defined behavior.",
  },
  DEFAULT_REMOVED: {
    id: "COMPAT-REQ-014",
    title: "Request field default value removed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Clients that rely on the server applying the default for omitted fields may see different behavior.",
    migrationHint: "Check whether any clients omit this field and depend on the default being applied server-side.",
  },
  DEFAULT_CHANGED: {
    id: "COMPAT-REQ-015",
    title: "Request field default value changed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Clients that omit this field may experience different server-side behavior due to the changed default.",
    migrationHint: "Document the change and confirm no consumers silently depend on the previous default.",
  },
  DEPRECATION_ADDED: {
    id: "COMPAT-REQ-016",
    title: "Request field deprecated",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The field is marked deprecated but remains functional. Consumers should migrate away from it.",
    migrationHint: "Plan removal for a future major version. Notify consumers via changelog.",
  },
  DEPRECATION_REMOVED: {
    id: "COMPAT-REQ-017",
    title: "Request field deprecation lifted",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The deprecation notice was withdrawn; the field is now a first-class part of the contract.",
  },
};

// Response-side rules: lenient — anything that breaks existing parsers is BREAKING
const RESPONSE_RULES: Partial<Record<ChangeKind, CompatRule>> = {
  FIELD_REMOVED: {
    id: "COMPAT-RESP-001",
    title: "Response field removed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Existing clients that read this field will experience null-pointer errors, missing data, or silent failures when the field is absent.",
    migrationHint: "Keep the field present (possibly empty) for a full deprecation period. Coordinate removal with all consumers.",
  },
  FIELD_ADDED: {
    id: "COMPAT-RESP-002",
    title: "New field added to response",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Additive change: strict parsers may warn on unknown fields but should not break. LENIENT consumers handle this transparently.",
    migrationHint: "STRICT or VERSION_LOCKED consumers should review the new field and update their schema expectations.",
  },
  REQUIREDNESS_ADDED: {
    id: "COMPAT-RESP-003",
    title: "Response field marked as always-present (required)",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Guaranteeing a field is always present is a contract strengthening; existing clients that handle the field continue to work.",
  },
  REQUIREDNESS_REMOVED: {
    id: "COMPAT-RESP-004",
    title: "Response field may now be absent (optional)",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "HIGH",
    rationale: "Clients that assumed the field was always present may crash when it is absent. Null-safety checks are needed.",
    migrationHint: "Audit consumers for unguarded field access. Add null/undefined guards before this change ships.",
  },
  TYPE_CHANGED: {
    id: "COMPAT-RESP-005",
    title: "Response field type changed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Clients that read this field and assume the original type will fail to parse, cast incorrectly, or throw runtime errors.",
    migrationHint: "Introduce a new field with the new type alongside the old one. Deprecate the old field and remove after a migration window.",
  },
  ENUM_VALUE_REMOVED: {
    id: "COMPAT-RESP-006",
    title: "Response enum value removed",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients with exhaustive enum switches will have a dead branch, but more critically, if this value was in production data clients may have cached it. New responses will not contain it, but the client's persistence layer may.",
    migrationHint: "Ensure clients handle unknown enum values gracefully before removing.",
  },
  ENUM_VALUE_ADDED: {
    id: "COMPAT-RESP-007",
    title: "Response enum value added",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Clients with exhaustive enum switches (switch/match without a default) will fail to handle the new value. LENIENT clients typically fall through to a default case.",
    migrationHint: "Ensure all consumers have a default/fallback case in their enum handling before deploying.",
  },
  NULLABLE_ADDED: {
    id: "COMPAT-RESP-008",
    title: "Response field now nullable",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "HIGH",
    rationale: "Clients that read this field without null-checking will encounter null-pointer errors when the server sends null.",
    migrationHint: "Add null guard at all consumer read sites before this change ships.",
  },
  NULLABLE_REMOVED: {
    id: "COMPAT-RESP-009",
    title: "Response field no longer nullable",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Removing nullability tightens the server guarantee; existing clients that handle null will still work correctly.",
  },
  FORMAT_CHANGED: {
    id: "COMPAT-RESP-010",
    title: "Response field format changed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Clients that parse the field with format-specific logic (e.g. date parsing, decimal precision) may fail when the format changes.",
    migrationHint: "Audit consumers for format-specific parsing. Test with the new format before shipping.",
  },
  CONSTRAINT_ADDED: {
    id: "COMPAT-RESP-011",
    title: "Response field constraints added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding constraints to a response field documents server guarantees; clients can rely on tighter invariants.",
  },
  CONSTRAINT_REMOVED: {
    id: "COMPAT-RESP-012",
    title: "Response field constraints relaxed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "LOW",
    rationale: "Clients that relied on the constraint as an invariant may encounter values outside the previously-guaranteed range.",
    migrationHint: "Check whether any consumer depends on the constraint as a documented guarantee.",
  },
  DEFAULT_ADDED: {
    id: "COMPAT-RESP-013",
    title: "Response field default value added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Documenting a server-side default for absent fields is a contract clarification; no client behavior changes.",
  },
  DEFAULT_REMOVED: {
    id: "COMPAT-RESP-014",
    title: "Response field default value removed",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The field may now be absent where it was previously substituted with a default. Assess whether consumers depend on it.",
  },
  DEFAULT_CHANGED: {
    id: "COMPAT-RESP-015",
    title: "Response field default value changed",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "LOW",
    rationale: "Consumers that depend on the specific default value may see different behavior.",
    migrationHint: "Document the change and verify no consumer asserts on the specific default value.",
  },
  DEPRECATION_ADDED: {
    id: "COMPAT-RESP-016",
    title: "Response field deprecated",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The field is marked deprecated but still present. Consumers should begin migration away from it.",
    migrationHint: "Plan to stop reading this field and use any replacement before the next major version.",
  },
  DEPRECATION_REMOVED: {
    id: "COMPAT-RESP-017",
    title: "Response field deprecation lifted",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The field is a permanent part of the contract again.",
  },
  RESPONSE_CODE_REMOVED: {
    id: "COMPAT-RESP-018",
    title: "HTTP response code removed",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients that handle this status code specifically will hit unhandled branches. Removing a previously-documented code breaks error-handling contracts.",
    migrationHint: "Ensure clients have a generic fallback handler before removing documented response codes.",
  },
  RESPONSE_CODE_ADDED: {
    id: "COMPAT-RESP-019",
    title: "New HTTP response code added",
    compatibility: "POTENTIALLY_BREAKING",
    severity: "MEDIUM",
    rationale: "Clients with exhaustive status-code handling may not handle the new code. Lenient clients with a generic error handler are unaffected.",
    migrationHint: "Ensure consumers handle unexpected status codes gracefully.",
  },
};

// Parameter-side rules
const PARAM_RULES: Partial<Record<ChangeKind, CompatRule>> = {
  PARAMETER_REMOVED: {
    id: "COMPAT-PARAM-001",
    title: "API parameter removed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Clients that send the now-removed parameter will have it silently ignored or receive an error, depending on the server's unknown-param policy.",
    migrationHint: "Deprecate before removal. Check server unknown-param behavior (strict vs. permissive).",
  },
  PARAMETER_ADDED: {
    id: "COMPAT-PARAM-002",
    title: "New optional parameter added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding an optional parameter does not break existing clients that do not send it.",
  },
  REQUIREDNESS_ADDED: {
    id: "COMPAT-PARAM-003",
    title: "Parameter became required",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "Clients that do not send this parameter will now fail with a validation error.",
    migrationHint: "All call sites must be updated to include the parameter before this change ships.",
  },
  TYPE_CHANGED: {
    id: "COMPAT-PARAM-004",
    title: "Parameter type changed",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients sending the parameter in the old type will fail validation.",
    migrationHint: "Coordinate type change across all consumers simultaneously.",
  },
  ENUM_VALUE_REMOVED: {
    id: "COMPAT-PARAM-005",
    title: "Parameter enum value removed",
    compatibility: "BREAKING",
    severity: "HIGH",
    rationale: "Clients sending the removed enum value will receive validation errors.",
    migrationHint: "Log usage of the value before removal. Notify all consumers.",
  },
  ENUM_VALUE_ADDED: {
    id: "COMPAT-PARAM-006",
    title: "Parameter enum value added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "New parameter values are available; existing clients using valid values are unaffected.",
  },
};

// Endpoint-level rules
const ENDPOINT_RULES: Partial<Record<ChangeKind, CompatRule>> = {
  ENDPOINT_REMOVED: {
    id: "COMPAT-EP-001",
    title: "API endpoint removed",
    compatibility: "BREAKING",
    severity: "CRITICAL",
    rationale: "All consumers of this endpoint will receive 404 or connection refused until they update. This is the most impactful class of breaking change.",
    migrationHint: "Deprecate the endpoint first (return Deprecation header, update docs). Set a sunset date. Provide a migration path before removal.",
  },
  ENDPOINT_ADDED: {
    id: "COMPAT-EP-002",
    title: "New API endpoint added",
    compatibility: "NON_BREAKING",
    severity: "INFO",
    rationale: "Adding new endpoints does not break existing consumers.",
  },
  DEPRECATION_ADDED: {
    id: "COMPAT-EP-003",
    title: "Endpoint marked deprecated",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "The endpoint still functions; consumers should begin planning migration.",
    migrationHint: "Reference the replacement endpoint and timeline in the deprecation notice.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Rule lookup
// ─────────────────────────────────────────────────────────────────────────────

function ruleFor(location: ChangeLocation, kind: ChangeKind): CompatRule | undefined {
  switch (location) {
    case "REQUEST":
      return REQUEST_RULES[kind];
    case "RESPONSE":
      // Endpoint-level changes live at RESPONSE location
      if (kind === "ENDPOINT_REMOVED" || kind === "ENDPOINT_ADDED" || kind === "DEPRECATION_ADDED") {
        return ENDPOINT_RULES[kind] ?? RESPONSE_RULES[kind];
      }
      return RESPONSE_RULES[kind];
    case "PATH_PARAM":
    case "QUERY_PARAM":
    case "HEADER":
      return PARAM_RULES[kind];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback for unmatched (ChangeKind, location) pairs
// ─────────────────────────────────────────────────────────────────────────────

function fallbackRule(kind: ChangeKind): CompatRule {
  // Conservative defaults
  const isAdded = kind.endsWith("_ADDED") || kind === "ENDPOINT_ADDED";
  const isRemoved = kind.endsWith("_REMOVED") || kind === "ENDPOINT_REMOVED";
  const isChanged = kind.endsWith("_CHANGED");

  if (isRemoved) {
    return {
      id: "COMPAT-GEN-001",
      title: "Element removed",
      compatibility: "BREAKING",
      severity: "HIGH",
      rationale: "Removing contract elements is generally a breaking change.",
    };
  }
  if (isAdded) {
    return {
      id: "COMPAT-GEN-002",
      title: "Element added",
      compatibility: "NON_BREAKING",
      severity: "INFO",
      rationale: "Additive changes are generally backward-compatible.",
    };
  }
  if (isChanged) {
    return {
      id: "COMPAT-GEN-003",
      title: "Element changed",
      compatibility: "POTENTIALLY_BREAKING",
      severity: "MEDIUM",
      rationale: "Changes to existing contract elements may break consumers depending on the specifics.",
    };
  }
  return {
    id: "COMPAT-GEN-004",
    title: "Contract change",
    compatibility: "INFORMATIONAL",
    severity: "INFO",
    rationale: "A contract element was modified. Review for consumer impact.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall compatibility from findings
// ─────────────────────────────────────────────────────────────────────────────

function overallCompatibility(findings: readonly CompatibilityFinding[]): CompatibilityClass {
  if (findings.some((f) => f.compatibility === "BREAKING")) return "BREAKING";
  if (findings.some((f) => f.compatibility === "POTENTIALLY_BREAKING")) return "POTENTIALLY_BREAKING";
  if (findings.some((f) => f.compatibility === "NON_BREAKING")) return "NON_BREAKING";
  return "INFORMATIONAL";
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function classifyCompatibility(diff: ContractDiff): CompatibilityReport {
  const findings: CompatibilityFinding[] = diff.changes.map((change): CompatibilityFinding => {
    const rule = ruleFor(change.location, change.kind) ?? fallbackRule(change.kind);

    return {
      changeId: change.id,
      ruleId: rule.id,
      ruleTitle: rule.title,
      compatibility: rule.compatibility,
      severity: rule.severity,
      endpointId: change.endpointId,
      location: change.location,
      description: change.description,
      rationale: rule.rationale,
      migrationHint: rule.migrationHint,
    };
  });

  const breakingCount = findings.filter((f) => f.compatibility === "BREAKING").length;
  const potentiallyBreakingCount = findings.filter((f) => f.compatibility === "POTENTIALLY_BREAKING").length;
  const nonBreakingCount = findings.filter((f) => f.compatibility === "NON_BREAKING").length;

  return {
    apiId: diff.apiId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    findings,
    breakingCount,
    potentiallyBreakingCount,
    nonBreakingCount,
    overallCompatibility: overallCompatibility(findings),
  };
}
