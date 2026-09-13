/**
 * API Contract Intelligence — Synthetic API Contracts
 * 4 APIs × multiple versions, realistic fintech field schemas.
 * All data is clearly synthetic / demo.
 */

import { ApiContract } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Market Data API  (v1.0 → v1.1 → v1.2 → v2.0)
// ─────────────────────────────────────────────────────────────────────────────
const MARKET_DATA_API: ApiContract = {
  id: "market-data-api",
  name: "Market Data API",
  domain: "MARKET_DATA",
  description:
    "Real-time and delayed price feeds, OHLCV bars, and instrument reference snapshots for exchange-traded derivatives.",
  owner: "Market Data Platform Team",
  baseUrl: "https://api-demo.ids.ion/market-data",
  versions: [
    // ── v1.0 ──────────────────────────────────────────────────────────────
    {
      version: "1.0.0",
      publishedDate: "2023-01-15",
      changelogSummary: "Initial GA release — price quotes and basic OHLCV.",
      endpoints: [
        {
          id: "GET /quotes/{symbol}",
          method: "GET",
          path: "/quotes/{symbol}",
          summary: "Retrieve latest bid/ask/last for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string", description: "Exchange symbol (e.g. ESH4)" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Quote snapshot",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "bid", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "ask", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "last", type: "decimal", required: true, nullable: false, format: "decimal128" },
                { name: "volume", type: "integer", required: true, nullable: false, constraints: { minimum: 0 } },
                { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "exchange", type: "string", required: true, nullable: false, enumValues: ["CME", "ICE", "EUREX"] },
              ],
            },
            { statusCode: 404, description: "Symbol not found", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }] },
          ],
          tags: ["quotes"],
        },
        {
          id: "GET /ohlcv/{symbol}",
          method: "GET",
          path: "/ohlcv/{symbol}",
          summary: "Retrieve OHLCV bars for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "interval", in: "query", required: true, type: "string", enumValues: ["1m", "5m", "1h", "1d"] },
            { name: "limit", in: "query", required: false, type: "integer", description: "Max bars (default 100)" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "OHLCV bars array",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "interval", type: "string", required: true, nullable: false },
                { name: "bars", type: "array", required: true, nullable: false,
                  items: { name: "bar", type: "object", required: true, nullable: false, properties: [
                    { name: "open", type: "decimal", required: true, nullable: false },
                    { name: "high", type: "decimal", required: true, nullable: false },
                    { name: "low", type: "decimal", required: true, nullable: false },
                    { name: "close", type: "decimal", required: true, nullable: false },
                    { name: "volume", type: "integer", required: true, nullable: false },
                    { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                  ]},
                },
              ],
            },
          ],
          tags: ["ohlcv"],
        },
      ],
    },
    // ── v1.1 ──────────────────────────────────────────────────────────────
    {
      version: "1.1.0",
      publishedDate: "2023-06-20",
      changelogSummary: "Added open_interest field to quotes; added currency to quotes; added settlement endpoint.",
      endpoints: [
        {
          id: "GET /quotes/{symbol}",
          method: "GET",
          path: "/quotes/{symbol}",
          summary: "Retrieve latest bid/ask/last for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Quote snapshot",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "bid", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "ask", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "last", type: "decimal", required: true, nullable: false, format: "decimal128" },
                { name: "volume", type: "integer", required: true, nullable: false },
                { name: "open_interest", type: "integer", required: false, nullable: true },  // NEW in 1.1
                { name: "currency", type: "string", required: false, nullable: false, defaultValue: "USD" }, // NEW in 1.1
                { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "exchange", type: "string", required: true, nullable: false, enumValues: ["CME", "ICE", "EUREX"] },
              ],
            },
            { statusCode: 404, description: "Symbol not found", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }] },
          ],
          tags: ["quotes"],
        },
        {
          id: "GET /ohlcv/{symbol}",
          method: "GET",
          path: "/ohlcv/{symbol}",
          summary: "Retrieve OHLCV bars for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "interval", in: "query", required: true, type: "string", enumValues: ["1m", "5m", "15m", "1h", "1d"] }, // 15m added
            { name: "limit", in: "query", required: false, type: "integer" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "OHLCV bars array",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "interval", type: "string", required: true, nullable: false },
                { name: "bars", type: "array", required: true, nullable: false,
                  items: { name: "bar", type: "object", required: true, nullable: false, properties: [
                    { name: "open", type: "decimal", required: true, nullable: false },
                    { name: "high", type: "decimal", required: true, nullable: false },
                    { name: "low", type: "decimal", required: true, nullable: false },
                    { name: "close", type: "decimal", required: true, nullable: false },
                    { name: "volume", type: "integer", required: true, nullable: false },
                    { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                    { name: "vwap", type: "decimal", required: false, nullable: true }, // NEW
                  ]},
                },
              ],
            },
          ],
          tags: ["ohlcv"],
        },
        {
          id: "GET /settlement/{symbol}",
          method: "GET",
          path: "/settlement/{symbol}",
          summary: "Retrieve daily settlement price",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "date", in: "query", required: false, type: "date", format: "date" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Settlement record",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "settlement_price", type: "decimal", required: true, nullable: false },
                { name: "settlement_date", type: "date", required: true, nullable: false, format: "date" },
                { name: "source", type: "string", required: true, nullable: false, enumValues: ["EXCHANGE_OFFICIAL", "CALCULATED"] },
              ],
            },
          ],
          tags: ["settlement"],
        },
      ],
    },
    // ── v1.2 ──────────────────────────────────────────────────────────────
    {
      version: "1.2.0",
      publishedDate: "2024-02-10",
      changelogSummary: "volume changed integer→number on quotes; deprecated exchange enum; added market_state field.",
      endpoints: [
        {
          id: "GET /quotes/{symbol}",
          method: "GET",
          path: "/quotes/{symbol}",
          summary: "Retrieve latest bid/ask/last for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "fields", in: "query", required: false, type: "string", description: "Comma-separated field projection" }, // NEW param
          ],
          responses: [
            {
              statusCode: 200,
              description: "Quote snapshot",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "bid", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "ask", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "last", type: "decimal", required: true, nullable: false, format: "decimal128" },
                { name: "volume", type: "number", required: true, nullable: false },  // CHANGED: integer → number (breaking)
                { name: "open_interest", type: "integer", required: false, nullable: true },
                { name: "currency", type: "string", required: false, nullable: false, defaultValue: "USD" },
                { name: "market_state", type: "string", required: false, nullable: false, enumValues: ["PRE_OPEN", "OPEN", "CLOSED", "HALT"] }, // NEW
                { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "exchange", type: "string", required: true, nullable: false, enumValues: ["CME", "ICE", "EUREX"], deprecated: true }, // DEPRECATED
              ],
            },
            { statusCode: 404, description: "Symbol not found", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }] },
            { statusCode: 429, description: "Rate limit exceeded", contentType: "application/json", fields: [{ name: "retry_after", type: "integer", required: true, nullable: false }] }, // NEW response code
          ],
          tags: ["quotes"],
        },
        {
          id: "GET /ohlcv/{symbol}",
          method: "GET",
          path: "/ohlcv/{symbol}",
          summary: "Retrieve OHLCV bars for a symbol",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "interval", in: "query", required: true, type: "string", enumValues: ["1m", "5m", "15m", "1h", "4h", "1d"] }, // 4h added
            { name: "limit", in: "query", required: false, type: "integer" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "OHLCV bars array",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "interval", type: "string", required: true, nullable: false },
                { name: "bars", type: "array", required: true, nullable: false,
                  items: { name: "bar", type: "object", required: true, nullable: false, properties: [
                    { name: "open", type: "decimal", required: true, nullable: false },
                    { name: "high", type: "decimal", required: true, nullable: false },
                    { name: "low", type: "decimal", required: true, nullable: false },
                    { name: "close", type: "decimal", required: true, nullable: false },
                    { name: "volume", type: "integer", required: true, nullable: false },
                    { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                    { name: "vwap", type: "decimal", required: false, nullable: true },
                  ]},
                },
              ],
            },
          ],
          tags: ["ohlcv"],
        },
        {
          id: "GET /settlement/{symbol}",
          method: "GET",
          path: "/settlement/{symbol}",
          summary: "Retrieve daily settlement price",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "date", in: "query", required: false, type: "date" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Settlement record",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "settlement_price", type: "decimal", required: true, nullable: false },
                { name: "settlement_date", type: "date", required: true, nullable: false, format: "date" },
                { name: "source", type: "string", required: true, nullable: false, enumValues: ["EXCHANGE_OFFICIAL", "CALCULATED", "ESTIMATED"] }, // ESTIMATED added
              ],
            },
          ],
          tags: ["settlement"],
        },
      ],
    },
    // ── v2.0 ──────────────────────────────────────────────────────────────
    {
      version: "2.0.0",
      publishedDate: "2024-09-01",
      changelogSummary: "Major redesign: /quotes renamed to /instruments/{symbol}/quote; exchange field removed; tick_size added as required; error schema standardized.",
      endpoints: [
        {
          id: "GET /instruments/{symbol}/quote",
          method: "GET",
          path: "/instruments/{symbol}/quote",
          summary: "Retrieve instrument quote (v2 renamed endpoint)",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "fields", in: "query", required: false, type: "string" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Quote snapshot v2",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "bid", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "ask", type: "decimal", required: true, nullable: false, format: "decimal128", constraints: { minimum: 0 } },
                { name: "last", type: "decimal", required: true, nullable: false, format: "decimal128" },
                { name: "volume", type: "number", required: true, nullable: false },
                { name: "open_interest", type: "integer", required: false, nullable: true },
                { name: "currency", type: "string", required: true, nullable: false },  // NOW REQUIRED (breaking)
                { name: "tick_size", type: "decimal", required: true, nullable: false }, // NEW REQUIRED (breaking)
                { name: "market_state", type: "string", required: true, nullable: false, enumValues: ["PRE_OPEN", "OPEN", "CLOSED", "HALT"] },
                { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                // exchange REMOVED (breaking)
              ],
            },
            {
              statusCode: 400,
              description: "Bad request — standard error envelope",
              contentType: "application/json",
              fields: [
                { name: "code", type: "string", required: true, nullable: false },
                { name: "message", type: "string", required: true, nullable: false },
                { name: "details", type: "array", required: false, nullable: true,
                  items: { name: "detail", type: "string", required: true, nullable: false } },
              ],
            },
            { statusCode: 404, description: "Symbol not found", contentType: "application/json",
              fields: [{ name: "code", type: "string", required: true, nullable: false }, { name: "message", type: "string", required: true, nullable: false }] },
            { statusCode: 429, description: "Rate limit exceeded", contentType: "application/json",
              fields: [{ name: "retry_after", type: "integer", required: true, nullable: false }] },
          ],
          tags: ["quotes", "instruments"],
        },
        {
          id: "GET /instruments/{symbol}/ohlcv",
          method: "GET",
          path: "/instruments/{symbol}/ohlcv",
          summary: "Retrieve OHLCV bars (v2 renamed)",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "interval", in: "query", required: true, type: "string", enumValues: ["1m", "5m", "15m", "1h", "4h", "1d"] },
            { name: "limit", in: "query", required: false, type: "integer" },
            { name: "from", in: "query", required: false, type: "datetime" },
            { name: "to", in: "query", required: false, type: "datetime" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "OHLCV bars",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "interval", type: "string", required: true, nullable: false },
                { name: "bars", type: "array", required: true, nullable: false,
                  items: { name: "bar", type: "object", required: true, nullable: false, properties: [
                    { name: "open", type: "decimal", required: true, nullable: false },
                    { name: "high", type: "decimal", required: true, nullable: false },
                    { name: "low", type: "decimal", required: true, nullable: false },
                    { name: "close", type: "decimal", required: true, nullable: false },
                    { name: "volume", type: "integer", required: true, nullable: false },
                    { name: "timestamp", type: "datetime", required: true, nullable: false, format: "date-time" },
                    { name: "vwap", type: "decimal", required: false, nullable: true },
                    { name: "num_trades", type: "integer", required: false, nullable: true }, // NEW
                  ]},
                },
              ],
            },
          ],
          tags: ["ohlcv", "instruments"],
        },
        {
          id: "GET /instruments/{symbol}/settlement",
          method: "GET",
          path: "/instruments/{symbol}/settlement",
          summary: "Settlement price (v2 renamed)",
          parameters: [
            { name: "symbol", in: "path", required: true, type: "string" },
            { name: "date", in: "query", required: false, type: "date" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Settlement record",
              contentType: "application/json",
              fields: [
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "settlement_price", type: "decimal", required: true, nullable: false },
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "source", type: "string", required: true, nullable: false, enumValues: ["EXCHANGE_OFFICIAL", "CALCULATED", "ESTIMATED"] },
                { name: "preliminary", type: "boolean", required: true, nullable: false, defaultValue: false }, // NEW
              ],
            },
          ],
          tags: ["settlement", "instruments"],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Reference Data API  (v1.0 → v2.0)
