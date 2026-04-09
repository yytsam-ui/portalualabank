import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency: "ARS" | "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function toNumber(value: unknown) {
  return Number(value ?? 0);
}

const statusLabels: Record<string, string> = {
  DRAFT: "Pendiente de derivacion",
  PENDING_AREA_APPROVAL: "Pendiente del area",
  REJECTED_BY_AREA: "Rechazada por el area",
  DERIVED_TO_AP: "En revision AP",
  RETURNED_BY_AP: "Devuelta por AP",
  ACCOUNTED: "Contabilizada",
  CANCELED: "Cancelada",
  APPROVED: "Aprobada",
  PARTIALLY_CONSUMED: "Parcialmente consumida",
  FULLY_CONSUMED: "Totalmente consumida",
  CLOSED: "Cerrada",
  CREATED: "Creada",
  UPDATED: "Actualizada",
  REJECTED: "Rechazada",
  RETURNED: "Devuelta",
  DERIVED: "Derivada",
  ACCOUNTED_ACTION: "Contabilizada",
  APPROVED_ACTION: "Aprobada",
  ATTACHMENT_ADDED: "Adjunto agregado",
  STATUS_CHANGED: "Cambio de estado",
  NOTIFICATION_QUEUED: "Notificacion preparada",
};

export function formatStatusLabel(value: string) {
  return statusLabels[value] ?? value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

export function isPreviewableMimeType(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}
