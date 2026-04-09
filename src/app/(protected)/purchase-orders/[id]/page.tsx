import Link from "next/link";
import { notFound } from "next/navigation";

import { AttachmentList } from "@/components/attachments/attachment-list";
import { HistoryList } from "@/components/shared/history-list";
import { PostActionButton } from "@/components/shared/post-action-button";
import { SectionGrid } from "@/components/shared/section-grid";
import { SummaryRow } from "@/components/shared/summary-row";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { getPurchaseOrderDetail } from "@/features/purchase-orders/purchase-orders.service";
import { requireAuth } from "@/lib/guards";
import { formatCurrency } from "@/lib/utils";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  let purchaseOrder: Awaited<ReturnType<typeof getPurchaseOrderDetail>>;

  try {
    purchaseOrder = await getPurchaseOrderDetail(user, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Expediente OC"
        title={purchaseOrder.number}
        description="Resumen, saldo remanente, adjuntos, historial y facturas asociadas."
        actions={
          <div className="flex flex-wrap gap-3">
            {user.role === "PROCUREMENT" && purchaseOrder.status === "DRAFT" ? (
              <PostActionButton endpoint={`/api/purchase-orders/${purchaseOrder.id}/approve`} label="Aprobar OC" />
            ) : null}
            {user.role === "REQUESTER_AREA" &&
            (purchaseOrder.status === "APPROVED" || purchaseOrder.status === "PARTIALLY_CONSUMED") ? (
              <Link href={`/invoices/new?purchaseOrderId=${purchaseOrder.id}`}>
                <Button variant="secondary">Cargar factura</Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <SectionGrid>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Resumen principal" />
            <CardContent>
              <SummaryRow label="Proveedor" value={purchaseOrder.supplier.businessName} />
              <SummaryRow label="Area" value={purchaseOrder.area} />
              <SummaryRow label="Cuenta contable" value={purchaseOrder.accountCode} />
              <SummaryRow label="CECO" value={purchaseOrder.costCenter} />
              <SummaryRow label="Responsable" value={purchaseOrder.requesterName || "-"} />
              <SummaryRow label="Estado" value={<StatusBadge status={purchaseOrder.status} />} />
              <SummaryRow label="Total" value={formatCurrency(purchaseOrder.totalAmount.toString(), purchaseOrder.currency)} />
              <SummaryRow label="Consumido" value={formatCurrency(purchaseOrder.consumedAmount.toString(), purchaseOrder.currency)} />
              <SummaryRow label="Saldo remanente" value={formatCurrency(purchaseOrder.remainingAmount.toString(), purchaseOrder.currency)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Posiciones" />
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <thead>
                  <tr>
                    <TH>Descripcion</TH>
                    <TH>Cantidad</TH>
                    <TH>Precio unitario</TH>
                    <TH>Total</TH>
                    <TH>Consumido</TH>
                    <TH>Saldo</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrder.items.map((item) => (
                    <tr key={item.id}>
                      <TD>{item.description}</TD>
                      <TD>{item.quantity.toString()}</TD>
                      <TD>{formatCurrency(item.unitPrice.toString(), purchaseOrder.currency)}</TD>
                      <TD>{formatCurrency(item.totalPrice.toString(), purchaseOrder.currency)}</TD>
                      <TD>{formatCurrency(item.consumedAmount.toString(), purchaseOrder.currency)}</TD>
                      <TD>{formatCurrency(item.remainingAmount.toString(), purchaseOrder.currency)}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Facturas asociadas" />
            <CardContent className="space-y-3">
              {purchaseOrder.invoices.length === 0 ? (
                <p className="text-sm text-slate-500">Todavia no hay facturas asociadas.</p>
              ) : (
                purchaseOrder.invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-600">
                          {invoice.totalAmount && invoice.currency ? formatCurrency(invoice.totalAmount.toString(), invoice.currency) : "Pendiente de contabilizacion"}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Adjuntos" />
            <CardContent className="space-y-3">
              <AttachmentList attachments={purchaseOrder.attachments} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Historial" />
            <CardContent>
              <HistoryList items={purchaseOrder.auditLogs} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Aprobaciones" />
            <CardContent>
              <HistoryList
                items={purchaseOrder.approvals.map((approval) => ({
                  id: approval.id,
                  action: approval.decision,
                  createdAt: approval.createdAt,
                  comment: approval.comment,
                  performedBy: approval.decidedBy,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </SectionGrid>
    </div>
  );
}
