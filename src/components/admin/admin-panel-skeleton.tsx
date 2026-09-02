export function AdminPanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function AdminHeroSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      <div className="h-12 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />
      <div className="h-5 w-full max-w-xl animate-pulse rounded-lg bg-muted/80" />
    </div>
  );
}
