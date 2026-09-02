export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-3">
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded-lg bg-muted/80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-muted" />
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
