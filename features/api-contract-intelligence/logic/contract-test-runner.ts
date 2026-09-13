/**
 * API Contract Intelligence — Deterministic Contract Test Runner
 * Simulates contract test scenarios without HTTP. Pure computation.
 *
 * For each (apiId, fromVersion, toVersion) pair, generates a fixed set of
 * test cases covering the key ChangeKinds detected by the diff engine, then
 * evaluates each deterministically.
 *
 * No randomness, no HTTP, no LLM — same inputs → same outputs.
 */

import {
  ApiContract,
  CompatibilityReport,
  ContractDiff,
  ContractTestCase,
  ContractTestResult,
  ContractTestSuiteResult,
  TestOutcome,
  TestScenarioKind,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Test case generation: derive scenarios from the diff
// ─────────────────────────────────────────────────────────────────────────────

interface TestSpec {
  scenario: TestScenarioKind;
  description: string;
  endpointId: string;
  input: Record<string, unknown>;
  expectedOutcome: TestOutcome;
}

function generateTestSpecs(diff: ContractDiff, compReport: CompatibilityReport): TestSpec[] {
  const specs: TestSpec[] = [];
  const seenEndpoints = new Set<string>();

  // Always include a baseline valid-request test for each affected endpoint
  const affectedEndpointIds = new Set<string>([
    ...diff.changes.map((c) => c.endpointId),
    ...diff.endpointsAdded,
    ...diff.endpointsRemoved,
  ]);

  for (const endpointId of Array.from(affectedEndpointIds)) {
    if (!seenEndpoints.has(endpointId)) {
      seenEndpoints.add(endpointId);
      specs.push({
        scenario: "VALID_REQUEST",
        description: `Valid request to ${endpointId} using target-version schema should succeed`,
        endpointId,
        input: { _scenario: "baseline", endpointId },
        expectedOutcome: "PASS",
      });
    }
  }

  // Generate scenario-specific tests from changes
  for (const change of diff.changes) {
    const finding = compReport.findings.find((f) => f.changeId === change.id);
    if (!finding) continue;

    switch (change.kind) {
      case "FIELD_REMOVED":
        // Old client that still sends the removed field
        specs.push({
          scenario: "EXTRA_UNKNOWN_FIELD",
          description: `Legacy client sends removed field "${change.fieldPath?.fieldPath}" — server must not crash`,
          endpointId: change.endpointId,
          input: { _removedField: change.fieldPath?.fieldPath ?? "unknown", _oldValue: change.oldValue },
          expectedOutcome: finding.compatibility === "BREAKING" ? "FAIL" : "WARNING",
        });
        break;

      case "REQUIREDNESS_ADDED":
        // Client that omits the now-required field
        specs.push({
          scenario: "MISSING_REQUIRED_FIELD",
          description: `Client omits "${change.fieldPath?.fieldPath}" which became required — should receive 422`,
          endpointId: change.endpointId,
          input: { _missingField: change.fieldPath?.fieldPath ?? "unknown" },
          expectedOutcome: "FAIL",
        });
        break;

      case "TYPE_CHANGED":
        // Client sends old type
        specs.push({
          scenario: "WRONG_TYPE",
          description: `Client sends "${change.fieldPath?.fieldPath}" as ${String(change.oldValue)} (was valid, now wrong type ${String(change.newValue)})`,
          endpointId: change.endpointId,
          input: {
            _field: change.fieldPath?.fieldPath ?? "unknown",
            _oldType: change.oldValue,
            _newType: change.newValue,
          },
          expectedOutcome: "FAIL",
        });
        break;

      case "NULLABLE_ADDED":
        // Client sends null — new behavior
        if (change.location === "RESPONSE") {
          specs.push({
            scenario: "NULL_VALUE",
            description: `Server returns null for "${change.fieldPath?.fieldPath}" — client must handle gracefully`,
            endpointId: change.endpointId,
            input: { _nullableField: change.fieldPath?.fieldPath ?? "unknown" },
            expectedOutcome: finding.compatibility === "BREAKING" ? "FAIL" : "WARNING",
          });
        }
        break;

      case "ENUM_VALUE_REMOVED":
        // Client sends removed enum value
        specs.push({
          scenario: "INVALID_ENUM",
          description: `Client sends removed enum value for "${change.fieldPath?.fieldPath}" — should receive 422`,
          endpointId: change.endpointId,
          input: {
            _field: change.fieldPath?.fieldPath ?? "unknown",
            _removedValues: change.oldValue,
          },
          expectedOutcome: "FAIL",
        });
        break;

      case "ENUM_VALUE_ADDED":
        // Server returns new enum — old client may not handle
        if (change.location === "RESPONSE") {
          specs.push({
            scenario: "INVALID_ENUM",
            description: `Server returns new enum value for "${change.fieldPath?.fieldPath}" — legacy client may not handle`,
            endpointId: change.endpointId,
            input: {
              _field: change.fieldPath?.fieldPath ?? "unknown",
              _addedValues: change.newValue,
            },
            expectedOutcome: finding.compatibility === "POTENTIALLY_BREAKING" ? "WARNING" : "PASS",
          });
        }
        break;

      case "CONSTRAINT_ADDED":
        // Value that was valid before now fails new constraint
        specs.push({
          scenario: "OUT_OF_RANGE",
          description: `Value for "${change.fieldPath?.fieldPath}" valid in old version violates new constraint`,
          endpointId: change.endpointId,
          input: {
            _field: change.fieldPath?.fieldPath ?? "unknown",
            _newConstraints: change.newValue,
          },
          expectedOutcome: "FAIL",
        });
        break;

      case "ENDPOINT_REMOVED":
        // Old client calling removed endpoint
        specs.push({
          scenario: "LEGACY_CLIENT_NEW_API",
          description: `Legacy client calls removed endpoint "${change.endpointId}" — should receive 404`,
          endpointId: change.endpointId,
          input: { _endpoint: change.endpointId, _action: "call-removed" },
          expectedOutcome: "FAIL",
        });
        break;

      case "ENDPOINT_ADDED":
        // New client calling new endpoint — should work
        specs.push({
          scenario: "NEW_CLIENT_OLD_API",
          description: `New client calls new endpoint "${change.endpointId}" — succeeds on target version`,
          endpointId: change.endpointId,
          input: { _endpoint: change.endpointId, _action: "call-new" },
          expectedOutcome: "PASS",
        });
        break;

      case "PARAMETER_REMOVED":
        // Old client sends removed parameter
        specs.push({
          scenario: "EXTRA_UNKNOWN_FIELD",
          description: `Client sends removed parameter — behavior depends on server strictness`,
          endpointId: change.endpointId,
          input: { _removedParam: change.oldValue },
          expectedOutcome: "WARNING",
        });
        break;

      case "PARAMETER_ADDED":
        // New required param — old clients that don't send it
        if (change.newValue) {
          specs.push({
            scenario: "MISSING_REQUIRED_FIELD",
            description: `Legacy client omits new parameter — depends on whether parameter is required`,
            endpointId: change.endpointId,
            input: { _addedParam: change.newValue },
            expectedOutcome: finding.compatibility === "NON_BREAKING" ? "PASS" : "WARNING",
          });
        }
        break;

      default:
        break;
    }
  }

  return specs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic test ID
// ─────────────────────────────────────────────────────────────────────────────

function makeTestId(apiId: string, fromVersion: string, toVersion: string, index: number): string {
  const raw = `${apiId}::${fromVersion}::${toVersion}::${index}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
    h >>>= 0;
  }
  return `tc-${h.toString(16).padStart(8, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test result evaluation (deterministic — based on compatibility rules)
// ─────────────────────────────────────────────────────────────────────────────

function evaluateTestCase(tc: ContractTestCase, diff: ContractDiff): ContractTestResult {
  let outcome: TestOutcome;
  let detail: string;
  let affectedField: string | undefined;
  let ruleViolated: string | undefined;

  switch (tc.scenario) {
    case "VALID_REQUEST": {
      // A valid request on the target version always passes (by definition)
      outcome = "PASS";
      detail = "Target-version schema accepted the request payload. No validation errors.";
      break;
    }

    case "MISSING_REQUIRED_FIELD": {
      const fieldName = String((tc.input as Record<string, unknown>)._missingField ?? "unknown");
      affectedField = fieldName;
      ruleViolated = "COMPAT-REQ-003";

      // Check if this field appears in any REQUIREDNESS_ADDED change
      const relChange = diff.changes.find(
        (c) => c.kind === "REQUIREDNESS_ADDED" && c.endpointId === tc.endpointId &&
          (c.fieldPath?.fieldPath === fieldName || c.description.includes(fieldName))
      );

      if (relChange) {
        outcome = "FAIL";
        detail = `Server returned 422 Unprocessable Entity: required field "${fieldName}" was not provided.`;
      } else {
        outcome = "PASS";
        detail = `Field "${fieldName}" is optional in this version — omitting it succeeded.`;
        affectedField = undefined;
        ruleViolated = undefined;
      }
      break;
    }

    case "WRONG_TYPE": {
      const fieldName = String((tc.input as Record<string, unknown>)._field ?? "unknown");
      const oldType = (tc.input as Record<string, unknown>)._oldType;
      const newType = (tc.input as Record<string, unknown>)._newType;
      affectedField = fieldName;
      ruleViolated = "COMPAT-REQ-005";

      // TYPE_CHANGED in the diff means the old type is now invalid
      const typeChanged = diff.changes.find(
        (c) => c.kind === "TYPE_CHANGED" && c.endpointId === tc.endpointId &&
          (c.fieldPath?.fieldPath === fieldName || c.description.includes(fieldName))
      );

      if (typeChanged) {
        outcome = "FAIL";
        detail = `Type mismatch: field "${fieldName}" expected ${String(newType)}, received ${String(oldType)}. Server rejected with 422.`;
      } else {
        outcome = "PASS";
        detail = `Type for "${fieldName}" was unchanged or the old type remains accepted.`;
        affectedField = undefined;
        ruleViolated = undefined;
      }
      break;
    }

    case "NULL_VALUE": {
      const fieldName = String((tc.input as Record<string, unknown>)._nullableField ?? "unknown");
      affectedField = fieldName;

      // Check if NULLABLE_ADDED exists for this field
      const nullableChange = diff.changes.find(
        (c) => c.kind === "NULLABLE_ADDED" && c.endpointId === tc.endpointId &&
          (c.fieldPath?.fieldPath === fieldName || c.description.includes(fieldName))
      );

      if (nullableChange) {
        outcome = "WARNING";
        detail = `Server returned null for "${fieldName}". Clients must add null guard before dereferencing this field.`;
        ruleViolated = "COMPAT-RESP-008";
      } else {
        outcome = "PASS";
        detail = `Field "${fieldName}" returned a non-null value as expected.`;
        affectedField = undefined;
      }
      break;
    }

    case "INVALID_ENUM": {
      const fieldName = String((tc.input as Record<string, unknown>)._field ?? "unknown");
      const removedValues = (tc.input as Record<string, unknown>)._removedValues;
      affectedField = fieldName;

      if (removedValues) {
        outcome = "FAIL";
        detail = `Client sent enum value(s) [${JSON.stringify(removedValues)}] for field "${fieldName}" — values removed in this version. Server returned 422.`;
        ruleViolated = "COMPAT-REQ-006";
      } else {
        // Server returned new enum value — old client may not handle
        const addedValues = (tc.input as Record<string, unknown>)._addedValues;
        outcome = "WARNING";
        detail = `Server returned new enum value(s) [${JSON.stringify(addedValues)}] for "${fieldName}". Legacy clients without a default case will throw.`;
        ruleViolated = "COMPAT-RESP-007";
      }
      break;
    }

    case "OUT_OF_RANGE": {
      const fieldName = String((tc.input as Record<string, unknown>)._field ?? "unknown");
      affectedField = fieldName;
      ruleViolated = "COMPAT-REQ-011";
      outcome = "FAIL";
      detail = `Value for "${fieldName}" passed old validation but violates new constraint ${JSON.stringify((tc.input as Record<string, unknown>)._newConstraints)}. Server returned 422.`;
      break;
    }

    case "LEGACY_CLIENT_NEW_API": {
      const endpoint = String((tc.input as Record<string, unknown>)._endpoint ?? tc.endpointId);
      const isRemoved = diff.endpointsRemoved.includes(endpoint);

      if (isRemoved) {
        outcome = "FAIL";
        detail = `Endpoint "${endpoint}" was removed in this version. Legacy client received 404 Not Found.`;
        ruleViolated = "COMPAT-EP-001";
      } else {
        outcome = "PASS";
        detail = `Endpoint "${endpoint}" still exists. Legacy client request succeeded.`;
      }
      break;
    }

    case "NEW_CLIENT_OLD_API": {
      const endpoint = String((tc.input as Record<string, unknown>)._endpoint ?? tc.endpointId);
      const isAdded = diff.endpointsAdded.includes(endpoint);

      if (isAdded) {
        outcome = "PASS";
        detail = `New endpoint "${endpoint}" returned 200 OK on target version. New client request succeeded.`;
      } else {
        outcome = "FAIL";
        detail = `Endpoint "${endpoint}" already existed — this test is a no-op.`;
      }
      break;
    }

    case "EXTRA_UNKNOWN_FIELD": {
      const removedField = String(
        (tc.input as Record<string, unknown>)._removedField ??
        (tc.input as Record<string, unknown>)._removedParam ?? "unknown"
      );

      // Removed fields in request — server may silently ignore or reject
      outcome = "WARNING";
      detail = `Client sent extra/removed field "${removedField}". Server silently ignored it (permissive mode). Strict-mode servers would return 400.`;
      affectedField = removedField;
      ruleViolated = "COMPAT-REQ-001";
      break;
    }

    default:
      outcome = "WARNING";
      detail = "Unrecognized test scenario — manual review required.";
  }

  const passed = outcome === tc.expectedOutcome;
  const actualOutcome: TestOutcome = outcome;

  return {
    testCaseId: tc.id,
    scenario: tc.scenario,
    description: tc.description,
    outcome: tc.expectedOutcome,
    actualOutcome,
    passed,
    detail,
    affectedField,
    ruleViolated,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function buildTestSuite(
  contract: ApiContract,
  diff: ContractDiff,
  compatReport: CompatibilityReport
): ContractTestCase[] {
  const specs = generateTestSpecs(diff, compatReport);

  return specs.map((spec, idx): ContractTestCase => ({
    id: makeTestId(diff.apiId, diff.fromVersion, diff.toVersion, idx),
    apiId: diff.apiId,
    endpointId: spec.endpointId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    scenario: spec.scenario,
    description: spec.description,
    input: spec.input,
    expectedOutcome: spec.expectedOutcome,
  }));
}

export function runContractTests(
  testCases: readonly ContractTestCase[],
  diff: ContractDiff
): ContractTestSuiteResult {
  const results: ContractTestResult[] = testCases.map((tc) => evaluateTestCase(tc, diff));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && r.actualOutcome === "FAIL").length;
  const warnings = results.filter((r) => !r.passed && r.actualOutcome === "WARNING").length;

  return {
    apiId: diff.apiId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    totalTests: results.length,
    passedTests: passed,
    failedTests: failed,
    warningTests: warnings,
    results,
  };
}
