function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted/60 ${className ?? ""}`} />;
}

export default function AdminStatistiquesLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-4" />
        <Skeleton className="h-72 lg:col-span-4" />
        <Skeleton className="h-72 lg:col-span-4" />
        <Skeleton className="h-28 lg:col-span-3" />
        <Skeleton className="h-28 lg:col-span-3" />
        <Skeleton className="h-28 lg:col-span-3" />
        <Skeleton className="h-28 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-6" />
        <Skeleton className="h-64 lg:col-span-6" />
      </div>
    </div>
  );
}
