// What the progress panel calls each pipeline step. Names come from the API's
// pipelines (opmap-api src/worker/pipelines). A step with no label here shows
// its raw name, so a new step is never hidden.
const STEP_LABELS: Record<string, string> = {
  "brand.crawl": "Reading your website",
  "brand.describe": "Reading your description",
  "brand.extract": "Drafting your profile",
  "brand.save": "Saving",
  "deepdive.crawl": "Reading their website",
  "deepdive.search": "Searching for their socials",
  "deepdive.signals": "Noting what they sell and lack",
  "deepdive.cards": "Writing opportunity cards",
  "deepdive.check": "Checking every claim against its source",
  "deepdive.save": "Saving",
  "drafts.write": "Writing WhatsApp, email, LinkedIn and call drafts",
  "drafts.check": "Checking every sentence against its source",
  "drafts.check.retry": "Checking again the sentences that came back unclear",
  "drafts.save": "Saving",
};

export function stepLabel(name: string) {
  return STEP_LABELS[name] ?? name;
}
