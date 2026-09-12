import React from "react";
import { Badge } from "./ui/Badge";

const pipelineSteps = [
  { stage: "01", name: "Unstructured / Market Input", type: "Exchange circulars, regulatory text, API logs" },
  { stage: "02", name: "LLM Semantic Interpretation", type: "Probabilistic extraction of candidate parameters" },
  { stage: "03", name: "Deterministic Rule Verification", type: "Rulebook constraints & tick math validation" },
  { stage: "04", name: "Strict Schema & Bounds Check", type: "Database constraints & boundary tolerances" },
  { stage: "05", name: "Audited & Traceable State", type: "Lineage-backed output committed to golden reference" },
];

export const PhilosophyVisual: React.FC = () => {
  return (
    <section className="section" id="philosophy" aria-label="Engineering Philosophy">
      <div className="container">
        <div className="philosophy-grid">
          <div className="philosophy-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 07 / Engineering Philosophy
            </div>
            <h2>
              AI is a component. <span>Correctness is the system.</span>
            </h2>
            <p>
              In capital markets and financial data infrastructure, plausible is not good enough. LLMs are powerful tools for parsing unstructured ambiguity, but they cannot be allowed to make unverified assertions on production data.
            </p>
            <p>
              My approach isolates language models to interpretation and extraction, while surrounding them with rigid deterministic rules, schema contracts, citation matching, and automated regression verification.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <Badge variant="pass">Zero Unverified State</Badge>
              <Badge variant="accent">Deterministic Verification</Badge>
            </div>
          </div>

          <div className="philosophy-flow" aria-label="Verification Pipeline Diagram">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)" }}>
                GROUNDED REASONING ARCHITECTURE
              </span>
              <Badge variant="pass">GUARDED</Badge>
            </div>

            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={step.stage}>
                <div className="flow-step-node">
                  <div>
                    <strong>
                      [{step.stage}] {step.name}
                    </strong>
                    <div>
                      <span>{step.type}</span>
                    </div>
                  </div>
                </div>
                {idx < pipelineSteps.length - 1 && <div className="flow-connector">↓</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
