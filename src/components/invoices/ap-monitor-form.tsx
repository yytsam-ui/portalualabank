"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMonitorInvoiceSchema } from "@/features/invoices/schemas";

type Values = z.infer<typeof createMonitorInvoiceSchema>;

export function ApMonitorInvoiceForm({
  suppliers,
  areas,
}: {
  suppliers: Array<{ id: string; businessName: string }>;
  areas: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(createMonitorInvoiceSchema) as never,
    defaultValues: {
      receivedDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: "",
      areaAssigned: "",
      notes: "",
    },
  });

  async function onSubmit(values: Values, event?: React.BaseSyntheticEvent) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("payload", JSON.stringify(values));
    const fileInput = event?.target?.querySelector('input[name="attachments"]') as HTMLInputElement | null;
    const files = fileInput?.files;
    if (files) {
      Array.from(files).forEach((file) => formData.append("attachments", file));
    }

    const response = await fetch("/api/ap/monitor-invoices", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo cargar la factura en el monitor.");
      setLoading(false);
      return;
    }

    router.push(`/invoices/${data.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit as never)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Proveedor</label>
          <Select {...register("supplierId")}>
            <option value="">Seleccionar</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.businessName}
              </option>
            ))}
          </Select>
          {errors.supplierId ? <p className="text-xs text-rose-600">{errors.supplierId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Area destino</label>
          <Select {...register("areaAssigned")}>
            <option value="">Pendiente de definir</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Numero de factura</label>
          <Input {...register("invoiceNumber")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Fecha de recepcion</label>
          <Input type="date" {...register("receivedDate")} />
          {errors.receivedDate ? <p className="text-xs text-rose-600">{errors.receivedDate.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Adjunto</label>
          <Input type="file" name="attachments" multiple />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Observaciones</label>
          <Textarea {...register("notes")} />
        </div>
      </div>
      <ApiFormError error={error} />
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar factura en monitor"}
      </Button>
    </form>
  );
}
