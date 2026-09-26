import { Reveal } from "@/components/Reveal";
import { CreatorShowcase } from "@/components/landing/CreatorShowcase";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HotThisWeek } from "@/components/landing/HotThisWeek";
import { PickYourVibe } from "@/components/landing/PickYourVibe";
import { Pricing } from "@/components/landing/Pricing";
import { SignupCta } from "@/components/landing/SignupCta";
import { WhySippa } from "@/components/landing/WhySippa";
import { faqs } from "@/data/landing";
import { siteConfig } from "@/config/site";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="bg-primary text-on-primary sr-only z-50 rounded-lg px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Reveal>
          <PickYourVibe />
        </Reveal>
        <Reveal>
          <CreatorShowcase />
        </Reveal>
        <Reveal>
          <WhySippa />
        </Reveal>
        <Reveal>
          <HotThisWeek />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <SignupCta />
        </Reveal>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
