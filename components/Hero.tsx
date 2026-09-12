import React from "react";
import { profile } from "@/data/portfolio";
import { LineageVisualizer } from "./LineageVisualizer";
import { Button } from "./ui/Button";

export const Hero: React.FC = () => {
  return (
    <section className="section" id="top" style={{ paddingTop: "clamp(40px, 6vw, 70px)" }}>
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-status-pill">
              <span className="eyebrow-dot" />
              <span>{profile.status}</span>
            </div>

            <div className="eyebrow">
              AI Engineering × Capital Markets × Data Systems
            </div>

            <h1 className="display-title">
              I engineer deterministic systems <span>for financial data.</span>
            </h1>

            <p className="hero-description">
              {profile.summary}
            </p>

            <div className="hero-actions">
              <Button href="#work" variant="primary">
                Explore Case Studies ↗
              </Button>
              <Button href="#inspector" variant="secondary">
                Financial Inspector ↗
              </Button>
              <Button href={profile.github} variant="ghost" external>
                GitHub ↗
              </Button>
              <Button href={profile.linkedin} variant="ghost" external>
                LinkedIn ↗
              </Button>
            </div>

            <div className="hero-meta">
              <span>
                LOCATION: <strong>{profile.location}</strong>
              </span>
              <span>
                ROLE: <strong>{profile.title}</strong>
              </span>
              <span>
                SYSTEMS: <strong>CME · ICE · EUREX</strong>
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <LineageVisualizer />
          </div>
        </div>
      </div>
    </section>
  );
};
