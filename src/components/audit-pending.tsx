import Link from "next/link";

type AuditPendingProps = {
  entreprise: string;
  slug: string;
};

export function AuditPending({ entreprise, slug }: AuditPendingProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-center text-zinc-100">
      <div className="max-w-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Target OS</p>
        <h1 className="mt-4 text-3xl font-semibold">{entreprise}</h1>
        <p className="mt-3 text-zinc-400">
          Le rapport brand pour ce prospect existe, mais le HTML n&apos;a pas encore été
          généré par n8n.
        </p>
        <p className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 font-mono text-sm text-zinc-300">
          /audit/{slug}
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Vérifie que n8n remplit bien <code className="text-zinc-300">html_rapport</code>{" "}
          sur la même ligne que le <code className="text-zinc-300">slug</code>.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← Retour au dashboard
        </Link>
      </div>
    </main>
  );
}
