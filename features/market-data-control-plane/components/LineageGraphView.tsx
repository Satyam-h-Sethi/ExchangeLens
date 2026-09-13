"use client";

import React, { useState } from "react";
import {
  DEFAULT_LINEAGE_GRAPH,
  evaluateImpactAnalysis,
  traceDownstream,
  traceUpstream,
} from "../logic/lineage-engine";

export function LineageGraphView() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("SRC_BLOOMBERG_BPIPE");
  const graph = DEFAULT_LINEAGE_GRAPH;

  const upstreamNodeIds = traceUpstream(selectedNodeId, graph);
  const downstreamNodeIds = traceDownstream(selectedNodeId, graph);
  const impactAnalysis = evaluateImpactAnalysis(
    selectedNodeId,
    "SOURCE",
    "CRITICAL",
    graph
  );

  const selectedNode =
    graph.nodes.find((n) => n.id === selectedNodeId) || graph.nodes[0];

  // Group nodes by 5-layer pipeline architecture
  const layerGroups = {
    SOURCES: graph.nodes.filter((n) => n.type === "SOURCE_FEED"),
    INGESTION: graph.nodes.filter(
      (n) => n.type === "INGESTION_CONNECTOR" || n.type === "NORMALIZATION_PIPELINE"
    ),
    REFERENCE_MASTER: graph.nodes.filter(
      (n) => n.type === "REFERENCE_MASTER" || n.type === "VALIDATION_SUITE"
    ),
    DISTRIBUTION: graph.nodes.filter((n) => n.type === "DISTRIBUTION_BUS"),
    DOWNSTREAM: graph.nodes.filter((n) =>
      n.type.startsWith("DOWNSTREAM_")
    ),
  };

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Directed Lineage & Blast-Radius Traversal Graph</h2>
          <p className="cp-view-subheading">
            Bidirectional DAG dependency mapping tracing upstream feed provenance and calculating downstream blast-radius impact for critical downstream trading systems.
          </p>
        </div>
      </div>

      {/* Impact Evaluation KPI Bar */}
      <div className="cp-kpi-grid">
        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Selected Node</span>
            <span className="cp-status-pill pass">{selectedNode.type.replace(/_/g, " ")}</span>
          </div>
          <div className="cp-kpi-value" style={{ fontSize: "1.2rem" }}>
            {selectedNode.label}
          </div>
          <div className="cp-kpi-subtext">Node ID: {selectedNode.id}</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Blast Radius Impact Score</span>
            <span
              className={`cp-status-pill ${
                impactAnalysis.blastRadiusScore > 75
                  ? "critical"
                  : impactAnalysis.blastRadiusScore > 40
                  ? "warning"
                  : "pass"
              }`}
            >
              {impactAnalysis.blastRadiusScore > 75
                ? "HIGH RISK"
                : impactAnalysis.blastRadiusScore > 40
                ? "MEDIUM"
                : "LOW"}
            </span>
          </div>
          <div className="cp-kpi-value">{impactAnalysis.blastRadiusScore} / 100</div>
          <div className="cp-kpi-subtext">Calculated consumer criticality weight</div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Downstream Consumers at Risk</span>
            <span className="cp-status-pill critical">
              {impactAnalysis.impactedConsumers.length} SERVICES
            </span>
          </div>
          <div className="cp-kpi-value">{impactAnalysis.impactedConsumers.length}</div>
          <div className="cp-kpi-subtext">
            {downstreamNodeIds.length} total downstream DAG nodes affected
          </div>
        </div>

        <div className="cp-kpi-card">
          <div className="cp-kpi-header">
            <span className="cp-kpi-label">Upstream Provenance</span>
            <span className="cp-status-pill pass">ROOT CAUSE</span>
          </div>
          <div className="cp-kpi-value">{upstreamNodeIds.length} Nodes</div>
          <div className="cp-kpi-subtext">Upstream parent feeding dependencies</div>
        </div>
      </div>

      {/* Visual DAG Representation */}
      <div className="cp-card cp-dag-container">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">Interactive Pipeline Dependency DAG</h3>
            <p className="cp-card-subtitle">
              Click any pipeline stage or system to highlight upstream roots and downstream blast radius
            </p>
          </div>
        </div>

        <div className="cp-dag-layers-wrapper">
          {/* Layer 1: External Sources */}
          <div className="cp-dag-layer">
            <div className="cp-dag-layer-title">1. External Sources</div>
            <div className="cp-dag-nodes-col">
              {layerGroups.SOURCES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.includes(node.id);
                const isDownstream = downstreamNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`cp-dag-node ${isSelected ? "selected" : ""} ${
                      isUpstream ? "upstream-highlight" : ""
                    } ${isDownstream ? "downstream-highlight" : ""}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="cp-dag-node-type">{node.type.replace(/_/g, " ")}</div>
                    <div className="cp-dag-node-name">{node.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cp-dag-flow-arrow">➔</div>

          {/* Layer 2: Ingestion & Normalization */}
          <div className="cp-dag-layer">
            <div className="cp-dag-layer-title">2. Ingest & Normalize</div>
            <div className="cp-dag-nodes-col">
              {layerGroups.INGESTION.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.includes(node.id);
                const isDownstream = downstreamNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`cp-dag-node ${isSelected ? "selected" : ""} ${
                      isUpstream ? "upstream-highlight" : ""
                    } ${isDownstream ? "downstream-highlight" : ""}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="cp-dag-node-type">{node.type.replace(/_/g, " ")}</div>
                    <div className="cp-dag-node-name">{node.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cp-dag-flow-arrow">➔</div>

          {/* Layer 3: Reference Master & Validation */}
          <div className="cp-dag-layer">
            <div className="cp-dag-layer-title">3. Golden Master & Rules</div>
            <div className="cp-dag-nodes-col">
              {layerGroups.REFERENCE_MASTER.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.includes(node.id);
                const isDownstream = downstreamNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`cp-dag-node ${isSelected ? "selected" : ""} ${
                      isUpstream ? "upstream-highlight" : ""
                    } ${isDownstream ? "downstream-highlight" : ""}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="cp-dag-node-type">{node.type.replace(/_/g, " ")}</div>
                    <div className="cp-dag-node-name">{node.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cp-dag-flow-arrow">➔</div>

          {/* Layer 4: Distribution Bus */}
          <div className="cp-dag-layer">
            <div className="cp-dag-layer-title">4. Distribution Bus</div>
            <div className="cp-dag-nodes-col">
              {layerGroups.DISTRIBUTION.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.includes(node.id);
                const isDownstream = downstreamNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`cp-dag-node ${isSelected ? "selected" : ""} ${
                      isUpstream ? "upstream-highlight" : ""
                    } ${isDownstream ? "downstream-highlight" : ""}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="cp-dag-node-type">{node.type.replace(/_/g, " ")}</div>
                    <div className="cp-dag-node-name">{node.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cp-dag-flow-arrow">➔</div>

          {/* Layer 5: Downstream Consumers */}
          <div className="cp-dag-layer">
            <div className="cp-dag-layer-title">5. Downstream Consumers</div>
            <div className="cp-dag-nodes-col">
              {layerGroups.DOWNSTREAM.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.includes(node.id);
                const isDownstream = downstreamNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`cp-dag-node ${isSelected ? "selected" : ""} ${
                      isUpstream ? "upstream-highlight" : ""
                    } ${isDownstream ? "downstream-highlight" : ""}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="cp-dag-node-type">{node.type.replace(/_/g, " ")}</div>
                    <div className="cp-dag-node-name">{node.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Impact Detailed Table */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">Impact Analysis for Node: {selectedNode.label}</h3>
            <p className="cp-card-subtitle">
              Downstream applications that rely directly or transitively on this pipeline node
            </p>
          </div>
        </div>

        <div className="cp-table-container">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Consumer System</th>
                <th>Criticality Tier</th>
                <th>Potential Consequence</th>
                <th>Action Required Upon Failure</th>
              </tr>
            </thead>
            <tbody>
              {impactAnalysis.impactedConsumers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--cp-text-muted)" }}>
                    No downstream consumers impacted by this terminal node.
                  </td>
                </tr>
              ) : (
                impactAnalysis.impactedConsumers.map((c) => (
                  <tr key={c.nodeId}>
                    <td className="cp-text-semibold">{c.systemName}</td>
                    <td>
                      <span
                        className={`cp-status-pill ${
                          c.riskTier === "TIER_1_CRITICAL"
                            ? "critical"
                            : c.riskTier === "TIER_2_SIGNIFICANT"
                            ? "warning"
                            : "pass"
                        }`}
                      >
                        {c.riskTier.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="cp-text-muted" style={{ maxWidth: "340px" }}>
                      {c.potentialConsequence}
                    </td>
                    <td className="cp-text-muted" style={{ maxWidth: "300px" }}>
                      {c.requiredAction}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
