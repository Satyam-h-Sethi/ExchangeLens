export interface Profile {
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  resumeUrl?: string;
  resumeAvailable: boolean;
  education: {
    degree: string;
    field: string;
    institution: string;
  };
  status: string;
  positioning: string;
  summary: string;
}

export interface Metric {
  value: string;
  label: string;
  detail: string;
  tag?: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  team: string;
  company: string;
  description: string;
  highlights: string[];
  skills: string[];
}

export interface CaseStudy {
  id: string;
  name: string;
  category: string;
  tagline: string;
  status: "Project Case Study" | "Applied Prototype" | "Engineering Concept";
  problem: string;
  approach: string;
  architecture: string[];
  validation: string;
  outcome: string;
  tags: string[];
}

export interface DomainLayer {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  summary: string;
  entities: string[];
  validationFocus: string;
  downstreamImpact: string;
}

export interface StackCategory {
  category: string;
  description: string;
  items: {
    name: string;
    context: string;
  }[];
}

export interface InspectorInstrument {
  id: string;
  symbol: string;
  exchange: "CME" | "ICE" | "EUREX";
  productName: string;
  assetClass: string;
  samplePayload: Record<string, unknown>;
  assertions: {
    field: string;
    expected: string;
    observed: string;
    status: "PASS" | "MISMATCH" | "WARNING";
    rule: string;
    evidence: string;
  }[];
}

export const profile: Profile = {
  name: "Satyam Sethi",
  title: "Quality Assurance Project Lead",
  company: "ION Data Service (IDS) · ION Group",
  location: "Noida, India",
  email: "satyam.h.sethi@gmail.com",
  github: "https://github.com/Satyam-h-Sethi",
  linkedin: "https://www.linkedin.com/in/satyam-sethi-a33a341bb/",
  resumeUrl: "/resume.pdf",
  resumeAvailable: false,
  education: {
    degree: "B.Tech",
    field: "Computer Science",
    institution: "Vellore Institute of Technology",
  },
  status: "Lead Engineer // ION Group // Open to high-impact AI × FinTech opportunities",
  positioning: "I engineer deterministic systems for financial data.",
  summary:
    "Engineering lead at ION, working across exchange-traded derivatives, market data, and financial-data validation. Building practical AI and automated validation workflows around complex production data systems.",
};

