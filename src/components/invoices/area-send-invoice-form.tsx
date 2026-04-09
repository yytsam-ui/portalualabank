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
import { areaSendInvoiceSchema } from "@/features/invoices/schemas";

type Values = z.infer<typeof areaSendInvoiceSchema>;

export function AreaSendInvoiceForm({
  endpoint,
  purchaseOrders,
  defaultValues,
}: {
  endpoint: string;
  purchaseOrders: Array<{ id: string; number: string; supplierName: string; remainingAmount: number }>;
  defaultValues?: Partial<Values>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(areaSendInvoiceSchema) as never,
    defaultValues: {
      purchaseOrderId: defaultValues?.purchaseOrderId ?? "",
      invoiceNumber: defaultValues?.invoiceNumber ?? "",
      notes: defaultValues?.notes ?? "",
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

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo enviar la factura a AP.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit as never)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Orden de compra</label>
        <Select {...register("purchaseOrderId")}>
          <option value="">Seleccionar</option>
          {purchaseOrders.map((purchaseOrder) => (
            <option key={purchaseOrder.id} value={purchaseOrder.id}>
              {purchaseOrder.number} · {purchaseOrder.supplierName} · saldo {purchaseOrder.remainingAmount.toFixed(2)}
            </option>
          ))}
        </Select>
        {errors.purchaseOrderId ? <p className="text-xs text-rose-600">{errors.purchaseOrderId.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Numero de factura</label>
        <Input {...register("invoiceNumber")} />
        {errors.invoiceNumber ? <p className="text-xs text-rose-600">{errors.invoiceNumber.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Adjunto</label>
        <Input type="file" name="attachments" multiple />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Observaciones</label>
        <Textarea {...register("notes")} />
      </div>
      <ApiFormError error={error} />
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Aprobar y enviar a AP"}
      </Button>
    </form>
  );
}
