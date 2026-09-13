"use client";

import React, { useState } from "react";
import "./aci.css";
import { SYNTHETIC_CONTRACTS } from "../../../features/api-contract-intelligence/data/contracts";
import { SYNTHETIC_CONSUMERS } from "../../../features/api-contract-intelligence/data/consumers";
import {
  OverviewView,
  ContractsView,
  CompareView,
  CompatibilityView,
  ConsumersView,
  ContractTestsView,
  ReleaseGateView,
  HistoryView,
  MigrationPlanView,
} from "../../../features/api-contract-intelligence/components";

type TabId =
  | "overview"
  | "contracts"
  | "compare"
  | "compatibility"
  | "consumers"
  | "tests"
  | "release-gate"
  | "history"
  | "migration";

interface TabItem {
  id: TabId;
  label: string;
  badge?: string;
}

const TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "contracts", label: "Contracts Explorer" },
  { id: "compare", label: "Structural Diff" },
  { id: "compatibility", label: "Compatibility Matrix" },
  { id: "consumers", label: "Consumer Blast Radius" },
  { id: "tests", label: "Contract Tests" },
  { id: "release-gate", label: "Release Gate", badge: "Live" },
  { id: "migration", label: "Migration Planner" },
  { id: "history", label: "Evolution History" },
];

export default function ApiContractIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="aci-root">
      {/* Top Banner / Hero */}
      <header className="aci-hero">
        <div className="aci-hero-inner">
          <div className="aci-hero-badge-row">
            <span className="aci-badge aci-badge-neutral">INSTITUTIONAL GOVERNANCE</span>
            <span className="aci-badge aci-badge-nonbreaking">PURE COMPUTATION ENGINE</span>
            <span className="aci-badge aci-badge-informational">ZERO EXTERNAL NETWORK DEPENDENCY</span>
          </div>
          <h1 className="aci-hero-title">API Contract Intelligence & Release Governance</h1>
          <p className="aci-hero-subtitle">
            Deterministic AST diffing, semantic backward/forward compatibility classification, consumer blast radius
            modeling, and zero-network contract invariant testing for mission-critical financial APIs.
          </p>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <nav className="aci-nav-bar" aria-label="API Contract Intelligence Navigation">
        <div className="aci-nav-inner">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`aci-nav-tab ${isActive ? "aci-nav-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.badge && <span className="aci-tab-badge">{tab.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="aci-workspace">
        {activeTab === "overview" && (
          <OverviewView contracts={SYNTHETIC_CONTRACTS} consumers={SYNTHETIC_CONSUMERS} />
        )}
        {activeTab === "contracts" && <ContractsView contracts={SYNTHETIC_CONTRACTS} />}
        {activeTab === "compare" && <CompareView contracts={SYNTHETIC_CONTRACTS} />}
        {activeTab === "compatibility" && <CompatibilityView contracts={SYNTHETIC_CONTRACTS} />}
        {activeTab === "consumers" && (
          <ConsumersView contracts={SYNTHETIC_CONTRACTS} consumers={SYNTHETIC_CONSUMERS} />
        )}
        {activeTab === "tests" && <ContractTestsView contracts={SYNTHETIC_CONTRACTS} />}
        {activeTab === "release-gate" && (
          <ReleaseGateView contracts={SYNTHETIC_CONTRACTS} consumers={SYNTHETIC_CONSUMERS} />
        )}
        {activeTab === "migration" && (
          <MigrationPlanView contracts={SYNTHETIC_CONTRACTS} consumers={SYNTHETIC_CONSUMERS} />
        )}
        {activeTab === "history" && (
          <HistoryView contracts={SYNTHETIC_CONTRACTS} consumers={SYNTHETIC_CONSUMERS} />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="aci-footer">
        <div className="aci-footer-inner">
          <div className="aci-footer-brand">
            <strong>API Contract Intelligence</strong> — Enterprise Specification Governance Platform
          </div>
          <div className="aci-footer-meta">
            Deterministic AST Diff Engine • Semantic Rule Classifiers (COMPAT-REQ/RESP/PARAM/EP) • Weighted Release Gate
          </div>
        </div>
      </footer>
    </div>
  );
}