export const metrics: Metric[] = [
  {
    value: "3+",
    label: "Years in Capital Markets",
    detail: "ION Group · Exchange-traded derivatives & financial data infrastructure",
    tag: "Domain Depth",
  },
  {
    value: "7",
    label: "Engineers Led",
    detail: "Delivery, automated quality harnesses & production release readiness",
    tag: "Leadership",
  },
  {
    value: "CME · ICE · EUREX",
    label: "Exchange Data Scope",
    detail: "Product masters, contract specs, tick conventions & margin rules",
    tag: "Market Data",
  },
  {
    value: "Python · SQL · Java",
    label: "Engineering Core",
    detail: "Data transformation, API validation & automation frameworks",
    tag: "Tech Stack",
  },
  {
    value: "AI × Finance",
    label: "Applied Focus",
    detail: "Grounding LLM reasoning in deterministic verification & lineage",
    tag: "Systems",
  },
  {
    value: "ION Data Service",
    label: "Enterprise Infrastructure",
    detail: "Reference data systems serving global financial institutions",
    tag: "IDS",
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "api-contract-intelligence",
    name: "API Contract Intelligence & Release Governance",
    category: "Contract Invariants & Release Governance",
    tagline: "Deterministic AST diffing, semantic compatibility classification, and zero-network release gates.",
    status: "Project Case Study",
    problem:
      "Enterprise financial microservices undergo continuous version evolution where uncoordinated schema modifications, breaking field mutations, and semantic contract drift cause catastrophic downstream clearing, trade execution, and settlement failures.",
    approach:
      "Architected an institutional specification governance platform featuring recursive AST diffing, semantic rule classifiers (COMPAT-REQ, COMPAT-RESP, COMPAT-PARAM, COMPAT-EP), field-level consumer blast radius modeling, zero-network contract invariant testing, and weighted multi-factor release gates.",
    architecture: [
      "Deterministic Recursive AST Diff Engine",
      "Semantic Backward / Forward Compatibility Classifier",
      "Field-Level Consumer Dependency Blast Radius Analyzer",
      "Pure Algorithmic Zero-Network Invariant Test Simulator",
      "Weighted Multi-Factor Policy Matrix Release Gate Evaluator",
      "Automated Consumer Migration Runbook & Task Generator",
    ],
    validation:
      "100% deterministic local computation with zero external network dependencies or LLM hallucination risk. Evaluates candidate contract schemas against strict backward/forward invariants with cryptographic change hashing.",
    outcome:
      "Eliminates silent API contract drift and empowers release engineering teams with automated ALLOW / WARN / BLOCK governance decisions and tailored consumer migration plans.",
    tags: ["API Contracts", "AST Diffing", "Compatibility", "Release Gate", "FinTech Architecture", "TypeScript"],
  },
  {
    id: "market-data-control-plane",
    name: "Market Data Control Plane",
    category: "Financial Data Reliability & Lineage",
    tagline: "Enterprise data governance, multi-source reconciliation, and directed blast-radius response engine.",
    status: "Project Case Study",
    problem:
      "Global exchange feeds (CME, ICE, Eurex, Bloomberg) experience schema drift, reconciliation mismatches, and contract specification deviations that silently propagate downstream to critical pricing, margin, and VaR engines.",
    approach:
      "Architected a comprehensive control plane combining 8-dimensional deterministic quality assertions, multi-feed consensus reconciliation, schema mutation impact classification, directed DAG lineage traversal, and an immutable audit incident manager.",
    architecture: [
      "Multi-Exchange Telemetry & Ingestion Gateway",
      "Deterministic 8-Dimension Quality Evaluation Engine",
      "Multi-Feed Tolerance Reconciliation Matrix",
      "Directed DAG Lineage & Blast Radius Calculator",
      "Incident Lifecycle & Immutable Audit Trail",
    ],
    validation:
      "Evaluates canonical contracts against strict exchange specifications, tolerance rules, and schema compatibility gates with instant quarantine and automated mitigation playbooks.",
    outcome:
      "Provides institutional data teams with an end-to-end cockpit answering what changed, where it came from, what disagrees, and what downstream systems are impacted.",
    tags: ["Market Data", "Data Lineage", "Reconciliation", "Schema Drift", "TypeScript"],
  },
  {
    id: "exchange-lens",
    name: "ExchangeLens",
    category: "Regulatory & Data Reconciliation",
    tagline: "Reconciling unstructured exchange notices with financial reference data.",
    status: "Project Case Study",
    problem:
      "Exchange circulars and regulatory notices from CME, ICE, and EUREX contain critical product changes (tick sizes, margin rules, trading calendars) published in unstructured text. Manual review introduces latency and operational risk into downstream data feeds.",
    approach:
      "Structured an end-to-end ingestion and comparison workflow. AI extracts changed specifications with source citations, while a deterministic rule engine checks differences against existing reference data before triggering alerts.",
    architecture: [
      "Document / Circular Ingestion",
      "Structured Parameter Extraction (LLM + Schema)",
      "Deterministic Rule Validation against Reference State",
      "Anomaly Classification & Traceable Audit Log",
    ],
    validation:
      "Every extracted field requires explicit character span citations from the circular. Zero assumptions are committed to reference state without pass-through verification against known database constraints.",
    outcome:
      "Provides a clear blueprint for converting ambiguous market notices into structured, auditable reference data updates.",
    tags: ["LLM Extraction", "Rule Engine", "Reference Data", "Auditability"],
  },
  {
    id: "market-data-validator",
    name: "Market Data Validator",
    category: "Data Quality & Contract Verification",
    tagline: "Automated boundary and specification verification for exchange market data.",
    status: "Project Case Study",
    problem:
      "Multi-exchange market data streams carry subtle contract specification mismatches, price anomalies, and tick-size deviations that cause downstream clearing and margin calculation errors.",
    approach:
      "Designed a validation surface that evaluates incoming contract records against authoritative exchange specifications and historical boundary models.",
    architecture: [
      "Exchange Feed Normalization",
      "Contract Parameter Assertion Matrix",
      "Boundary & Outlier Detection Engine",
      "Discrepancy Reporting & Lineage Log",
    ],
    validation:
      "Performs atomic contract rule assertions (e.g. tick size, delivery months, price limits) with instant pass/mismatch reporting.",
    outcome:
      "Establishes a systematic framework to prevent invalid contract states from reaching downstream clearing pipelines.",
    tags: ["Market Data", "Data Integrity", "Contract Specs", "Python"],
  },
  {
    id: "api-comparator",
    name: "API & Data Payload Comparator",
    category: "Automation & Regression Harness",
    tagline: "Deep multi-state payload diffing across financial API versions and databases.",
    status: "Project Case Study",
    problem:
      "Changes in core trading and data services risk subtle payload drift, breaking downstream integrations that rely on exact numeric precision, timestamps, and schema compliance.",
    approach:
      "Engineered an automated comparator harness that intercepts API responses and database snapshots across versions, applying schema assertions and value-level diffing.",
    architecture: [
      "Multi-Version API Request Orchestrator",
      "JSON / Database Snapshot Normalizer",
      "Configurable Field Tolerance & Strict Schema Diffing",
      "Automated CI/CD Quality Gate",
    ],
    validation:
      "Supports semantic field filtering, float precision tolerance, and required-schema enforcement to catch breaking regressions in CI pipelines.",
    outcome:
      "Accelerated regression cycles while ensuring zero unverified breaking schema alterations reach production releases.",
    tags: ["API Testing", "CI/CD", "Automation", "Regression Testing"],
  },
  {
    id: "rag-document-analyst",
    name: "RAG Document Analyst",
    category: "Applied AI & Investigation",
    tagline: "Evidence-grounded technical investigation across financial system documentation.",
    status: "Applied Prototype",
    problem:
      "Technical teams and analysts spend hours searching across hundreds of pages of exchange manuals, API specifications, and internal runbooks during production issue investigation.",
    approach:
      "Built a retrieval-augmented reasoning workflow that pairs semantic chunking with strict citation extraction and rule verification.",
    architecture: [
      "Document Chunking & Vector Indexing",
      "Hybrid Semantic + Keyword Retrieval",
      "Grounding Evaluator (Fact Extraction & Citation Matching)",
      "Structured Technical Answer Synthesis",
    ],
    validation:
      "Answers without direct, verifiable citations to indexed technical documentation are flagged as unverified to eliminate hallucinations.",
    outcome:
      "Demonstrates reliable technical knowledge retrieval without sacrificing factual grounding or traceability.",
    tags: ["RAG", "LLM Evaluation", "Information Retrieval", "TypeScript"],
  },
];

