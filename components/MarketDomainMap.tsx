"use client";

import React, { useState, useRef } from "react";
import { domainLayers, DomainLayer } from "@/data/portfolio";
import { Badge } from "./ui/Badge";

export const MarketDomainMap: React.FC = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(domainLayers[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeLayer: DomainLayer =
    domainLayers.find((layer) => layer.id === selectedLayerId) || domainLayers[0];

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % domainLayers.length;
      setSelectedLayerId(domainLayers[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + domainLayers.length) % domainLayers.length;
      setSelectedLayerId(domainLayers[prev].id);
      tabRefs.current[prev]?.focus();
    }
  };

  return (
    <section className="section" id="domain" aria-label="Capital Markets Domain Lifecycle">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 04 / Capital Markets Architecture
            </div>
            <h2 className="section-title">
              The derivative lifecycle <span>& data dependencies.</span>
            </h2>
          </div>
          <p className="lead">
            Interactive breakdown of cleared derivatives infrastructure, from exchange order books to central risk engines and downstream enterprise reference data.
          </p>
        </div>

        <div className="domain-map-container">
          {/* Layer Navigator Tabs */}
          <div className="domain-layer-tabs" role="tablist" aria-label="Domain Layers">
            {domainLayers.map((layer, idx) => {
              const isActive = layer.id === activeLayer.id;
              return (
                <button
                  key={layer.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setSelectedLayerId(layer.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`domain-tab-button ${isActive ? "is-active" : ""}`}
                >
                  <div className="domain-tab-info">
                    <strong>{layer.name}</strong>
                    <span>{layer.subtitle}</span>
                  </div>
                  <Badge variant={isActive ? "accent" : "default"}>{layer.number}</Badge>
                </button>
              );
            })}
          </div>

          {/* Active Layer Deep Dive Panel */}
          <div className="domain-detail-panel" role="tabpanel">
            <div className="domain-detail-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <Badge variant="accent">LAYER {activeLayer.number}</Badge>
                <Badge variant="pass">{activeLayer.subtitle}</Badge>
              </div>
              <h3>{activeLayer.name}</h3>
              <p>{activeLayer.summary}</p>
            </div>

            <div className="domain-subgrid">
              <div className="domain-block">
                <h4>Core Entities & Protocols</h4>
                <div className="domain-entity-pills">
                  {activeLayer.entities.map((entity) => (
                    <span key={entity} className="domain-entity-pill">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="domain-block">
                <h4>Validation & Correctness Focus</h4>
                <p>{activeLayer.validationFocus}</p>
              </div>
            </div>

            <div className="domain-block" style={{ borderLeft: "3px solid var(--status-warn)" }}>
              <h4 style={{ color: "var(--status-warn)" }}>Downstream Failure Impact</h4>
              <p>{activeLayer.downstreamImpact}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
