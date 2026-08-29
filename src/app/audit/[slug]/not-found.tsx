export default function AuditNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-center text-zinc-100">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Target OS</p>
        <h1 className="mt-4 text-3xl font-semibold">Rapport introuvable</h1>
        <p className="mt-3 max-w-md text-zinc-400">
          Aucun prospect ne correspond à ce slug. Vérifie l&apos;URL ou consulte la
          colonne <code className="text-zinc-300">slug</code> dans Supabase.
        </p>
      </div>
    </main>
  );
}
