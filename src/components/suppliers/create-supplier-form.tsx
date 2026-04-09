"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createSupplierSchema } from "@/features/suppliers/schemas";
import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof createSupplierSchema>;

export function CreateSupplierForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Values>({
    resolver: zodResolver(createSupplierSchema) as never,
    defaultValues: {
      active: true,
    },
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo crear el proveedor.");
      setLoading(false);
      return;
    }

    reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit as never)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Razón social</label>
          <Input {...register("businessName")} />
          {errors.businessName ? <p className="text-xs text-rose-600">{errors.businessName.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">CUIT</label>
          <Input {...register("taxId")} />
          {errors.taxId ? <p className="text-xs text-rose-600">{errors.taxId.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <ApiFormError error={error} />
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Crear proveedor"}
      </Button>
    </form>
  );
}
