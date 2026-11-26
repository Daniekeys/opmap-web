import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import night from "../../design/photos/night.jpg";
import street from "../../design/photos/street.jpg";
import vendor from "../../design/photos/vendor.jpg";
import { Container } from "@/components/container";
import { HeroHeadline } from "@/components/landing/hero-headline";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LeadsForm } from "@/components/landing/leads-form";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { TrySearch } from "@/components/landing/try-search";
import { Logo } from "@/components/logo";
import { CONTACT_EMAIL, SAMPLE_BAKERY, STOP_CONTACT_MAILTO } from "@/lib/landing";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import "./landing.css";

// Title, description and share preview (the image is app/opengraph-image.tsx
// and app/twitter-image.tsx).
export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "Opportunity Map", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

// The public landing page (design/screens/Landing.dc.html) for signed-out
// visitors; src/proxy.ts sends a signed-in "/" to /start. Static: it reads no
// cookies and calls no API.
export default function Landing() {
  return (
    <div className="lp overflow-x-clip bg-ground text-lg leading-7 text-ink">
      <RevealObserver />
      <Hero />
      <Street />
      <section id="how" aria-labelledby="how-h" className="pt-40">
        <Container size="wide" className="@container">
          <HowItWorks />
        </Container>
      </section>
      <section id="try" aria-labelledby="try-h" className="pt-40">
        <Container className="lp-reveal flex flex-col gap-8 @container">
          <h2 id="try-h" className="max-w-3xl text-statement font-semibold tracking-[-0.02em]">
            Type who you sell to. See who we&rsquo;d find.
          </h2>
          <TrySearch />
        </Container>
      </section>
      <Sources />
      <section id="sample" aria-labelledby="cta-h" className="py-40">
        <Container className="lp-reveal @container">
          <LeadsForm />
          <div className="mt-10 flex flex-wrap items-end gap-12">
            <p className="m-0 max-w-xl flex-[1_1_320px] text-muted">
              Within two working days you get 5 businesses, what to offer each one, the proof behind it and a message ready to send. No card, no
              account.
            </p>
            <figure className="m-0 max-w-3xl flex-[1_1_520px]">
              <Image
                src={vendor}
                alt="A food vendor under a wooden stall roof at a roadside market in Kaduna"
                sizes="(min-width: 1280px) 760px, 100vw"
                className="lp-photo aspect-3/2 w-full object-cover"
              />
              <figcaption className="pt-2.5 text-sm text-muted">A roadside food stall. Thousands like it across Lagos.</figcaption>
            </figure>
          </div>
        </Container>
      </section>
      <Footer />
    </div>
  );
}

const linkClass = "no-underline hover:text-accent-ink";

// The sentence is the layout: a lit map tile sits in the line where a word
// would be. A phone shows the logo and the CTA only.
function Hero() {
  return (
    <header id="top" className="flex min-h-svh flex-col pt-6 pb-8 md:min-h-[900px]">
      <Container className="flex flex-1 flex-col @container">
        {/* Phone: logo, Sign in and the CTA on one line (fits at 380; below
            380 the wordmark is for screen readers only, the tile mark stays). From
            768px: the three section links and Sign in. */}
        <nav aria-label="Main" className="flex items-center justify-between gap-2 md:gap-4">
          <a href="#top" className={`${linkClass} whitespace-nowrap`}>
            <Logo className="gap-2 md:gap-2.5 max-md:[&>span:last-child]:text-[15px] max-[379px]:[&>span:last-child]:sr-only" />
          </a>
          <div className="flex flex-none items-center gap-2.5 text-[15px] md:gap-7">
            <a href="#how" className={`${linkClass} hidden md:inline`}>
              How it works
            </a>
            <a href="#try" className={`${linkClass} hidden md:inline`}>
              Try a search
            </a>
            <a href="#sources" className={`${linkClass} hidden md:inline`}>
              Where the facts come from
            </a>
            <Link href="/login" className={`${linkClass} text-sm md:text-[15px]`}>
              Sign in
            </Link>
            <a href="#sample" className="lp-btn inline-flex h-10 items-center bg-primary px-2.5 text-sm font-semibold whitespace-nowrap text-on-primary hover:bg-primary/85 md:hidden">
              Get 5 free leads
            </a>
          </div>
        </nav>

        <div className="flex flex-1 flex-col justify-center py-16">
          {/* The size scales with the container, so the lines break the same
              at every width; fixing them keeps the fallback font (wider) from
              wrapping to four lines and shifting the hero when DM Sans loads. */}
          <HeroHeadline />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="lp-rise m-0 max-w-xl text-lead [animation-delay:0.15s]">
            Opportunity Map searches your city tile by tile, finds the local businesses most likely to buy what you sell, shows what to offer each
            one with proof, and writes the WhatsApp message for you.
          </p>
          <a
            href="#sample"
            className="lp-btn lp-rise inline-flex h-13 items-center bg-primary px-6 text-base font-semibold text-on-primary no-underline hover:bg-primary/85 [animation-delay:0.25s]"
          >
            Get 5 free leads
          </a>
        </div>
      </Container>
    </header>
  );
}

