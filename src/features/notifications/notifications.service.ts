import { AuditAction, EntityType, NotificationStatus, Prisma, Role } from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { env } from "@/lib/env";

type NotificationTx = Prisma.TransactionClient;

type Recipient = {
  email: string;
  name: string;
};

type QueueNotificationInput = {
  eventKey: string;
  entityType: EntityType;
  entityId: string;
  createdById: string;
  subject: string;
  template: string;
  recipients: Recipient[];
  payload?: Prisma.InputJsonValue;
  comment?: string;
};

async function resolveRecipientsByRole(
  tx: NotificationTx,
  options: {
    roles: Role[];
    area?: string | null;
  },
) {
  const users = await tx.user.findMany({
    where: {
      active: true,
      role: { in: options.roles },
      ...(options.area ? { area: options.area } : {}),
    },
    select: {
      email: true,
      name: true,
    },
  });

  return users.map((user) => ({ email: user.email, name: user.name }));
}

export async function queueNotification(tx: NotificationTx, input: QueueNotificationInput) {
  const uniqueRecipients = input.recipients.filter(
    (recipient, index, all) => all.findIndex((candidate) => candidate.email === recipient.email) === index,
  );

  if (uniqueRecipients.length === 0) {
    return [];
  }

  const rows = await Promise.all(
    uniqueRecipients.map((recipient) =>
      tx.notificationOutbox.create({
        data: {
          eventKey: input.eventKey,
          entityType: input.entityType,
          entityId: input.entityId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject: input.subject,
          template: input.template,
          payload: input.payload,
          status: env.mailEnabled ? NotificationStatus.PENDING : NotificationStatus.DISABLED,
          createdById: input.createdById,
        },
      }),
    ),
  );

  await createAuditLog(tx, {
    entityType: input.entityType,
    entityId: input.entityId,
    action: AuditAction.NOTIFICATION_QUEUED,
    performedById: input.createdById,
    comment: input.comment ?? `Se generaron ${rows.length} notificaciones de correo en modo ${env.mailEnabled ? "pendiente" : "simulado"}.`,
    metadata: {
      eventKey: input.eventKey,
      recipients: uniqueRecipients.map((recipient) => recipient.email),
      status: env.mailEnabled ? "PENDING" : "DISABLED",
    },
  });

  return rows;
}

export async function notifyPurchaseOrderCreated(
  tx: NotificationTx,
  options: { purchaseOrderId: string; number: string; area: string; createdById: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["PROCUREMENT"], area: options.area });
  return queueNotification(tx, {
    eventKey: "purchase-order.created",
    entityType: EntityType.PURCHASE_ORDER,
    entityId: options.purchaseOrderId,
    createdById: options.createdById,
    subject: `Nueva OC ${options.number} creada`,
    template: "oc-creada",
    recipients,
    payload: { number: options.number, area: options.area },
    comment: "Notificacion preparada por creacion de OC.",
  });
}

export async function notifyPurchaseOrderApproved(
  tx: NotificationTx,
  options: { purchaseOrderId: string; number: string; area: string; createdById: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["REQUESTER_AREA"], area: options.area });
  return queueNotification(tx, {
    eventKey: "purchase-order.approved",
    entityType: EntityType.PURCHASE_ORDER,
    entityId: options.purchaseOrderId,
    createdById: options.createdById,
    subject: `OC ${options.number} aprobada`,
    template: "oc-aprobada",
    recipients,
    payload: { number: options.number, area: options.area },
    comment: "Notificacion preparada por aprobacion de OC.",
  });
}

export async function notifyInvoiceDerivedToArea(
  tx: NotificationTx,
  options: { invoiceId: string; area: string; invoiceNumber?: string | null; createdById: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["REQUESTER_AREA"], area: options.area });
  return queueNotification(tx, {
    eventKey: "invoice.derived-to-area",
    entityType: EntityType.INVOICE,
    entityId: options.invoiceId,
    createdById: options.createdById,
    subject: `Factura ${options.invoiceNumber || "sin numero"} derivada al area`,
    template: "factura-derivada-area",
    recipients,
    payload: { area: options.area, invoiceNumber: options.invoiceNumber },
    comment: "Notificacion preparada por derivacion de factura al area.",
  });
}

export async function notifyInvoiceSentToAp(
  tx: NotificationTx,
  options: { invoiceId: string; invoiceNumber?: string | null; createdById: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["AP"] });
  return queueNotification(tx, {
    eventKey: "invoice.sent-to-ap",
    entityType: EntityType.INVOICE,
    entityId: options.invoiceId,
    createdById: options.createdById,
    subject: `Factura ${options.invoiceNumber || "sin numero"} enviada a AP`,
    template: "factura-enviada-ap",
    recipients,
    payload: { invoiceNumber: options.invoiceNumber },
    comment: "Notificacion preparada por envio de factura a AP.",
  });
}

export async function notifyInvoiceReturnedByAp(
  tx: NotificationTx,
  options: { invoiceId: string; invoiceNumber?: string | null; area?: string | null; createdById: string; comment: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["REQUESTER_AREA"], area: options.area });
  return queueNotification(tx, {
    eventKey: "invoice.returned-by-ap",
    entityType: EntityType.INVOICE,
    entityId: options.invoiceId,
    createdById: options.createdById,
    subject: `Factura ${options.invoiceNumber || "sin numero"} devuelta por AP`,
    template: "factura-devuelta-ap",
    recipients,
    payload: { invoiceNumber: options.invoiceNumber, comment: options.comment },
    comment: "Notificacion preparada por devolucion desde AP.",
  });
}

export async function notifyInvoiceAccounted(
  tx: NotificationTx,
  options: { invoiceId: string; invoiceNumber?: string | null; area?: string | null; createdById: string },
) {
  const recipients = await resolveRecipientsByRole(tx, { roles: ["REQUESTER_AREA", "PROCUREMENT"], area: options.area });
  return queueNotification(tx, {
    eventKey: "invoice.accounted",
    entityType: EntityType.INVOICE,
    entityId: options.invoiceId,
    createdById: options.createdById,
    subject: `Factura ${options.invoiceNumber || "sin numero"} contabilizada`,
    template: "factura-contabilizada",
    recipients,
    payload: { invoiceNumber: options.invoiceNumber, area: options.area },
    comment: "Notificacion preparada por contabilizacion.",
  });
}
