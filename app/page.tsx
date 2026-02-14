import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AIAgent from "@/components/AIAgent";
import type { Metadata } from "next";
import { PROFILE } from "@/lib/agent/profile";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, toAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Taha Jameel Portfolio",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.identity.displayName,
    alternateName: PROFILE.identity.legalName,
    url: SITE_URL,
    image: toAbsoluteUrl("/Logo.png"),
    email: PROFILE.contact.email,
    jobTitle: PROFILE.professional.role,
    description: PROFILE.summary,
    address: {
      "@type": "PostalAddress",
      addressLocality: PROFILE.location.city,
      addressRegion: PROFILE.location.province,
      addressCountry: PROFILE.location.country,
    },
    worksFor: {
      "@type": "Organization",
      name: PROFILE.professional.currentCompany.name,
    },
    sameAs: [PROFILE.contact.linkedin, PROFILE.contact.github, PROFILE.contact.whatsappLink],
    knowsLanguage: PROFILE.languages,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Person",
      name: PROFILE.identity.displayName,
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Navbar />
      <Hero />
      <Projects />
      <Contact />
      <Footer />
      <AIAgent />
    </main>
  );
}
