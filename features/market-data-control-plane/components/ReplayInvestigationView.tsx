"use client";

import React, { useState } from "react";
import { PipelineReplayScenario } from "../types";

interface ReplayInvestigationViewProps {
  scenarios: PipelineReplayScenario[];
}

export function ReplayInvestigationView({
  scenarios,
}: ReplayInvestigationViewProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || ""
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(3); // default to step 3 (Reconciliation)

  const currentScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const activeStage = currentScenario.stages[activeStepIndex] || currentScenario.stages[0];

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Step-by-Step Pipeline Replay & Investigation</h2>
          <p className="cp-view-subheading">
            Reconstruct and step through end-to-end data pipeline execution to inspect exact payloads, intermediate states, and validation failures.
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="cp-filter-group">
          <label className="cp-filter-label">Select Pipeline Scenario:</label>
          <select
            className="cp-select"
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setActiveStepIndex(0);
            }}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Overview Banner */}
      <div className="cp-card">
        <div className="cp-card-header">
          <div>
            <h3 className="cp-card-title">{currentScenario.title}</h3>
            <p className="cp-card-subtitle">{currentScenario.description}</p>
          </div>
          <div className="cp-recon-source-row">
            <span className="cp-tag">Entity: {currentScenario.triggerEntityId}</span>
            <span className="cp-tag cp-mono">Source: {currentScenario.triggerSourceCode}</span>
          </div>
        </div>
      </div>

      {/* 6-Stage Pipeline Step Tracker */}
      <div className="cp-replay-steps-container">
        {currentScenario.stages.map((stage, idx) => {
          const isActive = activeStepIndex === idx;
          return (
            <div
              key={stage.stageIndex}
              className={`cp-replay-step-card ${isActive ? "active" : ""} cp-step-status-${stage.status.toLowerCase()}`}
              onClick={() => setActiveStepIndex(idx)}
            >
              <div className="cp-replay-step-number">Stage {idx + 1}</div>
              <div className="cp-replay-step-name">{stage.stageName}</div>
              <div className="cp-replay-step-status">
                <span className={`cp-status-pill small ${stage.status.toLowerCase()}`}>
                  {stage.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Detail Console */}
      <div className="cp-card cp-detail-panel">
        <div className="cp-card-header">
          <div>
            <div className="cp-source-code-badge">
              STAGE {(activeStage.stageIndex ?? activeStepIndex) + 1} OF {currentScenario.stages.length}
            </div>
            <h3 className="cp-card-title">{activeStage.stageName}</h3>
            <p className="cp-card-subtitle">
              Execution timestamp: {new Date(activeStage.timestamp).toISOString()}
            </p>
          </div>
          <span className={`cp-status-pill large ${activeStage.status.toLowerCase()}`}>
            {activeStage.status}
          </span>
        </div>

        {/* Stage Execution Details */}
        <div className="cp-stage-content-box">
          <h4 className="cp-analysis-title">Stage Execution Summary</h4>
          <p className="cp-stage-details-text">{activeStage.details}</p>

          <h4 className="cp-analysis-title" style={{ marginTop: "1.25rem" }}>
            Output Artifact / Ingestion Snapshot
          </h4>
          <div className="cp-stage-output-box cp-mono">{activeStage.outputSummary}</div>
        </div>

        {/* Navigation Step Buttons */}
        <div className="cp-replay-nav-buttons">
          <button
            className="cp-btn-secondary"
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
          >
            ← Previous Stage
          </button>
          <button
            className="cp-btn-primary"
            disabled={activeStepIndex === currentScenario.stages.length - 1}
            onClick={() =>
              setActiveStepIndex((prev) =>
                Math.min(currentScenario.stages.length - 1, prev + 1)
              )
            }
          >
            Next Stage →
          </button>
        </div>
      </div>
    </div>
  );
}
