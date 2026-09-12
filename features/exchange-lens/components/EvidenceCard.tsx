"use client";

import React, { useState } from "react";
import type { ValidationResult } from "../types";
import { Badge } from "@/components/ui/Badge";

interface EvidenceCardProps {
  result: ValidationResult;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);
  const { evidence } = result;

  return (
    <div className="el-evidence-card">
      <div className="el-evidence-header">
        <div className="el-evidence-field-label">
          <span className="el-mono el-accent">.{result.fieldName}</span>
          <span className="el-evidence-display-label">{result.displayLabel}</span>
        </div>
        <Badge variant="default">SAMPLE EVIDENCE</Badge>
      </div>

      <div className="el-evidence-rule">
        <span className="el-value-label">RULE APPLIED</span>
        <span className="el-evidence-rule-text">{result.ruleApplied}</span>
      </div>

      <button
        type="button"
        className="el-evidence-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span>{expanded ? "▾ Hide source extract" : "▸ Show source extract"}</span>
      </button>

      {expanded && (
        <div className="el-evidence-body">
          <div className="el-evidence-meta-row">
            <span className="el-value-label">DOCUMENT</span>
            <span className="el-mono el-text-faint">{evidence.documentId}</span>
          </div>
          <div className="el-evidence-meta-row">
            <span className="el-value-label">SECTION</span>
            <span className="el-mono el-text-faint">{evidence.sectionLabel}</span>
          </div>
          <blockquote className="el-evidence-quote">
            {evidence.extractedStatement}
          </blockquote>
          <div className="el-evidence-disclaimer">
            ⚠ All evidence labeled <strong>SAMPLE EVIDENCE — synthetic</strong>. Not derived from real regulatory documents.
          </div>
        </div>
      )}
    </div>
  );
};
