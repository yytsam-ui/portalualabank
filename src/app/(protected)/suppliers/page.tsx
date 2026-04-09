import { CreateSupplierForm } from "@/components/suppliers/create-supplier-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH } from "@/components/ui/table";
import { listSuppliers } from "@/features/suppliers/suppliers.service";
import { requireRoles } from "@/lib/guards";
import { formatDate } from "@/lib/utils";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await requireRoles(["ADMIN", "PROCUREMENT"]);
  const params = await searchParams;
  const suppliers = await listSuppliers(params.search);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catalogo" title="Proveedores" description="Catalogo administrado por Compras." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader title="Listado" description="Busqueda basica por razon social o CUIT." />
          <CardContent className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <TH>Razon social</TH>
                  <TH>CUIT</TH>
                  <TH>Email</TH>
                  <TH>Estado</TH>
                  <TH>Alta</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <TD>{supplier.businessName}</TD>
                    <TD>{supplier.taxId}</TD>
                    <TD>{supplier.email}</TD>
                    <TD>{supplier.active ? "Activo" : "Inactivo"}</TD>
                    <TD>{formatDate(supplier.createdAt)}</TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Alta rapida" description="Solo Compras puede crear proveedores." />
          <CardContent>
            {user.role === "PROCUREMENT" ? (
              <CreateSupplierForm />
            ) : (
              <p className="text-sm text-slate-600">Administrador con vista de supervision. El alta queda reservada a Compras.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
