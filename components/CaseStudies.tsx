import React from "react";
import Link from "next/link";
import { caseStudies } from "@/data/portfolio";
import { Badge } from "./ui/Badge";

export const CaseStudies: React.FC = () => {
  return (
    <section className="section" id="work" aria-label="Selected Engineering Work">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 02 / Selected Systems & Case Studies
            </div>
            <h2 className="section-title">
              Technical products <span>& verification harnesses.</span>
            </h2>
          </div>
          <p className="lead">
            Architecture case studies and applied prototypes designed to bring deterministic validation, precision, and LLM reasoning to financial data.
          </p>
        </div>

        <div className="case-studies-list">
          {caseStudies.map((study) => (
            <article className="case-study-card" key={study.id}>
              <div className="case-study-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <Badge variant="accent">{study.category}</Badge>
                    <Badge variant="pass">{study.status}</Badge>
                  </div>
                  <h3>{study.name}</h3>
                  <p>{study.tagline}</p>
                </div>
              </div>

              <div className="case-study-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="case-study-block">
                    <h4>The Problem</h4>
                    <p>{study.problem}</p>
                  </div>

                  <div className="case-study-block">
                    <h4>System Approach</h4>
                    <p>{study.approach}</p>
                  </div>

                  <div className="case-study-block">
                    <h4>Validation & Grounding</h4>
                    <p>{study.validation}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="case-study-block">
                    <h4>Execution Architecture</h4>
                    <ul className="architecture-steps">
                      {study.architecture.map((step, idx) => (
                        <li key={step}>
                          <span>[{String(idx + 1).padStart(2, "0")}]</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="case-study-block">
                    <h4>Engineering Outcome</h4>
                    <p>{study.outcome}</p>
                  </div>
                </div>
              </div>

              <div className="case-study-footer">
                <div className="tags-list">
                  {study.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                {study.id === "exchange-lens" && (
                  <Link
                    href="/projects/exchangelens"
                    className="case-study-demo-link"
                    aria-label="Open ExchangeLens interactive demo"
                  >
                    View Interactive Demo →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
