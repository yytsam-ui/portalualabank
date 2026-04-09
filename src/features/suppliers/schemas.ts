import { z } from "zod";

export const createSupplierSchema = z.object({
  businessName: z.string().min(2, "Ingresá la razón social."),
  taxId: z.string().min(7, "Ingresá un CUIT válido."),
  email: z.email("Ingresá un email válido."),
  active: z.boolean().default(true),
});
