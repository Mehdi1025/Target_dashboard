"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type FastLinkProps = ComponentProps<typeof Link> & {
  showPending?: boolean;
};

export function FastLink({
  href,
  onClick,
  className,
  showPending = true,
  children,
  ...props
}: FastLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Link
      href={href}
      prefetch
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (typeof href === "string" && !href.startsWith("http") && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          startTransition(() => {
            router.push(href);
          });
        }
      }}
      className={cn(
        showPending && isPending && "pointer-events-none opacity-60",
        className
      )}
      aria-busy={isPending}
      {...props}
    >
      {children}
    </Link>
  );
}
