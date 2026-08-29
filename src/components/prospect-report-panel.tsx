"use client";

import { AuditReportEmbed, AuditReportMissing } from "@/components/audit-report-embed";

type ProspectReportPanelProps = {
  slug: string | null;
  companyName: string;
  visible: boolean;
};

export function ProspectReportPanel({
  slug,
  companyName,
  visible,
}: ProspectReportPanelProps) {
  if (!slug) {
    return visible ? <AuditReportMissing /> : null;
  }

  return <AuditReportEmbed slug={slug} companyName={companyName} visible={visible} />;
}
