"use client";

import { useState } from "react";
import { architectureStages } from "@/data/portfolio";

export function ArchitectureDiagram() {
  const [active, setActive] = useState(0);
  const stage = architectureStages[active];
  return <div className="architecture" aria-label="ExchangeLens system architecture">
    <div className="stage-list" role="tablist" aria-label="System stages">
      {architectureStages.map((item, index) => <button key={item.title} role="tab" aria-selected={index === active} className={`stage ${index === active ? "is-active" : ""}`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div></button>)}
    </div>
    <div className="stage-detail" role="tabpanel"><p className="eyebrow">{stage.meta}</p><h3>{stage.title}</h3><p>{stage.body}</p><div className="detail-line" /><p className="mono">{active < 6 ? `→ stage ${String(active + 2).padStart(2, "0")}` : "✓ review-ready output"}</p></div>
  </div>;
}
