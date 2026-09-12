import React from "react";
import { profile } from "@/data/portfolio";
import { Badge } from "./ui/Badge";

export const AboutSection: React.FC = () => {
  return (
    <section className="section" id="about" aria-label="About Satyam Sethi">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 08 / Background & Focus
            </div>
            <h2 className="section-title">
              Software at the intersection <span>of financial markets & AI.</span>
            </h2>
          </div>
          <p className="lead">
            Engineering background rooted in systems validation, software reliability, and financial domain complexity.
          </p>
        </div>

        <div className="about-box">
          <div className="about-text">
            <p>
              Over the last three years at ION Group, I have progressed from testing cleared derivatives workflows to architecting automated testing harnesses, validating high-throughput reference data feeds, and leading a team of 7 quality engineers.
            </p>
            <p>
              My work focuses on the intersection of capital markets domain rules and software correctness: ensuring market data, contract parameters, margin inputs, and lifecycle events maintain absolute integrity across enterprise trading environments.
            </p>
            <p>
              I am now extending these principles to AI systems—building architectures where language model reasoning is rigorously grounded by deterministic verification, schema constraints, and auditability.
            </p>
          </div>

          <div className="about-meta-card">
            <div>
              <h4>Current Focus</h4>
              <span>{profile.title}</span>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{profile.company}</div>
            </div>

            <div>
              <h4>Location</h4>
              <span>{profile.location}</span>
            </div>

            <div>
              <h4>Education</h4>
              <span>
                {profile.education.degree}, {profile.education.field}
              </span>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {profile.education.institution}
              </div>
            </div>

            <div style={{ marginTop: "4px" }}>
              <Badge variant="pass">Open to AI & FinTech Systems Roles</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
