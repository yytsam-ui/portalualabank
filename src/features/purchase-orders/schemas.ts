import { Currency } from "@prisma/client";
import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  description: z.string().min(2, "Describi el item."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a cero."),
  unitPrice: z.coerce.number().positive("El precio unitario debe ser mayor a cero."),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  area: z.string().min(2, "Ingresa el area solicitante."),
  accountCode: z.string().min(2, "Ingresa la cuenta contable."),
  costCenter: z.string().min(2, "Ingresa el CECO o centro de costo."),
  requesterName: z.string().optional(),
  currency: z.nativeEnum(Currency),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos un item."),
  intent: z.enum(["save", "approve"]).default("save"),
});

export const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  comment: z.string().optional(),
});
