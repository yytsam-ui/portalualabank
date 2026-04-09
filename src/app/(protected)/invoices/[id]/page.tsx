import { notFound } from "next/navigation";

import { AttachmentList } from "@/components/attachments/attachment-list";
import { ApAccountingForm } from "@/components/invoices/ap-accounting-form";
import { AreaSendInvoiceForm } from "@/components/invoices/area-send-invoice-form";
import { AssignAreaForm } from "@/components/invoices/assign-area-form";
import { ActionDecisionForm } from "@/components/shared/action-decision-form";
import { HistoryList } from "@/components/shared/history-list";
import { SectionGrid } from "@/components/shared/section-grid";
import { SummaryRow } from "@/components/shared/summary-row";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { getInvoiceDetail } from "@/features/invoices/invoices.service";
import { requireAuth } from "@/lib/guards";
import { decimalToNumber } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  let invoice: Awaited<ReturnType<typeof getInvoiceDetail>>;

  try {
    invoice = await getInvoiceDetail(user, id);
  } catch {
    notFound();
  }

  const purchaseOrdersForArea =
    user.role === "REQUESTER_AREA"
      ? await prisma.purchaseOrder.findMany({
          where: {
            deletedAt: null,
            area: user.area,
            status: { in: ["APPROVED", "PARTIALLY_CONSUMED"] },
          },
          include: { supplier: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const availableAreas =
    user.role === "AP"
      ? (
          await prisma.user.findMany({
            where: { active: true, role: "REQUESTER_AREA" },
            select: { area: true },
            distinct: ["area"],
            orderBy: { area: "asc" },
          })
        ).map((userArea) => userArea.area)
      : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Expediente"
        title={invoice.invoiceNumber || "Factura sin numero"}
        description="Seguimiento completo de la factura, la orden de compra vinculada, los adjuntos y la auditoria."
      />
      <SectionGrid>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Resumen" />
            <CardContent>
              <SummaryRow label="Proveedor" value={invoice.supplier.businessName} />
              <SummaryRow label="Origen" value={invoice.sourceType === "AP_MONITOR" ? "Monitor de AP" : "Carga directa desde area"} />
              <SummaryRow label="Estado" value={<StatusBadge status={invoice.status} />} />
              <SummaryRow label="Area asignada" value={invoice.purchaseOrder?.area || invoice.areaAssigned || "-"} />
              <SummaryRow label="Orden de compra" value={invoice.purchaseOrder?.number || "Pendiente de vinculacion"} />
              <SummaryRow label="Fecha de recepcion" value={formatDate(invoice.receivedDate)} />
              <SummaryRow label="Fecha de factura" value={invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "-"} />
              <SummaryRow label="Total" value={invoice.totalAmount && invoice.currency ? formatCurrency(invoice.totalAmount.toString(), invoice.currency) : "Pendiente de completar por AP"} />
              <SummaryRow label="Cuenta contable" value={invoice.accountCode || invoice.purchaseOrder?.accountCode || "-"} />
              <SummaryRow label="CECO" value={invoice.costCenter || invoice.purchaseOrder?.costCenter || "-"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Imputacion y consumo" description="Se completa en AP al contabilizar." />
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <thead>
                  <tr>
                    <TH>Concepto</TH>
                    <TH>Valor</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <TD>Subtotal</TD>
                    <TD>{invoice.subtotal && invoice.currency ? formatCurrency(invoice.subtotal.toString(), invoice.currency) : "-"}</TD>
                  </tr>
                  <tr>
                    <TD>Impuestos</TD>
                    <TD>{invoice.taxes && invoice.currency ? formatCurrency(invoice.taxes.toString(), invoice.currency) : "-"}</TD>
                  </tr>
                  <tr>
                    <TD>Total imputado a OC</TD>
                    <TD>{invoice.totalAmount && invoice.currency ? formatCurrency(invoice.totalAmount.toString(), invoice.currency) : "-"}</TD>
                  </tr>
                  <tr>
                    <TD>Saldo remanente de la OC</TD>
                    <TD>
                      {invoice.purchaseOrder ? formatCurrency(invoice.purchaseOrder.remainingAmount.toString(), invoice.purchaseOrder.currency) : "-"}
                    </TD>
                  </tr>
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {user.role === "AP" && invoice.sourceType === "AP_MONITOR" && invoice.status === "DRAFT" ? (
            <Card>
              <CardHeader title="Derivar al area" description="Selecciona el area que debe identificar la orden de compra correcta." />
              <CardContent>
                <AssignAreaForm endpoint={`/api/invoices/${invoice.id}/assign-area`} areas={availableAreas} defaultArea={invoice.areaAssigned || ""} />
              </CardContent>
            </Card>
          ) : null}

          {user.role === "REQUESTER_AREA" && (invoice.status === "PENDING_AREA_APPROVAL" || invoice.status === "RETURNED_BY_AP") ? (
            <Card>
              <CardHeader title="Gestion del area" description="Completa la OC correcta, confirma el numero y envia a AP en un solo paso." />
              <CardContent>
                <AreaSendInvoiceForm
                  endpoint={`/api/invoices/${invoice.id}/send-to-ap`}
                  purchaseOrders={purchaseOrdersForArea.map((purchaseOrder) => ({
                    id: purchaseOrder.id,
                    number: purchaseOrder.number,
                    supplierName: purchaseOrder.supplier.businessName,
                    remainingAmount: decimalToNumber(purchaseOrder.remainingAmount),
                  }))}
                  defaultValues={{
                    purchaseOrderId: invoice.purchaseOrderId ?? "",
                    invoiceNumber: invoice.invoiceNumber ?? "",
                    notes: invoice.notes ?? "",
                  }}
                />
              </CardContent>
            </Card>
          ) : null}

          {user.role === "AP" && invoice.status === "DERIVED_TO_AP" ? (
            <Card>
              <CardHeader title="Revision y contabilizacion" description="AP completa los datos contables usando la OC como base." />
              <CardContent className="space-y-6">
                <ApAccountingForm
                  endpoint={`/api/invoices/${invoice.id}/account`}
                  defaults={{
                    accountCode: invoice.purchaseOrder?.accountCode || invoice.accountCode || "",
                    costCenter: invoice.purchaseOrder?.costCenter || invoice.costCenter || "",
                    currency: invoice.purchaseOrder?.currency || invoice.currency,
                    notes: invoice.notes,
                  }}
                />
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-900">Devolver al area</p>
                  <ActionDecisionForm endpoint={`/api/invoices/${invoice.id}/return`} approveLabel="Devolver al area" approveOnly returnMode />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Adjuntos" />
            <CardContent>
              <AttachmentList attachments={invoice.attachments} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Historial" />
            <CardContent>
              <HistoryList items={invoice.auditLogs} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Aprobaciones y devoluciones" />
            <CardContent>
              <HistoryList
                items={invoice.approvals.map((approval) => ({
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
