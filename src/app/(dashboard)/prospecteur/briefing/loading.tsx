export default function BriefingLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-[640px] animate-pulse rounded-[1.75rem] bg-muted" />
    </div>
  );
}
