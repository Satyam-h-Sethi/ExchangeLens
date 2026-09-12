// ExchangeLens — sample DEMO data
// ALL data here is SAMPLE / DEMO data. None of it represents live market conditions,
// proprietary data, or verified production state. Clearly labelled throughout.

import type { ExchangeLensScenario } from "../types";

export const scenarios: ExchangeLensScenario[] = [
  // ─── SCENARIO 1: CME E-mini S&P 500 — tick size change circular ──────────────
  {
    id: "cme-es-tick-change",
    notice: {
      id: "cme-es-tick-change",
      exchange: "CME",
      documentId: "CME-SER-2024-0341",
      documentType: "Circular",
      title: "E-mini S&P 500 Futures — Proposed Tick Size Amendment",
      date: "2024-09-15",
      summary:
        "SAMPLE NOTICE: CME Group proposes a reduction in the minimum price fluctuation for E-mini S&P 500 (ES) outright contracts from 0.25 index points to 0.10 index points, effective the next quarterly roll. All other contract terms remain unchanged.",
      affectedProduct: "E-mini S&P 500 Index Futures",
      affectedSymbol: "ES",
    },
    extractedFields: [
      {
        fieldName: "tickSize",
        displayLabel: "Tick Size",
        extractedValue: "0.10 index points",
        rawSnippet:
          "\"…the minimum price fluctuation for outright transactions shall be reduced to 0.10 (one-tenth) of an index point per contract, effective the December 2024 roll…\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "index points",
      },
      {
        fieldName: "pointValue",
        displayLabel: "Point Value",
        extractedValue: "$50.00 multiplier",
        rawSnippet:
          "\"The contract multiplier of $50 per index point remains unchanged.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "USD",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        extractedValue: "Financial",
        rawSnippet:
          "\"Final settlement by cash against the Special Opening Quotation (SOQ).\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
      },
      {
        fieldName: "marginTier",
        displayLabel: "Margin Tier",
        extractedValue: "Tier 1 - Standard",
        rawSnippet:
          "\"Margin requirements remain at current Tier 1 Standard levels pending SPAN re-calibration.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "MEDIUM",
      },
    ],
    referenceFields: [
      {
        fieldName: "tickSize",
        displayLabel: "Tick Size",
        referenceValue: "0.25 index points",
        source: "IDS_PROD_MASTER · CME_ES_SPEC_v4.2",
        lastVerified: "2024-09-01",
      },
      {
        fieldName: "pointValue",
        displayLabel: "Point Value",
        referenceValue: "$50.00 multiplier",
        source: "IDS_PROD_MASTER · CME_ES_SPEC_v4.2",
        lastVerified: "2024-09-01",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        referenceValue: "Cash / Financial",
        source: "IDS_PROD_MASTER · CME_ES_SPEC_v4.2",
        lastVerified: "2024-09-01",
      },
      {
        fieldName: "marginTier",
        displayLabel: "Margin Tier",
        referenceValue: "SPAN Initial / Maintenance",
        source: "IDS_PROD_MASTER · MARGIN_TABLE_Q3",
        lastVerified: "2024-08-15",
      },
    ],
  },

  // ─── SCENARIO 2: ICE Brent Crude — multi-field specification update ──────────
  {
    id: "ice-brent-spec-update",
    notice: {
      id: "ice-brent-spec-update",
      exchange: "ICE",
      documentId: "ICE-PN-2024-0089",
      documentType: "Product Notice",
      title: "Brent Crude Futures — Contract Specification Clarification",
      date: "2024-08-22",
      summary:
        "SAMPLE NOTICE: ICE Futures Europe clarifies contract specifications for Brent Crude (B) futures. Key updates include re-statement of tick size, confirmation of contract lot size, and a clarification to settlement price reference language.",
      affectedProduct: "Brent Crude Futures",
      affectedSymbol: "B",
    },
    extractedFields: [
      {
        fieldName: "tickSize",
        displayLabel: "Tick Size",
        extractedValue: "$0.01 per barrel",
        rawSnippet:
          "\"The minimum price fluctuation is one cent ($0.01) per barrel per lot.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "USD/barrel",
      },
      {
        fieldName: "contractSize",
        displayLabel: "Contract Size",
        extractedValue: "1000 Barrels",
        rawSnippet:
          "\"Each contract represents 1,000 barrels (42,000 U.S. gallons).\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "Barrels",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        extractedValue: "Cash Settled (Index)",
        rawSnippet:
          "\"Settlement is made by reference to the ICE Brent Index published on the day following last trading.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
      },
      {
        fieldName: "expiryRule",
        displayLabel: "Expiry Rule",
        extractedValue: "Last day of second month preceding delivery",
        rawSnippet:
          "\"Trading ceases at the end of business on the last business day of the second month preceding the relevant delivery month.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "MEDIUM",
      },
    ],
    referenceFields: [
      {
        fieldName: "tickSize",
        displayLabel: "Tick Size",
        referenceValue: "$0.01 per barrel",
        source: "IDS_PROD_MASTER · ICE_BRENT_SPEC_v3.1",
        lastVerified: "2024-08-01",
      },
      {
        fieldName: "contractSize",
        displayLabel: "Contract Size",
        referenceValue: "1,000 Barrels (42,000 Gallons)",
        source: "IDS_PROD_MASTER · ICE_BRENT_SPEC_v3.1",
        lastVerified: "2024-08-01",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        referenceValue: "Cash settlement with option to exchange for physicals (EFP)",
        source: "IDS_PROD_MASTER · ICE_BRENT_SPEC_v3.1",
        lastVerified: "2024-08-01",
      },
      {
        fieldName: "expiryRule",
        displayLabel: "Expiry Rule",
        referenceValue: "Last business day of second calendar month preceding delivery",
        source: "IDS_PROD_MASTER · ICE_BRENT_SPEC_v3.1",
        lastVerified: "2024-08-01",
      },
    ],
  },

  // ─── SCENARIO 3: EUREX Bund — multi-change: nominal + delivery window ────────
  {
    id: "eurex-fgbl-delivery-update",
    notice: {
      id: "eurex-fgbl-delivery-update",
      exchange: "EUREX",
      documentId: "EUREX-CIRC-2024-C-017",
      documentType: "Specification Update",
      title: "Euro-Bund Futures — Delivery Window & Nominal Value Amendment",
      date: "2024-07-10",
      summary:
        "SAMPLE NOTICE: Eurex announces an update to the Euro-Bund Futures (FGBL) contract specification. The nominal face value is revised from €100,000 to €130,000 per contract, effective the September 2024 expiry. The delivery window T+2 rule is reconfirmed with additional settlement calendar clarification.",
      affectedProduct: "Euro-Bund Futures",
      affectedSymbol: "FGBL",
    },
    extractedFields: [
      {
        fieldName: "nominalValue",
        displayLabel: "Nominal Value",
        extractedValue: "€130,000 par value",
        rawSnippet:
          "\"…the nominal value of each Euro-Bund Future contract is amended to EUR 130,000, effective 16 September 2024 expiry.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "EUR",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        extractedValue: "Physical Delivery",
        rawSnippet:
          "\"Settlement remains by physical delivery of qualifying Federal Republic of Germany debt securities.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
      },
      {
        fieldName: "deliveryWindow",
        displayLabel: "Delivery Window",
        extractedValue: "T+2 from notice day",
        rawSnippet:
          "\"Delivery day is confirmed as T+2 following the Notice Day, which remains the tenth calendar day of the delivery month.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "days",
      },
      {
        fieldName: "couponRate",
        displayLabel: "Notional Coupon",
        extractedValue: "6% notional coupon",
        rawSnippet:
          "\"The 6% notional coupon rate for conversion factor calculation remains unchanged.\" [SAMPLE EVIDENCE — synthetic]",
        confidence: "HIGH",
        unit: "%",
      },
    ],
    referenceFields: [
      {
        fieldName: "nominalValue",
        displayLabel: "Nominal Value",
        referenceValue: "€100,000 par value",
        source: "IDS_PROD_MASTER · EUREX_FGBL_SPEC_v5.0",
        lastVerified: "2024-07-01",
      },
      {
        fieldName: "settlementType",
        displayLabel: "Settlement Type",
        referenceValue: "Physical Delivery (Deliverable basket with 8.5 to 10.5 years maturity)",
        source: "IDS_PROD_MASTER · EUREX_FGBL_SPEC_v5.0",
        lastVerified: "2024-07-01",
      },
      {
        fieldName: "deliveryWindow",
        displayLabel: "Delivery Window",
        referenceValue: "T+2 following Notice Day (tenth calendar day of month)",
        source: "IDS_PROD_MASTER · EUREX_FGBL_SPEC_v5.0",
        lastVerified: "2024-07-01",
      },
      {
        fieldName: "couponRate",
        displayLabel: "Notional Coupon",
        referenceValue: "6% notional coupon",
        source: "IDS_PROD_MASTER · EUREX_FGBL_SPEC_v5.0",
        lastVerified: "2024-07-01",
      },
    ],
  },
];
