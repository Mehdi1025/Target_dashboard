export default function AdminEquipeLoading() {
  return (
    <div className="flex flex-col gap-12">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-[1.75rem] bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
