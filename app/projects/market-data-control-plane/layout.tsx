import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Data Control Plane | Financial Data Reliability & Integrity Engine",
  description:
    "Institutional financial data control plane answering what changed, where it came from, what disagrees, downstream blast radius, and mitigation playbooks.",
};

export default function MarketDataControlPlaneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
