/**
 * Market Data Control Plane — Data Quality Engine
 *
 * Pure deterministic rule evaluation engine covering 8 distinct quality dimensions:
 * COMPLETENESS, VALIDITY, CONSISTENCY, TIMELINESS, UNIQUENESS,
 * REFERENTIAL_INTEGRITY, BUSINESS_RULE, SCHEMA.
 */

import {
  CanonicalInstrument,
  DimensionScore,
  QualityRule,
  QualityRuleCategory,
  QualityScorecard,
  RuleEvaluationResult,
  SeverityLevel,
} from "../types";

export const DEFAULT_QUALITY_RULES: QualityRule[] = [
  {
    id: "QR-COMP-001",
    name: "Mandatory Symbol & Root Symbol",
    category: "COMPLETENESS",
    description: "Instrument must specify a non-empty symbol and root contract code.",
    targetField: "symbol",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "CRITICAL",
    expression: "symbol != null && rootSymbol != null",
    evaluatorFnKey: "evalSymbolCompleteness",
  },
  {
    id: "QR-COMP-002",
    name: "Mandatory Contract Size & Unit",
    category: "COMPLETENESS",
    description: "Contract specifications must declare positive multiplier size and standard unit.",
    targetField: "specs.contractSize",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "CRITICAL",
    expression: "specs.contractSize > 0 && specs.contractUnit != ''",
    evaluatorFnKey: "evalContractSizeCompleteness",
  },
  {
    id: "QR-VAL-001",
    name: "Positive Non-Zero Settlement Price",
    category: "VALIDITY",
    description: "Settlement price must be strictly positive numeric value for standard futures contracts.",
    targetField: "lastSettlementPrice",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "ERROR",
    expression: "lastSettlementPrice > 0",
    evaluatorFnKey: "evalPositiveSettlement",
  },
  {
    id: "QR-VAL-002",
    name: "Valid Standard Currency Code",
    category: "VALIDITY",
    description: "Contract currency must match ISO 4217 3-letter standard (USD, EUR, GBP, JPY, CAD).",
    targetField: "specs.currency",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "ERROR",
    expression: "specs.currency in ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF']",
    evaluatorFnKey: "evalCurrencyValidity",
  },
  {
    id: "QR-VAL-003",
    name: "Tick Size Granularity Constraint",
    category: "VALIDITY",
    description: "Tick size must be strictly positive and a recognized standard fraction/decimal.",
    targetField: "specs.tickSize",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "ERROR",
    expression: "specs.tickSize > 0 && specs.tickSize <= 50.0",
    evaluatorFnKey: "evalTickSizeValidity",
  },
  {
    id: "QR-CONS-001",
    name: "Tick Value Coherence (Size × Multiplier)",
    category: "CONSISTENCY",
    description: "Tick value in monetary terms must equal contractSize × tickSize within float precision.",
    targetField: "specs.tickValue",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "CRITICAL",
    expression: "abs(specs.tickValue - (specs.contractSize * specs.tickSize)) < 0.0001",
    evaluatorFnKey: "evalTickValueConsistency",
  },
  {
    id: "QR-CONS-002",
    name: "Delivery Date Chronological Sequence",
    category: "CONSISTENCY",
    description: "Last trading date must be greater than or equal to first notice date when both exist.",
    targetField: "specs.lastTradingDate",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "WARNING",
    expression: "firstNoticeDate == null || lastTradingDate >= firstNoticeDate",
    evaluatorFnKey: "evalDateChronology",
  },
  {
    id: "QR-TIME-001",
    name: "Settlement Feed Freshness SLA (< 24h)",
    category: "TIMELINESS",
    description: "Active instrument settlement prices must have been published within the last 24 trading hours.",
    targetField: "updatedAt",
    targetEntity: "FEED",
    severityOnFailure: "WARNING",
    expression: "now() - parseDate(updatedAt) <= 86400000",
    evaluatorFnKey: "evalTimelinessFreshness",
  },
  {
    id: "QR-UNIQ-001",
    name: "Unique Exchange Symbol Per Venue",
    category: "UNIQUENESS",
    description: "No two active records in the canonical registry may share the same exchange and symbol.",
    targetField: "symbol",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "CRITICAL",
    expression: "unique(exchange + '_' + symbol)",
    evaluatorFnKey: "evalUniqueSymbolVenue",
  },
  {
    id: "QR-REF-001",
    name: "Authoritative Exchange Venue Mapping",
    category: "REFERENTIAL_INTEGRITY",
    description: "Exchange code must map to a recognized registered exchange master (CME, ICE, EUREX, CBOT, NYMEX).",
    targetField: "exchange",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "ERROR",
    expression: "exchange in ['CME', 'ICE', 'EUREX', 'CBOT', 'NYMEX']",
    evaluatorFnKey: "evalExchangeRefIntegrity",
  },
  {
    id: "QR-BIZ-001",
    name: "Non-Negative Volume & Open Interest",
    category: "BUSINESS_RULE",
    description: "Reported 24h trading volume and open interest contracts must be non-negative integers.",
    targetField: "volume24h",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "ERROR",
    expression: "volume24h >= 0 && openInterest >= 0",
    evaluatorFnKey: "evalNonNegativeMetrics",
  },
  {
    id: "QR-BIZ-002",
    name: "Settlement Method Compliance",
    category: "BUSINESS_RULE",
    description: "Settlement method must be PHYSICAL, CASH, or AUCTION matching asset class conventions.",
    targetField: "specs.settlementMethod",
    targetEntity: "INSTRUMENT",
    severityOnFailure: "INFO",
    expression: "specs.settlementMethod in ['PHYSICAL', 'CASH', 'AUCTION']",
    evaluatorFnKey: "evalSettlementMethodBizRule",
  },
  {
    id: "QR-SCH-001",
    name: "Canonical Schema Spec Completeness",
    category: "SCHEMA",
    description: "All contract specification object keys must be populated without missing types.",
    targetField: "specs",
    targetEntity: "SCHEMA",
    severityOnFailure: "WARNING",
    expression: "typeof specs === 'object' && specs.tradingHours != ''",
    evaluatorFnKey: "evalSchemaSpecCompleteness",
  },
];

