/**
 * Market Data Control Plane — Cross-Source Reconciliation Engine
 *
 * Reconciles multiple independent feeds (Direct Exchange, Vendor Consolidated,
 * Internal Reference Master, Settlement Clearing) for identical financial instruments.
 * Computes exact vs tolerance-based deltas, status classifications, and discrepancy severities.
 */

import {
  CanonicalInstrument,
  EntityReconciliationReport,
  FieldReconciliation,
  ReconciliationStatus,
  SeverityLevel,
  SourcePayloadRecord,
} from "../types";

export interface FieldReconRule {
  field: string;
  displayName: string;
  type: "NUMBER" | "STRING" | "DATE" | "ENUM";
  toleranceType?: "NONE" | "PERCENT" | "ABSOLUTE";
  toleranceValue?: number;
  severityOnMismatch: SeverityLevel;
  toleranceRuleDescription?: string;
}

export const DEFAULT_RECON_RULES: FieldReconRule[] = [
  {
    field: "lastSettlementPrice",
    displayName: "Settlement Price",
    type: "NUMBER",
    toleranceType: "ABSOLUTE",
    toleranceValue: 0.0001,
    severityOnMismatch: "CRITICAL",
    toleranceRuleDescription: "Zero-tolerance for official EOD settlement price (absolute diff <= 0.0001)",
  },
  {
    field: "contractSize",
    displayName: "Contract Multiplier Size",
    type: "NUMBER",
    toleranceType: "NONE",
    severityOnMismatch: "CRITICAL",
    toleranceRuleDescription: "Exact integer/decimal match required against master contract specs",
  },
  {
    field: "tickSize",
    displayName: "Minimum Tick Size",
    type: "NUMBER",
    toleranceType: "NONE",
    severityOnMismatch: "ERROR",
    toleranceRuleDescription: "Exact match on exchange minimum tick increment",
  },
  {
    field: "tickValue",
    displayName: "Tick Value ($)",
    type: "NUMBER",
    toleranceType: "NONE",
    severityOnMismatch: "CRITICAL",
    toleranceRuleDescription: "Exact calculated tick value (Contract Size × Tick Size)",
  },
  {
    field: "currency",
    displayName: "Denomination Currency",
    type: "STRING",
    toleranceType: "NONE",
    severityOnMismatch: "ERROR",
    toleranceRuleDescription: "Exact ISO-4217 currency symbol match",
  },
  {
    field: "settlementMethod",
    displayName: "Settlement Method",
    type: "ENUM",
    toleranceType: "NONE",
    severityOnMismatch: "ERROR",
    toleranceRuleDescription: "Exact settlement convention match (PHYSICAL vs CASH)",
  },
  {
    field: "volume24h",
    displayName: "24h Cumulative Volume",
    type: "NUMBER",
    toleranceType: "PERCENT",
    toleranceValue: 1.0, // 1% tolerance for intraday cadence timing
    severityOnMismatch: "WARNING",
    toleranceRuleDescription: "Volume diff <= 1.0% allowed due to multi-feed broadcast latency",
  },
  {
    field: "openInterest",
    displayName: "Open Interest (Contracts)",
    type: "NUMBER",
    toleranceType: "PERCENT",
    toleranceValue: 0.0, // EOD OI should be authoritative
    severityOnMismatch: "ERROR",
    toleranceRuleDescription: "Exact open interest contract match after clearing cycle",
  },
  {
    field: "lastTradingDate",
    displayName: "Last Trading Date",
    type: "DATE",
    toleranceType: "NONE",
    severityOnMismatch: "CRITICAL",
    toleranceRuleDescription: "Exact contract expiry date match",
  },
];

/**
 * Reconciles a golden reference record against multiple secondary source payload records.
 */