// ─────────────────────────────────────────────────────────────────────────────
const REFERENCE_DATA_API: ApiContract = {
  id: "reference-data-api",
  name: "Reference Data API",
  domain: "REFERENCE_DATA",
  description:
    "Canonical instrument master data: contract specs, tick sizes, expiry calendars, and regulatory classification.",
  owner: "Reference Data Engineering",
  baseUrl: "https://api-demo.ids.ion/reference",
  versions: [
    {
      version: "1.0.0",
      publishedDate: "2022-11-01",
      changelogSummary: "Initial release. Instrument master + contract spec endpoints.",
      endpoints: [
        {
          id: "GET /instruments/{id}",
          method: "GET",
          path: "/instruments/{id}",
          summary: "Retrieve canonical instrument record by ID",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Instrument master record",
              contentType: "application/json",
              fields: [
                { name: "id", type: "uuid", required: true, nullable: false },
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "isin", type: "string", required: true, nullable: false, constraints: { pattern: "^[A-Z]{2}[A-Z0-9]{9}[0-9]$" } },
                { name: "name", type: "string", required: true, nullable: false },
                { name: "exchange", type: "string", required: true, nullable: false, enumValues: ["CME", "ICE", "EUREX"] },
                { name: "asset_class", type: "string", required: true, nullable: false, enumValues: ["FUTURE", "OPTION", "SWAP", "BOND"] },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "tick_size", type: "decimal", required: true, nullable: false, constraints: { minimum: 0 } },
                { name: "tick_value", type: "decimal", required: true, nullable: false },
                { name: "lot_size", type: "integer", required: true, nullable: false, constraints: { minimum: 1 } },
                { name: "expiry_date", type: "date", required: false, nullable: true, format: "date" },
                { name: "active", type: "boolean", required: true, nullable: false },
              ],
            },
            { statusCode: 404, description: "Not found", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }] },
          ],
          tags: ["instruments"],
        },
        {
          id: "GET /instruments",
          method: "GET",
          path: "/instruments",
          summary: "List instruments with filters",
          parameters: [
            { name: "exchange", in: "query", required: false, type: "string", enumValues: ["CME", "ICE", "EUREX"] },
            { name: "asset_class", in: "query", required: false, type: "string" },
            { name: "active", in: "query", required: false, type: "boolean" },
            { name: "page", in: "query", required: false, type: "integer" },
            { name: "page_size", in: "query", required: false, type: "integer", description: "Max 500" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Paginated instrument list",
              contentType: "application/json",
              fields: [
                { name: "data", type: "array", required: true, nullable: false,
                  items: { name: "instrument", type: "object", required: true, nullable: false, properties: [
                    { name: "id", type: "uuid", required: true, nullable: false },
                    { name: "symbol", type: "string", required: true, nullable: false },
                    { name: "name", type: "string", required: true, nullable: false },
                    { name: "exchange", type: "string", required: true, nullable: false },
                    { name: "asset_class", type: "string", required: true, nullable: false },
                    { name: "active", type: "boolean", required: true, nullable: false },
                  ]} },
                { name: "total", type: "integer", required: true, nullable: false },
                { name: "page", type: "integer", required: true, nullable: false },
                { name: "page_size", type: "integer", required: true, nullable: false },
              ],
            },
          ],
          tags: ["instruments"],
        },
      ],
    },
    {
      version: "2.0.0",
      publishedDate: "2024-05-15",
      changelogSummary: "Breaking: lot_size renamed to contract_size; asset_class enum expanded; isin now nullable; MIC code added as required field.",
      endpoints: [
        {
          id: "GET /instruments/{id}",
          method: "GET",
          path: "/instruments/{id}",
          summary: "Retrieve canonical instrument record by ID",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
            { name: "include_history", in: "query", required: false, type: "boolean" }, // NEW param
          ],
          responses: [
            {
              statusCode: 200,
              description: "Instrument master record v2",
              contentType: "application/json",
              fields: [
                { name: "id", type: "uuid", required: true, nullable: false },
                { name: "symbol", type: "string", required: true, nullable: false },
                { name: "isin", type: "string", required: true, nullable: true, constraints: { pattern: "^[A-Z]{2}[A-Z0-9]{9}[0-9]$" } }, // NOW NULLABLE
                { name: "mic", type: "string", required: true, nullable: false, constraints: { minLength: 4, maxLength: 4 } }, // NEW REQUIRED
                { name: "name", type: "string", required: true, nullable: false },
                { name: "exchange", type: "string", required: true, nullable: false, enumValues: ["CME", "ICE", "EUREX", "CBOE", "LME"] }, // new enums
                { name: "asset_class", type: "string", required: true, nullable: false, enumValues: ["FUTURE", "OPTION", "SWAP", "BOND", "ETF", "INDEX"] }, // expanded
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "tick_size", type: "decimal", required: true, nullable: false, constraints: { minimum: 0 } },
                { name: "tick_value", type: "decimal", required: true, nullable: false },
                { name: "contract_size", type: "integer", required: true, nullable: false, constraints: { minimum: 1 } }, // RENAMED from lot_size
                { name: "expiry_date", type: "date", required: false, nullable: true, format: "date" },
                { name: "active", type: "boolean", required: true, nullable: false },
                { name: "regulatory_status", type: "string", required: true, nullable: false, enumValues: ["APPROVED", "PENDING", "SUSPENDED"] }, // NEW REQUIRED
              ],
            },
            { statusCode: 404, description: "Not found", contentType: "application/json",
              fields: [{ name: "code", type: "string", required: true, nullable: false }, { name: "message", type: "string", required: true, nullable: false }] },
          ],
          tags: ["instruments"],
        },
        {
          id: "GET /instruments",
          method: "GET",
          path: "/instruments",
          summary: "List instruments with filters",
          parameters: [
            { name: "exchange", in: "query", required: false, type: "string", enumValues: ["CME", "ICE", "EUREX", "CBOE", "LME"] },
            { name: "asset_class", in: "query", required: false, type: "string" },
            { name: "active", in: "query", required: false, type: "boolean" },
            { name: "page", in: "query", required: false, type: "integer" },
            { name: "page_size", in: "query", required: false, type: "integer" },
            { name: "sort", in: "query", required: false, type: "string", enumValues: ["symbol", "name", "expiry_date"] }, // NEW
          ],
          responses: [
            {
              statusCode: 200,
              description: "Paginated instrument list v2",
              contentType: "application/json",
              fields: [
                { name: "data", type: "array", required: true, nullable: false,
                  items: { name: "instrument", type: "object", required: true, nullable: false, properties: [
                    { name: "id", type: "uuid", required: true, nullable: false },
                    { name: "symbol", type: "string", required: true, nullable: false },
                    { name: "name", type: "string", required: true, nullable: false },
                    { name: "exchange", type: "string", required: true, nullable: false },
                    { name: "asset_class", type: "string", required: true, nullable: false },
                    { name: "active", type: "boolean", required: true, nullable: false },
                    { name: "mic", type: "string", required: true, nullable: false }, // NEW in list
                  ]} },
                { name: "total", type: "integer", required: true, nullable: false },
                { name: "page", type: "integer", required: true, nullable: false },
                { name: "page_size", type: "integer", required: true, nullable: false },
                { name: "links", type: "object", required: false, nullable: true, properties: [  // NEW pagination links
                  { name: "next", type: "string", required: false, nullable: true },
                  { name: "prev", type: "string", required: false, nullable: true },
                ]},
              ],
            },
          ],
          tags: ["instruments"],
        },
        {
          id: "POST /instruments/search",
          method: "POST",
          path: "/instruments/search",
          summary: "Advanced instrument lookup (new in v2)",
          parameters: [],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "query", type: "string", required: false, nullable: true },
              { name: "filters", type: "object", required: false, nullable: true, properties: [
                { name: "exchanges", type: "array", required: false, nullable: true,
                  items: { name: "exchange", type: "string", required: true, nullable: false } },
                { name: "asset_classes", type: "array", required: false, nullable: true,
                  items: { name: "class", type: "string", required: true, nullable: false } },
              ]},
            ],
          },
          responses: [
            {
              statusCode: 200,
              description: "Search results",
              contentType: "application/json",
              fields: [
                { name: "results", type: "array", required: true, nullable: false,
                  items: { name: "instrument", type: "object", required: true, nullable: false, properties: [
                    { name: "id", type: "uuid", required: true, nullable: false },
                    { name: "symbol", type: "string", required: true, nullable: false },
                    { name: "name", type: "string", required: true, nullable: false },
                    { name: "score", type: "number", required: true, nullable: false },
                  ]},
                },
              ],
            },
          ],
          tags: ["instruments", "search"],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Settlement API  (v1.0 → v1.5 → v2.0)
