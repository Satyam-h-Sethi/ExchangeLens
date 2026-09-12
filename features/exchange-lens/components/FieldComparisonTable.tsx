"use client";

import React from "react";
import type { ValidationResult, ValidationStatus } from "../types";
import { Badge } from "@/components/ui/Badge";

interface FieldComparisonTableProps {
  results: ValidationResult[];
  selectedField: string | null;
  onSelectField: (fieldName: string) => void;
}

function statusVariant(status: ValidationStatus): "pass" | "warn" | "fail" {
  if (status === "PASS") return "pass";
  if (status === "WARNING") return "warn";
  return "fail";
}

function statusIcon(status: ValidationStatus): string {
  if (status === "PASS") return "✓";
  if (status === "WARNING") return "△";
  return "✕";
}

export const FieldComparisonTable: React.FC<FieldComparisonTableProps> = ({
  results,
  selectedField,
  onSelectField,
}) => {
  return (
    <div className="el-comparison-table" role="list" aria-label="Field validation results">
      {results.map((result) => {
        const isSelected = result.fieldName === selectedField;
        const variant = statusVariant(result.status);
        const icon = statusIcon(result.status);

        return (
          <button
            key={result.fieldName}
            type="button"
            role="listitem"
            aria-pressed={isSelected}
            onClick={() => onSelectField(result.fieldName)}
            className={`el-field-row${isSelected ? " is-selected" : ""} el-field-row--${result.status.toLowerCase()}`}
          >
            <div className="el-field-row-top">
              <span className="el-field-label">{result.displayLabel}</span>
              <Badge variant={variant}>
                <span className="el-status-icon" aria-hidden="true">{icon}</span>
                {result.status}
              </Badge>
            </div>

            <div className="el-field-values">
              <div className="el-field-value-cell">
                <span className="el-value-label">EXTRACTED</span>
                <span className="el-value-text el-mono">{result.extractedValue}</span>
              </div>
              <div className="el-field-value-divider" aria-hidden="true">→</div>
              <div className="el-field-value-cell">
                <span className="el-value-label">REFERENCE</span>
                <span className="el-value-text el-mono">{result.referenceValue}</span>
              </div>
            </div>

            {result.delta && (
              <div className={`el-field-delta el-field-delta--${variant}`}>
                {result.delta}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
