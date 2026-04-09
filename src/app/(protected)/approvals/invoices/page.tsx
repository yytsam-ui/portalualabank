import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TD, TH } from "@/components/ui/table";
import { requireRoles } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function InvoiceApprovalInboxPage() {
  const user = await requireRoles(["ADMIN", "REQUESTER_AREA"]);
  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PENDING_AREA_APPROVAL", "RETURNED_BY_AP"] },
      ...(user.role === "REQUESTER_AREA" ? { areaAssigned: user.area } : {}),
    },
    include: {
      supplier: true,
      purchaseOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Area" title="Pendientes del area" description="Facturas derivadas por AP o devueltas para correccion." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Numero</TH>
                <TH>Proveedor</TH>
                <TH>OC</TH>
                <TH>Area</TH>
                <TH>Estado</TH>
                <TH>Fecha</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <TD>{invoice.invoiceNumber || "Pendiente"}</TD>
                  <TD>{invoice.supplier.businessName}</TD>
                  <TD>{invoice.purchaseOrder?.number || "Pendiente"}</TD>
                  <TD>{invoice.areaAssigned || invoice.purchaseOrder?.area || "-"}</TD>
                  <TD><StatusBadge status={invoice.status} /></TD>
                  <TD>{formatDate(invoice.createdAt)}</TD>
                  <TD>
                    <Link href={`/invoices/${invoice.id}`} className="text-sm font-semibold text-slate-950">
                      Revisar
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