// ─────────────────────────────────────────────────────────────────────────────
const SETTLEMENT_API: ApiContract = {
  id: "settlement-api",
  name: "Settlement API",
  domain: "SETTLEMENT",
  description:
    "Trade settlement instruction submission, status tracking, and CCP netting reports.",
  owner: "Settlement Engineering",
  baseUrl: "https://api-demo.ids.ion/settlement",
  versions: [
    {
      version: "1.0.0",
      publishedDate: "2023-03-01",
      changelogSummary: "Initial release.",
      endpoints: [
        {
          id: "POST /instructions",
          method: "POST",
          path: "/instructions",
          summary: "Submit a settlement instruction",
          parameters: [],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "trade_id", type: "uuid", required: true, nullable: false },
              { name: "instrument_id", type: "uuid", required: true, nullable: false },
              { name: "quantity", type: "integer", required: true, nullable: false, constraints: { minimum: 1 } },
              { name: "price", type: "decimal", required: true, nullable: false, constraints: { minimum: 0 } },
              { name: "side", type: "string", required: true, nullable: false, enumValues: ["BUY", "SELL"] },
              { name: "settlement_date", type: "date", required: true, nullable: false, format: "date" },
              { name: "counterparty_id", type: "string", required: true, nullable: false },
              { name: "currency", type: "string", required: true, nullable: false },
            ],
          },
          responses: [
            {
              statusCode: 201,
              description: "Instruction accepted",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED"] },
                { name: "created_at", type: "datetime", required: true, nullable: false, format: "date-time" },
              ],
            },
            { statusCode: 400, description: "Validation error", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }] },
          ],
          tags: ["instructions"],
        },
        {
          id: "GET /instructions/{id}",
          method: "GET",
          path: "/instructions/{id}",
          summary: "Get settlement instruction status",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Instruction record",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "trade_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED"] },
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "quantity", type: "integer", required: true, nullable: false },
                { name: "price", type: "decimal", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "failure_reason", type: "string", required: false, nullable: true },
              ],
            },
          ],
          tags: ["instructions"],
        },
      ],
    },
    {
      version: "1.5.0",
      publishedDate: "2023-11-15",
      changelogSummary: "Added CCP netting endpoint; added LEI to instruction request; price constraints tightened.",
      endpoints: [
        {
          id: "POST /instructions",
          method: "POST",
          path: "/instructions",
          summary: "Submit a settlement instruction",
          parameters: [],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "trade_id", type: "uuid", required: true, nullable: false },
              { name: "instrument_id", type: "uuid", required: true, nullable: false },
              { name: "quantity", type: "integer", required: true, nullable: false, constraints: { minimum: 1 } },
              { name: "price", type: "decimal", required: true, nullable: false, constraints: { minimum: 0, maximum: 9999999.99 } }, // constraint added
              { name: "side", type: "string", required: true, nullable: false, enumValues: ["BUY", "SELL"] },
              { name: "settlement_date", type: "date", required: true, nullable: false, format: "date" },
              { name: "counterparty_id", type: "string", required: true, nullable: false },
              { name: "currency", type: "string", required: true, nullable: false },
              { name: "lei", type: "string", required: false, nullable: true, constraints: { pattern: "^[A-Z0-9]{20}$" } }, // NEW
              { name: "priority", type: "string", required: false, nullable: false, enumValues: ["NORMAL", "HIGH", "URGENT"], defaultValue: "NORMAL" }, // NEW
            ],
          },
          responses: [
            {
              statusCode: 201,
              description: "Instruction accepted",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED"] },
                { name: "created_at", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "netting_id", type: "uuid", required: false, nullable: true }, // NEW
              ],
            },
            { statusCode: 400, description: "Validation error", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }, { name: "fields", type: "array", required: false, nullable: true, items: { name: "f", type: "string", required: true, nullable: false } }] },
            { statusCode: 422, description: "Business rule violation", contentType: "application/json", fields: [{ name: "error", type: "string", required: true, nullable: false }, { name: "code", type: "string", required: true, nullable: false }] }, // NEW
          ],
          tags: ["instructions"],
        },
        {
          id: "GET /instructions/{id}",
          method: "GET",
          path: "/instructions/{id}",
          summary: "Get settlement instruction status",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Instruction record",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "trade_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED", "CANCELLED"] }, // CANCELLED added
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "quantity", type: "integer", required: true, nullable: false },
                { name: "price", type: "decimal", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "failure_reason", type: "string", required: false, nullable: true },
                { name: "netting_id", type: "uuid", required: false, nullable: true }, // NEW
                { name: "updated_at", type: "datetime", required: true, nullable: false }, // NEW REQUIRED
              ],
            },
          ],
          tags: ["instructions"],
        },
        {
          id: "GET /netting/{date}",
          method: "GET",
          path: "/netting/{date}",
          summary: "CCP netting summary for a given settlement date",
          parameters: [
            { name: "date", in: "path", required: true, type: "date", format: "date" },
            { name: "counterparty_id", in: "query", required: false, type: "string" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Netting report",
              contentType: "application/json",
              fields: [
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "net_position", type: "decimal", required: true, nullable: false },
                { name: "instruction_count", type: "integer", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["OPEN", "CLOSED"] },
              ],
            },
          ],
          tags: ["netting"],
        },
      ],
    },
    {
      version: "2.0.0",
      publishedDate: "2025-01-10",
      changelogSummary: "Breaking: quantity type integer→decimal for fractional settlement; counterparty_id renamed to cpty_bic; lei is now required; new CANCEL status endpoint.",
      endpoints: [
        {
          id: "POST /instructions",
          method: "POST",
          path: "/instructions",
          summary: "Submit a settlement instruction",
          parameters: [],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "trade_id", type: "uuid", required: true, nullable: false },
              { name: "instrument_id", type: "uuid", required: true, nullable: false },
              { name: "quantity", type: "decimal", required: true, nullable: false, constraints: { minimum: 0 } }, // BREAKING: integer→decimal
              { name: "price", type: "decimal", required: true, nullable: false, constraints: { minimum: 0, maximum: 9999999.99 } },
              { name: "side", type: "string", required: true, nullable: false, enumValues: ["BUY", "SELL"] },
              { name: "settlement_date", type: "date", required: true, nullable: false, format: "date" },
              { name: "cpty_bic", type: "string", required: true, nullable: false, constraints: { minLength: 8, maxLength: 11 } }, // RENAMED from counterparty_id
              { name: "currency", type: "string", required: true, nullable: false },
              { name: "lei", type: "string", required: true, nullable: false, constraints: { pattern: "^[A-Z0-9]{20}$" } }, // NOW REQUIRED
              { name: "priority", type: "string", required: false, nullable: false, enumValues: ["NORMAL", "HIGH", "URGENT"], defaultValue: "NORMAL" },
            ],
          },
          responses: [
            {
              statusCode: 201,
              description: "Instruction accepted",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED", "CANCELLED"] },
                { name: "created_at", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "netting_id", type: "uuid", required: false, nullable: true },
              ],
            },
            { statusCode: 400, description: "Validation error", contentType: "application/json",
              fields: [{ name: "error", type: "string", required: true, nullable: false }, { name: "fields", type: "array", required: false, nullable: true, items: { name: "f", type: "string", required: true, nullable: false } }] },
            { statusCode: 422, description: "Business rule violation", contentType: "application/json",
              fields: [{ name: "error", type: "string", required: true, nullable: false }, { name: "code", type: "string", required: true, nullable: false }] },
          ],
          tags: ["instructions"],
        },
        {
          id: "GET /instructions/{id}",
          method: "GET",
          path: "/instructions/{id}",
          summary: "Get settlement instruction status",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Instruction record v2",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "trade_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["PENDING", "MATCHED", "SETTLED", "FAILED", "CANCELLED"] },
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "quantity", type: "decimal", required: true, nullable: false }, // CHANGED integer→decimal
                { name: "price", type: "decimal", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "cpty_bic", type: "string", required: true, nullable: false }, // RENAMED
                { name: "failure_reason", type: "string", required: false, nullable: true },
                { name: "netting_id", type: "uuid", required: false, nullable: true },
                { name: "updated_at", type: "datetime", required: true, nullable: false },
              ],
            },
          ],
          tags: ["instructions"],
        },
        {
          id: "PUT /instructions/{id}/cancel",
          method: "PUT",
          path: "/instructions/{id}/cancel",
          summary: "Cancel a pending instruction (new in v2)",
          parameters: [
            { name: "id", in: "path", required: true, type: "uuid" },
          ],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "reason", type: "string", required: true, nullable: false, constraints: { maxLength: 200 } },
            ],
          },
          responses: [
            {
              statusCode: 200,
              description: "Cancellation confirmed",
              contentType: "application/json",
              fields: [
                { name: "instruction_id", type: "uuid", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["CANCELLED"] },
                { name: "cancelled_at", type: "datetime", required: true, nullable: false },
              ],
            },
            { statusCode: 409, description: "Cannot cancel — instruction already settled",
              contentType: "application/json",
              fields: [{ name: "error", type: "string", required: true, nullable: false }] },
          ],
          tags: ["instructions"],
        },
        {
          id: "GET /netting/{date}",
          method: "GET",
          path: "/netting/{date}",
          summary: "CCP netting summary for a given settlement date",
          parameters: [
            { name: "date", in: "path", required: true, type: "date" },
            { name: "cpty_bic", in: "query", required: false, type: "string" }, // RENAMED from counterparty_id
          ],
          responses: [
            {
              statusCode: 200,
              description: "Netting report v2",
              contentType: "application/json",
              fields: [
                { name: "settlement_date", type: "date", required: true, nullable: false },
                { name: "net_position", type: "decimal", required: true, nullable: false },
                { name: "gross_position", type: "decimal", required: true, nullable: false }, // NEW
                { name: "instruction_count", type: "integer", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "status", type: "string", required: true, nullable: false, enumValues: ["OPEN", "CLOSED", "PARTIAL"] }, // PARTIAL added
              ],
            },
          ],
          tags: ["netting"],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Risk Snapshot API  (v1.0 → v1.3)
// ─────────────────────────────────────────────────────────────────────────────
const RISK_SNAPSHOT_API: ApiContract = {
  id: "risk-snapshot-api",
  name: "Risk Snapshot API",
  domain: "RISK",
  description:
    "Portfolio VaR snapshots, margin exposure calculations, and position risk factor breakdown.",
  owner: "Risk Systems Engineering",
  baseUrl: "https://api-demo.ids.ion/risk",
  versions: [
    {
      version: "1.0.0",
      publishedDate: "2023-07-01",
      changelogSummary: "Initial release: VaR snapshots and position exposure.",
      endpoints: [
        {
          id: "GET /portfolio/{portfolio_id}/var",
          method: "GET",
          path: "/portfolio/{portfolio_id}/var",
          summary: "Value-at-Risk snapshot for a portfolio",
          parameters: [
            { name: "portfolio_id", in: "path", required: true, type: "string" },
            { name: "confidence", in: "query", required: false, type: "number", description: "Confidence level 0–1 (default 0.99)" },
            { name: "horizon", in: "query", required: false, type: "integer", description: "Horizon in days (default 1)" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "VaR result",
              contentType: "application/json",
              fields: [
                { name: "portfolio_id", type: "string", required: true, nullable: false },
                { name: "var_amount", type: "decimal", required: true, nullable: false },
                { name: "confidence", type: "number", required: true, nullable: false },
                { name: "horizon_days", type: "integer", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "computed_at", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "method", type: "string", required: true, nullable: false, enumValues: ["HISTORICAL", "MONTE_CARLO", "PARAMETRIC"] },
              ],
            },
          ],
          tags: ["var"],
        },
        {
          id: "GET /portfolio/{portfolio_id}/positions",
          method: "GET",
          path: "/portfolio/{portfolio_id}/positions",
          summary: "Portfolio position list with risk metrics",
          parameters: [
            { name: "portfolio_id", in: "path", required: true, type: "string" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Position list",
              contentType: "application/json",
              fields: [
                { name: "portfolio_id", type: "string", required: true, nullable: false },
                { name: "positions", type: "array", required: true, nullable: false,
                  items: { name: "pos", type: "object", required: true, nullable: false, properties: [
                    { name: "instrument_id", type: "uuid", required: true, nullable: false },
                    { name: "symbol", type: "string", required: true, nullable: false },
                    { name: "quantity", type: "number", required: true, nullable: false },
                    { name: "market_value", type: "decimal", required: true, nullable: false },
                    { name: "pnl", type: "decimal", required: true, nullable: false },
                    { name: "currency", type: "string", required: true, nullable: false },
                  ]},
                },
                { name: "total_market_value", type: "decimal", required: true, nullable: false },
                { name: "computed_at", type: "datetime", required: true, nullable: false },
              ],
            },
          ],
          tags: ["positions"],
        },
      ],
    },
    {
      version: "1.3.0",
      publishedDate: "2024-07-20",
      changelogSummary: "var_amount renamed to var_value; delta/gamma added to positions (required); stress test endpoint added.",
      endpoints: [
        {
          id: "GET /portfolio/{portfolio_id}/var",
          method: "GET",
          path: "/portfolio/{portfolio_id}/var",
          summary: "Value-at-Risk snapshot for a portfolio",
          parameters: [
            { name: "portfolio_id", in: "path", required: true, type: "string" },
            { name: "confidence", in: "query", required: false, type: "number" },
            { name: "horizon", in: "query", required: false, type: "integer" },
            { name: "as_of", in: "query", required: false, type: "datetime", description: "Point-in-time snapshot (default: latest)" }, // NEW
          ],
          responses: [
            {
              statusCode: 200,
              description: "VaR result v1.3",
              contentType: "application/json",
              fields: [
                { name: "portfolio_id", type: "string", required: true, nullable: false },
                { name: "var_value", type: "decimal", required: true, nullable: false }, // RENAMED from var_amount
                { name: "expected_shortfall", type: "decimal", required: true, nullable: false }, // NEW REQUIRED
                { name: "confidence", type: "number", required: true, nullable: false },
                { name: "horizon_days", type: "integer", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
                { name: "computed_at", type: "datetime", required: true, nullable: false, format: "date-time" },
                { name: "method", type: "string", required: true, nullable: false, enumValues: ["HISTORICAL", "MONTE_CARLO", "PARAMETRIC"] },
                { name: "scenario_count", type: "integer", required: false, nullable: true }, // NEW
              ],
            },
          ],
          tags: ["var"],
        },
        {
          id: "GET /portfolio/{portfolio_id}/positions",
          method: "GET",
          path: "/portfolio/{portfolio_id}/positions",
          summary: "Portfolio position list with risk metrics",
          parameters: [
            { name: "portfolio_id", in: "path", required: true, type: "string" },
          ],
          responses: [
            {
              statusCode: 200,
              description: "Position list v1.3",
              contentType: "application/json",
              fields: [
                { name: "portfolio_id", type: "string", required: true, nullable: false },
                { name: "positions", type: "array", required: true, nullable: false,
                  items: { name: "pos", type: "object", required: true, nullable: false, properties: [
                    { name: "instrument_id", type: "uuid", required: true, nullable: false },
                    { name: "symbol", type: "string", required: true, nullable: false },
                    { name: "quantity", type: "number", required: true, nullable: false },
                    { name: "market_value", type: "decimal", required: true, nullable: false },
                    { name: "pnl", type: "decimal", required: true, nullable: false },
                    { name: "currency", type: "string", required: true, nullable: false },
                    { name: "delta", type: "decimal", required: true, nullable: false }, // NEW REQUIRED
                    { name: "gamma", type: "decimal", required: true, nullable: false }, // NEW REQUIRED
                    { name: "vega", type: "decimal", required: false, nullable: true },  // NEW optional
                  ]},
                },
                { name: "total_market_value", type: "decimal", required: true, nullable: false },
                { name: "total_pnl", type: "decimal", required: true, nullable: false }, // NEW
                { name: "computed_at", type: "datetime", required: true, nullable: false },
              ],
            },
          ],
          tags: ["positions"],
        },
        {
          id: "POST /portfolio/{portfolio_id}/stress-test",
          method: "POST",
          path: "/portfolio/{portfolio_id}/stress-test",
          summary: "Run a stress-test scenario against a portfolio",
          parameters: [
            { name: "portfolio_id", in: "path", required: true, type: "string" },
          ],
          requestSchema: {
            contentType: "application/json",
            fields: [
              { name: "scenario", type: "string", required: true, nullable: false, enumValues: ["2008_CRISIS", "2020_COVID", "RATE_SHOCK_100BP", "EQUITY_DROP_20PCT", "CUSTOM"] },
              { name: "custom_shocks", type: "object", required: false, nullable: true },
            ],
          },
          responses: [
            {
              statusCode: 200,
              description: "Stress test result",
              contentType: "application/json",
              fields: [
                { name: "portfolio_id", type: "string", required: true, nullable: false },
                { name: "scenario", type: "string", required: true, nullable: false },
                { name: "stressed_var", type: "decimal", required: true, nullable: false },
                { name: "stressed_pnl", type: "decimal", required: true, nullable: false },
                { name: "currency", type: "string", required: true, nullable: false },
              ],
            },
          ],
          tags: ["stress-test"],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
export const SYNTHETIC_CONTRACTS: ApiContract[] = [
  MARKET_DATA_API,
  REFERENCE_DATA_API,
  SETTLEMENT_API,
  RISK_SNAPSHOT_API,
];

export const CONTRACT_MAP: Record<string, ApiContract> = Object.fromEntries(
  SYNTHETIC_CONTRACTS.map((c) => [c.id, c])
);
