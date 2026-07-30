"use client";

import { useEffect, useState } from "react";

const steps = ["Parsing document", "Extracting entities", "Comparing reference data", "Evaluating impact", "Building evidence"];

export function ExchangeLensDemo() {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    if (step === steps.length) {
      const timeout = window.setTimeout(() => setState("done"), 350);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(() => setStep((value) => value + 1), 520);
    return () => window.clearTimeout(timeout);
  }, [state, step]);

  const analyze = () => { setStep(0); setState("running"); };

  return <section className="demo-shell" aria-labelledby="demo-title">
    <div className="demo-heading">
      <div><p className="eyebrow">Product simulation · not connected to a production system</p><h3 id="demo-title">ExchangeLens / change analysis</h3></div>
      <span className={`status ${state === "done" ? "status-success" : ""}`}><i /> {state === "done" ? "Change detected" : "Ready"}</span>
    </div>
    <div className="demo-grid">
      <div className="notice" aria-label="Example CME product notice">
        <p className="mono notice-title">CME PRODUCT NOTICE</p><div className="notice-rule" />
        <p><span>Product</span>Example Equity Index Future</p><p><span>Symbol</span>XYZ</p><p><span>Current Tick Size</span>0.25</p><p className="notice-change"><span>New Tick Size</span>0.10</p><p><span>Effective</span>15 Aug 2026</p>
        <button className="button button-primary" onClick={analyze} disabled={state === "running"}>{state === "running" ? "Analyzing…" : "Analyze change"}<span aria-hidden="true">↗</span></button>
      </div>
      <div className="analysis-panel" aria-live="polite">
        {state === "idle" && <div className="empty-state"><span className="scan-mark">⌁</span><p>Run the simulation to trace a product notice into a validated decision.</p></div>}
        {state === "running" && <div className="analysis-progress"><p className="eyebrow">Working through the document</p>{steps.map((item, index) => <p className={`progress-step ${index < step ? "is-complete" : index === step ? "is-active" : ""}`} key={item}><span>{index < step ? "✓" : "○"}</span>{item}{index === step && <em>…</em>}</p>)}</div>}
        {state === "done" && <div className="analysis-result"><div className="result-label"><i />Change detected</div><div className="result-value"><span>Tick size</span><strong>0.25 <b>→</b> <em>0.10</em></strong></div><div className="result-grid"><div><span>Severity</span><strong className="severity">High</strong></div><div><span>Confidence</span><strong>High</strong></div></div><div className="impact"><span>Potential impact</span><p>Reference data · Pricing · Trade validation · Downstream processing</p></div><div className="evidence"><span>Evidence</span><p>CME Product Notice — Demo source</p></div></div>}
      </div>
    </div>
  </section>;
}
