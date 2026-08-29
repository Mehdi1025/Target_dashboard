import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md";
};

export function Spinner({ className, size = "sm" }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        size === "sm" ? "size-3.5" : "size-4",
        className
      )}
      aria-hidden
    />
  );
}
