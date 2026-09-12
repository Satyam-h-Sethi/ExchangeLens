"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { scenarios } from "@/features/exchange-lens/data/scenarios";
import { runValidation, summarize } from "@/features/exchange-lens/logic/validator";
import { ScenarioSelector } from "@/features/exchange-lens/components/ScenarioSelector";
import { DocumentSummary } from "@/features/exchange-lens/components/DocumentSummary";
import { FieldComparisonTable } from "@/features/exchange-lens/components/FieldComparisonTable";
import { ValidationPanel } from "@/features/exchange-lens/components/ValidationPanel";

import "./exchangelens.css";

export default function ExchangeLensPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0],
    [selectedScenarioId]
  );

  const validationResults = useMemo(
    () => runValidation(scenario.extractedFields, scenario.referenceFields),
    [scenario]
  );

  const summary = useMemo(() => summarize(validationResults), [validationResults]);

  const handleScenarioSelect = (id: string) => {
    setSelectedScenarioId(id);
    setSelectedField(null); // reset field selection on scenario change
  };

  const handleFieldSelect = (fieldName: string) => {
    setSelectedField((prev) => (prev === fieldName ? null : fieldName));
  };

  return (
    <div className="el-page">
      {/* ── Back navigation ─────────────────────────────────────────────── */}
      <div className="el-nav-bar">
        <Link href="/#work" className="el-back-link">
          ← Portfolio
        </Link>
        <div className="el-nav-right">
          <span className="el-nav-label">SAMPLE / DEMO DATA</span>
          <span className="el-nav-divider" aria-hidden="true">·</span>
          <span className="el-nav-label">No live market data</span>
        </div>
      </div>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="el-header">
        <div className="el-header-eyebrow">
          <span className="el-mono el-text-faint">EXCHANGELENS</span>
          <span className="el-header-separator" aria-hidden="true">·</span>
          <span className="el-mono el-text-faint">Exchange Document Intelligence</span>
        </div>
        <h1 className="el-header-title">
          Regulatory notice extraction<br />
          <span className="el-accent">& deterministic validation.</span>
        </h1>
        <p className="el-header-desc">
          Demonstrates an exchange-document intelligence pipeline: structured field extraction from
          regulatory circulars, comparison against a reference data master, and deterministic
          validation with evidence-backed results. All data is{" "}
          <strong>SAMPLE / DEMO — not live market data</strong>.
        </p>
      </header>

      {/* ── Scenario selector ───────────────────────────────────────────── */}
      <section className="el-section" aria-label="Select exchange scenario">
        <div className="el-section-label">
          <span className="el-mono el-text-faint">01 / SELECT DOCUMENT</span>
        </div>
        <ScenarioSelector
          scenarios={scenarios}
          selectedId={selectedScenarioId}
          onSelect={handleScenarioSelect}
        />
      </section>

      {/* ── Three-panel main workspace ───────────────────────────────────── */}
      <section className="el-workspace" aria-label="ExchangeLens workspace">
        {/* Panel A: Document summary */}
        <div className="el-panel el-panel--doc" aria-label="Document summary">
          <div className="el-panel-header">
            <span className="el-mono el-text-faint el-panel-num">02</span>
            <span className="el-panel-title">Document Notice</span>
          </div>
          <DocumentSummary notice={scenario.notice} />
        </div>

        {/* Panel B: Field comparison */}
        <div className="el-panel el-panel--compare" aria-label="Field comparison table">
          <div className="el-panel-header">
            <span className="el-mono el-text-faint el-panel-num">03</span>
            <span className="el-panel-title">Extracted vs Reference</span>
            <span className="el-panel-hint">Select a field to inspect evidence</span>
          </div>
          <FieldComparisonTable
            results={validationResults}
            selectedField={selectedField}
            onSelectField={handleFieldSelect}
          />
        </div>

        {/* Panel C: Validation + evidence */}
        <div className="el-panel el-panel--validation" aria-label="Validation results and evidence">
          <div className="el-panel-header">
            <span className="el-mono el-text-faint el-panel-num">04</span>
            <span className="el-panel-title">Validation Output</span>
          </div>
          <ValidationPanel
            summary={summary}
            results={validationResults}
            selectedField={selectedField}
          />
        </div>
      </section>

      {/* ── Architecture note ────────────────────────────────────────────── */}
      <section className="el-arch-note" aria-label="Architecture notes">
        <div className="el-arch-note-header">
          <span className="el-mono el-text-faint">ARCHITECTURE NOTE</span>
        </div>
        <div className="el-arch-steps">
          {[
            { step: "01", label: "Document Ingest", desc: "Exchange circular / product notice ingested as structured text" },
            { step: "02", label: "Field Extraction", desc: "LLM annotates key contract specification fields with confidence scores" },
            { step: "03", label: "Reference Lookup", desc: "Extracted fields matched against reference data master (IDS_PROD_MASTER)" },
            { step: "04", label: "Deterministic Validation", desc: "Pure TypeScript engine: normalize → classify → delta → status" },
            { step: "05", label: "Evidence Output", desc: "Each result carries source snippet, document ID, and section label" },
          ].map(({ step, label, desc }) => (
            <div key={step} className="el-arch-step">
              <span className="el-arch-step-num el-mono">{step}</span>
              <div>
                <div className="el-arch-step-label">{label}</div>
                <div className="el-arch-step-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
