"use client";

import { type RefObject, useEffect } from "react";

import {
  buildSniperMessage,
  dispatchSniperTrigger,
  type SniperTriggerPayload,
} from "@/lib/sniper-message";

const DEFAULT_DELAY_MS = 15_000;
const DEFAULT_THRESHOLD = 0.6;
const SNIPER_TAWK_EVENT = "target_os_sniper_faiblesses";

const TRIGGER_SELECTORS = [
  ".mini-card.negative",
  "[data-audit-section='faiblesses']",
  "[data-target='faiblesses']",
];

type UseSmartTawkTriggerOptions = {
  prenom: string;
  entreprise: string;
  delayMs?: number;
  threshold?: number;
  once?: boolean;
  onTriggered?: (payload: SniperTriggerPayload) => void;
};

function findSensitiveSection(container: HTMLElement): Element | null {
  for (const selector of TRIGGER_SELECTORS) {
    const element = container.querySelector(selector);
    if (element) {
      return element;
    }
  }

  const headings = container.querySelectorAll("h1, h2, h3, h4");

  for (const heading of headings) {
    const label = heading.textContent?.toLowerCase() ?? "";

    if (
      label.includes("faiblesse") ||
      label.includes("axe") ||
      label.includes("amélioration") ||
      label.includes("rupture")
    ) {
      return (
        heading.closest(".card, .mini-card, section, article, div") ?? heading
      );
    }
  }

  return null;
}

export function triggerProactiveSniperChat({
  prenom,
  entreprise,
  onTriggered,
}: {
  prenom: string;
  entreprise: string;
  onTriggered?: (payload: SniperTriggerPayload) => void;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const message = buildSniperMessage(prenom, entreprise);
  const payload: SniperTriggerPayload = { prenom, entreprise, message };

  const execute = () => {
    window.Tawk_API?.setAttributes?.({ name: prenom }, () => {});
    window.Tawk_API?.addEvent?.(SNIPER_TAWK_EVENT, {
      prenom,
      entreprise,
      message,
    });
    window.Tawk_API?.maximize?.();

    dispatchSniperTrigger(payload);
    onTriggered?.(payload);
  };

  if (typeof window.Tawk_API?.maximize === "function") {
    execute();
    return;
  }

  window.Tawk_API = window.Tawk_API || {};
  const previousOnLoad = window.Tawk_API.onLoad;

  window.Tawk_API.onLoad = function onLoadWithSniper() {
    previousOnLoad?.();
    execute();
  };
}

export function useSmartTawkTrigger(
  containerRef: RefObject<HTMLElement | null>,
  options: UseSmartTawkTriggerOptions
) {
  const {
    prenom,
    entreprise,
    delayMs = DEFAULT_DELAY_MS,
    threshold = DEFAULT_THRESHOLD,
    once = true,
    onTriggered,
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let hasTriggered = false;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const setupObserver = () => {
      const target = findSensitiveSection(container);

      if (!target) {
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (!entry) {
            return;
          }

          if (entry.isIntersecting) {
            if (once && hasTriggered) {
              return;
            }

            clearTimer();
            timer = setTimeout(() => {
              hasTriggered = true;
              triggerProactiveSniperChat({ prenom, entreprise, onTriggered });
            }, delayMs);
            return;
          }

          clearTimer();
        },
        {
          root: null,
          threshold,
        }
      );

      observer.observe(target);
    };

    const frameId = window.requestAnimationFrame(setupObserver);

    return () => {
      window.cancelAnimationFrame(frameId);
      clearTimer();
      observer?.disconnect();
    };
  }, [containerRef, delayMs, threshold, once, prenom, entreprise, onTriggered]);
}
