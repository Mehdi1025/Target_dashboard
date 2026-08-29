"use client";

import { useMemo, useRef } from "react";

import { SniperProactiveBubble } from "@/components/sniper-proactive-bubble";
import { TawkToWidget } from "@/components/tawk-to-widget";
import { useSmartTawkTrigger } from "@/hooks/use-smart-tawk-trigger";
import { preparePublicReport } from "@/lib/html-report";

type PublicHtmlReportProps = {
  html: string;
  prenom: string;
  entreprise: string;
  visitorName: string;
  visitorEmail?: string | null;
};

export function PublicHtmlReport({
  html,
  prenom,
  entreprise,
  visitorName,
  visitorEmail,
}: PublicHtmlReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { markup } = useMemo(() => preparePublicReport(html), [html]);

  useSmartTawkTrigger(containerRef, {
    prenom,
    entreprise,
    delayMs: 15_000,
    threshold: 0.6,
    once: true,
  });

  return (
    <>
      <div
        ref={containerRef}
        id="public-audit-report"
        className="min-h-screen w-full"
        dangerouslySetInnerHTML={{ __html: markup }}
        suppressHydrationWarning
      />
      <TawkToWidget visitorName={visitorName} visitorEmail={visitorEmail} />
      <SniperProactiveBubble />
    </>
  );
}
