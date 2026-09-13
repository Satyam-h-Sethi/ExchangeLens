"use client";

import { useState } from "react";
import Link from "next/link";
import "./aci.css";
import {
  OverviewView,
  CompareView,
  ConsumersView,
  HistoryView,
  ContractIntelligenceDemoBanner,
} from "@/features/api-contract-intelligence/components";
import { SYNTHETIC_CONTRACTS } from "@/features/api-contract-intelligence/data/contracts";
import { SYNTHETIC_CONSUMERS } from "@/features/api-contract-intelligence/data/consumers";

// ─── Tab configuration ────────────────────────────────────────────────────────

type TabId = "overview" | "compare" | "consumers" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",   label: "Overview" },
  { id: "compare",    label: "Compare" },
  { id: "consumers",  label: "Consumers" },
  { id: "history",    label: "History" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiContractIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Shared API selector — drives Compare / Consumers / History
  const [selectedApiId, setSelectedApiId] = useState<string>(
    SYNTHETIC_CONTRACTS[0]?.id ?? ""
  );

  const selectedContract =
    SYNTHETIC_CONTRACTS.find((c) => c.id === selectedApiId) ??
    SYNTHETIC_CONTRACTS[0];

  return (
    <main className="aci-root">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="aci-header">
        <div>
          <Link href="/" className="aci-back-link" style={{ display: "inline-block", marginBottom: "0.5rem", fontSize: "0.82rem", color: "var(--aci-text-muted)", textDecoration: "none" }}>
            ← Back to Portfolio Overview
          </Link>
          <div className="aci-header-eyebrow">Internal Platform</div>
          <h1 className="aci-header-title">API Contract Intelligence</h1>
          <p className="aci-header-subtitle">
            Structural diff · Compatibility classification · Consumer blast
            radius · Release gate
          </p>
        </div>

        {/* API selector lives in header so all tabs share it */}
        <div className="aci-header-selectors">
          <div className="aci-header-form-group">
            <label className="aci-header-label" htmlFor="api-select">
              API Contract
            </label>
            <select
              id="api-select"
              className="aci-select"
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
            >
              {SYNTHETIC_CONTRACTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Interactive Automation Demonstration Banner ─────────────────── */}
      <ContractIntelligenceDemoBanner
        contract={selectedContract}
        consumers={SYNTHETIC_CONSUMERS}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 350, behavior: "smooth" });
        }}
      />

      {/* ── Primary nav ─────────────────────────────────────────────────── */}
      <nav className="aci-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`aci-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Tab panels ──────────────────────────────────────────────────── */}
      <div className="aci-content">
        {activeTab === "overview" && (
          <OverviewView
            contracts={SYNTHETIC_CONTRACTS}
            consumers={SYNTHETIC_CONSUMERS}
            selectedApiId={selectedApiId}
            onSelectApi={setSelectedApiId}
            onNavigate={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === "compare" && (
          <CompareView
            contract={selectedContract}
            consumers={SYNTHETIC_CONSUMERS}
          />
        )}

        {activeTab === "consumers" && (
          <ConsumersView
            contracts={SYNTHETIC_CONTRACTS}
            consumers={SYNTHETIC_CONSUMERS}
            selectedApiId={selectedApiId}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            contracts={SYNTHETIC_CONTRACTS}
            consumers={SYNTHETIC_CONSUMERS}
            selectedApiId={selectedApiId}
          />
        )}
      </div>
    </main>
  );
}