/**
 * Deterministically evaluates all rules against an instrument.
 */
export function evaluateInstrumentRules(
  instrument: CanonicalInstrument,
  allInstruments: CanonicalInstrument[] = [instrument],
  rules: QualityRule[] = DEFAULT_QUALITY_RULES,
  referenceDateStr: string = "2026-09-13T12:00:00Z"
): RuleEvaluationResult[] {
  const refTime = new Date(referenceDateStr).getTime();
  const results: RuleEvaluationResult[] = [];

  for (const rule of rules) {
    let passed = true;
    let actualValue: string | number | null | undefined = null;
    let expectedValue = "";
    let message = "";
    let remediationHint = "";
    let severity: SeverityLevel = "PASS";

    switch (rule.id) {
      case "QR-COMP-001": {
        actualValue = `${instrument.symbol} / ${instrument.rootSymbol}`;
        expectedValue = "Non-empty symbol and rootSymbol strings";
        passed = Boolean(instrument.symbol?.trim() && instrument.rootSymbol?.trim());
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Missing mandatory symbol or root symbol on instrument ${instrument.id}.`;
          remediationHint = "Verify feed parser mapping for ticker extraction.";
        } else {
          message = `Symbol '${instrument.symbol}' and root '${instrument.rootSymbol}' are valid.`;
        }
        break;
      }

      case "QR-COMP-002": {
        actualValue = `${instrument.specs.contractSize} ${instrument.specs.contractUnit}`;
        expectedValue = "Positive contract size with declared unit";
        passed = instrument.specs.contractSize > 0 && Boolean(instrument.specs.contractUnit?.trim());
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Contract size (${instrument.specs.contractSize}) must be positive with a valid unit.`;
          remediationHint = "Inject default contract unit from IDS reference master.";
        } else {
          message = `Contract size ${instrument.specs.contractSize} ${instrument.specs.contractUnit} is complete.`;
        }
        break;
      }

      case "QR-VAL-001": {
        actualValue = instrument.lastSettlementPrice;
        expectedValue = "Settlement price > 0.00";
        passed = typeof instrument.lastSettlementPrice === "number" && instrument.lastSettlementPrice > 0;
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Settlement price is ${instrument.lastSettlementPrice}, which violates positive price constraint.`;
          remediationHint = "Review clearing report for zero/negative mark flag or halt condition.";
        } else {
          message = `Settlement price ${instrument.lastSettlementPrice.toFixed(4)} is strictly positive.`;
        }
        break;
      }

      case "QR-VAL-002": {
        const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "CHF"];
        actualValue = instrument.specs.currency;
        expectedValue = validCurrencies.join(", ");
        passed = validCurrencies.includes(instrument.specs.currency);
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Currency '${instrument.specs.currency}' is not in the recognized ISO-4217 list.`;
          remediationHint = "Map vendor currency string to ISO 4217 standard currency code.";
        } else {
          message = `Currency '${instrument.specs.currency}' is a valid ISO 4217 code.`;
        }
        break;
      }

      case "QR-VAL-003": {
        actualValue = instrument.specs.tickSize;
        expectedValue = "0 < tickSize <= 50.0";
        passed =
          typeof instrument.specs.tickSize === "number" &&
          instrument.specs.tickSize > 0 &&
          instrument.specs.tickSize <= 50;
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Tick size ${instrument.specs.tickSize} is outside realistic boundaries.`;
          remediationHint = "Cross-reference exchange rulebook circular for current minimum tick tier.";
        } else {
          message = `Tick size ${instrument.specs.tickSize} is within normal parameters.`;
        }
        break;
      }

      case "QR-CONS-001": {
        const expectedTickVal = instrument.specs.contractSize * instrument.specs.tickSize;
        const diff = Math.abs(instrument.specs.tickValue - expectedTickVal);
        actualValue = instrument.specs.tickValue;
        expectedValue = expectedTickVal.toFixed(4);
        passed = diff < 0.001;
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Tick value mismatch: reported ${instrument.specs.tickValue} vs computed ${expectedTickVal} (Size ${instrument.specs.contractSize} × Tick ${instrument.specs.tickSize}).`;
          remediationHint = "Recalculate tick value from contract multiplier or check decimal precision scaling.";
        } else {
          message = `Tick value ${instrument.specs.tickValue} matches size × tick calculation.`;
        }
        break;
      }

      case "QR-CONS-002": {
        const fnDate = instrument.specs.firstNoticeDate;
        const ltDate = instrument.specs.lastTradingDate;
        actualValue = `Notice: ${fnDate ?? "N/A"} | Last Trade: ${ltDate}`;
        expectedValue = "lastTradingDate >= firstNoticeDate";
        if (fnDate && ltDate) {
          passed = new Date(ltDate).getTime() >= new Date(fnDate).getTime();
        } else {
          passed = true;
        }
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Chronology error: Last trading date (${ltDate}) precedes first notice date (${fnDate}).`;
          remediationHint = "Verify delivery cycle schedule against exchange calendar.";
        } else {
          message = `Chronological sequence verified for contract delivery cycle.`;
        }
        break;
      }

      case "QR-TIME-001": {
        const updateTime = new Date(instrument.updatedAt).getTime();
        const ageHours = (refTime - updateTime) / (1000 * 60 * 60);
        actualValue = `${ageHours.toFixed(1)}h ago (${instrument.updatedAt})`;
        expectedValue = "< 24.0 hours";
        passed = ageHours <= 24.5; // allowance for market close
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Feed update latency breach: record is ${ageHours.toFixed(1)} hours old (exceeds 24h SLA).`;
          remediationHint = "Check upstream feed connector status or trigger manual poll snapshot.";
        } else {
          message = `Record timestamp freshness is within SLA (${ageHours.toFixed(1)}h age).`;
        }
        break;
      }

      case "QR-UNIQ-001": {
        const duplicates = allInstruments.filter(
          (i) => i.exchange === instrument.exchange && i.symbol === instrument.symbol
        );
        actualValue = `${duplicates.length} match(es)`;
        expectedValue = "Exactly 1 unique record";
        passed = duplicates.length === 1;
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Collision: ${duplicates.length} records found with venue ${instrument.exchange} and symbol ${instrument.symbol}.`;
          remediationHint = "Deduplicate canonical entity records on composite primary key (exchange, symbol).";
        } else {
          message = `Unique exchange symbol constraint satisfied.`;
        }
        break;
      }

      case "QR-REF-001": {
        const validExchanges = ["CME", "ICE", "EUREX", "CBOT", "NYMEX"];
        actualValue = instrument.exchange;
        expectedValue = validExchanges.join(", ");
        passed = validExchanges.includes(instrument.exchange);
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Exchange code '${instrument.exchange}' is not registered in authoritative exchange master.`;
          remediationHint = "Register exchange identifier in venue reference dictionary.";
        } else {
          message = `Exchange code '${instrument.exchange}' is verified in venue registry.`;
        }
        break;
      }

      case "QR-BIZ-001": {
        actualValue = `Vol: ${instrument.volume24h}, OI: ${instrument.openInterest}`;
        expectedValue = "volume24h >= 0 && openInterest >= 0";
        passed = instrument.volume24h >= 0 && instrument.openInterest >= 0;
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Negative volume or open interest detected (${actualValue}).`;
          remediationHint = "Check integer overflow or negative delta adjustment in volume accumulator.";
        } else {
          message = `Volume (${instrument.volume24h.toLocaleString()}) and OI (${instrument.openInterest.toLocaleString()}) are valid.`;
        }
        break;
      }

      case "QR-BIZ-002": {
        const validMethods = ["PHYSICAL", "CASH", "AUCTION"];
        actualValue = instrument.specs.settlementMethod;
        expectedValue = validMethods.join(", ");
        passed = validMethods.includes(instrument.specs.settlementMethod);
        if (!passed) {
          severity = rule.severityOnFailure;
          message = `Settlement method '${instrument.specs.settlementMethod}' is unrecognized.`;
          remediationHint = "Align settlement method enum with standard clearing schema.";
        } else {
          message = `Settlement method '${instrument.specs.settlementMethod}' is valid.`;
        }
        break;
      }

      case "QR-SCH-001": {
        actualValue = typeof instrument.specs === "object" ? "Object populated" : "Invalid specs";
        expectedValue = "Structured contract specification object with trading hours";
        passed = Boolean(instrument.specs && instrument.specs.tradingHours?.trim());
        if (!passed) {
          severity = rule.severityOnFailure;
          message = "Contract specification object is missing required tradingHours definition.";
          remediationHint = "Enforce canonical JSON schema validation at ingestion boundary.";
        } else {
          message = `Contract specification schema meets structural completeness.`;
        }
        break;
      }

      default:
        passed = true;
        actualValue = "OK";
        expectedValue = "N/A";
        message = `Custom rule evaluation passed.`;
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      targetEntityId: instrument.id,
      symbol: instrument.symbol,
      targetField: rule.targetField,
      severity: passed ? "PASS" : severity,
      passed,
      actualValue,
      expectedValue,
      message,
      remediationHint,
      evaluatedAt: referenceDateStr,
    });
  }

  return results;
}

export const evaluateInstrumentQuality = evaluateInstrumentRules;

/**
 * Computes dimension scores and overall health scorecard across evaluation results.
 */
export function computeQualityScorecard(
  evaluationResults: RuleEvaluationResult[],
  generatedAt: string = new Date().toISOString()
): QualityScorecard {
  const categories: QualityRuleCategory[] = [
    "COMPLETENESS",
    "VALIDITY",
    "CONSISTENCY",
    "TIMELINESS",
    "UNIQUENESS",
    "REFERENTIAL_INTEGRITY",
    "BUSINESS_RULE",
    "SCHEMA",
  ];

  const dimensionScores: Record<QualityRuleCategory, DimensionScore> = {} as any;
  const categoryScores: Record<string, number> = {};

  let passedCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let criticalCount = 0;

  for (const cat of categories) {
    dimensionScores[cat] = {
      category: cat,
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      scorePercent: 100,
      status: "EXCELLENT",
    };
  }

  for (const res of evaluationResults) {
    const dim = dimensionScores[res.category];
    if (dim) {
      dim.totalChecks += 1;
      if (res.passed) {
        dim.passedChecks += 1;
        passedCount += 1;
      } else {
        dim.failedChecks += 1;
        if (res.severity === "WARNING" || res.severity === "INFO") warningCount += 1;
        if (res.severity === "ERROR") errorCount += 1;
        if (res.severity === "CRITICAL") criticalCount += 1;
      }
    }
  }

  // Calculate per-category percentages & status
  let weightedSum = 0;
  let totalRules = evaluationResults.length;

  for (const cat of categories) {
    const dim = dimensionScores[cat];
    if (dim.totalChecks > 0) {
      dim.scorePercent = Math.round((dim.passedChecks / dim.totalChecks) * 100);
      if (dim.scorePercent >= 90) dim.status = "EXCELLENT";
      else if (dim.scorePercent >= 70) dim.status = "DEGRADED";
      else dim.status = "FAILING";
      weightedSum += dim.scorePercent;
    } else {
      dim.scorePercent = 100;
      dim.status = "EXCELLENT";
      weightedSum += 100;
    }
    categoryScores[cat] = dim.scorePercent;
  }

  const overallScore = totalRules > 0 ? Math.round(weightedSum / categories.length) : 100;

  return {
    overallScore,
    totalRulesEvaluated: totalRules,
    totalEvaluations: totalRules,
    passedCount,
    passedEvaluations: passedCount,
    warningCount,
    errorCount,
    criticalCount,
    categoryScores,
    dimensionScores,
    generatedAt,
  };
}
