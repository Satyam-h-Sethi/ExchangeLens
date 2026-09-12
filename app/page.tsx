import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { ProofBento } from "@/components/ProofBento";
import { CaseStudies } from "@/components/CaseStudies";
import { FinancialInspector } from "@/components/FinancialInspector";
import { MarketDomainMap } from "@/components/MarketDomainMap";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { StackCategorized } from "@/components/StackCategorized";
import { PhilosophyVisual } from "@/components/PhilosophyVisual";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";
import { profile } from "@/data/portfolio";

export default function Home() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    worksFor: {
      "@type": "Organization",
      name: profile.company,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Noida",
      addressCountry: "IN",
    },
    sameAs: [profile.github, profile.linkedin],
    url: "https://satyamsethi.dev",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page-grid" aria-hidden="true" />
      <Navigation />
      <main id="main">
        <Hero />
        <ProofBento />
        <CaseStudies />
        <FinancialInspector />
        <MarketDomainMap />
        <ExperienceTimeline />
        <StackCategorized />
        <PhilosophyVisual />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
