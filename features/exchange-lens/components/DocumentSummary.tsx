"use client";

import React from "react";
import type { DocumentNotice } from "../types";
import { Badge } from "@/components/ui/Badge";

interface DocumentSummaryProps {
  notice: DocumentNotice;
}

const EXCHANGE_VARIANT: Record<string, "accent" | "pass" | "warn"> = {
  CME: "accent",
  ICE: "pass",
  EUREX: "warn",
};

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({ notice }) => {
  const variant = EXCHANGE_VARIANT[notice.exchange] ?? "accent";

  return (
    <div className="el-doc-summary">
      <div className="el-doc-summary-header">
        <div className="el-doc-summary-badges">
          <Badge variant={variant}>{notice.exchange}</Badge>
          <Badge variant="default">{notice.documentType}</Badge>
        </div>
        <span className="el-doc-date">{notice.date}</span>
      </div>

      <div className="el-doc-id">{notice.documentId}</div>
      <h3 className="el-doc-title">{notice.title}</h3>

      <div className="el-doc-meta-row">
        <div className="el-doc-meta-item">
          <span className="el-doc-meta-label">PRODUCT</span>
          <span className="el-doc-meta-value">{notice.affectedProduct}</span>
        </div>
        <div className="el-doc-meta-item">
          <span className="el-doc-meta-label">SYMBOL</span>
          <span className="el-doc-meta-value el-mono">{notice.affectedSymbol}</span>
        </div>
      </div>

      <p className="el-doc-summary-text">{notice.summary}</p>
    </div>
  );
};
