import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-mesh flex min-h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