export const inspectorInstruments: InspectorInstrument[] = [
  {
    id: "cme-es",
    symbol: "ES",
    exchange: "CME",
    productName: "E-mini S&P 500 Index Futures",
    assetClass: "Equity Index Derivatives",
    samplePayload: {
      instrument: "ESM6",
      exchange: "CME",
      tickSize: 0.25,
      pointValue: 50.0,
      currency: "USD",
      settlementType: "Financial",
      marginTier: "Tier 1 - Standard",
      tradingHours: "23:00 - 22:00 CT (Sun-Fri)",
      contractMonth: "2026-06",
      priceLimitRule: "7%, 13%, 20% Circuit Breaker",
    },
    assertions: [
      {
        field: "tickSize",
        expected: "0.25 index points",
        observed: "0.25 index points",
        status: "PASS",
        rule: "CME Rulebook Chapter 358: Minimum tick interval for ES outrights is 0.25 index points ($12.50).",
        evidence: "Matches authoritative CME Globex specification table.",
      },
      {
        field: "pointValue",
        expected: "$50.00 multiplier",
        observed: "$50.00 multiplier",
        status: "PASS",
        rule: "Contract multiplier is $50 × S&P 500 Stock Price Index.",
        evidence: "Reference database IDS_PROD_MASTER verified.",
      },
      {
        field: "settlementType",
        expected: "Cash / Financial",
        observed: "Financial",
        status: "PASS",
        rule: "Final settlement by cash settlement against Special Opening Quotation (SOQ).",
        evidence: "Settlement schema flag: CASH_SETTLED_TRUE.",
      },
      {
        field: "marginTier",
        expected: "SPAN Initial / Maintenance",
        observed: "Tier 1 - Standard",
        status: "WARNING",
        rule: "SPAN margin matrix requires dynamic base calculation, not fixed scalar tier.",
        evidence: "Payload uses legacy static tier label instead of active SPAN margin risk array.",
      },
    ],
  },
  {
    id: "ice-brent",
    symbol: "B",
    exchange: "ICE",
    productName: "Brent Crude Futures",
    assetClass: "Energy Commodities",
    samplePayload: {
      instrument: "B26Q",
      exchange: "ICE",
      tickSize: 0.01,
      contractSize: 1000,
      unitOfMeasure: "Barrels",
      currency: "USD",
      settlementType: "Cash Settled (Index)",
      expiryRule: "Last day of the second month preceding delivery month",
      dailyPriceLimit: "Dynamic Margin Bounds (No fixed circuit ceiling)",
    },
    assertions: [
      {
        field: "tickSize",
        expected: "$0.01 per barrel",
        observed: "$0.01 per barrel",
        status: "PASS",
        rule: "ICE Rulebook Section GGGG: Minimum price fluctuation is one cent ($0.01) per barrel.",
        evidence: "Verified against ICE Europe product reference specs.",
      },
      {
        field: "contractSize",
        expected: "1,000 Barrels (42,000 Gallons)",
        observed: "1000 Barrels",
        status: "PASS",
        rule: "Standard trading unit is 1,000 Barrels of crude oil.",
        evidence: "IDS Contract Multiplier = 1000.",
      },
      {
        field: "settlementType",
        expected: "Cash settlement with option to exchange for physicals (EFP)",
        observed: "Cash Settled (Index)",
        status: "PASS",
        rule: "Cash settlement against the ICE Brent Index on day following last day of trading.",
        evidence: "ICE Index calculation procedure confirmed.",
      },
    ],
  },
  {
    id: "eurex-fgbl",
    symbol: "FGBL",
    exchange: "EUREX",
    productName: "Euro-Bund Futures",
    assetClass: "Fixed Income / Interest Rates",
    samplePayload: {
      instrument: "FGBL-202609",
      exchange: "EUREX",
      tickSize: 0.01,
      couponRate: 0.06,
      nominalValue: 100000,
      currency: "EUR",
      settlementType: "Physical Delivery",
      deliveryWindow: "T+2 from notice day",
    },
    assertions: [
      {
        field: "nominalValue",
        expected: "€100,000 par value",
        observed: "100000 EUR",
        status: "PASS",
        rule: "Eurex Contract Specification Part 2: Nominal value EUR 100,000 with 6% notional coupon.",
        evidence: "Eurex Clearing Conditions section 1.3.",
      },
      {
        field: "settlementType",
        expected: "Physical Delivery (Deliverable basket with 8.5 to 10.5 years maturity)",
        observed: "Physical Delivery",
        status: "PASS",
        rule: "Physical delivery of debt securities issued by the Federal Republic of Germany.",
        evidence: "Basket conversion factor verified.",
      },
      {
        field: "deliveryWindow",
        expected: "T+2 following Notice Day (tenth calendar day of month)",
        observed: "T+2 from notice day",
        status: "PASS",
        rule: "Delivery day is the tenth calendar day of the respective delivery month.",
        evidence: "Target2 settlement calendar synchronized.",
      },
    ],
  },
];

