import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ExchangeLens — Exchange Document Intelligence",
  description:
    "Interactive demo: regulatory notice extraction and deterministic contract-specification validation across CME, ICE, and EUREX. Sample / demo data only.",
};

export default function ExchangeLensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
