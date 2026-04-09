import Link from "next/link";
import { FileSpreadsheet, Files, LayoutDashboard, Receipt, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/permissions";

const navigationByRole = {
  ADMIN: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/suppliers", label: "Proveedores", icon: Users },
    { href: "/purchase-orders", label: "Ordenes de compra", icon: FileSpreadsheet },
    { href: "/invoices", label: "Facturas", icon: Receipt },
    { href: "/tasks", label: "Tareas", icon: Files },
    { href: "/audit", label: "Auditoria", icon: ShieldCheck },
  ],
  PROCUREMENT: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/suppliers", label: "Proveedores", icon: Users },
    { href: "/purchase-orders", label: "Ordenes de compra", icon: FileSpreadsheet },
    { href: "/approvals/purchase-orders", label: "Aprobacion de OCs", icon: FileSpreadsheet },
    { href: "/tasks", label: "Tareas", icon: Files },
  ],
  REQUESTER_AREA: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/purchase-orders", label: "OCs de mi area", icon: FileSpreadsheet },
    { href: "/invoices", label: "Facturas", icon: Receipt },
    { href: "/approvals/invoices", label: "Pendientes del area", icon: Receipt },
    { href: "/tasks", label: "Tareas", icon: Files },
  ],
  AP: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/ap/monitor-de-facturas", label: "Monitor de facturas", icon: Receipt },
    { href: "/ap/cargar-factura", label: "Cargar factura", icon: Receipt },
    { href: "/ap/inbox", label: "Bandeja AP", icon: Files },
    { href: "/invoices", label: "Expedientes AP", icon: Receipt },
    { href: "/tasks", label: "Tareas", icon: Files },
  ],
} as const;

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role: keyof typeof navigationByRole;
    area: string;
  };
}) {
  const navigation = navigationByRole[user.role] ?? navigationByRole.ADMIN;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe3ff,transparent_30%),linear-gradient(180deg,#fbf8ff_0%,#f4eefc_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[290px_1fr]">
        <aside className="border-r border-[color:var(--color-border-soft)] bg-[linear-gradient(180deg,#31124e_0%,#571d8f_62%,#7b2ff7_100%)] px-6 py-8 text-white">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Uala Bank</p>
            <h1 className="mt-3 text-xl font-semibold">Portal de compras y facturas</h1>
            <p className="mt-2 text-sm text-white/75">Segregacion estricta entre Compras, Area y AP.</p>
          </div>
          <nav className="mt-8 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/12 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[color:var(--color-border-soft)] bg-white/85 px-6 py-4 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-primary)]">{user.name}</p>
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  {roleLabels[user.role]} · {user.area}
                </p>
              </div>
              <form action="/api/auth/signout" method="post">
                <input type="hidden" name="callbackUrl" value="/login" />
                <Button variant="outline">Cerrar sesion</Button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
