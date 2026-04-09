import { ApTabs } from "@/components/ap/ap-tabs";
import { ApMonitorInvoiceForm } from "@/components/invoices/ap-monitor-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRoles } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function ApCargarFacturaPage() {
  await requireRoles(["ADMIN", "AP"]);
  const [suppliers, requesterAreas] = await Promise.all([
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { businessName: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true, role: "REQUESTER_AREA" },
      select: { area: true },
      distinct: ["area"],
      orderBy: { area: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <ApTabs currentPath="/ap/cargar-factura" />
      <PageHeader
        eyebrow="AP"
        title="Cargar factura"
        description="Registro separado del monitor para ingresar una nueva factura recibida y derivarla al area correcta."
      />
      <Card>
        <CardHeader title="Formulario de carga" description="AP registra la factura, adjunta respaldo y decide si la deriva de inmediato." />
        <CardContent>
          <ApMonitorInvoiceForm
            suppliers={suppliers.map((supplier) => ({ id: supplier.id, businessName: supplier.businessName }))}
            areas={requesterAreas.map((requesterArea) => requesterArea.area)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
