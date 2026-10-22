// Mirrors opmap-api/src/core/contracts.ts
// (rows as they arrive over JSON: timestamps are ISO strings)

export type RunStatus = "queued" | "running" | "done" | "failed";

export type PipelineRun = {
  id: string;
  workspaceId: string;
  type: string;
  status: RunStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  costUsd: number;
  durationMs: number | null;
  createdAt: string;
};

export type StepRun = {
  id: string;
  workspaceId: string;
  pipelineRunId: string;
  name: string;
  status: RunStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  costUsd: number;
  durationMs: number | null;
  attempts: number;
  createdAt: string;
};

// GET /api/w/:workspaceId/pipeline-runs
export type PipelineRunsResponse = { runs: PipelineRun[] };

// GET /api/w/:workspaceId/pipeline-runs/:runId
export type PipelineRunDetailResponse = { run: PipelineRun; steps: StepRun[] };

// POST /api/w/:workspaceId/test-pipeline (202, owner only)
export type StartTestPipelineResponse = { run: PipelineRun };
