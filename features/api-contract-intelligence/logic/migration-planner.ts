/**
 * API Contract Intelligence — Migration Action Planner
 * Generates a prioritized, ordered set of migration actions for each consumer
 * impacted by a ContractDiff, based on the compatibility findings and consumer
 * dependency declarations.
 *
 * Action kinds:
 *   UPDATE_FIELD_TYPE, ADD_REQUIRED_FIELD, REMOVE_FIELD_REFERENCE,
 *   UPDATE_ENUM_HANDLING, UPDATE_ENDPOINT_PATH, ADD_NULL_GUARD,
 *   UPDATE_VERSION_HEADER, REMAP_RESPONSE_CODE, ADD_FALLBACK_DEFAULT,
 *   DEPRECATION_NOTICE
 *
 * Priority: CRITICAL (1) → HIGH (2) → MEDIUM (3) → LOW (4)
 * Pure function: same inputs → same output.
 */

import {
  ApiConsumer,
  CompatibilityReport,
  ConsumerApiDependency,
  ConsumerEndpointDependency,
  ConsumerImpactReport,
  ConsumerMigrationPlan,
  ContractDiff,
  MigrationAction,
  MigrationActionKind,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Action ID hashing (deterministic)
// ─────────────────────────────────────────────────────────────────────────────

function makeActionId(consumerId: string, changeId: string, kind: MigrationActionKind): string {
  const raw = `${consumerId}::${changeId}::${kind}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
    h >>>= 0;
  }
  return `ma-${h.toString(16).padStart(8, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority mapping
// ─────────────────────────────────────────────────────────────────────────────

function priorityFor(compatibility: string, critical: boolean): 1 | 2 | 3 | 4 {
  switch (compatibility) {
    case "BREAKING":
      return critical ? 1 : 2;
    case "POTENTIALLY_BREAKING":
      return critical ? 2 : 3;
    case "NON_BREAKING":
      return critical ? 3 : 4;
    default:
      return 4;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action generators — one per relevant ChangeKind
// ─────────────────────────────────────────────────────────────────────────────

function actionsForEndpoint(
  consumerId: string,
  changeId: string,
  change: ContractDiff["changes"][0],
  compatibility: string,
  endpointDep: ConsumerEndpointDependency
): MigrationAction[] {
  const critical = endpointDep.criticalForOperation;
  const priority = priorityFor(compatibility, critical);
  const actions: MigrationAction[] = [];

  switch (change.kind) {
    case "ENDPOINT_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_ENDPOINT_PATH"),
        kind: "UPDATE_ENDPOINT_PATH",
        priority,
        endpointId: change.endpointId,
        description: `Update all call sites from removed endpoint "${change.endpointId}" to its replacement, if available. If no replacement exists, flag for product-owner escalation.`,
        estimatedEffort: "M",
        automatable: false,
      });
      break;

    case "ENDPOINT_ADDED":
      // Purely additive — only a notice action
      actions.push({
        id: makeActionId(consumerId, changeId, "DEPRECATION_NOTICE"),
        kind: "DEPRECATION_NOTICE",
        priority: 4,
        endpointId: change.endpointId,
        description: `New endpoint "${change.endpointId}" available. Evaluate whether migrating to it would improve functionality.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "DEPRECATION_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "DEPRECATION_NOTICE"),
        kind: "DEPRECATION_NOTICE",
        priority: 4,
        endpointId: change.endpointId,
        description: `Endpoint "${change.endpointId}" is now deprecated. Plan migration to replacement before sunset date.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    default:
      break;
  }

  return actions;
}

function actionsForFieldChange(
  consumerId: string,
  changeId: string,
  change: ContractDiff["changes"][0],
  compatibility: string,
  endpointDep: ConsumerEndpointDependency
): MigrationAction[] {
  const critical = endpointDep.criticalForOperation;
  const priority = priorityFor(compatibility, critical);
  const fieldPath = change.fieldPath?.fieldPath ?? "unknown";
  const actions: MigrationAction[] = [];

  switch (change.kind) {
    case "FIELD_REMOVED":
      if (change.location === "RESPONSE") {
        // Consumer reads a field that is now gone
        actions.push({
          id: makeActionId(consumerId, changeId, "REMOVE_FIELD_REFERENCE"),
          kind: "REMOVE_FIELD_REFERENCE",
          priority,
          endpointId: change.endpointId,
          fieldPath,
          description: `Remove all references to response field "${fieldPath}" from ${change.endpointId} response parsing. Field no longer present in target version.`,
          estimatedEffort: "S",
          automatable: true,
          automationHint: `sed -i 's/response\\.${fieldPath}//g'`,
        });
      } else {
        // Consumer sends a field that server no longer accepts
        actions.push({
          id: makeActionId(consumerId, changeId, "REMOVE_FIELD_REFERENCE"),
          kind: "REMOVE_FIELD_REFERENCE",
          priority,
          endpointId: change.endpointId,
          fieldPath,
          description: `Stop sending removed request field "${fieldPath}" to ${change.endpointId}. Server may reject or silently drop it.`,
          estimatedEffort: "S",
          automatable: false,
        });
      }
      break;

    case "FIELD_ADDED":
      if (change.location === "RESPONSE" && change.newValue) {
        actions.push({
          id: makeActionId(consumerId, changeId, "ADD_FALLBACK_DEFAULT"),
          kind: "ADD_FALLBACK_DEFAULT",
          priority: 4,
          endpointId: change.endpointId,
          fieldPath,
          description: `New response field "${fieldPath}" available from ${change.endpointId}. Update response type definitions and consider using it.`,
          estimatedEffort: "S",
          automatable: false,
        });
      }
      break;

    case "TYPE_CHANGED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_FIELD_TYPE"),
        kind: "UPDATE_FIELD_TYPE",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `Update handling of field "${fieldPath}" from type "${String(change.oldValue)}" to "${String(change.newValue)}" at ${change.endpointId}. Update type annotations, parsers, and serializers.`,
        estimatedEffort: "M",
        automatable: false,
      });
      break;

    case "REQUIREDNESS_ADDED":
      if (change.location === "REQUEST") {
        // Consumer must now always send this field
        actions.push({
          id: makeActionId(consumerId, changeId, "ADD_REQUIRED_FIELD"),
          kind: "ADD_REQUIRED_FIELD",
          priority,
          endpointId: change.endpointId,
          fieldPath,
          description: `Field "${fieldPath}" is now required in ${change.endpointId} request body. All call sites must supply a value. Audit for gaps.`,
          estimatedEffort: "M",
          automatable: false,
        });
      }
      break;

    case "REQUIREDNESS_REMOVED":
      if (change.location === "RESPONSE") {
        // Consumer reads this as always-present; now it may be absent
        actions.push({
          id: makeActionId(consumerId, changeId, "ADD_NULL_GUARD"),
          kind: "ADD_NULL_GUARD",
          priority,
          endpointId: change.endpointId,
          fieldPath,
          description: `Response field "${fieldPath}" from ${change.endpointId} may now be absent. Add null/undefined guard before all dereference sites.`,
          estimatedEffort: "S",
          automatable: true,
          automationHint: `Add optional chaining: response.${fieldPath.replace(/\./g, "?.")}`,
        });
      }
      break;

    case "NULLABLE_ADDED":
      if (change.location === "RESPONSE") {
        actions.push({
          id: makeActionId(consumerId, changeId, "ADD_NULL_GUARD"),
          kind: "ADD_NULL_GUARD",
          priority,
          endpointId: change.endpointId,
          fieldPath,
          description: `Response field "${fieldPath}" from ${change.endpointId} can now be null. Add null guard at every read site to prevent null-pointer errors.`,
          estimatedEffort: "S",
          automatable: true,
          automationHint: `Add null check: if (response.${fieldPath} !== null) { ... }`,
        });
      }
      break;

    case "ENUM_VALUE_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_ENUM_HANDLING"),
        kind: "UPDATE_ENUM_HANDLING",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `Enum value(s) [${JSON.stringify(change.oldValue)}] removed from field "${fieldPath}" at ${change.endpointId}. Remove stale cases from switch statements and update type definitions.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "ENUM_VALUE_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_ENUM_HANDLING"),
        kind: "UPDATE_ENUM_HANDLING",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `New enum value(s) [${JSON.stringify(change.newValue)}] added to field "${fieldPath}" at ${change.endpointId}. Update exhaustive switch statements and type definitions to handle new values.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "CONSTRAINT_ADDED":
    case "CONSTRAINT_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "ADD_FALLBACK_DEFAULT"),
        kind: "ADD_FALLBACK_DEFAULT",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `Field "${fieldPath}" validation constraints changed at ${change.endpointId}. Review existing values against new constraints${
          change.kind === "CONSTRAINT_ADDED"
            ? " and add client-side pre-validation to prevent 422 errors."
            : " — previously invalid values may now be accepted."
        }`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "DEFAULT_REMOVED":
    case "DEFAULT_CHANGED":
      actions.push({
        id: makeActionId(consumerId, changeId, "ADD_FALLBACK_DEFAULT"),
        kind: "ADD_FALLBACK_DEFAULT",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `Default value for field "${fieldPath}" ${change.kind === "DEFAULT_REMOVED" ? "removed" : `changed from ${JSON.stringify(change.oldValue)} to ${JSON.stringify(change.newValue)}`} at ${change.endpointId}. ${
          change.location === "REQUEST"
            ? "Clients relying on server-applied defaults must now supply explicit values."
            : "Response parsing may see different values when field is omitted by server."
        }`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "FORMAT_CHANGED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_FIELD_TYPE"),
        kind: "UPDATE_FIELD_TYPE",
        priority,
        endpointId: change.endpointId,
        fieldPath,
        description: `Field "${fieldPath}" format changed from "${String(change.oldValue)}" to "${String(change.newValue)}" at ${change.endpointId}. Update format-specific parsers (dates, decimals, URIs).`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "DEPRECATION_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "DEPRECATION_NOTICE"),
        kind: "DEPRECATION_NOTICE",
        priority: 4,
        endpointId: change.endpointId,
        fieldPath,
        description: `Field "${fieldPath}" is deprecated at ${change.endpointId}. Begin migrating to the replacement field or approach before next major version removes it.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    default:
      break;
  }

  return actions;
}

function actionsForParameterChange(
  consumerId: string,
  changeId: string,
  change: ContractDiff["changes"][0],
  compatibility: string,
  endpointDep: ConsumerEndpointDependency
): MigrationAction[] {
  const critical = endpointDep.criticalForOperation;
  const priority = priorityFor(compatibility, critical);
  const actions: MigrationAction[] = [];

  switch (change.kind) {
    case "PARAMETER_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "REMOVE_FIELD_REFERENCE"),
        kind: "REMOVE_FIELD_REFERENCE",
        priority,
        endpointId: change.endpointId,
        description: `Parameter "${String(change.oldValue)}" removed from ${change.endpointId}. Remove from all call sites.`,
        estimatedEffort: "S",
        automatable: true,
        automationHint: `Remove query/header param '${String(change.oldValue)}' from all ${change.endpointId} requests`,
      });
      break;

    case "PARAMETER_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "ADD_REQUIRED_FIELD"),
        kind: "ADD_REQUIRED_FIELD",
        priority,
        endpointId: change.endpointId,
        description: `Parameter "${String(change.newValue)}" added to ${change.endpointId}. ${
          compatibility === "BREAKING"
            ? "Required — all call sites must supply it."
            : "Optional but recommended — evaluate whether to adopt it."
        }`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "TYPE_CHANGED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_FIELD_TYPE"),
        kind: "UPDATE_FIELD_TYPE",
        priority,
        endpointId: change.endpointId,
        description: `Parameter type changed from "${String(change.oldValue)}" to "${String(change.newValue)}" at ${change.endpointId}. Update type coercion at all call sites.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "REQUIREDNESS_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "ADD_REQUIRED_FIELD"),
        kind: "ADD_REQUIRED_FIELD",
        priority,
        endpointId: change.endpointId,
        description: `Parameter became required at ${change.endpointId}. Audit all call sites and supply mandatory value.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "ENUM_VALUE_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_ENUM_HANDLING"),
        kind: "UPDATE_ENUM_HANDLING",
        priority,
        endpointId: change.endpointId,
        description: `Parameter enum value(s) removed from ${change.endpointId}. Remove stale parameter values from call sites.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "ENUM_VALUE_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "UPDATE_ENUM_HANDLING"),
        kind: "UPDATE_ENUM_HANDLING",
        priority: 4,
        endpointId: change.endpointId,
        description: `New parameter enum value(s) added to ${change.endpointId}. Update documentation and optionally adopt new values.`,
        estimatedEffort: "XS",
        automatable: false,
      });
      break;

    default:
      break;
  }

  return actions;
}

