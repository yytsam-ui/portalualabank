import Link from "next/link";

import { ApTabs } from "@/components/ap/ap-tabs";
import { MonitorFiltersForm } from "@/components/invoices/monitor-filters-form";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { getApMonitorData, getApMonitorFilterOptions, type ApMonitorFilters } from "@/features/invoices/monitor.service";
import { requireRoles } from "@/lib/guards";
import { formatCurrency, formatDate, formatStatusLabel } from "@/lib/utils";

export default async function ApMonitorDeFacturasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRoles(["ADMIN", "AP"]);
  const resolvedSearchParams = await searchParams;
  const filters = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  ) as ApMonitorFilters;

  const [monitor, filterOptions] = await Promise.all([getApMonitorData(user, filters), getApMonitorFilterOptions()]);

  return (
    <div className="space-y-8">
      <ApTabs currentPath="/ap/monitor-de-facturas" />
      <PageHeader
        eyebrow="AP"
        title="Monitor de facturas"
        description="Listado operativo de facturas recibidas por AP con trazabilidad, filtros amplios y seguimiento completo."
      />

      <Card>
        <CardHeader title="Filtros del monitor" description="Busqueda global, filtros por columna, fechas y datos operativos." />
        <CardContent>
          <MonitorFiltersForm
            filters={filters}
            options={{
              suppliers: filterOptions.suppliers.map((supplier) => ({ value: supplier.businessName, label: supplier.businessName })),
              areas: filterOptions.areas.map((area) => ({ value: area, label: area })),
              purchaseOrders: filterOptions.purchaseOrders.map((purchaseOrder) => ({ value: purchaseOrder.number, label: purchaseOrder.number })),
              users: filterOptions.users.map((userOption) => ({ value: userOption.id, label: userOption.name })),
              statuses: filterOptions.statuses.map((status) => ({ value: status, label: formatStatusLabel(status) })),
              sourceTypes: filterOptions.sourceTypes.map((sourceType) => ({
                value: sourceType,
                label: sourceType === "AP_MONITOR" ? "Monitor AP" : "Carga desde area",
              })),
              currencies: filterOptions.currencies.map((currency) => ({ value: currency, label: currency })),
              invoiceTypes: filterOptions.invoiceTypes.map((invoiceType) => ({ value: invoiceType, label: invoiceType })),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Facturas cargadas"
          description={`Resultados: ${monitor.total}. Pagina ${monitor.page} de ${monitor.totalPages}.`}
        />
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>ID interno</TH>
                <TH>Numero</TH>
                <TH>Proveedor</TH>
                <TH>CUIT</TH>
                <TH>Tipo</TH>
                <TH>Fecha factura</TH>
                <TH>Recepcion</TH>
                <TH>Moneda</TH>
                <TH>Subtotal</TH>
                <TH>Impuestos</TH>
                <TH>Total</TH>
                <TH>Area asignada</TH>
                <TH>Area origen</TH>
                <TH>OC</TH>
                <TH>Cuenta</TH>
                <TH>CECO</TH>
                <TH>Estado</TH>
                <TH>Origen</TH>
                <TH>Creador</TH>
                <TH>Derivo</TH>
                <TH>Aprobo</TH>
                <TH>Contabilizo</TH>
                <TH>Creacion</TH>
                <TH>Actualizacion</TH>
                <TH>Derivacion</TH>
                <TH>Envio a AP</TH>
                <TH>Contabilizacion</TH>
                <TH>Adjunto</TH>
                <TH>Observaciones</TH>
                <TH>Motivo devolucion</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border-soft)]">
              {monitor.rows.map((row) => (
                <tr key={row.id}>
                  <TD>{row.internalId}</TD>
                  <TD>{row.invoiceNumber}</TD>
                  <TD>{row.supplierName}</TD>
                  <TD>{row.supplierTaxId}</TD>
                  <TD>{row.invoiceType}</TD>
                  <TD>{row.invoiceDate ? formatDate(row.invoiceDate) : "-"}</TD>
                  <TD>{formatDate(row.receivedDate)}</TD>
                  <TD>{row.currency}</TD>
                  <TD>{row.currency !== "-" && row.subtotal !== "-" ? formatCurrency(row.subtotal, row.currency as "ARS" | "USD") : "-"}</TD>
                  <TD>{row.currency !== "-" && row.taxes !== "-" ? formatCurrency(row.taxes, row.currency as "ARS" | "USD") : "-"}</TD>
                  <TD>{row.currency !== "-" && row.total !== "-" ? formatCurrency(row.total, row.currency as "ARS" | "USD") : "-"}</TD>
                  <TD>{row.areaAssigned}</TD>
                  <TD>{row.areaOrigin}</TD>
                  <TD>{row.purchaseOrderNumber}</TD>
                  <TD>{row.accountCode}</TD>
                  <TD>{row.costCenter}</TD>
                  <TD><StatusBadge status={row.status} /></TD>
                  <TD>{row.sourceLabel}</TD>
                  <TD>{row.createdByName}</TD>
                  <TD>{row.derivedByName}</TD>
                  <TD>{row.approvedByName}</TD>
                  <TD>{row.accountedByName}</TD>
                  <TD>{formatDate(row.createdAt)}</TD>
                  <TD>{formatDate(row.updatedAt)}</TD>
                  <TD>{row.derivedAt ? formatDate(row.derivedAt) : "-"}</TD>
                  <TD>{row.sentToApAt ? formatDate(row.sentToApAt) : "-"}</TD>
                  <TD>{row.accountedAt ? formatDate(row.accountedAt) : "-"}</TD>
                  <TD>{row.hasAttachment ? "Si" : "No"}</TD>
                  <TD>{row.notes}</TD>
                  <TD>{row.returnReason}</TD>
                  <TD>
                    <Link href={`/invoices/${row.id}`} className="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                      Ver
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[color:var(--color-text-muted)]">Total filtrado: {monitor.total}</p>
        <div className="flex gap-2">
          {monitor.page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), page: String(monitor.page - 1) }).toString()}`}>
              <span className="rounded-xl border border-[color:var(--color-border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)]">Anterior</span>
            </Link>
          ) : null}
          {monitor.page < monitor.totalPages ? (
            <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), page: String(monitor.page + 1) }).toString()}`}>
              <span className="rounded-xl border border-[color:var(--color-border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)]">Siguiente</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
