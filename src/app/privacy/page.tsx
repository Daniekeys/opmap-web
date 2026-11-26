import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { CONTACT_EMAIL, STOP_CONTACT_MAILTO } from "@/lib/landing";

export const metadata: Metadata = {
  title: "Privacy and data sources - Opportunity Map",
  description: "What Opportunity Map reads about businesses, how to opt out, and how the data is handled.",
};

// Linked from the landing page footer. Public: src/proxy.ts lets it through
// without a session.
export default function Privacy() {
  const link = "text-ink underline underline-offset-3 hover:text-accent-ink";
  return (
    <Container as="main" className="flex flex-col gap-10 py-6">
      <Link href="/" className="self-start no-underline hover:text-accent-ink">
        <Logo />
      </Link>
      <article className="flex max-w-read flex-col gap-6 pb-16 text-lg leading-7">
        <h1 className="m-0 text-title font-bold">Privacy and data sources</h1>
        <p className="m-0">
          Opportunity Map helps sellers find local businesses that may want what they sell. To do that, it reads public information about those
          businesses.
        </p>
        <section aria-labelledby="read-h" className="flex flex-col gap-2">
          <h2 id="read-h" className="m-0 text-section font-semibold">
            What we read
          </h2>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-6">
            <li>Google Maps listings: name, address, type of business, phone number, website and rating.</li>
            <li>The business&rsquo;s own public website.</li>
            <li>Public social media bios, such as an Instagram bio.</li>
          </ul>
          <p className="m-0">We never read anything behind a login.</p>
        </section>
        <section aria-labelledby="opt-h" className="flex flex-col gap-2">
          <h2 id="opt-h" className="m-0 text-section font-semibold">
            How to opt out
          </h2>
          <p className="m-0">
            Email{" "}
            <a href={STOP_CONTACT_MAILTO} className={link}>
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject &ldquo;Stop contacting me&rdquo; and your business name or phone number. We add you to our stop list, and no campaign
            contacts you again.
          </p>
        </section>
        <section aria-labelledby="ndpa-h" className="flex flex-col gap-2">
          <h2 id="ndpa-h" className="m-0 text-section font-semibold">
            How the data is handled
          </h2>
          <p className="m-0">
            Daniekeys Studios handles this data under the Nigeria Data Protection Act 2023 (NDPA). Questions go to {CONTACT_EMAIL}.
          </p>
        </section>
      </article>
    </Container>
  );
}
