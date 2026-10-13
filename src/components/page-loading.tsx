// Placeholder blocks shown while a page's request-time data streams in.
export function PageLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6" role="status" aria-label="Loading">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
