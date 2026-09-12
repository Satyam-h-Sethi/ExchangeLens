"use client";

import React, { useRef } from "react";
import type { ExchangeLensScenario } from "../types";
import { Badge } from "@/components/ui/Badge";

interface ScenarioSelectorProps {
  scenarios: ExchangeLensScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const EXCHANGE_COLORS: Record<string, "accent" | "pass" | "warn"> = {
  CME: "accent",
  ICE: "pass",
  EUREX: "warn",
};

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  selectedId,
  onSelect,
}) => {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % scenarios.length;
      onSelect(scenarios[next].id);
      btnRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + scenarios.length) % scenarios.length;
      onSelect(scenarios[prev].id);
      btnRefs.current[prev]?.focus();
    }
  };

  return (
    <div className="el-scenario-selector" role="tablist" aria-label="Exchange scenarios">
      {scenarios.map((scenario, idx) => {
        const isSelected = scenario.id === selectedId;
        const variant = EXCHANGE_COLORS[scenario.notice.exchange] ?? "accent";
        return (
          <button
            key={scenario.id}
            ref={(el) => { btnRefs.current[idx] = el; }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(scenario.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`el-scenario-btn${isSelected ? " is-active" : ""}`}
          >
            <div className="el-scenario-btn-top">
              <Badge variant={variant}>{scenario.notice.exchange}</Badge>
              <span className="el-scenario-doctype">{scenario.notice.documentType}</span>
            </div>
            <div className="el-scenario-symbol">{scenario.notice.affectedSymbol}</div>
            <div className="el-scenario-product">{scenario.notice.affectedProduct}</div>
            <div className="el-scenario-docid">{scenario.notice.documentId}</div>
          </button>
        );
      })}
    </div>
  );
};
