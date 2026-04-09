import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Demo1234!", 10);

  await prisma.auditLog.deleteMany();
  await prisma.notificationOutbox.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.invoiceAllocation.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  const [admin, procurement, requester, apUser] = await Promise.all([
    prisma.user.create({ data: { name: "Admin Demo", email: "admin@demo.com", passwordHash, role: "ADMIN", area: "FINANCE", active: true } }),
    prisma.user.create({ data: { name: "Compras Demo", email: "compras@demo.com", passwordHash, role: "PROCUREMENT", area: "OPERATIONS", active: true } }),
    prisma.user.create({ data: { name: "Area Demo", email: "area@demo.com", passwordHash, role: "REQUESTER_AREA", area: "OPERATIONS", active: true } }),
    prisma.user.create({ data: { name: "AP Demo", email: "ap@demo.com", passwordHash, role: "AP", area: "FINANCE", active: true } }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { businessName: "Tech Supplies SA", taxId: "30711222331", email: "compras@techsupplies.com", active: true } }),
    prisma.supplier.create({ data: { businessName: "Servicios Financieros SRL", taxId: "30711222332", email: "admin@serviciosfinancieros.com", active: true } }),
    prisma.supplier.create({ data: { businessName: "Consultoria Andina", taxId: "30711222333", email: "contacto@andina.com", active: true } }),
    prisma.supplier.create({ data: { businessName: "Infraestructura Cloud SAS", taxId: "30711222334", email: "billing@cloudsas.com", active: true } }),
    prisma.supplier.create({ data: { businessName: "Mobiliario Corporativo SA", taxId: "30711222335", email: "ventas@mobiliario.com", active: true } }),
  ]);

  const poDraft = await prisma.purchaseOrder.create({
    data: {
      number: "PO-000001",
      supplierId: suppliers[0].id,
      area: "OPERATIONS",
      accountCode: "610100",
      costCenter: "OPS-001",
      requesterName: "Maria Lopez",
      createdById: procurement.id,
      currency: "ARS",
      totalAmount: 1200000,
      consumedAmount: 0,
      remainingAmount: 1200000,
      status: "DRAFT",
      notes: "Equipamiento para onboarding.",
      items: {
        create: [
          { description: "Notebook ejecutiva", quantity: 4, unitPrice: 250000, totalPrice: 1000000, consumedAmount: 0, remainingAmount: 1000000 },
          { description: "Docking station", quantity: 4, unitPrice: 50000, totalPrice: 200000, consumedAmount: 0, remainingAmount: 200000 },
        ],
      },
    },
  });

  const poApproved = await prisma.purchaseOrder.create({
    data: {
      number: "PO-000002",
      supplierId: suppliers[1].id,
      area: "OPERATIONS",
      accountCode: "620200",
      costCenter: "OPS-002",
      requesterName: "Sofia Rey",
      createdById: procurement.id,
      currency: "USD",
      totalAmount: 8000,
      consumedAmount: 0,
      remainingAmount: 8000,
      status: "APPROVED",
      approvedById: procurement.id,
      approvedAt: new Date(),
      notes: "Servicios de consultoria financiera.",
      items: {
        create: [{ description: "Consultoria mensual", quantity: 2, unitPrice: 4000, totalPrice: 8000, consumedAmount: 0, remainingAmount: 8000 }],
      },
    },
    include: { items: true },
  });

  const poPartial = await prisma.purchaseOrder.create({
    data: {
      number: "PO-000003",
      supplierId: suppliers[2].id,
      area: "OPERATIONS",
      accountCode: "630300",
      costCenter: "OPS-003",
      requesterName: "Carlos Diaz",
      createdById: procurement.id,
      currency: "ARS",
      totalAmount: 500000,
      consumedAmount: 200000,
      remainingAmount: 300000,
      status: "PARTIALLY_CONSUMED",
      approvedById: procurement.id,
      approvedAt: new Date(),
      notes: "Servicios de mejora de procesos.",
      items: {
        create: [
          { description: "Workshop diagnostico", quantity: 1, unitPrice: 200000, totalPrice: 200000, consumedAmount: 200000, remainingAmount: 0 },
          { description: "Implementacion", quantity: 1, unitPrice: 300000, totalPrice: 300000, consumedAmount: 0, remainingAmount: 300000 },
        ],
      },
    },
    include: { items: true },
  });

  const invoicePendingDerivation = await prisma.invoice.create({
    data: {
      supplierId: suppliers[3].id,
      sourceType: "AP_MONITOR",
      invoiceNumber: null,
      receivedDate: new Date("2026-04-02T00:00:00Z"),
      status: "DRAFT",
      uploadedById: apUser.id,
      notes: "Factura recibida por mesa AP.",
    },
  });

  const invoiceAssignedToArea = await prisma.invoice.create({
    data: {
      supplierId: suppliers[1].id,
      areaAssigned: "OPERATIONS",
      sourceType: "AP_MONITOR",
      invoiceNumber: null,
      receivedDate: new Date("2026-04-03T00:00:00Z"),
      status: "PENDING_AREA_APPROVAL",
      uploadedById: apUser.id,
      notes: "Pendiente de que el area vincule la OC.",
    },
  });

  const invoiceDerived = await prisma.invoice.create({
    data: {
      supplierId: suppliers[2].id,
      purchaseOrderId: poPartial.id,
      areaAssigned: "OPERATIONS",
      sourceType: "AREA",
      invoiceNumber: "FC-2026-88",
      receivedDate: new Date("2026-03-26T00:00:00Z"),
      status: "DERIVED_TO_AP",
      uploadedById: requester.id,
      approvedByUserAreaId: requester.id,
      approvedByUserAreaAt: new Date("2026-03-27T00:00:00Z"),
      notes: "Factura enviada a AP desde la OC.",
    },
  });

  const invoiceReturned = await prisma.invoice.create({
    data: {
      supplierId: suppliers[1].id,
      purchaseOrderId: poApproved.id,
      areaAssigned: "OPERATIONS",
      sourceType: "AP_MONITOR",
      invoiceNumber: "FAC-1002",
      receivedDate: new Date("2026-04-04T00:00:00Z"),
      status: "RETURNED_BY_AP",
      uploadedById: apUser.id,
      approvedByUserAreaId: requester.id,
      approvedByUserAreaAt: new Date("2026-04-05T00:00:00Z"),
      notes: "Se requiere corregir respaldo documental.",
    },
  });

  const invoiceAccounted = await prisma.invoice.create({
    data: {
      supplierId: suppliers[2].id,
      purchaseOrderId: poPartial.id,
      areaAssigned: "OPERATIONS",
      sourceType: "AREA",
      invoiceNumber: "FC-2026-99",
      invoiceType: "C",
      invoiceDate: new Date("2026-03-10T00:00:00Z"),
      receivedDate: new Date("2026-03-12T00:00:00Z"),
      currency: "ARS",
      subtotal: 70000,
      taxes: 10000,
      totalAmount: 80000,
      accountCode: poPartial.accountCode,
      costCenter: poPartial.costCenter,
      status: "ACCOUNTED",
      uploadedById: requester.id,
      approvedByUserAreaId: requester.id,
      approvedByUserAreaAt: new Date("2026-03-13T00:00:00Z"),
      accountedById: apUser.id,
      accountedAt: new Date("2026-03-15T00:00:00Z"),
      allocations: {
        create: [{ purchaseOrderId: poPartial.id, allocatedAmount: 80000 }],
      },
      notes: "Factura ya contabilizada.",
    },
  });

  await prisma.approval.createMany({
    data: [
      { entityType: "PURCHASE_ORDER", entityId: poApproved.id, step: 1, decision: "APPROVED", decidedById: procurement.id, comment: "OC aprobada por Compras." },
      { entityType: "INVOICE", entityId: invoiceDerived.id, step: 1, decision: "APPROVED", decidedById: requester.id, comment: "Factura vinculada y enviada a AP." },
      { entityType: "INVOICE", entityId: invoiceReturned.id, step: 2, decision: "RETURNED", decidedById: apUser.id, comment: "Falta aclarar respaldo de servicio." },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { entityType: "SUPPLIER", entityId: suppliers[0].id, action: "CREATED", performedById: procurement.id, comment: "Proveedor creado por Compras." },
      { entityType: "PURCHASE_ORDER", entityId: poDraft.id, action: "CREATED", toStatus: "DRAFT", performedById: procurement.id, comment: "OC creada en borrador.", metadata: { accountCode: poDraft.accountCode, costCenter: poDraft.costCenter } },
      { entityType: "PURCHASE_ORDER", entityId: poApproved.id, action: "APPROVED", fromStatus: "DRAFT", toStatus: "APPROVED", performedById: procurement.id, comment: "OC aprobada por Compras." },
      { entityType: "INVOICE", entityId: invoicePendingDerivation.id, action: "CREATED", toStatus: "DRAFT", performedById: apUser.id, comment: "Factura cargada en el monitor de AP." },
      { entityType: "INVOICE", entityId: invoiceAssignedToArea.id, action: "DERIVED", fromStatus: "DRAFT", toStatus: "PENDING_AREA_APPROVAL", performedById: apUser.id, comment: "Factura derivada al area OPERATIONS." },
      { entityType: "INVOICE", entityId: invoiceDerived.id, action: "DERIVED", fromStatus: "DRAFT", toStatus: "DERIVED_TO_AP", performedById: requester.id, comment: "Factura cargada desde el area y enviada a AP." },
      { entityType: "INVOICE", entityId: invoiceReturned.id, action: "RETURNED", fromStatus: "DERIVED_TO_AP", toStatus: "RETURNED_BY_AP", performedById: apUser.id, comment: "Factura devuelta al area." },
      { entityType: "INVOICE", entityId: invoiceAccounted.id, action: "ACCOUNTED", fromStatus: "DERIVED_TO_AP", toStatus: "ACCOUNTED", performedById: apUser.id, comment: "Factura contabilizada por AP." },
    ],
  });

  await prisma.notificationOutbox.createMany({
    data: [
      {
        eventKey: "invoice.derived-to-area",
        entityType: "INVOICE",
        entityId: invoiceAssignedToArea.id,
        recipientEmail: requester.email,
        recipientName: requester.name,
        subject: "Factura derivada al area",
        template: "factura-derivada-area",
        payload: { invoiceNumber: invoiceAssignedToArea.invoiceNumber, area: "OPERATIONS" },
        status: "DISABLED",
        createdById: apUser.id,
      },
      {
        eventKey: "invoice.sent-to-ap",
        entityType: "INVOICE",
        entityId: invoiceDerived.id,
        recipientEmail: apUser.email,
        recipientName: apUser.name,
        subject: "Factura enviada a AP",
        template: "factura-enviada-ap",
        payload: { invoiceNumber: invoiceDerived.invoiceNumber },
        status: "DISABLED",
        createdById: requester.id,
      },
    ],
  });

  void admin;
  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
