// ExchangeLens — deterministic validator
// Pure TypeScript functions — no UI dependencies.
// Input: extracted fields + reference fields → ValidationResult[]

import type {
  ExtractedField,
  ReferenceField,
  ValidationResult,
  ValidationStatus,
  EvidenceItem,
} from "../types";

/**
 * Normalize a value string for comparison:
 * strip currency symbols, commas, whitespace; lowercase.
 */
function normalizeValue(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[€$£,\s]/g, "")
    .replace(/usd|eur|gbp/g, "")
    .trim();
}

/**
 * Determine validation status by comparing normalized extracted vs reference values.
 * PASS       — values match after normalization
 * WARNING    — values differ but within allowed tolerance OR field is a format/labeling difference
 * MISMATCH   — values differ in a materially significant way
 */
function classifyStatus(
  extracted: string,
  reference: string,
  fieldName: string
): ValidationStatus {
  const normExtracted = normalizeValue(extracted);
  const normReference = normalizeValue(reference);

  if (normExtracted === normReference) return "PASS";

  // Numeric fields: attempt float comparison with tolerance
  const numExtracted = parseFloat(normExtracted);
  const numReference = parseFloat(normReference);

  if (!isNaN(numExtracted) && !isNaN(numReference)) {
    const pctDiff = Math.abs(numExtracted - numReference) / Math.abs(numReference || 1);
    if (pctDiff < 0.001) return "PASS"; // within 0.1% — floating-point/formatting artifact
    if (pctDiff < 0.05) return "WARNING"; // within 5% — possible rounding / format variant
    return "MISMATCH"; // material difference
  }

  // String fields: check if extracted is a substring / prefix of reference (format variant)
  if (
    normReference.includes(normExtracted) ||
    normExtracted.includes(normReference)
  ) {
    return "WARNING";
  }

  // Special known-equivalent mappings (fintech domain rules)
  const equivalences: [string, string][] = [
    ["financial", "cash/financial"],
    ["cash settled", "cash settlement"],
    ["cashsettled(index)", "cashsettlement"],
    ["physicaldelivery", "physicaldelivery(deliverablebasketwith8.5to10.5yearsmaturity)"],
    ["t+2fromnoticeday", "t+2followingnoticedaytenthcalendardayofmonth"],
    ["1000barrels", "1,000barrels(42,000gallons)"],
    ["tier1-standard", "span initial/maintenance"],
  ];

  for (const [a, b] of equivalences) {
    const na = normalizeValue(a);
    const nb = normalizeValue(b);
    if (
      (normExtracted === na && normReference === nb) ||
      (normExtracted === nb && normReference === na)
    ) {
      return "WARNING";
    }
  }

  return "MISMATCH";
}

/**
 * Build a human-readable delta description.
 */
function buildDelta(
  status: ValidationStatus,
  extracted: string,
  reference: string,
  fieldName: string
): string | undefined {
  if (status === "PASS") return undefined;

  const numE = parseFloat(normalizeValue(extracted));
  const numR = parseFloat(normalizeValue(reference));

  if (!isNaN(numE) && !isNaN(numR)) {
    const diff = numE - numR;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(4).replace(/\.?0+$/, "")} from reference`;
  }

  if (status === "WARNING") {
    return "Format / label variant — semantic equivalence likely";
  }

  return `Extracted "${extracted}" does not match reference "${reference}"`;
}

/**
 * Run the deterministic validation engine.
 * Returns one ValidationResult per matched field (extracted ∩ reference).
 * Fields present only in one set are skipped (no phantom results).
 */
export function runValidation(
  extractedFields: ExtractedField[],
  referenceFields: ReferenceField[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const ef of extractedFields) {
    const rf = referenceFields.find((r) => r.fieldName === ef.fieldName);
    if (!rf) continue; // no reference counterpart — skip

    const status = classifyStatus(ef.extractedValue, rf.referenceValue, ef.fieldName);
    const delta = buildDelta(status, ef.extractedValue, rf.referenceValue, ef.fieldName);

    const evidence: EvidenceItem = {
      documentId: `DOC:${ef.fieldName.toUpperCase()}`,
      sectionLabel: `Extracted from notice — field: ${ef.displayLabel}`,
      extractedStatement: ef.rawSnippet,
      affectedField: ef.fieldName,
      isSampleEvidence: true,
    };

    results.push({
      fieldName: ef.fieldName,
      displayLabel: ef.displayLabel,
      status,
      extractedValue: ef.extractedValue,
      referenceValue: rf.referenceValue,
      delta,
      ruleApplied: `Reference source: ${rf.source} (verified ${rf.lastVerified})`,
      evidence,
    });
  }

  return results;
}

/**
 * Summarize a set of validation results into counts.
 */
export interface ValidationSummary {
  total: number;
  pass: number;
  warning: number;
  mismatch: number;
  overallStatus: ValidationStatus;
}

export function summarize(results: ValidationResult[]): ValidationSummary {
  const pass = results.filter((r) => r.status === "PASS").length;
  const warning = results.filter((r) => r.status === "WARNING").length;
  const mismatch = results.filter((r) => r.status === "MISMATCH").length;

  let overallStatus: ValidationStatus = "PASS";
  if (mismatch > 0) overallStatus = "MISMATCH";
  else if (warning > 0) overallStatus = "WARNING";

  return { total: results.length, pass, warning, mismatch, overallStatus };
}