export const domainLayers: DomainLayer[] = [
  {
    id: "trading",
    number: "01",
    name: "Trading & Execution",
    subtitle: "Order routing, market feeds & exchange matching",
    summary:
      "Market participants submit orders to central limit order books (CLOB) across venues like CME, ICE, and EUREX. Fast tick normalization and contract validity checks occur at the gateway boundary.",
    entities: ["Order Books (CLOB)", "Tick Rules", "Price Banding", "Market Feeds (FAST/FIX)"],
    validationFocus: "Validating contract identifiers, tick increments, session statuses, and spread specifications.",
    downstreamImpact: "Unchecked order states corrupt execution records and downstream matching feeds.",
  },
  {
    id: "clearing",
    number: "02",
    name: "Clearing & Matching",
    subtitle: "Central counterparty novation & trade capture",
    summary:
      "Clearinghouses (CME Clearing, ICE Clear, Eurex Clearing) act as the central counterparty (CCP), novating trades, matching buyer with seller, and confirming trade allocations.",
    entities: ["Trade Allocation", "CCP Novation", "Trade Give-ups", "Clearing Member Accounts"],
    validationFocus: "Reconciling trade execution timestamps, account allocations, and clearing status flags.",
    downstreamImpact: "Unmatched trades result in breaks, unallocated risk, and operational reconciliation delays.",
  },
  {
    id: "margin",
    number: "03",
    name: "Margin & Risk",
    subtitle: "SPAN, portfolio margin & collateral calculations",
    summary:
      "Risk engines compute Initial Margin (IM) and Variation Margin (VM) using risk models such as SPAN and VaR to guard against default risk in clearing accounts.",
    entities: ["SPAN Risk Arrays", "Variation Margin", "Initial Margin", "Collateral haircuts"],
    validationFocus: "Verifying price mark-to-market accuracy, parameter file versioning, and margin tier thresholds.",
    downstreamImpact: "Inaccurate price or parameter data produces catastrophic under- or over-margining of trading desks.",
  },
  {
    id: "post-trade",
    number: "04",
    name: "Post-Trade Lifecycle",
    subtitle: "Position keeping, settlement & corporate actions",
    summary:
      "Clearing systems maintain ongoing net open positions, handle cash or physical settlement upon expiration, and manage corporate actions for exchange-traded contracts.",
    entities: ["Open Interest", "Daily Settlement Prices", "Physical Delivery Notices", "Cash Settlement"],
    validationFocus: "Auditing final settlement index calculations, delivery basket eligibility, and position roll adjustments.",
    downstreamImpact: "Settlement errors cause cash transfer mismatches and failed deliveries at central depositories.",
  },
  {
    id: "reference-data",
    number: "05",
    name: "Reference Data (IDS)",
    subtitle: "Product master, contract definitions & corporate calendars",
    summary:
      "Systems like ION Data Service (IDS) maintain the authoritative global golden source of contract specs, exchange calendars, product codes, multipliers, and regulatory mappings.",
    entities: ["Product Masters", "Trading Calendars", "Tick Increment Tables", "ISIN / CFI / RIC Mappings"],
    validationFocus: "Detecting parameter drift, circular schema inconsistencies, and unannounced exchange spec alterations.",
    downstreamImpact: "Corrupted reference data silently breaks valuation, risk, accounting, and execution across every connected client.",
  },
  {
    id: "downstream",
    number: "06",
    name: "Downstream Delivery",
    subtitle: "Client feeds, risk gateways & regulatory reporting",
    summary:
      "Validated data payloads and market states are broadcast to bank middle-offices, risk management platforms, algorithmic execution engines, and regulatory reporting repositories.",
    entities: ["Risk Gateways", "Regulatory Repositories (EMIR/CFTC)", "Client Data Feeds", "Audit Archives"],
    validationFocus: "Ensuring schema compliance, delivery latency SLAs, message ordering, and zero-loss audit logging.",
    downstreamImpact: "Delivery delays or payload deformities trigger regulatory fines, misstated risk reports, and trading halts.",
  },
];

