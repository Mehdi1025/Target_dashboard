export default function AdminControleLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-3">
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-[1.75rem] bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
