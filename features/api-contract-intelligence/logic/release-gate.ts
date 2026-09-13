/**
 * API Contract Intelligence — Release Gate Evaluator
 * Produces a deterministic ALLOW / WARN / BLOCK decision for a proposed
 * version upgrade given: the diff, its compatibility classification, consumer
 * impact reports, and the contract test suite results.
 *
 * Scoring model (lower is better):
 *   BREAKING finding    → +40 pts each
 *   POTENTIALLY_BREAKING → +15 pts each
 *   CRITICAL consumer impact → +50 pts each
 *   HIGH consumer impact     → +20 pts each
 *   VERSION_LOCKED consumer affected → +30 pts each (additional)
 *   Test FAIL (unexpected) → +10 pts each
 *   Test WARNING (unexpected) → +3 pts each
 *
 * Decision thresholds:
 *   score = 0            → ALLOW
 *   1 ≤ score ≤ 49       → WARN  (non-zero but no critical items)
 *   score ≥ 50           → BLOCK
 *   Any CRITICAL consumer impact → BLOCK (irrespective of score)
 *   Any BREAKING change + no migration window flag → BLOCK
 *
 * Pure function: same inputs → same output.
 */

import {
  CompatibilityReport,
  ConsumerImpactReport,
  ContractDiff,
  ContractTestSuiteResult,
  ReleaseDecision,
  ReleaseGateResult,
} from "../types";
import { SYNTHETIC_CONSUMERS } from "../data/consumers";

// ─────────────────────────────────────────────────────────────────────────────
// Scoring constants
// ─────────────────────────────────────────────────────────────────────────────

const SCORE = {
  BREAKING_FINDING: 40,
  POTENTIALLY_BREAKING_FINDING: 15,
  CRITICAL_CONSUMER: 50,
  HIGH_CONSUMER: 20,
  VERSION_LOCKED_SURCHARGE: 30,
  TEST_FAIL: 10,
  TEST_WARN: 3,
} as const;

const THRESHOLD_WARN = 1;
const THRESHOLD_BLOCK = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Rule evaluation helpers
// ─────────────────────────────────────────────────────────────────────────────

interface GateRule {
  ruleId: string;
  description: string;
  passed: boolean;
  scoreContribution: number;
  detail: string;
}

function evaluateCompatibilityRules(compatReport: CompatibilityReport): GateRule[] {
  const rules: GateRule[] = [];

  const breakingFindings = compatReport.findings.filter((f) => f.compatibility === "BREAKING");
  const potentiallyBreaking = compatReport.findings.filter((f) => f.compatibility === "POTENTIALLY_BREAKING");

  // Rule: No breaking changes
  rules.push({
    ruleId: "GATE-001",
    description: "No breaking changes in this version transition",
    passed: breakingFindings.length === 0,
    scoreContribution: breakingFindings.length * SCORE.BREAKING_FINDING,
    detail: breakingFindings.length === 0
      ? "No breaking changes detected."
      : `${breakingFindings.length} breaking change${breakingFindings.length > 1 ? "s" : ""} detected: ${
          breakingFindings.slice(0, 3).map((f) => f.ruleTitle).join("; ")
        }${breakingFindings.length > 3 ? ` + ${breakingFindings.length - 3} more` : ""}`,
  });

  // Rule: No potentially-breaking changes (or flagged for review)
  rules.push({
    ruleId: "GATE-002",
    description: "No potentially-breaking changes require manual review",
    passed: potentiallyBreaking.length === 0,
    scoreContribution: potentiallyBreaking.length * SCORE.POTENTIALLY_BREAKING_FINDING,
    detail: potentiallyBreaking.length === 0
      ? "No potentially-breaking changes."
      : `${potentiallyBreaking.length} potentially-breaking change${potentiallyBreaking.length > 1 ? "s" : ""} require validation before release.`,
  });

  // Rule: No endpoint removals without deprecation notice
  const endpointRemovals = compatReport.findings.filter(
    (f) => f.ruleId === "COMPAT-EP-001"
  );
  rules.push({
    ruleId: "GATE-003",
    description: "No endpoint removals without prior deprecation period",
    passed: endpointRemovals.length === 0,
    scoreContribution: 0, // Captured by GATE-001 (these are always BREAKING)
    detail: endpointRemovals.length === 0
      ? "No endpoints removed."
      : `${endpointRemovals.length} endpoint${endpointRemovals.length > 1 ? "s" : ""} removed: ${
          endpointRemovals.map((f) => f.endpointId).join(", ")
        }. Verify deprecation headers were published and sunset window elapsed.`,
  });

  return rules;
}

