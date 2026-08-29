"use client";

import Link from "next/link";

import { AuditLinkActions } from "@/components/audit-link-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatValue, getFullName, getStatutBadgeClass } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import type { ProspectListItem } from "@/types/prospect";

type ProspectsTableProps = {
  prospects: ProspectListItem[];
};

export function ProspectsTable({ prospects }: ProspectsTableProps) {
  function handleApprove(prospectId: string) {
    console.log(prospectId);
  }

  if (prospects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Aucun prospect pour le moment</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les prospects générés par l&apos;IA apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Entreprise</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Score IA</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => (
            <TableRow key={prospect.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="transition-colors hover:text-primary hover:underline"
                >
                  {prospect.entreprise}
                </Link>
              </TableCell>
              <TableCell>{getFullName(prospect.prenom, prospect.nom)}</TableCell>
              <TableCell>{formatValue(prospect.poste)}</TableCell>
              <TableCell className="text-muted-foreground">{prospect.email}</TableCell>
              <TableCell>
                {prospect.ia_score !== null ? (
                  <span className="font-semibold tabular-nums">{prospect.ia_score}/100</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatutBadgeClass(prospect.statut)}
                >
                  {prospect.statut}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <AuditLinkActions
                    prospectId={prospect.id}
                    entreprise={prospect.entreprise}
                    slug={prospect.slug}
                    variant="inline"
                  />
                  <Link
                    href={`/prospects/${prospect.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Voir
                  </Link>
                  <Button size="sm" onClick={() => handleApprove(prospect.id)}>
                    Approuver &amp; Envoyer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
