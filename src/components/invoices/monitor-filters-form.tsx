import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Option = { value: string; label: string };

export function MonitorFiltersForm({
  filters,
  options,
}: {
  filters: Record<string, string | undefined>;
  options: {
    suppliers: Option[];
    areas: Option[];
    purchaseOrders: Option[];
    users: Option[];
    statuses: Option[];
    sourceTypes: Option[];
    currencies: Option[];
    invoiceTypes: Option[];
  };
}) {
  return (
    <form className="space-y-4" method="get">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input name="q" placeholder="Busqueda global" defaultValue={filters.q} />
        <Select name="status" defaultValue={filters.status}>
          <option value="">Todos los estados</option>
          {options.statuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="supplierId" defaultValue={filters.supplierId}>
          <option value="">Todos los proveedores</option>
          {options.suppliers.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="area" defaultValue={filters.area}>
          <option value="">Todas las areas</option>
          {options.areas.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="purchaseOrderId" defaultValue={filters.purchaseOrderId}>
          <option value="">Todas las OCs</option>
          {options.purchaseOrders.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="currency" defaultValue={filters.currency}>
          <option value="">Todas las monedas</option>
          {options.currencies.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input name="accountCode" placeholder="Cuenta contable" defaultValue={filters.accountCode} />
        <Input name="costCenter" placeholder="CECO" defaultValue={filters.costCenter} />
        <Select name="createdById" defaultValue={filters.createdById}>
          <option value="">Todos los usuarios</option>
          {options.users.map((option) => (
            <option key={option.value} value={option.label}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="sourceType" defaultValue={filters.sourceType}>
          <option value="">Todos los origenes</option>
          {options.sourceTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="invoiceType" defaultValue={filters.invoiceType}>
          <option value="">Todos los tipos</option>
          {options.invoiceTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select name="hasAttachment" defaultValue={filters.hasAttachment}>
          <option value="">Con y sin adjunto</option>
          <option value="si">Con adjunto</option>
          <option value="no">Sin adjunto</option>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} />
        <Input name="dateTo" type="date" defaultValue={filters.dateTo} />
        <Input name="receivedFrom" type="date" defaultValue={filters.receivedFrom} />
        <Input name="receivedTo" type="date" defaultValue={filters.receivedTo} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Aplicar filtros</Button>
        <a href="/ap/monitor-de-facturas">
          <Button type="button" variant="outline">
            Limpiar filtros
          </Button>
        </a>
      </div>
    </form>
  );
}
