"use client";

import { useEffect, useState } from "react";

import {
  SNIPER_TRIGGER_EVENT,
  type SniperTriggerPayload,
} from "@/lib/sniper-message";

export function SniperProactiveBubble() {
  const [payload, setPayload] = useState<SniperTriggerPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleSniperTrigger(event: Event) {
      const customEvent = event as CustomEvent<SniperTriggerPayload>;
      setPayload(customEvent.detail);
      setIsVisible(true);
    }

    window.addEventListener(SNIPER_TRIGGER_EVENT, handleSniperTrigger);
    return () => window.removeEventListener(SNIPER_TRIGGER_EVENT, handleSniperTrigger);
  }, []);

  if (!isVisible || !payload) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 bottom-24 z-[999999] max-w-sm opacity-100 transition-all duration-500">
      <div className="rounded-2xl border border-indigo-400/20 bg-[#111827] p-4 shadow-2xl shadow-indigo-500/20">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
          Target OS
        </p>
        <p className="text-sm leading-relaxed text-zinc-100">{payload.message}</p>
      </div>
    </div>
  );
}
