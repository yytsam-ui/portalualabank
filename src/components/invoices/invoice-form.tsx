"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createInvoiceSchema } from "@/features/invoices/schemas";

type PurchaseOrderOption = {
  id: string;
  number: string;
  supplierName: string;
  accountCode: string;
  costCenter: string;
  remainingAmount: number;
};

type Values = z.infer<typeof createInvoiceSchema>;

export function InvoiceForm({ purchaseOrders }: { purchaseOrders: PurchaseOrderOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(createInvoiceSchema) as never,
  });

  const selectedPurchaseOrderId = useWatch({ control, name: "purchaseOrderId" });
  const selectedPurchaseOrder = purchaseOrders.find((purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId);

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

    const response = await fetch("/api/invoices", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo registrar la factura.");
      setLoading(false);
      return;
    }

    router.push(`/invoices/${data.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit as never)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
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
          <Input placeholder="Ej. 0001-00001234" {...register("invoiceNumber")} />
          {errors.invoiceNumber ? <p className="text-xs text-rose-600">{errors.invoiceNumber.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Adjunto de factura</label>
          <Input type="file" name="attachments" multiple />
        </div>
      </div>

      {selectedPurchaseOrder ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Datos heredados de la OC</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Proveedor</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedPurchaseOrder.supplierName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cuenta contable</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedPurchaseOrder.accountCode}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">CECO</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedPurchaseOrder.costCenter}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Observaciones</label>
        <Textarea placeholder="Detalle opcional para AP." {...register("notes")} />
      </div>

      <ApiFormError error={error} />
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Aprobar y enviar a AP"}
      </Button>
    </form>
  );
}
