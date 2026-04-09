import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TD, TH } from "@/components/ui/table";
import { requireRoles } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchaseOrderApprovalInboxPage() {
  const user = await requireRoles(["ADMIN", "PROCUREMENT"]);
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      deletedAt: null,
      status: "DRAFT",
      ...(user.role === "PROCUREMENT" ? { area: user.area } : {}),
    },
    include: { supplier: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Compras" title="OCs para aprobar" description="Compras revisa y aprueba OCs en borrador." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Numero</TH>
                <TH>Proveedor</TH>
                <TH>Area</TH>
                <TH>Total</TH>
                <TH>Creada por</TH>
                <TH>Fecha</TH>
                <TH>Estado</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((purchaseOrder) => (
                <tr key={purchaseOrder.id}>
                  <TD>{purchaseOrder.number}</TD>
                  <TD>{purchaseOrder.supplier.businessName}</TD>
                  <TD>{purchaseOrder.area}</TD>
                  <TD>{formatCurrency(purchaseOrder.totalAmount.toString(), purchaseOrder.currency)}</TD>
                  <TD>{purchaseOrder.createdBy.name}</TD>
                  <TD>{formatDate(purchaseOrder.createdAt)}</TD>
                  <TD><StatusBadge status={purchaseOrder.status} /></TD>
                  <TD>
                    <Link href={`/purchase-orders/${purchaseOrder.id}`} className="text-sm font-semibold text-slate-950">
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
