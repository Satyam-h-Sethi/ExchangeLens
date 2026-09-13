/**
 * Market Data Control Plane — Synthetic Versioned Schemas
 *
 * Models real exchange feed schemas across version boundaries to demonstrate
 * deterministic schema drift detection, breaking changes, and consumer impact analysis.
 */

import { SchemaDefinition } from "../types";

export const SYNTHETIC_SCHEMAS: Record<string, { base: SchemaDefinition; target: SchemaDefinition }> = {
  CME_FAST_FIX: {
    base: {
      id: "cme-fast-itch-v3.2.0",
      sourceCode: "CME_DIRECT",
      version: "v3.2.0",
      publishedDate: "2025-11-15",
      fields: [
        { name: "SecurityID", type: "NUMBER", required: true, description: "CME internal unique contract identifier" },
        { name: "SecurityExchange", type: "STRING", required: true, description: "Exchange venue code (e.g. XCME, XCBT)" },
        { name: "Symbol", type: "STRING", required: true, description: "Contract ticker symbol (e.g. ESZ6)" },
        { name: "LastPx", type: "DECIMAL", required: true, precision: 7, description: "Last traded transaction price" },
        { name: "TradeQty", type: "NUMBER", required: true, description: "Executed contract quantity" },
        { name: "AggressorSide", type: "ENUM", required: false, enumValues: ["BUY", "SELL", "CROSS"], description: "Order aggressor classification" },
        { name: "SendingTime", type: "TIMESTAMP", required: true, description: "Exchange broadcast epoch UTC nanoseconds" },
        { name: "TradingStatus", type: "ENUM", required: true, enumValues: ["PRE_OPEN", "OPEN", "HALT", "CLOSED"], description: "Venue contract state" },
      ],
    },
    target: {
      id: "cme-fast-itch-v3.3.1",
      sourceCode: "CME_DIRECT",
      version: "v3.3.1",
      publishedDate: "2026-09-01",
      fields: [
        { name: "SecurityID", type: "NUMBER", required: true, description: "CME internal unique contract identifier" },
        { name: "SecurityExchange", type: "STRING", required: true, description: "Exchange venue code (e.g. XCME, XCBT)" },
        { name: "Symbol", type: "STRING", required: true, description: "Contract ticker symbol (e.g. ESZ6)" },
        { name: "LastPx", type: "DECIMAL", required: true, precision: 7, description: "Last traded transaction price" },
        { name: "TradeQty", type: "NUMBER", required: true, description: "Executed contract quantity" },
        { name: "AggressorSide", type: "ENUM", required: false, enumValues: ["BUY", "SELL", "CROSS", "UNDISCLOSED"], description: "Order aggressor classification (expanded with UNDISCLOSED)" },
        { name: "SendingTime", type: "TIMESTAMP", required: true, description: "Exchange broadcast epoch UTC nanoseconds" },
        { name: "TradingStatus", type: "ENUM", required: true, enumValues: ["PRE_OPEN", "OPEN", "HALT", "CLOSED", "AUCTION"], description: "Venue contract state" },
        { name: "MatchingEngineID", type: "NUMBER", required: true, description: "NEW MANDATORY FIELD: CME Globex matching engine partition ID" },
        { name: "MicrosecondTimestamp", type: "TIMESTAMP", required: false, description: "NEW OPTIONAL FIELD: Supplementary high-resolution clock" },
      ],
    },
  },

  ICE_FIXML: {
    base: {
      id: "ice-fixml-spec-v4.1.0",
      sourceCode: "ICE_REF",
      version: "v4.1.0",
      publishedDate: "2025-08-10",
      fields: [
        { name: "SecID", type: "STRING", required: true, description: "ICE Security Identifier" },
        { name: "SecTyp", type: "STRING", required: true, description: "Security Type (FUT, OPT)" },
        { name: "MatDt", type: "DATE", required: true, description: "Maturity Date YYYY-MM-DD" },
        { name: "PxUnit", type: "DECIMAL", required: true, precision: 6, description: "Price Unit Multiplier" },
        { name: "MinPriceIncr", type: "DECIMAL", required: true, precision: 6, description: "Minimum Tick Size" },
        { name: "SettlMeth", type: "ENUM", required: true, enumValues: ["P", "C"], description: "Settlement Method: Physical or Cash" },
        { name: "DailyCapLimit", type: "DECIMAL", required: false, precision: 4, description: "Price band circuit breaker ceiling" },
      ],
    },
    target: {
      id: "ice-fixml-spec-v4.2.0-rc2",
      sourceCode: "ICE_REF",
      version: "v4.2.0-rc2",
      publishedDate: "2026-09-08",
      fields: [
        { name: "SecID", type: "STRING", required: true, description: "ICE Security Identifier" },
        { name: "SecTyp", type: "STRING", required: true, description: "Security Type (FUT, OPT)" },
        { name: "MatDt", type: "DATE", required: true, description: "Maturity Date YYYY-MM-DD" },
        { name: "PxUnit", type: "DECIMAL", required: true, precision: 4, description: "MUTATION: Precision reduced from 6 to 4 decimals (BREAKING)" },
        { name: "MinPriceIncr", type: "DECIMAL", required: true, precision: 6, description: "Minimum Tick Size" },
        { name: "SettlMeth", type: "ENUM", required: true, enumValues: ["P", "C", "A"], description: "MUTATION: Added 'A' (Auction settlement)" },
        // Notice: DailyCapLimit removed (BREAKING)
        { name: "ClearingVenueCode", type: "STRING", required: true, description: "NEW MANDATORY FIELD: Clearinghouse identifier code" },
      ],
    },
  },

  EUREX_T7: {
    base: {
      id: "eurex-t7-eti-v11.0.0",
      sourceCode: "EUREX_FEED",
      version: "v11.0.0",
      publishedDate: "2025-10-01",
      fields: [
        { name: "MarketSegmentID", type: "NUMBER", required: true, description: "Eurex market segment" },
        { name: "SimpleInstrumentID", type: "NUMBER", required: true, description: "Instrument numeric identifier" },
        { name: "ContractDate", type: "NUMBER", required: true, description: "Contract delivery month YYYYMM" },
        { name: "SettlementPrice", type: "DECIMAL", required: true, precision: 6, description: "Daily official settlement price" },
        { name: "Currency", type: "STRING", required: true, description: "Contract denomination currency" },
      ],
    },
    target: {
      id: "eurex-t7-eti-v11.1.0",
      sourceCode: "EUREX_FEED",
      version: "v11.1.0",
      publishedDate: "2026-08-20",
      fields: [
        { name: "MarketSegmentID", type: "NUMBER", required: true, description: "Eurex market segment" },
        { name: "SimpleInstrumentID", type: "NUMBER", required: true, description: "Instrument numeric identifier" },
        { name: "ContractDate", type: "NUMBER", required: true, description: "Contract delivery month YYYYMM" },
        { name: "SettlementPrice", type: "DECIMAL", required: true, precision: 6, description: "Daily official settlement price" },
        { name: "Currency", type: "STRING", required: true, description: "Contract denomination currency" },
        { name: "TickRuleTableID", type: "NUMBER", required: false, description: "NEW OPTIONAL FIELD: Dynamic tick size schedule identifier" },
      ],
    },
  },
};
