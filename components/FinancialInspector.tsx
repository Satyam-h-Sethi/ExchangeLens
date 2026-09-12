"use client";

import React, { useState, useRef } from "react";
import { inspectorInstruments, InspectorInstrument } from "@/data/portfolio";
import { TerminalWindow } from "./ui/TerminalWindow";
import { Badge } from "./ui/Badge";

export const FinancialInspector: React.FC = () => {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(
    inspectorInstruments[0].id
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeInstrument: InspectorInstrument =
    inspectorInstruments.find((item) => item.id === selectedInstrumentId) ||
    inspectorInstruments[0];

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % inspectorInstruments.length;
      setSelectedInstrumentId(inspectorInstruments[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + inspectorInstruments.length) % inspectorInstruments.length;
      setSelectedInstrumentId(inspectorInstruments[prev].id);
      tabRefs.current[prev]?.focus();
    }
  };

  return (
    <section className="section" id="inspector" aria-label="Financial Specification Inspector">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 03 / Interactive Proof of Work
            </div>
            <h2 className="section-title">
              Financial specification <span>inspector.</span>
            </h2>
          </div>
          <p className="lead">
            Interactive demonstration of contract-rule verification across major exchange derivatives (CME, ICE, EUREX). Evaluates payload fields against authoritative rulebooks and golden reference models.
          </p>
        </div>

        {/* Instrument Selector Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
          {inspectorInstruments.map((inst, idx) => {
            const isSelected = inst.id === activeInstrument.id;
            return (
              <button
                key={inst.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedInstrumentId(inst.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                style={{
                  padding: "10px 18px",
                  background: isSelected ? "var(--surface-3)" : "var(--surface)",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  color: isSelected ? "var(--text)" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                <Badge variant="accent">{inst.exchange}</Badge>
                <span>{inst.symbol} — {inst.productName}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          <TerminalWindow
            title={`INSPECTION SUITE // ${activeInstrument.exchange}:${activeInstrument.symbol} (${activeInstrument.assetClass})`}
            badge={<Badge variant="pass">SAMPLE DATA VERIFIED</Badge>}
          >
            <div style={{ padding: "clamp(16px, 3vw, 24px)" }}>
              {/* Instrument Meta Header */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 18px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>
                    {activeInstrument.productName} ({activeInstrument.symbol})
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    VENUE: {activeInstrument.exchange} · ASSET CLASS: {activeInstrument.assetClass}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Badge variant="pass">
                    {activeInstrument.assertions.filter((a) => a.status === "PASS").length} PASSED
                  </Badge>
                  {activeInstrument.assertions.some((a) => a.status === "WARNING") && (
                    <Badge variant="warn">
                      {activeInstrument.assertions.filter((a) => a.status === "WARNING").length} WARNING
                    </Badge>
                  )}
                </div>
              </div>

              {/* Assertion Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                {activeInstrument.assertions.map((assertion) => {
                  const isPass = assertion.status === "PASS";
                  const isWarn = assertion.status === "WARNING";
                  const badgeVariant = isPass ? "pass" : isWarn ? "warn" : "fail";

                  return (
                    <div
                      key={assertion.field}
                      style={{
                        padding: "16px",
                        background: "var(--bg)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid var(--border-subtle)",
                          paddingBottom: "8px",
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>
                          .{assertion.field}
                        </span>
                        <Badge variant={badgeVariant}>{assertion.status}</Badge>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "12px",
                          fontSize: "12.5px",
                        }}
                      >
                        <div style={{ background: "var(--surface-2)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--text-faint)", marginBottom: "2px" }}>
                            EXPECTED SPECIFICATION
                          </div>
                          <div style={{ color: "var(--text)", fontWeight: 500 }}>
                            {assertion.expected}
                          </div>
                        </div>

                        <div style={{ background: "var(--surface-2)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--text-faint)", marginBottom: "2px" }}>
                            OBSERVED IN FEED
                          </div>
                          <div style={{ color: isPass ? "var(--status-pass)" : "var(--status-warn)", fontWeight: 600 }}>
                            {assertion.observed}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        <strong style={{ color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                          RULE:{" "}
                        </strong>
                        {assertion.rule}
                      </div>

                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)" }}>
                        EVIDENCE: {assertion.evidence}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Raw Sample Payload Inspector */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)", marginBottom: "8px" }}>
                  RAW NORMALIZED PAYLOAD [JSON SNAPSHOT]
                </div>
                <pre
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "14px",
                    margin: 0,
                    overflowX: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  {JSON.stringify(activeInstrument.samplePayload, null, 2)}
                </pre>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </div>
    </section>
  );
};
