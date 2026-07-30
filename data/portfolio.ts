export const profile = {
  email: "satyam.h.sethi@gmail.com",
  github: "https://github.com/Satyam-h-Sethi",
  linkedin: "https://www.linkedin.com/in/satyam-sethi-a33a341bb/",
  resumeAvailable: false,
};

export const metrics = [
  { value: "3+", label: "Years in capital markets", detail: "ION Group · financial infrastructure" },
  { value: "7", label: "Engineers led", detail: "Delivery, quality & production readiness" },
  { value: "CME · ICE · EUREX", label: "Exchange data", detail: "Products, contracts, prices & margins" },
  { value: "Python · SQL · Java", label: "Engineering core", detail: "Automation, data and systems" },
  { value: "AI × Finance", label: "Current focus", detail: "Reasoning around difficult data" },
  { value: "ION", label: "Financial infrastructure", detail: "ION Data Service (IDS)" },
];

export const architectureStages = [
  { title: "Exchange documents", meta: "CME · ICE · EUREX", body: "Notices, circulars, specifications and operating updates become the source material." },
  { title: "Ingestion", meta: "PDF · HTML · Tables", body: "Preserve source context and extract the pieces that carry operational meaning." },
  { title: "Structured extraction", meta: "Product · symbol · tick · date", body: "Turn semi-structured change notices into a reviewable data model." },
  { title: "Retrieval / RAG", meta: "Source context", body: "Bring the relevant rule, notice and reference-data context into one decision surface." },
  { title: "AI reasoning", meta: "Interpret ambiguity", body: "Use an LLM to interpret documents and surface possible changes with evidence." },
  { title: "Deterministic validation", meta: "Enforce rules", body: "Compare against reference data, enforce constraints and flag downstream impact." },
  { title: "Evidence-backed intelligence", meta: "Traceable output", body: "Every finding is tied to source material so a human can inspect and act." },
];

export const stack = [
  { title: "Engineering", items: ["Python", "Java", "SQL"] },
  { title: "AI", items: ["LLMs", "RAG", "Structured extraction", "Evaluation / validation"] },
  { title: "Data", items: ["Oracle SQL", "Financial data validation", "Transformation", "Reference data"] },
  { title: "Automation", items: ["Robot Framework", "Selenium", "TestNG", "REST Assured"] },
  { title: "Infrastructure", items: ["AWS", "Docker", "Jenkins", "CI/CD"] },
];

export const projects = [
  { name: "ExchangeLens", state: "Featured concept", type: "AI × exchange change intelligence", description: "A case study exploring how exchange notices can become structured, traceable change decisions.", live: true },
  { name: "Market Data Validator", state: "Future project", type: "Data quality", description: "A planned validation surface for market-data expectations and exceptions.", live: false },
  { name: "API Response Comparator", state: "Future project", type: "Automation", description: "A planned tool for comparing API payloads against contracts and reference states.", live: false },
  { name: "RAG Document Analyst", state: "Future project", type: "Applied AI", description: "A planned document reasoning workflow for evidence-led technical investigation.", live: false },
];
