import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TD, TH } from "@/components/ui/table";
import { getTaskInbox } from "@/features/tasks/tasks.service";
import { requireAuth } from "@/lib/guards";
import { formatDate } from "@/lib/utils";

export default async function TasksPage() {
  const user = await requireAuth();
  const tasks = await getTaskInbox(user);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tareas" title="Bandeja agregada" description="Pendientes operativos filtrados por tu rol y tu area." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <TH>Tarea</TH>
                <TH>Entidad</TH>
                <TH>Area</TH>
                <TH>Estado</TH>
                <TH>Creacion</TH>
                <TH />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <TD>{task.title}</TD>
                  <TD>{task.entityType}</TD>
                  <TD>{task.area}</TD>
                  <TD><StatusBadge status={task.status} /></TD>
                  <TD>{formatDate(task.createdAt)}</TD>
                  <TD>
                    <Link href={task.href} className="text-sm font-semibold text-slate-950">
                      Ir a la tarea
                    </Link>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
