/**
 * Market Data Control Plane — Schema Drift Engine
 *
 * Computes deterministic schema diffs between feed versions (e.g. CME FAST v3.2 -> v3.3,
 * ICE FIXML v4.1 -> v4.2). Classifies changes by breaking vs non-breaking compatibility
 * and maps downstream consumer blast radius.
 */

import {
  CompatibilityClassification,
  FieldChangeType,
  SchemaDefinition,
  SchemaDriftReport,
  SchemaField,
  SchemaFieldDiff,
} from "../types";

export function diffSchemas(
  oldSchema: SchemaDefinition,
  newSchema: SchemaDefinition,
  sourceName: string = oldSchema.sourceCode
): SchemaDriftReport {
  const oldFieldMap = new Map<string, SchemaField>();
  for (const f of oldSchema.fields) {
    oldFieldMap.set(f.name, f);
  }

  const newFieldMap = new Map<string, SchemaField>();
  for (const f of newSchema.fields) {
    newFieldMap.set(f.name, f);
  }

  const diffs: SchemaFieldDiff[] = [];
  let breakingCount = 0;
  let nonBreakingCount = 0;

  // 1. Check for removed or modified fields
  for (const [name, oldField] of oldFieldMap.entries()) {
    const newField = newFieldMap.get(name);

    if (!newField) {
      // Removed field -> BREAKING CHANGE
      diffs.push({
        fieldName: name,
        changeType: "REMOVED",
        oldField,
        compatibility: "BREAKING_CHANGE",
        impactExplanation: `Field '${name}' was deleted in schema version ${newSchema.version}. Downstream parsers expecting this tag will fail or drop messages.`,
        affectedConsumers: ["Real-time Parser Connector", "Risk & Margin Calculation Service", "Historical Time-Series Store"],
      });
      breakingCount++;
      continue;
    }

    // Compare types
    if (oldField.type !== newField.type) {
      diffs.push({
        fieldName: name,
        changeType: "TYPE_CHANGED",
        oldField,
        newField,
        compatibility: "BREAKING_CHANGE",
        impactExplanation: `Data type altered from ${oldField.type} to ${newField.type}. Will trigger deserialization exceptions in binary/typed decoders.`,
        affectedConsumers: ["Low-Latency Order Router", "Valuation Engine", "Analytics Pipelines"],
      });
      breakingCount++;
      continue;
    }

    // Compare requiredness
    if (!oldField.required && newField.required) {
      diffs.push({
        fieldName: name,
        changeType: "REQUIREDNESS_TIGHTENED",
        oldField,
        newField,
        compatibility: "BREAKING_CHANGE",
        impactExplanation: `Field '${name}' changed from optional to mandatory. Ingestion feeds omitting this field will be rejected at ingestion boundary.`,
        affectedConsumers: ["Ingestion Gateway", "Reconciliation Service"],
      });
      breakingCount++;
      continue;
    } else if (oldField.required && !newField.required) {
      diffs.push({
        fieldName: name,
        changeType: "REQUIREDNESS_RELAXED",
        oldField,
        newField,
        compatibility: "NON_BREAKING",
        impactExplanation: `Field '${name}' is now optional. Existing systems can continue sending it without disruption.`,
        affectedConsumers: ["Ingestion Gateway"],
      });
      nonBreakingCount++;
    }

    // Compare precision if applicable
    if (oldField.precision !== undefined && newField.precision !== undefined && oldField.precision !== newField.precision) {
      const isNarrowing = newField.precision < oldField.precision;
      diffs.push({
        fieldName: name,
        changeType: "PRECISION_CHANGED",
        oldField,
        newField,
        compatibility: isNarrowing ? "BREAKING_CHANGE" : "POTENTIALLY_BREAKING",
        impactExplanation: `Numeric decimal precision changed from ${oldField.precision} to ${newField.precision}. ${
          isNarrowing ? "Causes truncation of fractional tick values." : "Requires widening in database schemas."
        }`,
        affectedConsumers: ["IDS Database Mirror", "Clearing Margin Engine"],
      });
      if (isNarrowing) breakingCount++;
      else nonBreakingCount++;
    }

    // Compare enum values if applicable
    if (oldField.enumValues && newField.enumValues) {
      const removedEnums = oldField.enumValues.filter((e) => !newField.enumValues?.includes(e));
      const addedEnums = newField.enumValues.filter((e) => !oldField.enumValues?.includes(e));

      if (removedEnums.length > 0) {
        diffs.push({
          fieldName: name,
          changeType: "ENUM_CONTRACTED",
          oldField,
          newField,
          compatibility: "BREAKING_CHANGE",
          impactExplanation: `Enum members [${removedEnums.join(", ")}] were removed. Existing messages using these values will fail validation.`,
          affectedConsumers: ["Trade Capture Parser", "Regulatory Reporting"],
        });
        breakingCount++;
      } else if (addedEnums.length > 0) {
        diffs.push({
          fieldName: name,
          changeType: "ENUM_EXPANDED",
          oldField,
          newField,
          compatibility: "POTENTIALLY_BREAKING",
          impactExplanation: `New enum values [${addedEnums.join(", ")}] added. Consumers with strict switch-case statements must be updated.`,
          affectedConsumers: ["Order Routing Logic", "Settlement Dispatcher"],
        });
        nonBreakingCount++;
      }
    }
  }

  // 2. Check for newly added fields
  for (const [name, newField] of newFieldMap.entries()) {
    if (!oldFieldMap.has(name)) {
      if (newField.required) {
        diffs.push({
          fieldName: name,
          changeType: "ADDED_REQUIRED",
          newField,
          compatibility: "BREAKING_CHANGE",
          impactExplanation: `New mandatory field '${name}' added to schema. Feed payloads lacking this field will fail schema validation.`,
          affectedConsumers: ["Ingestion Pipeline", "Reference Master DB", "Downstream Clearing"],
        });
        breakingCount++;
      } else {
        diffs.push({
          fieldName: name,
          changeType: "ADDED_OPTIONAL",
          newField,
          compatibility: "NON_BREAKING",
          impactExplanation: `New optional field '${name}' added for supplementary metadata. Backward-compatible with existing parsers.`,
          affectedConsumers: ["Metadata Catalog"],
        });
        nonBreakingCount++;
      }
    }
  }

  let overallCompatibility: CompatibilityClassification = "NON_BREAKING";
  let recommendedAction = "Safe to deploy schema update with standard release cycle.";

  if (breakingCount > 0) {
    overallCompatibility = "BREAKING_CHANGE";
    recommendedAction = `CRITICAL: ${breakingCount} breaking schema mutations detected. Requires dual-version parallel feed deployment, downstream parser migration, and regression signoff before cutover.`;
  } else if (diffs.some((d) => d.compatibility === "POTENTIALLY_BREAKING")) {
    overallCompatibility = "POTENTIALLY_BREAKING";
    recommendedAction = "Review enum extensions and precision widening with downstream consumer teams before deploying.";
  }

  return {
    sourceCode: oldSchema.sourceCode,
    sourceName,
    baseVersion: oldSchema.version,
    targetVersion: newSchema.version,
    detectedAt: new Date().toISOString(),
    overallCompatibility,
    compatibilityScore: overallCompatibility,
    diffs,
    mutations: diffs,
    breakingCount,
    nonBreakingCount,
    breakingChangesCount: breakingCount,
    affectedConsumers: Array.from(new Set(diffs.flatMap((d) => d.affectedConsumers))),
    recommendedAction,
  };
}
