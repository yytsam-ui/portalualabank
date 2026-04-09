import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-300/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">403</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Acceso restringido</h1>
        <p className="mt-3 text-sm text-slate-600">
          Tu rol no tiene permisos para esta vista o acción. Si lo necesitás por trabajo, podés revisarlo con un administrador.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard">
            <Button>Volver al dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