function evaluateConsumerRules(
  impactReports: readonly ConsumerImpactReport[]
): GateRule[] {
  const rules: GateRule[] = [];

  const criticalImpacts = impactReports.filter((r) => r.overallImpact === "CRITICAL");
  const highImpacts = impactReports.filter((r) => r.overallImpact === "HIGH");
  const versionLockedImpacted = impactReports.filter((r) => {
    // A consumer is VERSION_LOCKED if any of their dependencies declare it
    return SYNTHETIC_CONSUMERS.find(
      (c) => c.id === r.consumerId &&
        c.dependencies.some((d) => d.toleranceBehavior === "VERSION_LOCKED")
    );
  });

  // Rule: No critical consumer impact
  rules.push({
    ruleId: "GATE-010",
    description: "No consumers experience CRITICAL-level impact",
    passed: criticalImpacts.length === 0,
    scoreContribution: criticalImpacts.length * SCORE.CRITICAL_CONSUMER,
    detail: criticalImpacts.length === 0
      ? "No consumers at critical risk."
      : `${criticalImpacts.length} consumer${criticalImpacts.length > 1 ? "s" : ""} at CRITICAL risk: ${
          criticalImpacts.map((r) => r.consumerName).join(", ")
        }. Deployment will break production consumers.`,
  });

  // Rule: High-impact consumers have mitigation plans
  rules.push({
    ruleId: "GATE-011",
    description: "High-impact consumers have been identified and notified",
    passed: highImpacts.length === 0,
    scoreContribution: highImpacts.length * SCORE.HIGH_CONSUMER,
    detail: highImpacts.length === 0
      ? "No consumers at high risk."
      : `${highImpacts.length} consumer${highImpacts.length > 1 ? "s" : ""} at HIGH risk: ${
          highImpacts.map((r) => r.consumerName).join(", ")
        }. Confirm upgrade coordination before release.`,
  });

  // Rule: Version-locked consumers have been escalated
  rules.push({
    ruleId: "GATE-012",
    description: "No VERSION_LOCKED consumers are affected by this change",
    passed: versionLockedImpacted.length === 0,
    scoreContribution: versionLockedImpacted.length * SCORE.VERSION_LOCKED_SURCHARGE,
    detail: versionLockedImpacted.length === 0
      ? "No version-locked consumers affected."
      : `${versionLockedImpacted.length} VERSION_LOCKED consumer${versionLockedImpacted.length > 1 ? "s" : ""} affected: ${
          versionLockedImpacted.map((r) => r.consumerName).join(", ")
        }. These consumers require a dedicated validation cycle before any upgrade.`,
  });

  return rules;
}

