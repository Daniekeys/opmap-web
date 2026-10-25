// Mirrors opmap-api/src/modules/brand/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)
import type { PipelineRun } from "./pipeline";

export type FactKind = "service" | "proof_point" | "ideal_client" | "industry" | "tone" | "location";
export type FactStatus = "pending" | "approved" | "rejected";
export type ProfileStatus = "draft" | "approved" | "archived" | "retired";

export type Fact = {
  id: string;
  kind: FactKind;
  text: string;
  // Null for a fact the user typed in (origin "user").
  sourceUrl: string | null;
  excerpt: string | null;
  origin: "extracted" | "user";
  status: FactStatus;
  possiblyStale: boolean;
  staleReason: string | null;
  previouslyApproved: boolean;
  // The extracted wording, when the user has edited it.
  originalText: string | null;
};

export type BrandSource = "website" | "description";

// A fact read from a description has this as its sourceUrl.
export const DESCRIPTION_SOURCE = "description";

export type ProfileSummary = {
  id: string;
  version: number;
  source: BrandSource;
  // Null for a version read from a description.
  website: string | null;
  // Instagram handle without "@", given with a description.
  instagram: string | null;
  status: ProfileStatus;
  businessName: string | null;
  promptVersion: string | null;
  createdAt: string;
  approvedAt: string | null;
  // Why a retired version can't be used.
  retiredReason: string | null;
  facts: { total: number; pending: number; approved: number; rejected: number };
  // What the user changed while reviewing this version.
  changes: { edited: number; added: number; rejected: number; total: number };
};

export type RunProblem = "site_unreachable" | "blocked_address" | "robots_disallowed" | "no_content" | "foreign_website" | "failed";

// GET /api/w/:workspaceId/brand
export type BrandOverviewResponse = {
  website: string | null;
  // The last description run's text and handle, to start the next one from.
  description: string | null;
  instagram: string | null;
  approved: ProfileSummary | null;
  draft: ProfileSummary | null;
  latestRun: PipelineRun | null;
  latestRunProblem: RunProblem | null;
  versions: ProfileSummary[];
};

export type CrawledPage = { url: string; title: string; via: "http" | "browser" };

// An approved fact of the previous approved version that this version's crawl
// no longer found on the site.
export type MissingFact = { kind: FactKind; text: string; sourceUrl: string | null };

// GET /api/w/:workspaceId/brand/profiles/:profileId
export type ProfileDetailResponse = {
  profile: ProfileSummary;
  pages: CrawledPage[];
  facts: Fact[];
  missing: MissingFact[];
};

// POST /api/w/:workspaceId/brand/runs (owner, 202). A bare domain gets https://.
// A website, or a description (30 to 3000 characters) and an optional
// Instagram handle.
export type StartBrandRunBody = { website: string } | { description: string; instagram?: string | null };
export const MIN_DESCRIPTION_CHARS = 30;
export const MAX_DESCRIPTION_CHARS = 3000;
export type StartBrandRunResponse = { run: PipelineRun };

// POST .../brand/facts/:factId/approve and /reject; PATCH .../brand/facts/:factId
export type FactResponse = { fact: Fact };

// PATCH body: the corrected text (1 to 500 characters), approved as it is saved.
export type EditFactBody = { text: string };

// POST .../brand/profiles/:profileId/facts (201)
export type AddFactBody = { kind: FactKind; text: string };

// POST .../brand/profiles/:profileId/approve (owner)
export type ApproveProfileResponse = { profile: ProfileSummary };
