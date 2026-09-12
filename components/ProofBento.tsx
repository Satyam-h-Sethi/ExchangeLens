import React from "react";
import { metrics } from "@/data/portfolio";
import { Badge } from "./ui/Badge";

export const ProofBento: React.FC = () => {
  return (
    <section className="section" id="proof" aria-label="Verified Domain Scale">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 01 / Scale & Domain Depth
            </div>
            <h2 className="section-title">
              Engineering metrics <span>grounded in production.</span>
            </h2>
          </div>
          <p className="lead">
            Verified focus across exchange-traded derivatives, large-scale financial reference data, and quality automation architecture.
          </p>
        </div>

        <div className="bento-grid">
          {metrics.map((metric) => (
            <article className="bento-card" key={metric.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="bento-value">{metric.value}</span>
                {metric.tag && <Badge variant="accent">{metric.tag}</Badge>}
              </div>
              <div>
                <h3 className="bento-label">{metric.label}</h3>
                <p className="bento-detail">{metric.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
