"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPurchaseOrderSchema } from "@/features/purchase-orders/schemas";

type Values = z.infer<typeof createPurchaseOrderSchema>;

export function PurchaseOrderForm({
  suppliers,
  defaultArea,
}: {
  suppliers: Array<{ id: string; businessName: string }>;
  defaultArea: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Values>({
    resolver: zodResolver(createPurchaseOrderSchema) as never,
    defaultValues: {
      area: defaultArea,
      accountCode: "",
      costCenter: "",
      currency: "ARS",
      intent: "save",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: Values, event?: React.BaseSyntheticEvent) {
    setLoading(true);
    setError(null);

    const fileInput = event?.target?.querySelector('input[name="attachments"]') as HTMLInputElement | null;
    const files = fileInput?.files;
    const formData = new FormData();
    formData.set("payload", JSON.stringify(values));
    if (files) {
      Array.from(files).forEach((file) => formData.append("attachments", file));
    }

    const response = await fetch("/api/purchase-orders", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo crear la OC.");
      setLoading(false);
      return;
    }

    router.push(`/purchase-orders/${data.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit as never)}>
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
          <label className="text-sm font-medium text-slate-700">Area</label>
          <Input {...register("area")} />
          {errors.area ? <p className="text-xs text-rose-600">{errors.area.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cuenta contable</label>
          <Input placeholder="Ej. 610100" {...register("accountCode")} />
          {errors.accountCode ? <p className="text-xs text-rose-600">{errors.accountCode.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">CECO / Centro de costo</label>
          <Input placeholder="Ej. ADM-001" {...register("costCenter")} />
          {errors.costCenter ? <p className="text-xs text-rose-600">{errors.costCenter.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Responsable / Gestor</label>
          <Input {...register("requesterName")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Moneda</label>
          <Select {...register("currency")}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Posiciones</h3>
            <p className="mt-1 text-sm text-slate-600">Defini posiciones, cantidades y precio unitario.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar item
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1.8fr_0.7fr_0.7fr_auto]">
              <Input placeholder="Descripcion" {...register(`items.${index}.description`)} />
              <Input type="number" step="0.01" placeholder="Cantidad" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
              <Input type="number" step="0.01" placeholder="Precio unitario" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
              <Button type="button" variant="outline" onClick={() => remove(index)} disabled={fields.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {errors.items ? <p className="text-xs text-rose-600">{errors.items.message as string}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Adjuntos</label>
          <Input type="file" name="attachments" multiple />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Notas</label>
          <Textarea {...register("notes")} />
        </div>
      </div>

      <ApiFormError error={error} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading} onClick={() => setValue("intent", "save")}>
          {loading ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button type="submit" variant="secondary" disabled={loading} onClick={() => setValue("intent", "approve")}>
          {loading ? "Aprobando..." : "Guardar y aprobar OC"}
        </Button>
      </div>
    </form>
  );
}
