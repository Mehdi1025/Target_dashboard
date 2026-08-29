"use client";

import { useEffect } from "react";

const TAWK_SCRIPT_ID = "tawk-target-os-script";

type TawkToWidgetProps = {
  visitorName: string;
  visitorEmail?: string | null;
};

function getTawkEmbedUrl() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) {
    return null;
  }

  return `https://embed.tawk.to/${propertyId}/${widgetId}`;
}

export function TawkToWidget({ visitorName, visitorEmail }: TawkToWidgetProps) {
  useEffect(() => {
    const embedUrl = getTawkEmbedUrl();

    if (!embedUrl) {
      console.error(
        "[Target OS] Tawk.to non configuré : ajoute NEXT_PUBLIC_TAWK_PROPERTY_ID et NEXT_PUBLIC_TAWK_WIDGET_ID dans .env.local"
      );
      return;
    }

    const visitor = {
      name: visitorName,
      ...(visitorEmail ? { email: visitorEmail } : {}),
    };

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.visitor = visitor;

    function applyVisitorAttributes() {
      window.Tawk_API?.setAttributes?.(visitor, () => {});
      window.Tawk_API?.showWidget?.();
    }

    window.Tawk_API.onLoad = applyVisitorAttributes;

    const existingScript = document.getElementById(TAWK_SCRIPT_ID) as HTMLScriptElement | null;

    if (!existingScript) {
      window.Tawk_LoadStart = new Date();

      const script = document.createElement("script");
      script.id = TAWK_SCRIPT_ID;
      script.async = true;
      script.src = embedUrl;
      script.charset = "UTF-8";
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        console.error(
          `[Target OS] Échec chargement Tawk.to (${embedUrl}). Vérifie NEXT_PUBLIC_TAWK_WIDGET_ID dans .env.local.`
        );
      };
      document.body.appendChild(script);
    } else if (existingScript.src !== embedUrl) {
      existingScript.src = embedUrl;
    } else {
      applyVisitorAttributes();
    }

    return () => {
      window.Tawk_API?.hideWidget?.();
    };
  }, [visitorName, visitorEmail]);

  return null;
}