function actionsForResponseCodeChange(
  consumerId: string,
  changeId: string,
  change: ContractDiff["changes"][0],
  compatibility: string,
  endpointDep: ConsumerEndpointDependency
): MigrationAction[] {
  const critical = endpointDep.criticalForOperation;
  const priority = priorityFor(compatibility, critical);
  const actions: MigrationAction[] = [];

  switch (change.kind) {
    case "RESPONSE_CODE_REMOVED":
      actions.push({
        id: makeActionId(consumerId, changeId, "REMAP_RESPONSE_CODE"),
        kind: "REMAP_RESPONSE_CODE",
        priority,
        endpointId: change.endpointId,
        description: `HTTP ${String(change.oldValue)} response code removed from ${change.endpointId}. Update error handling to use fallback generic handler; remove code-specific branch.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    case "RESPONSE_CODE_ADDED":
      actions.push({
        id: makeActionId(consumerId, changeId, "REMAP_RESPONSE_CODE"),
        kind: "REMAP_RESPONSE_CODE",
        priority,
        endpointId: change.endpointId,
        description: `New HTTP ${String(change.newValue)} response code added to ${change.endpointId}. Add explicit handler to avoid unhandled-status-code errors in strict parsers.`,
        estimatedEffort: "S",
        automatable: false,
      });
      break;

    default:
      break;
  }

  return actions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Version header action (always appended when version changes)
// ─────────────────────────────────────────────────────────────────────────────

function versionHeaderAction(
  consumerId: string,
  dep: ConsumerApiDependency,
  diff: ContractDiff
): MigrationAction {
  return {
    id: makeActionId(consumerId, `${dep.apiId}-version-pin`, "UPDATE_VERSION_HEADER"),
    kind: "UPDATE_VERSION_HEADER",
    priority: 2,
    endpointId: "*",
    description: `Update pinned version for ${dep.apiId} from ${dep.pinnedVersion} to ${diff.toVersion} in all request headers (Accept-Version, X-API-Version) and client configuration.`,
    estimatedEffort: "XS",
    automatable: true,
    automationHint: `Update API_VERSION constant from '${dep.pinnedVersion}' to '${diff.toVersion}'`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// De-duplication (same kind + field → keep highest priority)
// ─────────────────────────────────────────────────────────────────────────────

function deduplicateActions(actions: MigrationAction[]): MigrationAction[] {
  const seen = new Map<string, MigrationAction>();
  for (const action of actions) {
    const key = `${action.kind}::${action.endpointId}::${action.fieldPath ?? ""}`;
    const existing = seen.get(key);
    if (!existing || action.priority < existing.priority) {
      seen.set(key, action);
    }
  }
  // Sort by priority (1 = highest), then by kind
  return Array.from(seen.values()).sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : a.kind.localeCompare(b.kind)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-consumer plan builder
// ─────────────────────────────────────────────────────────────────────────────

function buildConsumerPlan(
  consumer: ApiConsumer,
  diff: ContractDiff,
  compatReport: CompatibilityReport,
  impactReport: ConsumerImpactReport
): ConsumerMigrationPlan {
  const dep = consumer.dependencies.find((d) => d.apiId === diff.apiId);
  if (!dep) {
    return {
      consumerId: consumer.id,
      consumerName: consumer.name,
      apiId: diff.apiId,
      fromVersion: diff.fromVersion,
      toVersion: diff.toVersion,
      actions: [],
      estimatedTotalEffort: "XS",
    };
  }

  const rawActions: MigrationAction[] = [];

  // Version header update is always needed
  rawActions.push(versionHeaderAction(consumer.id, dep, diff));

  for (const change of diff.changes) {
    const finding = compatReport.findings.find((f) => f.changeId === change.id);
    if (!finding) continue;

    // Skip informational changes — no action needed
    if (finding.compatibility === "INFORMATIONAL") {
      // Still add a deprecation notice for endpoint deprecations
      if (change.kind === "DEPRECATION_ADDED") {
        const endpointDep = dep.endpoints.find((e) => e.endpointId === change.endpointId);
        if (endpointDep) {
          rawActions.push(...actionsForEndpoint(consumer.id, change.id, change, finding.compatibility, endpointDep));
        }
      }
      continue;
    }

    const endpointDep = dep.endpoints.find((e) => e.endpointId === change.endpointId);
    if (!endpointDep) {
      // Consumer doesn't use this endpoint — skip (except ENDPOINT_REMOVED which is globally impactful)
      if (change.kind === "ENDPOINT_REMOVED") {
        // If it's in the consumer's dependency list (already guarded above), generate action
        // Here: endpoint not found in dep.endpoints — skip
      }
      continue;
    }

    // Field-level changes
    if (change.location === "REQUEST" || change.location === "RESPONSE") {
      if (
        change.kind === "ENDPOINT_REMOVED" ||
        change.kind === "ENDPOINT_ADDED" ||
        change.kind === "DEPRECATION_ADDED"
      ) {
        rawActions.push(...actionsForEndpoint(consumer.id, change.id, change, finding.compatibility, endpointDep));
      } else if (change.kind === "RESPONSE_CODE_REMOVED" || change.kind === "RESPONSE_CODE_ADDED") {
        rawActions.push(...actionsForResponseCodeChange(consumer.id, change.id, change, finding.compatibility, endpointDep));
      } else {
        // Check if this field is consumed/written by this consumer
        const fieldPath = change.fieldPath?.fieldPath;
        let isRelevant = false;
        if (change.location === "REQUEST") {
          isRelevant = !fieldPath || (endpointDep.writtenFields?.some(
            (wf) => wf === fieldPath || wf.startsWith(fieldPath + ".") || fieldPath.startsWith(wf + ".")
          ) ?? true);
        } else {
          isRelevant = !fieldPath || endpointDep.consumedFields.some(
            (cf) => cf === fieldPath || cf.startsWith(fieldPath + ".") || fieldPath.startsWith(cf + ".")
          );
        }
        if (isRelevant) {
          rawActions.push(...actionsForFieldChange(consumer.id, change.id, change, finding.compatibility, endpointDep));
        }
      }
    } else {
      // PATH_PARAM, QUERY_PARAM, HEADER — parameter changes
      rawActions.push(...actionsForParameterChange(consumer.id, change.id, change, finding.compatibility, endpointDep));
    }
  }

  const actions = deduplicateActions(rawActions);

  // Estimate total effort
  const effortOrder = ["XS", "S", "M", "L", "XL"];
  const maxEffort = actions.reduce((max, a) => {
    if (!a.estimatedEffort) return max;
    return effortOrder.indexOf(a.estimatedEffort) > effortOrder.indexOf(max) ? a.estimatedEffort : max;
  }, "XS" as string);

  // Escalate if many actions
  const combinedEffort =
    actions.length > 10 ? "XL" :
    actions.length > 6  ? "L"  :
    actions.length > 3  ? "M"  :
    maxEffort;

  return {
    consumerId: consumer.id,
    consumerName: consumer.name,
    apiId: diff.apiId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    actions,
    estimatedTotalEffort: combinedEffort as "XS" | "S" | "M" | "L" | "XL",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function buildMigrationPlan(
  consumer: ApiConsumer,
  diff: ContractDiff,
  compatReport: CompatibilityReport,
  impactReport: ConsumerImpactReport
): ConsumerMigrationPlan {
  return buildConsumerPlan(consumer, diff, compatReport, impactReport);
}

export function buildAllMigrationPlans(
  consumers: readonly ApiConsumer[],
  diff: ContractDiff,
  compatReport: CompatibilityReport,
  impactReports: readonly ConsumerImpactReport[]
): ConsumerMigrationPlan[] {
  return impactReports
    .map((impact) => {
      const consumer = consumers.find((c) => c.id === impact.consumerId);
      if (!consumer) return null;
      return buildConsumerPlan(consumer, diff, compatReport, impact);
    })
    .filter((p): p is ConsumerMigrationPlan => p !== null)
    .sort((a, b) => {
      // Sort by action count descending (most urgent first)
      return b.actions.length - a.actions.length;
    });
}
