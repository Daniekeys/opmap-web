// Mirrors opmap-api/src/http/errors.ts

// `issues` comes only with code invalid_input, one entry per problem.
export type ApiIssue = { code: string; path: (string | number)[]; message: string };

// Codes the web app acts on: unauthenticated (401), forbidden (403),
// not_found (404), invalid_input (400), invite_invalid (404), invite_used and
// invite_expired (410).
export type ApiErrorResponse = { error: { code: string; message: string; issues?: ApiIssue[] } };
