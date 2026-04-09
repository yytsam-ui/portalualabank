import { Currency, InvoiceType } from "@prisma/client";
import { z } from "zod";

export const createInvoiceSchema = z.object({
  purchaseOrderId: z.string().min(1, "Selecciona una OC."),
  invoiceNumber: z.string().min(1, "Ingresa el numero de factura."),
  notes: z.string().optional(),
});

export const areaSendInvoiceSchema = z.object({
  purchaseOrderId: z.string().min(1, "Selecciona una OC."),
  invoiceNumber: z.string().min(1, "Ingresa el numero de factura."),
  notes: z.string().optional(),
});

export const createMonitorInvoiceSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  invoiceNumber: z.string().optional(),
  areaAssigned: z.string().optional(),
  receivedDate: z.string().min(1, "Ingresa la fecha de recepcion."),
  notes: z.string().optional(),
});

export const assignMonitorInvoiceSchema = z.object({
  areaAssigned: z.string().min(2, "Selecciona un area de destino."),
});

export const accountInvoiceSchema = z.object({
  invoiceType: z.nativeEnum(InvoiceType),
  invoiceDate: z.string().min(1, "Ingresa la fecha de factura."),
  currency: z.nativeEnum(Currency),
  subtotal: z.coerce.number().nonnegative("Subtotal invalido."),
  taxes: z.coerce.number().nonnegative("Impuestos invalidos."),
  totalAmount: z.coerce.number().positive("El total debe ser mayor a cero."),
  accountCode: z.string().min(2, "Ingresa la cuenta contable."),
  costCenter: z.string().min(2, "Ingresa el CECO o centro de costo."),
  notes: z.string().optional(),
});
