/**
 * API Contract Intelligence — Structural Diff Engine
 * Produces a deterministic ContractDiff from two ContractVersion objects.
 * Pure function: same inputs always yield the same output.
 */

import {
  ApiEndpoint,
  ApiField,
  ApiParameter,
  ChangeKind,
  ChangeLocation,
  ContractChange,
  ContractDiff,
  ContractVersion,
  FieldPath,
  ResponseSchema,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic ID hashing (simple — not crypto)
// ─────────────────────────────────────────────────────────────────────────────

function makeChangeId(endpointId: string, location: ChangeLocation, kind: string, path: string): string {
  const raw = `${endpointId}::${location}::${kind}::${path}`;
  // djb2 hash → hex string
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
    h >>>= 0; // keep 32-bit unsigned
  }
  return h.toString(16).padStart(8, "0");
}

// ─────────────────────────────────────────────────────────────────────────────
// Field comparison helpers
// ─────────────────────────────────────────────────────────────────────────────

function fieldMapByName(fields: readonly ApiField[]): Map<string, ApiField> {
  const m = new Map<string, ApiField>();
  for (const f of fields) m.set(f.name, f);
  return m;
}

function constraintsEqual(
  a?: { minimum?: number; maximum?: number; minLength?: number; maxLength?: number; pattern?: string; minItems?: number; maxItems?: number },
  b?: { minimum?: number; maximum?: number; minLength?: number; maxLength?: number; pattern?: string; minItems?: number; maxItems?: number }
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.minimum === b.minimum &&
    a.maximum === b.maximum &&
    a.minLength === b.minLength &&
    a.maxLength === b.maxLength &&
    a.pattern === b.pattern &&
    a.minItems === b.minItems &&
    a.maxItems === b.maxItems
  );
}

