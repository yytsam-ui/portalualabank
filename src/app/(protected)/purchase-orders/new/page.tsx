import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRoles } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function NewPurchaseOrderPage() {
  const user = await requireRoles(["PROCUREMENT"]);
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { businessName: "asc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Nueva OC"
        title="Crear orden de compra"
        description="Compras crea la OC, completa cuenta contable y CECO, adjunta archivos y la deja aprobada o en borrador."
      />
      <Card>
        <CardHeader title="Formulario" description="La cuenta contable y el CECO son obligatorios para operar la OC." />
        <CardContent>
          <PurchaseOrderForm
            suppliers={suppliers.map((supplier) => ({ id: supplier.id, businessName: supplier.businessName }))}
            defaultArea={user.area}
          />
        </CardContent>
      </Card>
    </div>
  );
}
