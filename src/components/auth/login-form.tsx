"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";

import { loginSchema } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiFormError } from "@/components/shared/api-form-error";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@demo.com",
      password: "Demo1234!",
    },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard",
    });

    if (result?.error) {
      setError("Credenciales inválidas.");
      setLoading(false);
      return;
    }

    router.push(result?.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <div className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Portal Interno</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Procure-to-Pay con trazabilidad, control interno y auditoría.</h1>
          <p className="mt-4 text-sm text-slate-300">
            Un MVP enterprise pensado para compras, área usuaria, AP y auditoría con un flujo claro entre orden de compra, factura y contabilización.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-300" />
            <p className="text-sm font-medium">Credenciales demo en README</p>
          </div>
          <p className="mt-3 text-sm text-slate-300">Contraseña única para todos los roles: `Demo1234!`</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Acceso</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Ingresar al portal</h2>
          <p className="mt-2 text-sm text-slate-600">Usá una de las credenciales de prueba para recorrer el flujo completo.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" {...register("email")} />
              {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <Input type="password" {...register("password")} />
              {errors.password ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
            </div>
            <ApiFormError error={error} />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