export const experience: ExperienceItem[] = [
  {
    period: "2026 — Present",
    role: "Quality Assurance Project Lead",
    team: "ION Data Service (IDS)",
    company: "ION Group",
    description:
      "Lead a team of 7 engineers responsible for quality engineering, automation architecture, and production readiness for enterprise financial reference data platforms.",
    highlights: [
      "Lead delivery quality and release readiness for core IDS infrastructure handling global exchange data.",
      "Architect and direct automated testing harnesses for high-throughput financial data validation and API regression.",
      "Collaborate across product, core engineering, and operations to enforce strict correctness criteria on all releases.",
      "Drive test strategy, framework modernization, and engineering quality culture across the team.",
    ],
    skills: ["Engineering Leadership", "Financial Data Validation", "Release Governance", "Python", "SQL", "CI/CD"],
  },
  {
    period: "2025",
    role: "Automation Engineer",
    team: "Core Engineering",
    company: "ION Group",
    description:
      "Engineered automated validation frameworks, CI/CD integration pipelines, and data verification suites for financial systems.",
    highlights: [
      "Developed robust UI and API automation frameworks using Python, Java, Robot Framework, and REST Assured.",
      "Integrated continuous testing gates within Jenkins CI/CD pipelines, accelerating feedback loops for development teams.",
      "Implemented automated database and contract assertion suites for cleared derivatives workflows.",
    ],
    skills: ["Python", "Java", "Robot Framework", "REST Assured", "Jenkins", "Oracle SQL"],
  },
  {
    period: "2024",
    role: "QA Analyst",
    team: "XTP Core",
    company: "ION Group",
    description:
      "Executed manual and automated validation for trading, clearing, and post-trade lifecycle workflows in cleared derivatives systems.",
    highlights: [
      "Validated complex trade capture, allocation, margin calculations, and post-trade workflows for global derivatives markets.",
      "Built automated test suites using Selenium, TestNG, and SQL for UI and backend reconciliation.",
      "Analyzed exchange specifications and market data edge cases to ensure software compliance with clearing rules.",
    ],
    skills: ["Cleared Derivatives", "Trade Lifecycle", "Selenium", "TestNG", "SQL", "Defect Analysis"],
  },
];

