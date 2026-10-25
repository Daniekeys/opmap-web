// What the progress panel calls each pipeline step. Names come from the API's
// pipelines (opmap-api src/worker/pipelines). A step with no label here shows
// its raw name, so a new step is never hidden.
const STEP_LABELS: Record<string, string> = {
  "brand.crawl": "Reading your website",
  "brand.describe": "Reading your description",
  "brand.extract": "Drafting your profile",
  "brand.save": "Saving",
};

export function stepLabel(name: string) {
  return STEP_LABELS[name] ?? name;
}
