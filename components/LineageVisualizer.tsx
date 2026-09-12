"use client";

import React, { useState } from "react";
import { TerminalWindow } from "./ui/TerminalWindow";
import { Badge } from "./ui/Badge";

const stages = [
  { id: "01", name: "Ingest", desc: "FIX/FAST & circular PDF stream capture", status: "STREAMING" },
  { id: "02", name: "Normalize", desc: "Harmonize CME, ICE & EUREX schema fields", status: "STABLE" },
  { id: "03", name: "Validate", desc: "Contract specs & tick boundary checks", status: "ASSERTING" },
  { id: "04", name: "Reason", desc: "LLM extraction + deterministic rule verification", status: "EVALUATING" },
  { id: "05", name: "Deliver", desc: "Audit-logged golden reference state output", status: "COMMITTED" },
];

export const LineageVisualizer: React.FC = () => {
  const [activeStage, setActiveStage] = useState(2);

  return (
    <TerminalWindow
      title="FINANCIAL DATA PIPELINE & LINEAGE"
      badge={<Badge variant="pass">PIPELINE ACTIVE</Badge>}
    >
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
          }}
        >
          <span style={{ color: "var(--text-faint)" }}>AUTHORITATIVE VENUES:</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Badge variant="accent">CME</Badge>
            <Badge variant="accent">ICE</Badge>
            <Badge variant="accent">EUREX</Badge>
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-faint)",
            textAlign: "right",
            marginBottom: "6px",
            letterSpacing: "0.04em",
          }}
        >
          Click a stage to inspect
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {stages.map((stage, idx) => {
            const isSelected = activeStage === idx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: isSelected ? "var(--surface-3)" : "var(--surface-2)",
                  border: isSelected ? "1px solid var(--accent-border)" : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: isSelected ? "var(--accent)" : "var(--text-faint)",
                      fontWeight: 700,
                    }}
                  >
                    {stage.id}
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {stage.desc}
                    </div>
                  </div>
                </div>
                <Badge variant={isSelected ? "pass" : "default"}>
                  {stage.status}
                </Badge>
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: "12px",
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: "11.5px",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "var(--text-faint)" }}>INSPECTION CONTEXT:</span>
            <span style={{ color: "var(--status-pass)" }}>LINEAGE TRACEABLE</span>
          </div>
          <div>
            Stage {stages[activeStage].id}: <strong style={{ color: "var(--text)" }}>{stages[activeStage].name}</strong> — {stages[activeStage].desc}
          </div>
        </div>
      </div>
    </TerminalWindow>
  );
};
