"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HtmlReportViewerProps = {
  html: string | null;
  companyName: string;
};

export function HtmlReportViewer({ html, companyName }: HtmlReportViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function handlePrint() {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) {
      return;
    }

    iframeWindow.focus();
    iframeWindow.print();
  }

  async function handleToggleFullscreen() {
    const container = iframeRef.current?.parentElement;
    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }

  if (!html?.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rapport Brand / Audit</CardTitle>
          <CardDescription>
            Le rapport HTML Awwards n&apos;a pas encore été généré pour ce prospect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aucun rapport disponible</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Lancez votre workflow n8n pour produire le rapport et l&apos;enregistrer dans{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">html_rapport</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-50">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-zinc-50">Rapport Brand / Audit</CardTitle>
          <CardDescription className="text-zinc-400">
            Rapport Awwards — {companyName}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleToggleFullscreen}>
            {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          </Button>
          <Button onClick={handlePrint}>Télécharger en PDF / Imprimer</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="html-report-container min-h-[85vh] bg-zinc-950">
          <iframe
            ref={iframeRef}
            title={`Rapport Brand Audit — ${companyName}`}
            srcDoc={html}
            sandbox="allow-same-origin allow-modals"
            className="h-[85vh] w-full border-0 bg-zinc-950"
          />
        </div>
      </CardContent>
    </Card>
  );
}
