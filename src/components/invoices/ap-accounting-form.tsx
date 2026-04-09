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
import { accountInvoiceSchema } from "@/features/invoices/schemas";

type Values = z.infer<typeof accountInvoiceSchema>;

export function ApAccountingForm({
  endpoint,
  defaults,
}: {
  endpoint: string;
  defaults: {
    accountCode: string;
    costCenter: string;
    currency?: "ARS" | "USD" | null;
    notes?: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(accountInvoiceSchema) as never,
    defaultValues: {
      invoiceType: "A",
      invoiceDate: new Date().toISOString().slice(0, 10),
      currency: defaults.currency ?? "ARS",
      subtotal: 0,
      taxes: 0,
      totalAmount: 0,
      accountCode: defaults.accountCode,
      costCenter: defaults.costCenter,
      notes: defaults.notes ?? "",
    },
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    setError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo contabilizar la factura.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit as never)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tipo de factura</label>
          <Select {...register("invoiceType")}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="CREDIT_NOTE">Nota de credito</option>
            <option value="DEBIT_NOTE">Nota de debito</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Fecha de factura</label>
          <Input type="date" {...register("invoiceDate")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Moneda</label>
          <Select {...register("currency")}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Subtotal</label>
          <Input type="number" step="0.01" {...register("subtotal", { valueAsNumber: true })} />
          {errors.subtotal ? <p className="text-xs text-rose-600">{errors.subtotal.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Impuestos</label>
          <Input type="number" step="0.01" {...register("taxes", { valueAsNumber: true })} />
          {errors.taxes ? <p className="text-xs text-rose-600">{errors.taxes.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Total</label>
          <Input type="number" step="0.01" {...register("totalAmount", { valueAsNumber: true })} />
          {errors.totalAmount ? <p className="text-xs text-rose-600">{errors.totalAmount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cuenta contable</label>
          <Input {...register("accountCode")} />
          {errors.accountCode ? <p className="text-xs text-rose-600">{errors.accountCode.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">CECO</label>
          <Input {...register("costCenter")} />
          {errors.costCenter ? <p className="text-xs text-rose-600">{errors.costCenter.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Observaciones contables</label>
        <Textarea {...register("notes")} />
      </div>
      <ApiFormError error={error} />
      <Button type="submit" disabled={loading}>
        {loading ? "Contabilizando..." : "Contabilizar factura"}
      </Button>
    </form>
  );
}
