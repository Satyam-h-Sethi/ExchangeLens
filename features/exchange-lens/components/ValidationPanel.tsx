"use client";

import React from "react";
import type { ValidationResult } from "../types";
import type { ValidationSummary } from "../logic/validator";
import { Badge } from "@/components/ui/Badge";
import { EvidenceCard } from "./EvidenceCard";

interface ValidationPanelProps {
  summary: ValidationSummary;
  results: ValidationResult[];
  selectedField: string | null;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  summary,
  results,
  selectedField,
}) => {
  const overallVariant =
    summary.overallStatus === "PASS"
      ? "pass"
      : summary.overallStatus === "WARNING"
      ? "warn"
      : "fail";

  const focusedResult = selectedField
    ? results.find((r) => r.fieldName === selectedField) ?? null
    : null;

  const displayResults = focusedResult ? [focusedResult] : results;

  return (
    <div className="el-validation-panel">
      {/* Summary bar */}
      <div className="el-validation-summary">
        <div className="el-validation-summary-status">
          <Badge variant={overallVariant}>{summary.overallStatus}</Badge>
          <span className="el-validation-summary-label">
            Validation {summary.overallStatus === "PASS" ? "passed" : "complete"}
          </span>
        </div>
        <div className="el-validation-counts">
          <span className="el-count el-count--pass">
            <span className="el-count-num">{summary.pass}</span> PASS
          </span>
          {summary.warning > 0 && (
            <span className="el-count el-count--warn">
              <span className="el-count-num">{summary.warning}</span> WARN
            </span>
          )}
          {summary.mismatch > 0 && (
            <span className="el-count el-count--fail">
              <span className="el-count-num">{summary.mismatch}</span> MISMATCH
            </span>
          )}
        </div>
      </div>

      {/* Evidence cards */}
      <div className="el-evidence-list">
        {selectedField && (
          <div className="el-evidence-filter-note">
            Showing evidence for <span className="el-mono el-accent">.{selectedField}</span>
            {" "}— <span className="el-text-muted">click a field again to deselect</span>
          </div>
        )}
        {displayResults.map((result) => (
          <EvidenceCard key={result.fieldName} result={result} />
        ))}
      </div>
    </div>
  );
};
