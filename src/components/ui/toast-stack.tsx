"use client";

import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { useToast, type ToastVariant } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: typeof CheckCircle2 }
> = {
  success: {
    container: "border-emerald-500/30 bg-emerald-950/95 text-emerald-50",
    icon: CheckCircle2,
  },
  error: {
    container: "border-rose-500/30 bg-rose-950/95 text-rose-50",
    icon: XCircle,
  },
  warning: {
    container: "border-orange-500/30 bg-orange-950/95 text-orange-50",
    icon: AlertCircle,
  },
  info: {
    container: "border-cyan-500/30 bg-slate-950/95 text-slate-50",
    icon: Info,
  },
};

export function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100000] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const styles = VARIANT_STYLES[item.variant];
        const Icon = styles.icon;

        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all",
              styles.container
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs leading-relaxed opacity-85">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
                aria-label="Fermer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
