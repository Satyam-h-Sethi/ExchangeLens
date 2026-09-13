/**
 * API Contract Intelligence — Consumer Impact Analysis Engine
 * Determines the blast radius of a ContractDiff on each registered consumer.
 *
 * Impact chain:
 *   ContractDiff → CompatibilityReport → per-consumer field/endpoint overlap
 *   → ConsumerImpactReport per consumer
 *
 * Pure function: no side effects, same inputs → same output.
 */

import {
  ApiConsumer,
  CompatibilityFinding,
  CompatibilityReport,
  ConsumerApiImpact,
  ConsumerFieldImpact,
  ConsumerImpactReport,
  ConsumerToleranceBehavior,
  ContractDiff,
  ImpactLevel,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalize a field path for comparison: strip leading dot, lowercase */
function normalizePath(p: string): string {
  return p.replace(/^\./, "").toLowerCase();
}

/**
 * True if the change's field path overlaps with any consumed path.
 * Supports nested prefixes: consuming "bars" also covers "bars.close".
 */
function fieldIsConsumed(changePath: string | undefined, consumedFields: readonly string[]): boolean {
  if (!changePath) return false;
  const cp = normalizePath(changePath);
  return consumedFields.some((cf) => {
    const nf = normalizePath(cf);
    return cp === nf || cp.startsWith(nf + ".") || nf.startsWith(cp + ".");
  });
}

/**
 * Map a compatibility class + tolerance behavior → effective impact level.
 * LENIENT consumers tolerate NON_BREAKING and INFORMATIONAL changes; they still
 * break on BREAKING and POTENTIALLY_BREAKING when it touches a consumed field.
 * VERSION_LOCKED consumers treat any change as CRITICAL.
 */
function effectiveImpact(
  compatibility: string,
  tolerance: ConsumerToleranceBehavior,
  criticalForOperation: boolean
): ImpactLevel {
  if (tolerance === "VERSION_LOCKED") {
    // Any change to a consumed endpoint/field is a blocker
    return compatibility === "INFORMATIONAL" ? "LOW" : "CRITICAL";
  }

  switch (compatibility) {
    case "BREAKING":
      return criticalForOperation ? "CRITICAL" : "HIGH";
    case "POTENTIALLY_BREAKING":
      if (tolerance === "LENIENT") return criticalForOperation ? "MEDIUM" : "LOW";
      return criticalForOperation ? "HIGH" : "MEDIUM";
    case "NON_BREAKING":
      if (tolerance === "LENIENT") return "NONE";
      return "LOW";
    case "INFORMATIONAL":
      return "NONE";
    default:
      return "LOW";
  }
}

/** Aggregate multiple impact levels to a single worst-case */
function maxImpact(levels: ImpactLevel[]): ImpactLevel {
  const order: ImpactLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let max = 0;
  for (const l of levels) {
    const idx = order.indexOf(l);
    if (idx > max) max = idx;
  }
  return order[max];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-consumer, per-API impact computation
// ─────────────────────────────────────────────────────────────────────────────

function computeApiImpact(
  consumer: ApiConsumer,
  diff: ContractDiff,
  report: CompatibilityReport
): ConsumerApiImpact | null {
  // Find the dependency declaration for this API
  const dep = consumer.dependencies.find((d) => d.apiId === diff.apiId);
  if (!dep) return null;

  const tolerance = dep.toleranceBehavior;
  const fieldImpacts: ConsumerFieldImpact[] = [];
  const affectedEndpoints = new Set<string>();

  for (const finding of report.findings) {
    // Check if the consumer uses this endpoint
    const endpointDep = dep.endpoints.find((e) => e.endpointId === finding.endpointId);

    // Endpoint-level changes (ENDPOINT_REMOVED, ENDPOINT_ADDED)
    if (!endpointDep) {
      // Consumer doesn't use this endpoint — skip field-level impact
      // But still track endpoint removals if they're in the consumer's list
      if (finding.ruleId === "COMPAT-EP-001") {
        const listed = dep.endpoints.find((e) => e.endpointId === finding.endpointId);
        if (listed) {
          affectedEndpoints.add(finding.endpointId);
          const level = effectiveImpact("BREAKING", tolerance, listed.criticalForOperation);
          if (level !== "NONE") {
            fieldImpacts.push({
              changeId: finding.changeId,
              fieldPath: finding.endpointId,
              compatibility: finding.compatibility,
              detail: `Endpoint "${finding.endpointId}" removed — consumer will receive 404`,
            });
          }
        }
      }
      continue;
    }

    const criticalForOperation = endpointDep.criticalForOperation;

    // For endpoint-level changes (not field-level)
    if (finding.ruleId === "COMPAT-EP-001" || finding.ruleId === "COMPAT-EP-003") {
      affectedEndpoints.add(finding.endpointId);
      const level = effectiveImpact(finding.compatibility, tolerance, criticalForOperation);
      if (level !== "NONE") {
        fieldImpacts.push({
          changeId: finding.changeId,
          fieldPath: finding.endpointId,
          compatibility: finding.compatibility,
          detail: finding.description,
        });
      }
      continue;
    }

    // For response-code changes without a specific field path
    if (finding.ruleId === "COMPAT-RESP-018" || finding.ruleId === "COMPAT-RESP-019") {
      const level = effectiveImpact(finding.compatibility, tolerance, criticalForOperation);
      if (level !== "NONE") {
        affectedEndpoints.add(finding.endpointId);
        fieldImpacts.push({
          changeId: finding.changeId,
          fieldPath: `${finding.endpointId}`,
          compatibility: finding.compatibility,
          detail: finding.description,
        });
      }
      continue;
    }

    // Parameter-level changes
    if (
      finding.ruleId === "COMPAT-PARAM-001" ||
      finding.ruleId === "COMPAT-PARAM-002" ||
      finding.ruleId === "COMPAT-PARAM-003" ||
      finding.ruleId === "COMPAT-PARAM-004" ||
      finding.ruleId === "COMPAT-PARAM-005" ||
      finding.ruleId === "COMPAT-PARAM-006"
    ) {
      const level = effectiveImpact(finding.compatibility, tolerance, criticalForOperation);
      if (level !== "NONE") {
        affectedEndpoints.add(finding.endpointId);
        fieldImpacts.push({
          changeId: finding.changeId,
          fieldPath: `${finding.endpointId} (param)`,
          compatibility: finding.compatibility,
          detail: finding.description,
        });
      }
      continue;
    }

    // Field-level changes: check if the consumer actually reads this field
    // Extract the fieldPath from the finding's description (it's embedded in the change)
    // We need to find the matching change from the diff
    const matchingChange = diff.changes.find((c) => c.id === finding.changeId);
    const fieldPath = matchingChange?.fieldPath?.fieldPath;

    // For request-side changes, check writtenFields; for response, check consumedFields
    let isConsumed = false;
    if (finding.location === "REQUEST") {
      isConsumed = fieldIsConsumed(fieldPath, endpointDep.writtenFields ?? []);
    } else {
      isConsumed = fieldIsConsumed(fieldPath, endpointDep.consumedFields);
    }

    if (!isConsumed) continue;

    const level = effectiveImpact(finding.compatibility, tolerance, criticalForOperation);
    if (level !== "NONE") {
      affectedEndpoints.add(finding.endpointId);
      fieldImpacts.push({
        changeId: finding.changeId,
        fieldPath: fieldPath ?? finding.endpointId,
        compatibility: finding.compatibility,
        detail: finding.description,
      });
    }
  }

  if (fieldImpacts.length === 0 && affectedEndpoints.size === 0) {
    return null; // no overlap with this consumer
  }

  const impactLevels = fieldImpacts.map((fi) => {
    const change = diff.changes.find((c) => c.id === fi.changeId);
    const endpointDep = dep.endpoints.find((e) => e.endpointId === change?.endpointId);
    const critical = endpointDep?.criticalForOperation ?? false;
    return effectiveImpact(fi.compatibility, tolerance, critical);
  });

  const overallImpact = maxImpact(impactLevels);
  const affectedEndpointList = Array.from(affectedEndpoints);

  const riskSummary = buildRiskSummary(
    consumer,
    diff,
    overallImpact,
    fieldImpacts,
    tolerance,
    affectedEndpointList
  );

  return {
    apiId: diff.apiId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    impactLevel: overallImpact,
    affectedEndpoints: affectedEndpointList,
    fieldImpacts,
    riskSummary,
  };
}

function buildRiskSummary(
  consumer: ApiConsumer,
  diff: ContractDiff,
  impact: ImpactLevel,
  fieldImpacts: ConsumerFieldImpact[],
  tolerance: ConsumerToleranceBehavior,
  affectedEndpoints: string[]
): string {
  if (impact === "NONE") return "No impact on this consumer.";

  const breaking = fieldImpacts.filter((f) => f.compatibility === "BREAKING");
  const potentially = fieldImpacts.filter((f) => f.compatibility === "POTENTIALLY_BREAKING");

  const parts: string[] = [];

  if (breaking.length > 0) {
    parts.push(`${breaking.length} breaking change${breaking.length > 1 ? "s" : ""} directly affect consumed fields/endpoints`);
  }
  if (potentially.length > 0) {
    parts.push(`${potentially.length} potentially breaking change${potentially.length > 1 ? "s" : ""} require validation`);
  }
  if (affectedEndpoints.length > 0) {
    parts.push(`${affectedEndpoints.length} endpoint${affectedEndpoints.length > 1 ? "s" : ""} affected`);
  }

  const toleranceNote = tolerance === "VERSION_LOCKED"
    ? " Consumer is VERSION_LOCKED and cannot accept any change without full validation."
    : tolerance === "STRICT"
      ? " Consumer uses STRICT tolerance — all field changes require code updates."
      : " Consumer uses LENIENT tolerance — unknown fields ignored but breaking changes still apply.";

  return `${consumer.name} → ${diff.apiId} ${diff.fromVersion}→${diff.toVersion}: ${parts.join("; ")}.${toleranceNote}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeConsumerImpact(
  consumer: ApiConsumer,
  diff: ContractDiff,
  compatReport: CompatibilityReport
): ConsumerImpactReport {
  const apiImpact = computeApiImpact(consumer, diff, compatReport);

  const apiImpacts = apiImpact ? [apiImpact] : [];
  const overallImpact = maxImpact(apiImpacts.map((a) => a.impactLevel));

  return {
    consumerId: consumer.id,
    consumerName: consumer.name,
    apiImpacts,
    overallImpact,
  };
}

/**
 * Analyze impact for all consumers at once. Consumers not dependent on the
 * diffed API are omitted from the result.
 */
export function analyzeAllConsumerImpacts(
  consumers: readonly ApiConsumer[],
  diff: ContractDiff,
  compatReport: CompatibilityReport
): ConsumerImpactReport[] {
  return consumers
    .map((c) => analyzeConsumerImpact(c, diff, compatReport))
    .filter((r) => r.apiImpacts.length > 0);
}