// The tile in the headline opens onto the world it stands for.
function Street() {
  return (
    <figure className="m-0">
      <Container size="wide">
        <div className="lp-opening relative aspect-[16/8] overflow-hidden">
          <Image
            src={street}
            alt="A busy street in Kawo, Kaduna, with shops, motorbikes and a man carrying drinks on his head"
            fill
            sizes="(min-width: 1520px) 1440px, 100vw"
            className="lp-photo object-cover object-[center_60%]"
          />
        </div>
        <figcaption className="pt-3 text-sm text-muted">
          Every shop on a street like this is a business someone could be selling to. Lekki, Yaba, Surulere, Ikeja, all of it.
        </figcaption>
      </Container>
    </figure>
  );
}

// The statement names what we read, lit one at a time; the proof is an
// evidence card.
function Sources() {
  const read = ["their Google Maps listing", "their own website", "their Instagram bio"];
  return (
    <section id="sources" aria-labelledby="src-h" className="pt-40">
      <Container className="lp-reveal flex flex-wrap items-center gap-12">
        <div className="flex flex-[1_1_560px] flex-col gap-6">
          <h2 id="src-h" className="m-0 text-statement font-semibold tracking-[-0.02em]">
            Every claim points to where it came from.
          </h2>
          <p className="m-0 max-w-read text-[30px] leading-[38px] font-medium tracking-[-0.015em]">
            We read{" "}
            {read.map((r, i) => (
              <span key={r}>
                <span className="lp-src" style={{ animationDelay: `${i * 2}s` }}>
                  {r}
                </span>
                {i < read.length - 1 ? ", " : " and "}
              </span>
            ))}
            <span className="lp-src" style={{ animationDelay: "6s" }}>
              nothing behind a login
            </span>
            .
          </p>
          <p className="m-0 max-w-xl">
            If we can&rsquo;t back something up, we say so and pitch your general offer instead of guessing. Anyone who asks us to stop never hears
            from your campaigns again.
          </p>
        </div>
        <figure className="m-0 flex max-w-lg flex-[1_1_380px] flex-col gap-3.5 rounded-card border border-border bg-surface p-6 text-base leading-[25px]">
          <span>
            Their Instagram bio says{" "}
            <mark className="bg-accent-soft text-accent-ink underline decoration-accent decoration-2 underline-offset-3">DM to order, 3 days notice</mark>.
          </span>
          <span className="flex flex-col gap-0.5 rounded-control bg-raised px-3.5 py-3 text-body">
            <span>&ldquo;DM to order. 3 days notice for custom cakes.&rdquo;</span>
            <span className="text-small text-muted">Instagram bio of {SAMPLE_BAKERY.handle}, read 28 Oct</span>
          </span>
          <figcaption className="text-small text-muted">An opportunity card for a bakery in Lekki Phase 1, Lagos. Sample data.</figcaption>
        </figure>
      </Container>
    </section>
  );
}

// The night photo under a dark wash, with the name cropped at the bottom.
// The .dark class swaps the tokens to the dark theme for this band.
function Footer() {
  const footLink = "text-ink underline underline-offset-3 hover:text-accent-ink";
  return (
    <footer className="dark relative overflow-hidden bg-ground text-ink">
      <Image src={night} alt="" fill sizes="100vw" className="object-cover object-[center_40%]" />
      <div aria-hidden className="absolute inset-0 bg-ground/78" />
      <Container className="relative flex min-h-[760px] flex-col pt-24 @container">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex max-w-read flex-col gap-7">
            <h2 className="m-0 text-[clamp(36px,5cqw,76px)] leading-none font-bold tracking-[-0.035em]">
              Built for Lagos.
              <br />
              Works in any city.
            </h2>
            <a
              href="#sample"
              className="lp-btn inline-flex h-13 items-center self-start bg-primary px-6 text-base font-semibold text-on-primary no-underline hover:bg-primary/85"
            >
              Get 5 free leads
            </a>
          </div>
          <div className="flex flex-col gap-2.5 text-base">
            <a href={`mailto:${CONTACT_EMAIL}`} className={footLink}>
              {CONTACT_EMAIL}
            </a>
            <Link href="/privacy" className={footLink}>
              Privacy and data sources
            </Link>
            <a href={STOP_CONTACT_MAILTO} className={footLink}>
              Ask us to stop contacting you
            </a>
            <Link href="/login" className={footLink}>
              Sign in
            </Link>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap justify-between gap-3 pt-20 text-sm text-muted">
          <span>A Daniekeys Studios product. Made in Nigeria.</span>
          <span>Data from public listings and websites, handled under the NDPA.</span>
          <span className="basis-full">
            Photos from Pexels: Muhammad-Taha Ibrahim (Kawo street), Abdulrahman Abubakar (aerial), VIVO Ken (bakery), Vurzie Kim (food stall),
            Segun Jana (Abeokuta at night).
          </span>
        </div>
        {/* "Opportunity Map" in DM Sans 700 at -0.05em tracking is about 7.04em
            wide, so 14cqw spans about 99% of the container: edge to edge and
            centred. Its descenders reach 1.04em below the line top (ascent 0.992,
            line-height 1), so the bottom padding keeps them clear of the edge. */}
        <div aria-hidden className="mt-16 pb-[0.12em] text-center text-[14cqw] leading-none font-bold tracking-[-0.05em] whitespace-nowrap">
          Opportunity Map
        </div>
      </Container>
    </footer>
  );
}