export function reconcileEntitySources(
  canonical: CanonicalInstrument,
  sourceRecords: SourcePayloadRecord[],
  goldenSourceCode: string = "IDS_REF_MASTER",
  rules: FieldReconRule[] = DEFAULT_RECON_RULES
): EntityReconciliationReport {
  const fieldsRecon: FieldReconciliation[] = [];
  let mismatchCount = 0;
  let warningCount = 0;

  // Flatten canonical values into field map
  const canonicalMap: Record<string, string | number | null> = {
    symbol: canonical.symbol,
    rootSymbol: canonical.rootSymbol,
    lastSettlementPrice: canonical.lastSettlementPrice,
    contractSize: canonical.specs.contractSize,
    tickSize: canonical.specs.tickSize,
    tickValue: canonical.specs.tickValue,
    currency: canonical.specs.currency,
    settlementMethod: canonical.specs.settlementMethod,
    volume24h: canonical.volume24h,
    openInterest: canonical.openInterest,
    lastTradingDate: canonical.specs.lastTradingDate,
    firstNoticeDate: canonical.specs.firstNoticeDate ?? null,
    tradingHours: canonical.specs.tradingHours,
  };

  for (const rule of rules) {
    const goldenVal = canonicalMap[rule.field] ?? null;
    const secondaryValues: FieldReconciliation["secondaryValues"] = [];
    let fieldStatus: ReconciliationStatus = "MATCH";
    let fieldSeverity: SeverityLevel = "PASS";
    let explanation = `All sources agree on ${rule.displayName}.`;

    for (const src of sourceRecords) {
      if (src.sourceCode === goldenSourceCode) continue;

      const srcVal = src.fields[rule.field];

      if (srcVal === undefined || srcVal === null) {
        secondaryValues.push({
          sourceCode: src.sourceCode,
          value: null,
          status: "MISSING_SOURCE",
        });
        if (fieldStatus === "MATCH") {
          fieldStatus = "WARNING";
          fieldSeverity = "WARNING";
          explanation = `Field ${rule.displayName} is missing in feed ${src.sourceCode}.`;
          warningCount++;
        }
        continue;
      }

      if (rule.type === "NUMBER" && typeof goldenVal === "number" && typeof srcVal === "number") {
        const delta = Math.round((srcVal - goldenVal) * 1000000) / 1000000;
        const deltaPercent = goldenVal !== 0 ? Math.abs((delta / goldenVal) * 100) : 0;

        let matchStatus: ReconciliationStatus = "MATCH";

        if (delta === 0) {
          matchStatus = "MATCH";
        } else if (rule.toleranceType === "PERCENT" && rule.toleranceValue !== undefined) {
          if (deltaPercent <= rule.toleranceValue) {
            matchStatus = "WITHIN_TOLERANCE";
          } else {
            matchStatus = "MISMATCH";
          }
        } else if (rule.toleranceType === "ABSOLUTE" && rule.toleranceValue !== undefined) {
          if (Math.abs(delta) <= rule.toleranceValue) {
            matchStatus = "WITHIN_TOLERANCE";
          } else {
            matchStatus = "MISMATCH";
          }
        } else {
          matchStatus = "MISMATCH";
        }

        secondaryValues.push({
          sourceCode: src.sourceCode,
          value: srcVal,
          status: matchStatus,
          delta: delta !== 0 ? delta : undefined,
          deltaPercent: deltaPercent !== 0 ? Math.round(deltaPercent * 100) / 100 : undefined,
        });

        if (matchStatus === "MISMATCH") {
          fieldStatus = "MISMATCH";
          fieldSeverity = rule.severityOnMismatch;
          explanation = `Discrepancy detected in ${src.sourceCode}: reported ${srcVal} vs master ${goldenVal} (Δ ${delta > 0 ? "+" : ""}${delta}, ${deltaPercent.toFixed(2)}%).`;
          mismatchCount++;
        } else if (matchStatus === "WITHIN_TOLERANCE" && fieldStatus === "MATCH") {
          fieldStatus = "WITHIN_TOLERANCE";
          explanation = `Minor variance in ${src.sourceCode} (${deltaPercent.toFixed(2)}%) within allowable tolerance threshold (${rule.toleranceValue}%).`;
        }
      } else {
        // String, Enum, Date matching
        const gStr = String(goldenVal ?? "").trim().toUpperCase();
        const sStr = String(srcVal ?? "").trim().toUpperCase();

        if (gStr === sStr) {
          secondaryValues.push({
            sourceCode: src.sourceCode,
            value: srcVal as any,
            status: "MATCH",
          });
        } else {
          secondaryValues.push({
            sourceCode: src.sourceCode,
            value: srcVal as any,
            status: "MISMATCH",
            delta: `${sStr} ≠ ${gStr}`,
          });
          fieldStatus = "MISMATCH";
          fieldSeverity = rule.severityOnMismatch;
          explanation = `Value conflict on ${rule.displayName}: ${src.sourceCode} reported '${srcVal}' vs master '${goldenVal}'.`;
          mismatchCount++;
        }
      }
    }

    fieldsRecon.push({
      field: rule.field,
      displayName: rule.displayName,
      goldenSourceValue: goldenVal,
      goldenSourceCode,
      secondaryValues,
      status: fieldStatus,
      severity: fieldSeverity,
      toleranceRule: rule.toleranceRuleDescription,
      explanation,
    });
  }

  let overallStatus: ReconciliationStatus = "MATCH";
  if (mismatchCount > 0) overallStatus = "MISMATCH";
  else if (warningCount > 0) overallStatus = "WARNING";

  const sourcesCompared = [goldenSourceCode, ...sourceRecords.map((s) => s.sourceCode).filter((c) => c !== goldenSourceCode)];

  return {
    entityId: canonical.id,
    symbol: canonical.symbol,
    name: canonical.name,
    exchange: canonical.exchange,
    evaluatedAt: new Date().toISOString(),
    overallStatus,
    fields: fieldsRecon,
    sourcesCompared,
    mismatchCount,
    warningCount,
  };
}
