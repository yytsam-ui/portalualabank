import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardMetrics } from "@/features/dashboard/dashboard.service";
import { requireAuth } from "@/lib/guards";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireAuth();
  const metrics = await getDashboardMetrics(user);

  const cards = [
    { label: "OCs en borrador", value: metrics.pendingPurchaseOrders },
    { label: "Facturas pendientes del area", value: metrics.pendingInvoices },
    { label: "OCs con saldo", value: metrics.purchaseOrdersWithBalance },
    { label: "Facturas en AP", value: metrics.invoicesForAccounting },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inicio"
        title="Panel operativo"
        description="Resumen del flujo operativo segregado entre Compras, Area y AP."
        actions={
          <div className="flex gap-3">
            {user.role === "PROCUREMENT" ? (
              <Link href="/purchase-orders/new">
                <Button>Nueva OC</Button>
              </Link>
            ) : null}
            {user.role === "REQUESTER_AREA" ? (
              <Link href="/invoices/new">
                <Button variant="secondary">Nueva factura</Button>
              </Link>
            ) : user.role === "AP" ? (
              <Link href="/ap/monitor-de-facturas">
                <Button variant="secondary">Monitor de facturas</Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-4xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader title="Rechazos y devoluciones" description="Ultimos movimientos relevantes del flujo." />
          <CardContent className="space-y-3">
            {metrics.recentRejections.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{log.entityType.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-500">
                      {log.performedBy.name} · {formatDate(log.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={log.action} />
                </div>
                {log.comment ? <p className="mt-2 text-sm text-slate-600">{log.comment}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Accesos rapidos" description="Atajos segun tu rol." />
          <CardContent className="space-y-3">
            {user.role === "PROCUREMENT" ? (
              <>
                <Link href="/suppliers" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">Gestion de proveedores</p>
                  <p className="mt-1 text-sm text-slate-600">Alta y mantenimiento basico de proveedores.</p>
                </Link>
                <Link href="/approvals/purchase-orders" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">Aprobacion de OCs</p>
                  <p className="mt-1 text-sm text-slate-600">Revisar y aprobar OCs de Compras.</p>
                </Link>
              </>
            ) : null}
            {user.role === "REQUESTER_AREA" ? (
              <>
                <Link href="/purchase-orders" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">OCs de mi area</p>
                  <p className="mt-1 text-sm text-slate-600">Ver saldo remanente y adjuntos.</p>
                </Link>
                <Link href="/approvals/invoices" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">Pendientes del area</p>
                  <p className="mt-1 text-sm text-slate-600">Vincular facturas derivadas y enviarlas a AP.</p>
                </Link>
              </>
            ) : null}
            {user.role === "AP" ? (
              <>
                <Link href="/ap/monitor-de-facturas" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">Monitor de facturas</p>
                  <p className="mt-1 text-sm text-slate-600">Registrar facturas recibidas y derivarlas al area correcta.</p>
                </Link>
                <Link href="/ap/inbox" className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">Bandeja AP</p>
                  <p className="mt-1 text-sm text-slate-600">Expedientes derivados listos para revision y contabilizacion.</p>
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
