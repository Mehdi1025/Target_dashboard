"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, LayoutGrid, Sparkles } from "lucide-react";

import { AuditLinkActions } from "@/components/audit-link-actions";
import { ProspectDetailHero } from "@/components/prospect-detail-hero";
import {
  ProspectDetailAudit,
  ProspectDetailIdentity,
} from "@/components/prospect-detail-sections";
import { ProspectDetailSidebar } from "@/components/prospect-detail-sidebar";
import { ProspectNotes } from "@/components/prospect-notes";
import { ProspectReportPanel } from "@/components/prospect-report-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackActivity } from "@/hooks/use-track-activity";
import { formatValue } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import type { ProspectDetailCore } from "@/types/prospect";
type ProspectDetailViewProps = {
  prospect: ProspectDetailCore;
};

export function ProspectDetailView({ prospect }: ProspectDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { logAction } = useTrackActivity();

  useEffect(() => {
    logAction(
      "VIEW_LEAD",
      prospect.id,
      { entreprise: prospect.entreprise, source: "prospect_detail" },
      { dedupeMs: 30_000 }
    );
  }, [prospect.id, prospect.entreprise, logAction]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "report") {
      logAction("OPEN_REPORT", prospect.id, {
        entreprise: prospect.entreprise,
        slug: prospect.slug ?? undefined,
      });
    }
  }

  function handleCopyEmail() {
    if (!prospect.script_email) return;
    setCopied(true);
    void navigator.clipboard.writeText(prospect.script_email);
    logAction("COPY_EMAIL", prospect.id, {
      entreprise: prospect.entreprise,
      email_type: "cold_v1",
    });
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:gap-12">
        <ProspectDetailHero prospect={prospect} />

        <div className="grid gap-8 xl:grid-cols-[1fr_300px] xl:gap-10">
          <div className="min-w-0 space-y-8">
            <AuditLinkActions
              prospectId={prospect.id}
              entreprise={prospect.entreprise}
              slug={prospect.slug}
            />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="inline-flex h-12 rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-border/40">
                  <TabsTrigger
                    value="overview"
                    className="gap-2 rounded-xl px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20"
                  >
                    <LayoutGrid className="size-4" />
                    Dossier
                  </TabsTrigger>
                  <TabsTrigger
                    value="report"
                    className="gap-2 rounded-xl px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20"
                  >
                    <FileText className="size-4" />
                    Rapport
                  </TabsTrigger>
                </TabsList>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "overview" ? "Vue opérationnelle" : "Preview client"}
                </p>
              </div>

              <TabsContent value="overview" className="mt-8 space-y-8">
                <ProspectNotes
                  prospectId={prospect.id}
                  initialNotes={prospect.notes}
                  entreprise={prospect.entreprise}
                />
                <ProspectDetailIdentity prospect={prospect} />
                <ProspectDetailAudit prospect={prospect} />

                <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl lg:p-8">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-indigo-500/20 blur-3xl" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-3xl font-black tabular-nums text-white/20">
                          03
                        </span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300/80">
                            Outreach
                          </p>
                          <h2 className="text-xl font-bold">Script email IA</h2>
                        </div>
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="size-3.5 text-indigo-400" />
                        Personnalisé pour {prospect.entreprise}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleCopyEmail}
                      disabled={!prospect.script_email}
                      className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Copy className="size-4" />
                      {copied ? "Copié !" : "Copier"}
                    </Button>
                  </div>

                  <div className="relative mt-6 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
                      <span className="size-2.5 rounded-full bg-rose-400/90" />
                      <span className="size-2.5 rounded-full bg-amber-400/90" />
                      <span className="size-2.5 rounded-full bg-emerald-400/90" />
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                        outreach.md
                      </span>
                    </div>
                    <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap p-6 font-sans text-sm leading-[1.85] text-slate-200">
                      {formatValue(prospect.script_email)}
                    </pre>
                  </div>
                </section>
              </TabsContent>

              {prospect.slug ? (
                <div className={cn(activeTab === "report" ? "mt-8" : "mt-0")}>
                  <ProspectReportPanel
                    slug={prospect.slug}
                    companyName={prospect.entreprise}
                    visible={activeTab === "report"}
                  />
                </div>
              ) : activeTab === "report" ? (
                <div className="mt-8">
                  <ProspectReportPanel slug={null} companyName={prospect.entreprise} visible />
                </div>
              ) : null}
            </Tabs>
          </div>

          <ProspectDetailSidebar
            prospect={prospect}
            onCopyEmail={handleCopyEmail}
            copied={copied}
          />
        </div>
      </div>
  );
}
