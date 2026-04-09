import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TD, TH } from "@/components/ui/table";
import { listAuditLogs } from "@/features/audit/audit.service";
import { requireRoles } from "@/lib/guards";
import { formatDate } from "@/lib/utils";

export default async function AuditPage() {
  await requireRoles(["ADMIN"]);
  const logs = await listAuditLogs();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Auditoria" title="Auditoria" description="Vista consolidada de trazabilidad y acciones criticas." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Entidad</TH>
                <TH>ID</TH>
                <TH>Accion</TH>
                <TH>De</TH>
                <TH>A</TH>
                <TH>Usuario</TH>
                <TH>Fecha</TH>
                <TH>Comentario</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <TD>{log.entityType}</TD>
                  <TD>{log.entityId.slice(0, 10)}</TD>
                  <TD><StatusBadge status={log.action} /></TD>
                  <TD>{log.fromStatus || "-"}</TD>
                  <TD>{log.toStatus || "-"}</TD>
                  <TD>{log.performedBy.name}</TD>
                  <TD>{formatDate(log.createdAt)}</TD>
                  <TD>{log.comment || "-"}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
