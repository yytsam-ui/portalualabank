import Link from "next/link";

import { ApTabs } from "@/components/ap/ap-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TD, TH } from "@/components/ui/table";
import { requireRoles } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ApInboxPage() {
  await requireRoles(["ADMIN", "AP"]);
  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      status: "DERIVED_TO_AP",
      purchaseOrderId: { not: null },
    },
    include: {
      supplier: true,
      purchaseOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <ApTabs currentPath="/ap/inbox" />
      <PageHeader eyebrow="AP" title="Bandeja de AP" description="Solo se muestran expedientes que ya fueron enviados a AP por el area." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Factura</TH>
                <TH>Proveedor</TH>
                <TH>OC</TH>
                <TH>Area</TH>
                <TH>Total</TH>
                <TH>Estado</TH>
                <TH>Recepcion</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <TD>{invoice.invoiceNumber || "Pendiente"}</TD>
                  <TD>{invoice.supplier.businessName}</TD>
                  <TD>{invoice.purchaseOrder!.number}</TD>
                  <TD>{invoice.purchaseOrder!.area}</TD>
                  <TD>{invoice.totalAmount && invoice.currency ? formatCurrency(invoice.totalAmount.toString(), invoice.currency) : "Pendiente"}</TD>
                  <TD><StatusBadge status={invoice.status} /></TD>
                  <TD>{formatDate(invoice.receivedDate)}</TD>
                  <TD>
                    <Link href={`/invoices/${invoice.id}`} className="text-sm font-semibold text-slate-950">
                      Abrir expediente
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
