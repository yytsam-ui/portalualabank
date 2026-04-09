import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRoles } from "@/lib/guards";
import { decimalToNumber } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";

export default async function NewInvoicePage() {
  const user = await requireRoles(["REQUESTER_AREA"]);
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      deletedAt: null,
      area: user.area,
      status: { in: ["APPROVED", "PARTIALLY_CONSUMED"] },
    },
    include: {
      supplier: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Nueva factura"
        title="Registrar factura desde una OC"
        description="El area informa el numero de factura, la vincula a una OC y la envia directamente a AP."
      />
      <Card>
        <CardHeader title="Formulario simplificado" description="El area no carga datos contables ni impuestos detallados." />
        <CardContent>
          <InvoiceForm
            purchaseOrders={purchaseOrders.map((purchaseOrder) => ({
              id: purchaseOrder.id,
              number: purchaseOrder.number,
              supplierName: purchaseOrder.supplier.businessName,
              accountCode: purchaseOrder.accountCode,
              costCenter: purchaseOrder.costCenter,
              remainingAmount: decimalToNumber(purchaseOrder.remainingAmount),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
