import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://satyamsethi.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Satyam Sethi — AI Engineering × Capital Markets",
  description:
    "Engineer and technical lead building across AI, financial data, automation and capital-markets infrastructure.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Satyam Sethi — AI Engineering × Capital Markets",
    description: "AI, financial data, automation and capital-markets infrastructure.",
    url: siteUrl,
    siteName: "Satyam Sethi",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Satyam Sethi — AI Engineering × Capital Markets",
    description: "AI, financial data, automation and capital-markets infrastructure.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#090b10" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
