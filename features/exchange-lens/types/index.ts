// ExchangeLens — core domain types
// All data in this feature is SAMPLE / DEMO data — not live market data.

export type ExchangeId = "CME" | "ICE" | "EUREX";

export type ValidationStatus = "PASS" | "WARNING" | "MISMATCH";

export interface DocumentNotice {
  id: string;
  exchange: ExchangeId;
  documentId: string;
  documentType: "Circular" | "Product Notice" | "Specification Update" | "Advisory";
  title: string;
  date: string; // ISO date string SAMPLE
  summary: string;
  affectedProduct: string;
  affectedSymbol: string;
}

export interface ExtractedField {
  fieldName: string;
  displayLabel: string;
  extractedValue: string;
  rawSnippet: string; // the text span from which this was extracted (SAMPLE EVIDENCE)
  confidence: "HIGH" | "MEDIUM" | "LOW";
  unit?: string;
}

export interface ReferenceField {
  fieldName: string;
  displayLabel: string;
  referenceValue: string;
  source: string; // e.g. "IDS_PROD_MASTER rev 2024-Q4"
  lastVerified: string; // SAMPLE date
}

export interface ValidationResult {
  fieldName: string;
  displayLabel: string;
  status: ValidationStatus;
  extractedValue: string;
  referenceValue: string;
  delta?: string; // human-readable description of the difference
  ruleApplied: string;
  evidence: EvidenceItem;
}

export interface EvidenceItem {
  documentId: string;
  sectionLabel: string; // e.g. "Section 4.2 — Tick Size Rules"
  extractedStatement: string; // text span — SAMPLE EVIDENCE
  affectedField: string;
  isSampleEvidence: true; // always true; we never fabricate real citations
}

export interface ExchangeLensScenario {
  id: string;
  notice: DocumentNotice;
  extractedFields: ExtractedField[];
  referenceFields: ReferenceField[];
  // validation results are computed from extracted vs reference
}
