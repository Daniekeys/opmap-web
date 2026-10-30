// Placeholder blocks shown while a page's request-time data streams in.
export function PageLoading() {
  return (
    <div className="flex w-full flex-col gap-3" role="status" aria-label="Loading">
      <div className="h-7 w-40 animate-pulse rounded-control bg-raised" />
      <div className="h-24 animate-pulse rounded-card bg-raised" />
      <div className="h-24 animate-pulse rounded-card bg-raised" />
    </div>
  );
}