function evaluateTestRules(testResults: ContractTestSuiteResult | null): GateRule[] {
  const rules: GateRule[] = [];

  if (!testResults) {
    rules.push({
      ruleId: "GATE-020",
      description: "Contract test suite has been executed",
      passed: false,
      scoreContribution: 20,
      detail: "No contract tests have been run for this version transition. Execute the test suite before release.",
    });
    return rules;
  }

  // Count unexpected outcomes (where actual ≠ expected)
  const unexpectedFails = testResults.results.filter(
    (r) => !r.passed && r.actualOutcome === "FAIL"
  ).length;
  const unexpectedWarnings = testResults.results.filter(
    (r) => !r.passed && r.actualOutcome === "WARNING"
  ).length;

  // Rule: All contract tests within expected outcomes
  rules.push({
    ruleId: "GATE-020",
    description: "Contract test suite passes with expected outcomes",
    passed: unexpectedFails === 0 && unexpectedWarnings === 0,
    scoreContribution:
      unexpectedFails * SCORE.TEST_FAIL + unexpectedWarnings * SCORE.TEST_WARN,
    detail: unexpectedFails === 0 && unexpectedWarnings === 0
      ? `All ${testResults.totalTests} contract tests produced expected outcomes.`
      : `${unexpectedFails} unexpected failure${unexpectedFails !== 1 ? "s" : ""}, ${unexpectedWarnings} unexpected warning${unexpectedWarnings !== 1 ? "s" : ""} across ${testResults.totalTests} tests.`,
  });

  // Rule: Test pass rate (we consider "passed" = outcome matched expected)
  const passRate = testResults.totalTests > 0
    ? (testResults.passedTests / testResults.totalTests) * 100
    : 100;
  rules.push({
    ruleId: "GATE-021",
    description: "Contract test pass rate ≥ 90%",
    passed: passRate >= 90,
    scoreContribution: passRate < 90 ? 15 : 0,
    detail: `Test pass rate: ${passRate.toFixed(1)}% (${testResults.passedTests}/${testResults.totalTests} tests matched expected outcomes).`,
  });

  return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision derivation
// ─────────────────────────────────────────────────────────────────────────────

function deriveDecision(
  totalScore: number,
  rules: readonly GateRule[],
  compatReport: CompatibilityReport,
  impactReports: readonly ConsumerImpactReport[]
): ReleaseDecision {
  // Hard blocks regardless of score
  const hasCriticalConsumer = impactReports.some((r) => r.overallImpact === "CRITICAL");
  if (hasCriticalConsumer) return "BLOCK";

  const hasBreakingChange = compatReport.overallCompatibility === "BREAKING";
  if (hasBreakingChange) return "BLOCK";

  // Score-based tiers
  if (totalScore === 0) return "ALLOW";
  if (totalScore < THRESHOLD_BLOCK) return "WARN";
  return "BLOCK";
}

function buildReleaseNarrative(
  decision: ReleaseDecision,
  totalScore: number,
  compatReport: CompatibilityReport,
  impactReports: readonly ConsumerImpactReport[],
  diff: ContractDiff
): string {
  const { fromVersion, toVersion, apiId } = diff;
  const consumerCount = impactReports.length;

  if (decision === "ALLOW") {
    return `${apiId} ${fromVersion} → ${toVersion} is safe to release. No breaking or potentially-breaking changes detected. ${
      consumerCount === 0
        ? "No consumers are impacted by this transition."
        : `${consumerCount} consumer${consumerCount > 1 ? "s" : ""} reviewed — all at LOW impact or below.`
    }`;
  }

  if (decision === "WARN") {
    const potentiallyBreaking = compatReport.findings.filter(
      (f) => f.compatibility === "POTENTIALLY_BREAKING"
    ).length;
    return `${apiId} ${fromVersion} → ${toVersion} can proceed with caution (risk score: ${totalScore}). ${
      potentiallyBreaking > 0
        ? `${potentiallyBreaking} potentially-breaking change${potentiallyBreaking > 1 ? "s" : ""} require validation before deploying to production. `
        : ""
    }${
      consumerCount > 0
        ? `${consumerCount} consumer${consumerCount > 1 ? "s" : ""} affected — confirm upgrade coordination plan.`
        : ""
    }`;
  }

  // BLOCK
  const breakingCount = compatReport.findings.filter((f) => f.compatibility === "BREAKING").length;
  const criticalConsumers = impactReports
    .filter((r) => r.overallImpact === "CRITICAL")
    .map((r) => r.consumerName);
  const parts: string[] = [];
  if (breakingCount > 0) {
    parts.push(`${breakingCount} breaking change${breakingCount > 1 ? "s" : ""} will break existing clients`);
  }
  if (criticalConsumers.length > 0) {
    parts.push(`${criticalConsumers.join(", ")} will be critically impacted`);
  }

  return `BLOCKED: ${apiId} ${fromVersion} → ${toVersion} cannot be released in the current state (risk score: ${totalScore}). ${parts.join("; ")}. Resolve all blocking issues before rescheduling.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateReleaseGate(
  diff: ContractDiff,
  compatReport: CompatibilityReport,
  impactReports: readonly ConsumerImpactReport[],
  testResults: ContractTestSuiteResult | null
): ReleaseGateResult {
  const compatRules = evaluateCompatibilityRules(compatReport);
  const consumerRules = evaluateConsumerRules(impactReports);
  const testRules = evaluateTestRules(testResults);

  const allRules = [...compatRules, ...consumerRules, ...testRules];
  const totalScore = allRules.reduce((sum, r) => sum + r.scoreContribution, 0);

  const decision = deriveDecision(totalScore, allRules, compatReport, impactReports);
  const narrative = buildReleaseNarrative(decision, totalScore, compatReport, impactReports, diff);

  // Identify blocking rules (failed rules with non-zero score contribution, or hard-block conditions)
  const blockingRuleIds = allRules
    .filter((r) => !r.passed && (r.scoreContribution >= SCORE.BREAKING_FINDING || decision === "BLOCK"))
    .map((r) => r.ruleId);

  return {
    apiId: diff.apiId,
    fromVersion: diff.fromVersion,
    toVersion: diff.toVersion,
    decision,
    riskScore: totalScore,
    breakingCount: compatReport.breakingCount,
    potentiallyBreakingCount: compatReport.potentiallyBreakingCount,
    affectedConsumerCount: impactReports.length,
    criticalConsumerCount: impactReports.filter((r) => r.overallImpact === "CRITICAL").length,
    blockingRuleIds,
    narrative,
  };
}