export const techStack: StackCategory[] = [
  {
    category: "Core Engineering",
    description: "Languages and foundational tools used for systems development, automation, and data logic.",
    items: [
      { name: "Python", context: "Test harnesses, data pipelines, automation engines, AI tooling" },
      { name: "SQL (Oracle)", context: "Complex database queries, schema validation, reference data auditing" },
      { name: "Java", context: "Enterprise automation frameworks, backend validation harnesses" },
      { name: "TypeScript", context: "Modern web tools, typed data interfaces, interactive prototypes" },
    ],
  },
  {
    category: "AI & Reasoning Systems",
    description: "Applied AI workflows designed for document investigation and structured information extraction.",
    items: [
      { name: "LLM Engineering", context: "Prompt structuring, deterministic guardrails, schema enforcement" },
      { name: "RAG Architectures", context: "Semantic chunking, vector retrieval, grounded technical question answering" },
      { name: "Structured Extraction", context: "Extracting strict typed parameters from unstructured market notices" },
      { name: "Evaluation & Validation", context: "Citation matching, hallucination detection, deterministic assertion checks" },
    ],
  },
  {
    category: "Financial Data & Systems",
    description: "Domain infrastructure and data structures powering capital markets workflows.",
    items: [
      { name: "Exchange Data", context: "CME, ICE, and EUREX products, contract specs, and market conventions" },
      { name: "Reference Data", context: "Product master records, calendars, tick tables, and identifier mappings" },
      { name: "Cleared Derivatives", context: "Trade capture, allocation, margin, and post-trade lifecycle workflows" },
      { name: "Data Lineage & Audit", context: "Traceable transformations from raw exchange feed to downstream state" },
    ],
  },
  {
    category: "Automation & Quality Harnesses",
    description: "Frameworks and tooling used for end-to-end verification and regression prevention.",
    items: [
      { name: "Robot Framework", context: "Keyword-driven end-to-end automation for enterprise workflows" },
      { name: "REST Assured", context: "Automated API contract testing and payload validation" },
      { name: "Selenium & TestNG", context: "Browser automation and structured test execution suites" },
      { name: "Custom Python Harnesses", context: "Specialized financial payload comparison and diff tools" },
    ],
  },
  {
    category: "Infrastructure & Delivery",
    description: "Production environments, build pipelines, and release orchestration.",
    items: [
      { name: "Jenkins CI/CD", context: "Automated test execution gates, release pipelines, build triggers" },
      { name: "Docker", context: "Containerized test environments and portable service dependencies" },
      { name: "AWS", context: "Cloud infrastructure fundamentals and test environment deployment" },
      { name: "Git & Linux", context: "Version control workflows, shell scripting, server administration" },
    ],
  },
];
