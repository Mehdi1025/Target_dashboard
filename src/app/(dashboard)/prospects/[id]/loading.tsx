function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[1.75rem] bg-muted/40 ${className ?? ""}`} />;
}

export default function ProspectLoading() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:gap-12">
      <Skeleton className="h-72" />
      <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <Skeleton className="h-28" />
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
          <Skeleton className="h-72" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-52" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}
