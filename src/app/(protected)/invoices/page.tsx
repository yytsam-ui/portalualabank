import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { listInvoices } from "@/features/invoices/invoices.service";
import { requireRoles } from "@/lib/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function InvoicesPage() {
  const user = await requireRoles(["ADMIN", "REQUESTER_AREA", "AP"]);
  const invoices = await listInvoices(user);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Facturas"
        title={user.role === "AP" ? "Expedientes de AP" : "Facturas"}
        description="Listado filtrado segun rol, area y etapa del proceso."
        actions={
          user.role === "REQUESTER_AREA" ? (
            <Link href="/invoices/new">
              <Button>Nueva factura</Button>
            </Link>
          ) : user.role === "AP" ? (
            <Link href="/ap/monitor-de-facturas">
              <Button>Monitor de facturas</Button>
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
                  <TD>{invoice.purchaseOrder?.number || "-"}</TD>
                  <TD>{invoice.purchaseOrder?.area || invoice.areaAssigned || "-"}</TD>
                  <TD>{invoice.totalAmount && invoice.currency ? formatCurrency(invoice.totalAmount.toString(), invoice.currency) : "-"}</TD>
                  <TD><StatusBadge status={invoice.status} /></TD>
                  <TD>{formatDate(invoice.receivedDate)}</TD>
                  <TD>
                    <Link href={`/invoices/${invoice.id}`} className="text-sm font-semibold text-slate-950">
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
