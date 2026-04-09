import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { listPurchaseOrders } from "@/features/purchase-orders/purchase-orders.service";
import { requireRoles } from "@/lib/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchaseOrdersPage() {
  const user = await requireRoles(["ADMIN", "PROCUREMENT", "REQUESTER_AREA"]);
  const purchaseOrders = await listPurchaseOrders(user);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={user.role === "REQUESTER_AREA" ? "Mi Area" : "Compras"}
        title={user.role === "REQUESTER_AREA" ? "Ordenes de compra de mi area" : "Ordenes de Compra"}
        description="Consulta de OCs, saldos remanentes y estado del expediente."
        actions={
          user.role === "PROCUREMENT" ? (
            <Link href="/purchase-orders/new">
              <Button>Nueva OC</Button>
            </Link>
          ) : null
        }
      />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Numero</TH>
                <TH>Proveedor</TH>
                <TH>Area</TH>
                <TH>Cuenta</TH>
                <TH>CECO</TH>
                <TH>Total</TH>
                <TH>Consumido</TH>
                <TH>Saldo</TH>
                <TH>Estado</TH>
                <TH>Fecha</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((purchaseOrder) => (
                <tr key={purchaseOrder.id}>
                  <TD className="font-medium text-slate-900">{purchaseOrder.number}</TD>
                  <TD>{purchaseOrder.supplier.businessName}</TD>
                  <TD>{purchaseOrder.area}</TD>
                  <TD>{purchaseOrder.accountCode}</TD>
                  <TD>{purchaseOrder.costCenter}</TD>
                  <TD>{formatCurrency(purchaseOrder.totalAmount.toString(), purchaseOrder.currency)}</TD>
                  <TD>{formatCurrency(purchaseOrder.consumedAmount.toString(), purchaseOrder.currency)}</TD>
                  <TD>{formatCurrency(purchaseOrder.remainingAmount.toString(), purchaseOrder.currency)}</TD>
                  <TD><StatusBadge status={purchaseOrder.status} /></TD>
                  <TD>{formatDate(purchaseOrder.createdAt)}</TD>
                  <TD>
                    <Link href={`/purchase-orders/${purchaseOrder.id}`} className="text-sm font-semibold text-slate-950">
                      Ver detalle
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
