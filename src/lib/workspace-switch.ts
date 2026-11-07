// Where the workspace switcher goes: the same screen under the other
// workspace, except a screen showing one workspace-owned item (a campaign and
// everything under it: its leads, cards, drafts and pipeline; or one Brand DNA
// version), which goes to that section's list. The item belongs to the old
// workspace, so under the new one the API rightly answers 404. The query
// string (a run id, a tab) is dropped for the same reason.
export function switchTarget(pathname: string, slug: string) {
  const rest = pathname.split("/").filter(Boolean).slice(2);
  const [section, item] = rest;
  const ownsItem = (section === "campaigns" && item !== undefined && item !== "new") || (section === "brand" && item !== undefined);
  return `/${["w", slug, ...(ownsItem ? [section] : rest)].join("/")}`;
}