function enumSetsEqual(a?: readonly string[], b?: readonly string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((v) => sa.has(v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursive field diff (returns changes for one field path)
// ─────────────────────────────────────────────────────────────────────────────

function diffFields(
  baseFields: readonly ApiField[],
  targetFields: readonly ApiField[],
  endpointId: string,
  location: ChangeLocation,
  statusCode: number | undefined,
  parentPath: string,
  accum: ContractChange[]
): void {
  const baseMap = fieldMapByName(baseFields);
  const targetMap = fieldMapByName(targetFields);

  // Fields present in base but not in target → removed
  for (const [name, baseField] of Array.from(baseMap.entries())) {
    const fieldPath = parentPath ? `${parentPath}.${name}` : name;
    if (!targetMap.has(name)) {
      accum.push({
        id: makeChangeId(endpointId, location, "FIELD_REMOVED", fieldPath),
        kind: "FIELD_REMOVED",
        location,
        endpointId,
        fieldPath: { endpointId, location, statusCode, fieldPath },
        oldValue: `${baseField.type} (${baseField.required ? "required" : "optional"})`,
        newValue: undefined,
        description: `Field "${fieldPath}" removed from ${location.toLowerCase()} schema`,
      });
    }
  }

  // Fields present in target
  for (const [name, targetField] of Array.from(targetMap.entries())) {
    const fieldPath = parentPath ? `${parentPath}.${name}` : name;
    const fp: FieldPath = { endpointId, location, statusCode, fieldPath };

    if (!baseMap.has(name)) {
      // Added
      accum.push({
        id: makeChangeId(endpointId, location, "FIELD_ADDED", fieldPath),
        kind: "FIELD_ADDED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: undefined,
        newValue: `${targetField.type} (${targetField.required ? "required" : "optional"})`,
        description: `Field "${fieldPath}" added to ${location.toLowerCase()} schema${targetField.required ? " (required)" : " (optional)"}`,
      });
      continue;
    }

    const baseField = baseMap.get(name)!;

    // Type changed
    if (baseField.type !== targetField.type) {
      accum.push({
        id: makeChangeId(endpointId, location, "TYPE_CHANGED", fieldPath),
        kind: "TYPE_CHANGED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: baseField.type,
        newValue: targetField.type,
        description: `Field "${fieldPath}" type changed from "${baseField.type}" to "${targetField.type}"`,
      });
    }

    // Requiredness
    if (!baseField.required && targetField.required) {
      accum.push({
        id: makeChangeId(endpointId, location, "REQUIREDNESS_ADDED", fieldPath),
        kind: "REQUIREDNESS_ADDED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: "optional",
        newValue: "required",
        description: `Field "${fieldPath}" became required`,
      });
    } else if (baseField.required && !targetField.required) {
      accum.push({
        id: makeChangeId(endpointId, location, "REQUIREDNESS_REMOVED", fieldPath),
        kind: "REQUIREDNESS_REMOVED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: "required",
        newValue: "optional",
        description: `Field "${fieldPath}" changed from required to optional`,
      });
    }

    // Nullability
    if (!baseField.nullable && targetField.nullable) {
      accum.push({
        id: makeChangeId(endpointId, location, "NULLABLE_ADDED", fieldPath),
        kind: "NULLABLE_ADDED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: "non-nullable",
        newValue: "nullable",
        description: `Field "${fieldPath}" is now nullable`,
      });
    } else if (baseField.nullable && !targetField.nullable) {
      accum.push({
        id: makeChangeId(endpointId, location, "NULLABLE_REMOVED", fieldPath),
        kind: "NULLABLE_REMOVED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: "nullable",
        newValue: "non-nullable",
        description: `Field "${fieldPath}" is no longer nullable (stricter)`,
      });
    }

    // Enum changes
    if (!enumSetsEqual(baseField.enumValues, targetField.enumValues)) {
      const baseEnums = new Set(baseField.enumValues ?? []);
      const targetEnums = new Set(targetField.enumValues ?? []);
      const added = [...targetEnums].filter((v) => !baseEnums.has(v));
      const removed = [...baseEnums].filter((v) => !targetEnums.has(v));
      if (removed.length > 0) {
        accum.push({
          id: makeChangeId(endpointId, location, "ENUM_VALUE_REMOVED", fieldPath),
          kind: "ENUM_VALUE_REMOVED",
          location,
          endpointId,
          fieldPath: fp,
          oldValue: removed,
          newValue: [...targetEnums],
          description: `Field "${fieldPath}" enum values removed: [${removed.join(", ")}]`,
        });
      }
      if (added.length > 0) {
        accum.push({
          id: makeChangeId(endpointId, location, "ENUM_VALUE_ADDED", fieldPath),
          kind: "ENUM_VALUE_ADDED",
          location,
          endpointId,
          fieldPath: fp,
          oldValue: [...baseEnums],
          newValue: added,
          description: `Field "${fieldPath}" enum values added: [${added.join(", ")}]`,
        });
      }
    }

    // Format
    if (baseField.format !== targetField.format) {
      if (baseField.format || targetField.format) {
        accum.push({
          id: makeChangeId(endpointId, location, "FORMAT_CHANGED", fieldPath),
          kind: "FORMAT_CHANGED",
          location,
          endpointId,
          fieldPath: fp,
          oldValue: baseField.format,
          newValue: targetField.format,
          description: `Field "${fieldPath}" format changed from "${baseField.format ?? "none"}" to "${targetField.format ?? "none"}"`,
        });
      }
    }

    // Constraints
    if (!constraintsEqual(baseField.constraints, targetField.constraints)) {
      const hasBaseConstraints = !!baseField.constraints;
      const hasTargetConstraints = !!targetField.constraints;
      const kind: ChangeKind = !hasBaseConstraints && hasTargetConstraints
        ? "CONSTRAINT_ADDED"
        : hasBaseConstraints && !hasTargetConstraints
          ? "CONSTRAINT_REMOVED"
          : "CONSTRAINT_ADDED"; // changed — treat as added (more specific)
      accum.push({
        id: makeChangeId(endpointId, location, kind, fieldPath),
        kind,
        location,
        endpointId,
        fieldPath: fp,
        oldValue: baseField.constraints,
        newValue: targetField.constraints,
        description: `Field "${fieldPath}" validation constraints ${kind === "CONSTRAINT_REMOVED" ? "removed" : "changed"}`,
      });
    }

    // Default
    const baseHasDefault = baseField.defaultValue !== undefined;
    const targetHasDefault = targetField.defaultValue !== undefined;
    if (baseHasDefault && !targetHasDefault) {
      accum.push({
        id: makeChangeId(endpointId, location, "DEFAULT_REMOVED", fieldPath),
        kind: "DEFAULT_REMOVED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: baseField.defaultValue,
        newValue: undefined,
        description: `Field "${fieldPath}" default value removed`,
      });
    } else if (!baseHasDefault && targetHasDefault) {
      accum.push({
        id: makeChangeId(endpointId, location, "DEFAULT_ADDED", fieldPath),
        kind: "DEFAULT_ADDED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: undefined,
        newValue: targetField.defaultValue,
        description: `Field "${fieldPath}" default value added: ${JSON.stringify(targetField.defaultValue)}`,
      });
    } else if (baseHasDefault && targetHasDefault && baseField.defaultValue !== targetField.defaultValue) {
      accum.push({
        id: makeChangeId(endpointId, location, "DEFAULT_CHANGED", fieldPath),
        kind: "DEFAULT_CHANGED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: baseField.defaultValue,
        newValue: targetField.defaultValue,
        description: `Field "${fieldPath}" default changed from ${JSON.stringify(baseField.defaultValue)} to ${JSON.stringify(targetField.defaultValue)}`,
      });
    }

    // Deprecation
    if (!baseField.deprecated && targetField.deprecated) {
      accum.push({
        id: makeChangeId(endpointId, location, "DEPRECATION_ADDED", fieldPath),
        kind: "DEPRECATION_ADDED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: false,
        newValue: true,
        description: `Field "${fieldPath}" marked as deprecated`,
      });
    } else if (baseField.deprecated && !targetField.deprecated) {
      accum.push({
        id: makeChangeId(endpointId, location, "DEPRECATION_REMOVED", fieldPath),
        kind: "DEPRECATION_REMOVED",
        location,
        endpointId,
        fieldPath: fp,
        oldValue: true,
        newValue: false,
        description: `Field "${fieldPath}" deprecation lifted`,
      });
    }

    // Recurse into object/array properties
    if (targetField.properties && baseField.properties) {
      diffFields(baseField.properties, targetField.properties, endpointId, location, statusCode, fieldPath, accum);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parameter diff
// ─────────────────────────────────────────────────────────────────────────────

function diffParameters(
  baseParams: readonly ApiParameter[],
  targetParams: readonly ApiParameter[],
  endpointId: string,
  accum: ContractChange[]
): void {
  const loc = (p: ApiParameter): ChangeLocation =>
    p.in === "path" ? "PATH_PARAM" : p.in === "query" ? "QUERY_PARAM" : "HEADER";

  const baseMap = new Map(baseParams.map((p) => [p.name, p]));
  const targetMap = new Map(targetParams.map((p) => [p.name, p]));

  for (const [name, basePrm] of Array.from(baseMap.entries())) {
    if (!targetMap.has(name)) {
      accum.push({
        id: makeChangeId(endpointId, loc(basePrm), "PARAMETER_REMOVED", name),
        kind: "PARAMETER_REMOVED",
        location: loc(basePrm),
        endpointId,
        oldValue: name,
        newValue: undefined,
        description: `Parameter "${name}" (${basePrm.in}) removed from ${endpointId}`,
      });
    }
  }

  for (const [name, targetPrm] of Array.from(targetMap.entries())) {
    if (!baseMap.has(name)) {
      accum.push({
        id: makeChangeId(endpointId, loc(targetPrm), "PARAMETER_ADDED", name),
        kind: "PARAMETER_ADDED",
        location: loc(targetPrm),
        endpointId,
        oldValue: undefined,
        newValue: name,
        description: `Parameter "${name}" (${targetPrm.in}) added to ${endpointId}${targetPrm.required ? " (required)" : " (optional)"}`,
      });
    } else {
      const basePrm = baseMap.get(name)!;
      if (basePrm.type !== targetPrm.type) {
        accum.push({
          id: makeChangeId(endpointId, loc(targetPrm), "TYPE_CHANGED", `param:${name}`),
          kind: "TYPE_CHANGED",
          location: loc(targetPrm),
          endpointId,
          oldValue: basePrm.type,
          newValue: targetPrm.type,
          description: `Parameter "${name}" type changed from "${basePrm.type}" to "${targetPrm.type}"`,
        });
      }
      if (!basePrm.required && targetPrm.required) {
        accum.push({
          id: makeChangeId(endpointId, loc(targetPrm), "REQUIREDNESS_ADDED", `param:${name}`),
          kind: "REQUIREDNESS_ADDED",
          location: loc(targetPrm),
          endpointId,
          oldValue: "optional",
          newValue: "required",
          description: `Parameter "${name}" became required`,
        });
      }
      if (!enumSetsEqual(basePrm.enumValues, targetPrm.enumValues)) {
        const baseE = new Set(basePrm.enumValues ?? []);
        const targetE = new Set(targetPrm.enumValues ?? []);
        const removed = [...baseE].filter((v) => !targetE.has(v));
        const added = [...targetE].filter((v) => !baseE.has(v));
        if (removed.length > 0) {
          accum.push({
            id: makeChangeId(endpointId, loc(targetPrm), "ENUM_VALUE_REMOVED", `param:${name}`),
            kind: "ENUM_VALUE_REMOVED",
            location: loc(targetPrm),
            endpointId,
            oldValue: removed,
            newValue: [...targetE],
            description: `Parameter "${name}" enum values removed: [${removed.join(", ")}]`,
          });
        }
        if (added.length > 0) {
          accum.push({
            id: makeChangeId(endpointId, loc(targetPrm), "ENUM_VALUE_ADDED", `param:${name}`),
            kind: "ENUM_VALUE_ADDED",
            location: loc(targetPrm),
            endpointId,
            oldValue: [...baseE],
            newValue: added,
            description: `Parameter "${name}" enum values added: [${added.join(", ")}]`,
          });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response code diff
// ─────────────────────────────────────────────────────────────────────────────

function diffResponses(
  baseResponses: readonly ResponseSchema[],
  targetResponses: readonly ResponseSchema[],
  endpointId: string,
  accum: ContractChange[]
): void {
  const baseMap = new Map(baseResponses.map((r) => [r.statusCode, r]));
  const targetMap = new Map(targetResponses.map((r) => [r.statusCode, r]));

  for (const [code] of Array.from(baseMap.entries())) {
    if (!targetMap.has(code)) {
      accum.push({
        id: makeChangeId(endpointId, "RESPONSE", "RESPONSE_CODE_REMOVED", String(code)),
        kind: "RESPONSE_CODE_REMOVED",
        location: "RESPONSE",
        endpointId,
        oldValue: code,
        newValue: undefined,
        description: `HTTP ${code} response removed from ${endpointId}`,
      });
    }
  }

  for (const [code, targetResp] of Array.from(targetMap.entries())) {
    if (!baseMap.has(code)) {
      accum.push({
        id: makeChangeId(endpointId, "RESPONSE", "RESPONSE_CODE_ADDED", String(code)),
        kind: "RESPONSE_CODE_ADDED",
        location: "RESPONSE",
        endpointId,
        newValue: code,
        oldValue: undefined,
        description: `HTTP ${code} response added to ${endpointId}`,
      });
    } else {
      const baseResp = baseMap.get(code)!;
      diffFields(baseResp.fields, targetResp.fields, endpointId, "RESPONSE", code, "", accum);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-endpoint diff
// ─────────────────────────────────────────────────────────────────────────────

function diffEndpoint(
  base: ApiEndpoint,
  target: ApiEndpoint,
  accum: ContractChange[]
): void {
  const eid = base.id;

  // Deprecation at endpoint level
  if (!base.deprecated && target.deprecated) {
    accum.push({
      id: makeChangeId(eid, "RESPONSE", "DEPRECATION_ADDED", "endpoint"),
      kind: "DEPRECATION_ADDED",
      location: "RESPONSE",
      endpointId: eid,
      description: `Endpoint ${eid} marked as deprecated`,
    });
  }

  // Parameters
  diffParameters(base.parameters, target.parameters, eid, accum);

  // Request body
  if (base.requestSchema && target.requestSchema) {
    diffFields(base.requestSchema.fields, target.requestSchema.fields, eid, "REQUEST", undefined, "", accum);
  } else if (!base.requestSchema && target.requestSchema) {
    accum.push({
      id: makeChangeId(eid, "REQUEST", "FIELD_ADDED", "requestBody"),
      kind: "FIELD_ADDED",
      location: "REQUEST",
      endpointId: eid,
      description: `Request body schema added to ${eid}`,
    });
  } else if (base.requestSchema && !target.requestSchema) {
    accum.push({
      id: makeChangeId(eid, "REQUEST", "FIELD_REMOVED", "requestBody"),
      kind: "FIELD_REMOVED",
      location: "REQUEST",
      endpointId: eid,
      description: `Request body schema removed from ${eid}`,
    });
  }

  // Responses
  diffResponses(base.responses, target.responses, eid, accum);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function diffContractVersions(
  apiId: string,
  baseVersion: ContractVersion,
  targetVersion: ContractVersion
): ContractDiff {
  const changes: ContractChange[] = [];

  const baseEndpointMap = new Map<string, ApiEndpoint>(
    baseVersion.endpoints.map((e) => [e.id, e])
  );
  const targetEndpointMap = new Map<string, ApiEndpoint>(
    targetVersion.endpoints.map((e) => [e.id, e])
  );

  const endpointsRemoved: string[] = [];
  const endpointsAdded: string[] = [];

  // Removed endpoints
  for (const [id] of Array.from(baseEndpointMap.entries())) {
    if (!targetEndpointMap.has(id)) {
      endpointsRemoved.push(id);
      changes.push({
        id: makeChangeId(id, "RESPONSE", "ENDPOINT_REMOVED", id),
        kind: "ENDPOINT_REMOVED",
        location: "RESPONSE",
        endpointId: id,
        oldValue: id,
        newValue: undefined,
        description: `Endpoint "${id}" removed`,
      });
    }
  }

  // Added endpoints
  for (const [id] of Array.from(targetEndpointMap.entries())) {
    if (!baseEndpointMap.has(id)) {
      endpointsAdded.push(id);
      changes.push({
        id: makeChangeId(id, "RESPONSE", "ENDPOINT_ADDED", id),
        kind: "ENDPOINT_ADDED",
        location: "RESPONSE",
        endpointId: id,
        oldValue: undefined,
        newValue: id,
        description: `Endpoint "${id}" added`,
      });
    }
  }

  // Changed endpoints
  for (const [id, baseEp] of Array.from(baseEndpointMap.entries())) {
    const targetEp = targetEndpointMap.get(id);
    if (targetEp) {
      diffEndpoint(baseEp, targetEp, changes);
    }
  }

  return {
    fromVersion: baseVersion.version,
    toVersion: targetVersion.version,
    apiId,
    changes,
    endpointsAdded,
    endpointsRemoved,
  };
}
