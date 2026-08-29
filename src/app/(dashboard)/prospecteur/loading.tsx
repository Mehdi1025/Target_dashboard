function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/40 ${className ?? ""}`} />;
}

export default function ProspecteurLoading() {
  return (
    <div className="flex flex-col gap-10">
      <Skeleton className="h-32 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
