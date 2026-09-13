"use client";

import React, { useState } from "react";
import { CanonicalInstrument } from "../types";

interface DataExplorerViewProps {
  instruments: CanonicalInstrument[];
}

export function DataExplorerView({ instruments }: DataExplorerViewProps) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(
    instruments[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assetClassFilter, setAssetClassFilter] = useState<string>("ALL");

  const filteredInstruments = instruments.filter((inst) => {
    if (assetClassFilter !== "ALL" && inst.assetClass !== assetClassFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inst.symbol.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        (inst.isin && inst.isin.toLowerCase().includes(q)) ||
        inst.exchange.toLowerCase().includes(q) ||
        (inst.bloombergTicker && inst.bloombergTicker.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const selectedInstrument =
    instruments.find((i) => i.id === selectedInstrumentId) || instruments[0];

  return (
    <div className="cp-section-stack">
      {/* Header */}
      <div className="cp-header-action-row">
        <div>
          <h2 className="cp-view-heading">Canonical Financial Instrument Data Explorer</h2>
          <p className="cp-view-subheading">
            Enterprise golden-copy instrument directory with contract specifications, multi-asset symbology mapping, tick schedules, and margin parameters.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="cp-card cp-filter-bar">
        <div className="cp-filter-item">
          <label className="cp-filter-label">Search Directory:</label>
          <input
            type="text"
            className="cp-input"
            placeholder="Search symbol, ISIN, exchange, ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cp-filter-item">
          <label className="cp-filter-label">Asset Class:</label>
          <select
            className="cp-select"
            value={assetClassFilter}
            onChange={(e) => setAssetClassFilter(e.target.value)}
          >
            <option value="ALL">All Asset Classes</option>
            <option value="EQUITY_INDEX">Equity Index</option>
            <option value="ENERGY">Energy & Commodities</option>
            <option value="INTEREST_RATE">Interest Rates & Bonds</option>
          </select>
        </div>
      </div>

      {/* Master-Detail Explorer */}
      <div className="cp-grid-master-detail">
        {/* Instruments Directory List */}
        <div className="cp-sources-list">
          {filteredInstruments.map((inst) => {
            const isSelected = selectedInstrument.id === inst.id;
            return (
              <div
                key={inst.id}
                className={`cp-source-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedInstrumentId(inst.id)}
              >
                <div className="cp-source-card-top">
                  <span className="cp-badge-symbol cp-mono">{inst.symbol}</span>
                  <span className="cp-tag">{inst.exchange}</span>
                </div>
                <div className="cp-source-card-name">{inst.name}</div>
                <div className="cp-source-card-meta">
                  <span>ISIN: {inst.isin || "—"}</span>
                  <span>Settle: {inst.lastSettlementPrice} {inst.specs.currency}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Golden Instrument Card */}
        <div className="cp-detail-panel cp-card">
          <div className="cp-card-header">
            <div>
              <div className="cp-source-code-badge">{selectedInstrument.exchange} — {selectedInstrument.assetClass}</div>
              <h3 className="cp-card-title">{selectedInstrument.name}</h3>
              <p className="cp-card-subtitle">Canonical ID: {selectedInstrument.id}</p>
            </div>
            <span className="cp-status-pill pass large">{selectedInstrument.status}</span>
          </div>

          {/* Symbology Identifiers Cross-Reference */}
          <div className="cp-symbology-box">
            <h4 className="cp-analysis-title">Symbology Cross-Reference</h4>
            <div className="cp-symbology-grid">
              <div className="cp-symbology-item">
                <span className="cp-detail-label">Exchange Symbol</span>
                <span className="cp-detail-value cp-mono">{selectedInstrument.symbol}</span>
              </div>
              <div className="cp-symbology-item">
                <span className="cp-detail-label">ISIN Identifier</span>
                <span className="cp-detail-value cp-mono">{selectedInstrument.isin || "—"}</span>
              </div>
              <div className="cp-symbology-item">
                <span className="cp-detail-label">Reuters RIC</span>
                <span className="cp-detail-value cp-mono">{selectedInstrument.ric || "—"}</span>
              </div>
              <div className="cp-symbology-item">
                <span className="cp-detail-label">Bloomberg Ticker</span>
                <span className="cp-detail-value cp-mono">{selectedInstrument.bloombergTicker || "—"}</span>
              </div>
            </div>
          </div>

          {/* Contract Specifications Grid */}
          <h4 className="cp-analysis-title" style={{ marginTop: "1.5rem" }}>
            Golden Copy Contract Specifications
          </h4>
          <div className="cp-detail-grid">
            <div className="cp-detail-item">
              <span className="cp-detail-label">Contract Size Multiplier</span>
              <span className="cp-detail-value cp-mono">{selectedInstrument.specs.contractSize}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Contract Unit</span>
              <span className="cp-detail-value">{selectedInstrument.specs.contractUnit}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Denominated Currency</span>
              <span className="cp-detail-value cp-mono">{selectedInstrument.specs.currency}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Minimum Tick Size</span>
              <span className="cp-detail-value cp-mono">{selectedInstrument.specs.tickSize}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Tick Value (Per Contract)</span>
              <span className="cp-detail-value cp-mono">
                {selectedInstrument.specs.tickValue} {selectedInstrument.specs.currency}
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Settlement Method</span>
              <span className="cp-detail-value cp-mono">{selectedInstrument.specs.settlementMethod}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Last Settlement Price</span>
              <span className="cp-detail-value cp-mono cp-text-bold">
                {selectedInstrument.lastSettlementPrice} {selectedInstrument.specs.currency}
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">24h Trade Volume</span>
              <span className="cp-detail-value cp-mono">
                {selectedInstrument.volume24h?.toLocaleString() ?? "—"} contracts
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Open Interest</span>
              <span className="cp-detail-value cp-mono">
                {selectedInstrument.openInterest?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Approx Initial Margin</span>
              <span className="cp-detail-value cp-mono">
                {selectedInstrument.specs.initialMarginApproxUSD
                  ? `$${selectedInstrument.specs.initialMarginApproxUSD.toLocaleString()} USD`
                  : "—"}
              </span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Trading Hours</span>
              <span className="cp-detail-value">{selectedInstrument.specs.tradingHours}</span>
            </div>
            <div className="cp-detail-item">
              <span className="cp-detail-label">Last Trading / Expiration Date</span>
              <span className="cp-detail-value cp-mono">{selectedInstrument.specs.lastTradingDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
