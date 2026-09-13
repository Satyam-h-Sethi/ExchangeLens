/**
 * API Contract Intelligence — Synthetic Consumer Registry
 * 7 consumers across 4 internal teams, with declared API dependencies,
 * pinned versions, tolerance behaviors, and field-level consumption declarations.
 * All data is clearly synthetic / demo.
 */

import { ApiConsumer } from "../types";

export const SYNTHETIC_CONSUMERS: ApiConsumer[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Pricing Engine  (pinned to Market Data v1.2, strict)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "pricing-engine",
    name: "Pricing Engine",
    team: "Derivatives Pricing",
    description:
      "Real-time mark-to-market service consuming live quotes and instrument specs to compute theoretical prices and greeks for the internal book.",
    dependencies: [
      {
        apiId: "market-data-api",
        pinnedVersion: "1.2.0",
        toleranceBehavior: "STRICT",
        endpoints: [
          {
            endpointId: "GET /quotes/{symbol}",
            consumedFields: ["bid", "ask", "last", "volume", "timestamp", "exchange"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /ohlcv/{symbol}",
            consumedFields: ["bars.close", "bars.volume", "bars.timestamp", "bars.vwap"],
            criticalForOperation: false,
          },
        ],
      },
      {
        apiId: "reference-data-api",
        pinnedVersion: "1.0.0",
        toleranceBehavior: "STRICT",
        endpoints: [
          {
            endpointId: "GET /instruments/{id}",
            consumedFields: ["tick_size", "tick_value", "lot_size", "currency", "asset_class", "expiry_date"],
            criticalForOperation: true,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Reference Service  (pinned to Reference Data v1.0, lenient)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "reference-service",
    name: "Reference Service",
    team: "Data Platform",
    description:
      "Internal master data cache and lookup layer that replicates the Reference Data API for downstream services. Tolerates additional fields from the provider.",
    dependencies: [
      {
        apiId: "reference-data-api",
        pinnedVersion: "1.0.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /instruments/{id}",
            consumedFields: ["id", "symbol", "isin", "name", "exchange", "asset_class", "currency", "lot_size", "active"],
            writtenFields: undefined,
            criticalForOperation: true,
          },
          {
            endpointId: "GET /instruments",
            consumedFields: ["data.id", "data.symbol", "data.name", "data.exchange", "data.asset_class", "data.active", "total", "page", "page_size"],
            criticalForOperation: true,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Settlement Service  (pinned to Settlement v1.5 and Market Data v1.1, strict)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "settlement-service",
    name: "Settlement Service",
    team: "Post-Trade Operations",
    description:
      "Manages submission and lifecycle of CCP settlement instructions. Reads EOD settlement prices from Market Data API for validation.",
    dependencies: [
      {
        apiId: "settlement-api",
        pinnedVersion: "1.5.0",
        toleranceBehavior: "STRICT",
        endpoints: [
          {
            endpointId: "POST /instructions",
            consumedFields: [],
            writtenFields: ["trade_id", "instrument_id", "quantity", "price", "side", "settlement_date", "counterparty_id", "currency"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /instructions/{id}",
            consumedFields: ["instruction_id", "trade_id", "status", "settlement_date", "quantity", "price", "failure_reason", "updated_at"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /netting/{date}",
            consumedFields: ["settlement_date", "net_position", "instruction_count", "currency", "status"],
            criticalForOperation: false,
          },
        ],
      },
      {
        apiId: "market-data-api",
        pinnedVersion: "1.1.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /settlement/{symbol}",
            consumedFields: ["symbol", "settlement_price", "settlement_date", "source"],
            criticalForOperation: true,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Risk Service  (pinned to Risk Snapshot v1.0, strict)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "risk-service",
    name: "Risk Service",
    team: "Risk Management",
    description:
      "Aggregates portfolio risk metrics, including VaR and position exposures, and distributes to the risk dashboard and regulatory systems.",
    dependencies: [
      {
        apiId: "risk-snapshot-api",
        pinnedVersion: "1.0.0",
        toleranceBehavior: "STRICT",
        endpoints: [
          {
            endpointId: "GET /portfolio/{portfolio_id}/var",
            consumedFields: ["portfolio_id", "var_amount", "confidence", "horizon_days", "currency", "computed_at", "method"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /portfolio/{portfolio_id}/positions",
            consumedFields: ["portfolio_id", "positions.instrument_id", "positions.symbol", "positions.quantity", "positions.market_value", "positions.pnl", "total_market_value", "computed_at"],
            criticalForOperation: true,
          },
        ],
      },
      {
        apiId: "market-data-api",
        pinnedVersion: "1.2.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /quotes/{symbol}",
            consumedFields: ["bid", "ask", "last", "volume", "market_state", "timestamp"],
            criticalForOperation: false,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Reporting API  (pinned to Market Data v1.2 and Reference Data v2.0, lenient)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "reporting-api",
    name: "Reporting API",
    team: "Business Intelligence",
    description:
      "Regulatory and management reporting layer. Reads market data and reference information to produce MiFID II/EMIR daily reports.",
    dependencies: [
      {
        apiId: "market-data-api",
        pinnedVersion: "1.2.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /quotes/{symbol}",
            consumedFields: ["symbol", "last", "volume", "timestamp"],
            criticalForOperation: false,
          },
          {
            endpointId: "GET /ohlcv/{symbol}",
            consumedFields: ["symbol", "interval", "bars.open", "bars.high", "bars.low", "bars.close", "bars.volume", "bars.timestamp"],
            criticalForOperation: false,
          },
        ],
      },
      {
        apiId: "reference-data-api",
        pinnedVersion: "2.0.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /instruments/{id}",
            consumedFields: ["id", "symbol", "isin", "mic", "name", "exchange", "asset_class", "currency", "regulatory_status", "active"],
            criticalForOperation: true,
          },
        ],
      },
      {
        apiId: "settlement-api",
        pinnedVersion: "1.5.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /netting/{date}",
            consumedFields: ["settlement_date", "net_position", "instruction_count", "currency", "status"],
            criticalForOperation: false,
          },
        ],
      },
      {
        apiId: "risk-snapshot-api",
        pinnedVersion: "1.3.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /portfolio/{portfolio_id}/var",
            consumedFields: ["portfolio_id", "var_value", "expected_shortfall", "confidence", "horizon_days", "currency", "method"],
            criticalForOperation: false,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Batch Analytics  (pinned to Market Data v1.1, version-locked)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "batch-analytics",
    name: "Batch Analytics",
    team: "Quantitative Research",
    description:
      "Overnight batch job computing analytics, factor models, and back-tests. Version-locked: cannot upgrade mid-research cycle without full validation.",
    dependencies: [
      {
        apiId: "market-data-api",
        pinnedVersion: "1.1.0",
        toleranceBehavior: "VERSION_LOCKED",
        endpoints: [
          {
            endpointId: "GET /ohlcv/{symbol}",
            consumedFields: ["symbol", "interval", "bars.open", "bars.high", "bars.low", "bars.close", "bars.volume", "bars.timestamp"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /settlement/{symbol}",
            consumedFields: ["symbol", "settlement_price", "settlement_date", "source"],
            criticalForOperation: true,
          },
        ],
      },
      {
        apiId: "reference-data-api",
        pinnedVersion: "1.0.0",
        toleranceBehavior: "VERSION_LOCKED",
        endpoints: [
          {
            endpointId: "GET /instruments/{id}",
            consumedFields: ["id", "symbol", "isin", "currency", "tick_size", "tick_value", "lot_size", "asset_class", "expiry_date", "active"],
            criticalForOperation: true,
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Mobile Client  (pinned to Market Data v1.2, lenient)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "mobile-client",
    name: "Mobile Client",
    team: "Client Applications",
    description:
      "iOS/Android trader app. Lenient field handling: ignores unknown fields, gracefully degrades on missing optional data.",
    dependencies: [
      {
        apiId: "market-data-api",
        pinnedVersion: "1.2.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /quotes/{symbol}",
            consumedFields: ["symbol", "bid", "ask", "last", "volume", "market_state", "timestamp"],
            criticalForOperation: true,
          },
          {
            endpointId: "GET /ohlcv/{symbol}",
            consumedFields: ["symbol", "interval", "bars.open", "bars.high", "bars.low", "bars.close", "bars.volume", "bars.timestamp"],
            criticalForOperation: false,
          },
        ],
      },
      {
        apiId: "reference-data-api",
        pinnedVersion: "1.0.0",
        toleranceBehavior: "LENIENT",
        endpoints: [
          {
            endpointId: "GET /instruments/{id}",
            consumedFields: ["symbol", "name", "exchange", "asset_class", "currency", "active"],
            criticalForOperation: false,
          },
        ],
      },
    ],
  },
];

export const CONSUMER_MAP: Record<string, ApiConsumer> = Object.fromEntries(
  SYNTHETIC_CONSUMERS.map((c) => [c.id, c])
);
